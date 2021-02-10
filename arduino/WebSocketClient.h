#ifndef WebSocketClient_h
#define WebSocketClient_h

#include "Arduino.h"
#include <ESP8266WiFi.h>

class WebSocketClient {
  public:
    WebSocketClient();
    void connectToWifi();
    void connect();
    void update();
    void scan();
  private:
    byte data[256];
    bool newData;
    long awaitTimeout = 5000;
    long awaitTime = 0;
    bool awaitingUpgrade = false;
    bool upgrading = false;
    void connectToWs(String path);
    void readWs();
    void clearBuffer();
    void decodeData();
    void sendPong();
    String generateKey();
    WiFiClient *client;
};

#endif
