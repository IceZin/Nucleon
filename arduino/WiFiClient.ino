#include <ESP8266WiFi.h>
#include "WebSocketClient.h"

WebSocketClient webclient;

void setup() {
  Serial.begin(115200);
  Serial.println("[!] Starting ESP8266");
  webclient.scan();
  webclient.connectToWifi();
  Serial.println("[*] ESP8266 Started");
}

void loop() {
  webclient.update();
}
