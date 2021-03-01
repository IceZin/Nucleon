#include "WebSocketClient.h"
#include "LedControl.h"
#include <WiFi.h>

WiFiClient client;
WebSocketClient webclient;
LedControl led_manager;

void setup() {
  Serial.begin(115200);

  led_manager.setupLeds();
  led_manager.mode = 0x00;
  led_manager.ws = &webclient;
  led_manager.start();

  webclient.strip = &led_manager;
  webclient.connectToWifi();

  Serial.println("[*] ESP32 STARTED");
}

void loop() {
  webclient.update();
  led_manager.update();
}
