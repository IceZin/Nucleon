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
      "Host: nucleon.azurewebsites.net\r\n"
      "Connection: Upgrade\r\n"
      "Upgrade: websocket\r\n"
      "Sec-WebSocket-Version: 13\r\n"
      "Sec-WebSocket-Protocol: Device\r\n"
      "Cookie: dvc_name=ESP8266 LED;dvc_addr=esp_led;owner=fb501a2157d3eefc\r\n"
      "\r\n";

  client->println(handshake.c_str());
  awaitTime = millis();
}

void WebSocketClient::sendBuff(byte buf[], int len) {
  client->write(buf, len);
}

void WebSocketClient::readWs() {
  byte i = 0;

  if (awaitingUpgrade) {
    char tmpData[128];
    
    while(client->available() > 0) {
      char c = client->read();
      
      if (c == ' ' or c == '\0') {
        tmpData[i] = '\0';
        
        if (!strcmp(tmpData, "101")) {
          clearBuffer();
          awaitingUpgrade = false;
          upgrading = false;
          lastAction = millis();
          client->print("Test message");
        }
        
        memset(tmpData, 0, sizeof(tmpData));
        i = 0;
        return;
      }

      if (i == 128) {
        Serial.println(tmpData);
        memset(tmpData, 0, sizeof(tmpData));
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
  Serial.print("TYPE: ");
  Serial.println(TYPE);

  if (TYPE == 0x0) {
    lastAction = millis();
    byte buf[1] = {0x0};
    sendBuff(buf, 1);
    clearBuffer();
  } else if (TYPE == 0x1) {
    int LEN = client->read();
    Serial.println(LEN);
    int data[LEN];

    for (byte i = 0; i < LEN; i++) data[i] = client->read();

    Serial.print("MODE: ");
    Serial.println(data[0]);

    if (data[0] == 0x0) {
      strip->stop();
      strip->clear();
      strip->mode = 0x0;
    } else if (data[0] == 0x1) {
      strip->stop();
      strip->showSolidColor();
      strip->mode = 0x1;
    } else if (data[0] == 0x2) {
      strip->start();
      strip->update_delay = data[2];
      strip->mode = 0x2;
    } else if (data[0] == 0x3) {
      strip->start();
      strip->update_delay = data[2];
      strip->mode = 0x3;
    } else if (data[0] == 0x4) {
      strip->update_delay = 0;
      
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
    } else if (data[0] == 0xfe and LEN == 5) {
      strip->setColorType(data[1]);
      int rgb[3];
      for (int i = 0; i < 3; i++) rgb[i] = data[i + 2];
      strip->setColor(rgb);
    } else if (data[0] == 0xff) {
      if (p_len > 0) {
        for (int i = 0; i < p_len; i++) delete [] phases[i];
        delete [] phases;
      }
      
      p_len = (LEN - 2) / 3;
      phases = new double*[p_len];
      
      strip->setColorType(data[1]);
      strip->p_sz = p_len;

      for (int i = 0; i < p_len; i++) {
        phases[i] = new double[3];
        for (int x = 0; x < 3; x++) phases[i][x] = (double)data[(3 * i) + 2 + x];
      }
      
      strip->p = phases;
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
     Serial.println("[!] Not connected to server");
     client->connect("192.168.0.10", 80);
     awaitingUpgrade = true;
  }
  
  if (awaitingUpgrade and !upgrading) {
    Serial.println("[*] Attempting connection with WebServer");
    Serial.println(client->connected());
    connectToWs("/");
  }

  if (!awaitingUpgrade) {
    if (millis() - lastAction > 12000) {
      client->stop();
      awaitingUpgrade = true;
      lastAction = 0;
      Serial.println("[!] Server is not sending ping packets");
      Serial.println("[!] Disconnected");
    }
  }
  
  if (client->available() > 0) readWs();
  
  if (upgrading and millis() - awaitTime >= awaitTimeout) {
    upgrading = false;
  }
}
