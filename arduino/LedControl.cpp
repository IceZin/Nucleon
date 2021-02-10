#include "LedControl.h"

LedControl::LedControl() {
  
}

void LedControl::setupLeds() {
  pinMode(2, OUTPUT);
  pinMode(A0, INPUT);
  
  FastLED.addLeds<WS2811, 2, RBG>(strip, leds);
  FastLED.clear();
  FastLED.show();
}

void LedControl::clear() {
  FastLED.clear();
  FastLED.show();
}

void LedControl::start() {
  if (!state) {
    state = true;
    update_ms = millis();
  }
}

void LedControl::stop() {
  state = false;
  clearTemp();
}

void LedControl::clearTemp() {
  led = 0;
}

void LedControl::clearHeapMem() {
  int sz = sizeof(fade_color) / sizeof(fade_color[0]);
  
  for (int i = 0; i < sz; i++) {
    delete[] fade_color[i];
  }
  
  delete[] fade_color;
}

void LedControl::update() {
  if (millis() >= update_ms + update_delay) {
    if (state) {
      if (mode == FADE) fade();
      else if (mode == CHROMA) rainbow();
      else if (mode == SPECTRUM) spectrum();
    }
    
    update_ms += update_delay;
  }
}

void LedControl::showSolidColor() {
  fill_solid(strip, leds, CRGB(strip_color[0], strip_color[1], strip_color[2]));
  FastLED.show();
}

void LedControl::setColor(int* rgb) {
  for (int i = 0; i < 3; i++) strip_color[i] = rgb[i];
}

void LedControl::setPhases(int** phases) {
  fade_color = phases;
}

void LedControl::setFadeS(int* rgb) {
  for (int i = 0; i < 3; i++) {
    fade_color[0][i] = rgb[i];
  }
}

void LedControl::setFadeE(int* rgb) {
  for (int i = 0; i < 3; i++) {
    fade_color[1][i] = rgb[i];
  }
}

void LedControl::setLen(int len) {
  trail_len = len;
}

void LedControl::setDelay(int ms) {
  update_delay = ms;
}

void LedControl::trail() {
  if (led-1 >= 0) {
    strip[led-1] = CRGB(0, 0, 0);
  } else {
    strip[leds-1] = CRGB(0, 0, 0);
  }
  
  for (int i = 0; i < trail_len; i++) {
    if (i + led > leds-1) {
      strip[(i+led)-leds] = CRGB(fade_color[0][0], fade_color[0][1], fade_color[0][2]);
    } else {
      strip[i+led] = CRGB(fade_color[0][0], fade_color[0][1], fade_color[0][2]);
    }
  }
  
  FastLED.show();
  led++;
  
  if (led == leds) {
    led = 0;
  }
}

void LedControl::fade() {
  double *phases[3] = {(double*)fade_color[0], (double*)fade_color[1]};
  
  for (int i = 0; i < leds; i++) {
    int fade[3];
    int mtl = 0;
    
    if (led + i >= leds) mtl = 1;
    
    calcFade((double)((led + i) - (leds * mtl)) / (double)leds, phases, fade);
    
    strip[i] = CRGB(fade[0], fade[1], fade[2]);
  }
  
  if (++led == leds) led = 0;
  
  FastLED.show();
}

void LedControl::setSpectrumInfo(int intensity, int decay, int cutoff, int mxintensity) {
  spectrumDecay = decay;
  spectrumCutoff = cutoff;
  maxVal = mxintensity;
}

void LedControl::spectrum() {
  int rval = sample();
  /*if (rval > maxVal) {
    maxVal = rval;
  }*/
  
  if (rval - lval > 10) {
    lval = rval;
    l_action = millis();
  } else {
    if (millis() - l_action >= 1 and lval > 0) {
      if (lval >= spectrumDecay) lval -= spectrumDecay;
      else lval = 0;
      l_action = millis();
    }
  }

  //if (millis() - l_action >= 5000) maxVal = 0;

  float intensity = (float)lval / (float)maxVal;

  Serial.print("maxVal:");
  Serial.print(maxVal);
  Serial.print(", ");
  Serial.print("signalVal:");
  Serial.print(rval);
  Serial.print(", ");
  Serial.print("ledVal:");
  Serial.println(lval);

  if (intensity > 1.0) intensity = 1.0;

  animateLine(intensity);
}

int LedControl::sample() {
  int smax = 0;
  int smin = 1023;
  
  for (int i = 0; i < 200; i++) {
    int rval = analogRead(A0);
    
    if (rval > smax) smax = rval;
    if (rval < smin) smin = rval;
  }

  if (smax - smin < spectrumCutoff) return 0;

  return smax - smin;
}

void LedControl::animateSolid(float intensity) {
  int color[3];
  int brg_c = round(intensity * 50);

  if (led < brg_c) led++;
  else if (led > brg_c) {
    if (millis() - l_d > 20) {
      led--;
      l_d = millis();
    }
  }

  for (int i = 0; i < 3; i++) {
    color[i] = round(strip_color[i] * ((float)led / 50.0));
  }

  fill_solid(strip, leds, CRGB(color[0], color[1], color[2]));
  FastLED.show();
}

void LedControl::animateLine(float intensity) {
  int leds_c = round(intensity * (leds - 1));

  if (led < leds_c) {
    strip[led++] = CRGB(strip_color[0], strip_color[1], strip_color[2]);
  } else if (led > leds_c) {
    strip[led--] = CRGB(0, 0, 0);
  }

  FastLED.show();
}

void LedControl::rainbow() {
  double phases[3][3] = {{0.0, 0.0, 255.0}, {0.0, 255.0, 0.0}, {255.0, 0.0, 0.0}};
  double *p[3] = {phases[0], phases[1], phases[2]};
  
  for (int i = 0; i < leds; i++) {
    int fade[3];
    int mtl = 0;
    
    if (led + i >= leds) mtl = 1;
    
    calcFade((double)((led + i) - (leds * mtl)) / (double)leds, p, fade);
    strip[i] = CRGB(fade[0], fade[1], fade[2]);
  }
  
  if (++led == leds) led = 0;
  
  FastLED.show();
}

void LedControl::calcFade(double intensity, double *phases[3], int* result) {
  //Fix intensity
  if (intensity > 1) intensity = 1.0;

  //Start Phase
  int ls_size = (sizeof(phases) / sizeof(phases[0]));
  int ph = floor((double)ls_size * intensity);

  //End Phase
  int endph;
  if (ph == ls_size - 1) endph = 0;
  else endph = ph + 1;

  //Phase value
  double phase_n = (1.0 / (double)ls_size) * ph;

  //Phase intensity
  if (phase_n > 0) intensity = (intensity - phase_n) / phase_n;
  else intensity *= ls_size;

  for (int i = 0; i < 3; i++) result[i] = round(intensity * (phases[endph][i] - phases[ph][i]) + phases[ph][i]);
}
