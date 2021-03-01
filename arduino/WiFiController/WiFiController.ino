#include "LedControl.h"
#include "Command.h"
#include <Wire.h>

LedControl led_strip;
Command observer;

void setup() {
  led_strip.setupLeds();
  led_strip.mode = 0x00;
  led_strip.start();
  observer.strip = &led_strip;

  Serial.begin(115200);
}

void loop() {
  while (Serial.available() > 0 ) {
    observer.handleCommand();
  }
  
  led_strip.update();
}
