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
      "dvc_name: ESP8266 LED\r\n"
      "dvc_addr: esp_led\r\n"
      "owner: fb501a2157d3eefc\r\n"
      "\r\n";

  client->write(handshake.c_str());
  awaitTime = millis();
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
    client->write(0x0);
    clearBuffer();
  } else if (TYPE == 0x1) {
    byte LEN = client->read();
    byte c;
    Serial.write(LEN);
  
    for (byte i = 0; i < LEN; i++) {
      c = client->read();
      Serial.write(c);
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
    connectToWs("/dvcCon");
  }
  
  if (client->available() > 0) readWs();
  
  if (upgrading and millis() - awaitTime >= awaitTimeout) {
    upgrading = false;
  }
}
