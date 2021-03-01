#include "WebSocketClient.h"

WebSocketClient::WebSocketClient() {
  client = new WiFiClient;
  WiFi.mode(WIFI_STA);
}

void WebSocketClient::scan() {
  int aps = WiFi.scanNetworks();

  for (int i = 0; i < aps; i++) {
    Serial.print("[*] ");
    Serial.println(WiFi.SSID(i));
  }
}

void WebSocketClient::connectToWifi() {
  WiFi.begin("2.4GHz Nucleon", "VHgp!!07MHgp@)05");
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}

void WebSocketClient::connectToWs(String path) {
  upgrading = true;
  
  String handshake = "GET " + path + " HTTP/1.1\r\n"
      "Host: 192.168.0.10:8080\r\n"
      "Connection: Upgrade\r\n"
      "Upgrade: websocket\r\n"
      "Sec-WebSocket-Version: 13\r\n"
      "Sec-WebSocket-Protocol: Device\r\n"
      "Cookie: dvc_name=ESP8266 LED;dvc_addr=esp_led;owner=fb501a2157d3eefc\r\n"
      "\r\n";

  client->write(handshake.c_str());
  awaitTime = millis();
}

void WebSocketClient::sendBuff(byte buf[], int len) {
  client->write(buf, len);
}

void WebSocketClient::readWs() {
  byte i = 0;

  if (awaitingUpgrade) {
    char tmpData[32];
    
    while(client->available() > 0) {
      char c = client->read();
      
      if (c == ' ' or c == '\0') {
        tmpData[i] = '\0';
        
        if (!strcmp(tmpData, "101")) {
          clearBuffer();
          awaitingUpgrade = false;
          upgrading = false;
        }
        
        memset(tmpData, 0, sizeof(tmpData));
        i = 0;
        return;
      }
      
      tmpData[i++] = c;
    }
  } else {
    decodeData();
  }
}

void WebSocketClient::decodeData() {
  int TYPE = client->read();

  if (TYPE == 0x0) {
    client->write((byte)0x0);
    clearBuffer();
  } else if (TYPE == 0x1) {
    int LEN = client->read();
    int data[LEN];
    for (byte i = 0; i < LEN; i++) data[i] = client->read();

    if (data[0] == 0x0) {
      strip->stop();
      strip->clear();
    } else if (data[0] == 0x1) {
      strip->stop();
      strip->showSolidColor();
    } else if (data[0] == 0x3) {
      strip->clearHeapMem();
      
      int **tmp;
      tmp = new int*[data[1]];
  
      for (int i = 0; i < data[1]; i++) {
        tmp[i] = new int[3];
        for (int x = 0; i < 3; i++) {
          tmp[i][x] = data[(i * 3) + x + 2];
        }
      }
  
      strip->setPhases(tmp);
      strip->start();
      strip->mode = 0x3;
    } else if (data[0] == 0x4) {
      int intensity = data[1];
      int decay = data[2];
      
      int cutoff = 0;
      int mxintensity = 0;
  
      for (int i = 3; i < 3 + 5; i++) {
        cutoff += data[i];
        mxintensity += data[i + 5];
      }

      int animType = data[13];
      
      strip->start();
      strip->setSpectrumInfo(intensity, decay, cutoff, mxintensity, animType);
      strip->mode = 0x4;
    } else if (data[0] == 0xff and LEN == 4) {
      int rgb[3];
      for (int i = 0; i < 3; i++) rgb[i] = data[i + 1];
      strip->setColor(rgb);
    }
  }
}

void WebSocketClient::clearBuffer() {
  while (client->available() > 0) {
    client->read();
  }
}

void WebSocketClient::update() {
  if (WiFi.status() != WL_CONNECTED) connectToWifi();
  
  if (!client->connected()) {
     client->connect("192.168.0.10", 8080);
     awaitingUpgrade = true;
  }
  
  if (awaitingUpgrade and !upgrading) {
    Serial.println("[*] Attempting connection with WebServer");
    connectToWs("/dvcCon");
  }
  
  if (client->available() > 0) readWs();
  
  if (upgrading and millis() - awaitTime >= awaitTimeout) {
    upgrading = false;
  }
}
