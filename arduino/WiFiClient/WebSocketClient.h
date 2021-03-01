#ifndef WebSocketClient_h
#define WebSocketClient_h

#include "Arduino.h"
#include "LedControl.h"
#include <WiFi.h>

class WebSocketClient {
  public:
    WebSocketClient();
    
    void connectToWifi();
    void connect();
    void update();
    void scan();
    void sendBuff(byte buf[], int len);

    class LedControl *strip;
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
    
    WiFiClient *client;
};

#endif
