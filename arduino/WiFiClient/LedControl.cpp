#include "LedControl.h"

LedControl::LedControl() {
  
}

void LedControl::setupLeds() {
  pinMode(22, OUTPUT);
  pinMode(34, INPUT);

  analogReadResolution(10);
  
  FastLED.addLeds<WS2812, 22, RBG>(strip, leds);
  FastLED.clear();
  FastLED.show();

  FastLED.setMaxPowerInVoltsAndMilliamps(5,1500);  //set to 5 volts 1.5 amps
}

void LedControl::clear() {
  FastLED.clear();
  FastLED.show();
}

void LedControl::start() {
  if (!state) {
    state = true;
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
  if (millis() - lastUpdate >= update_delay) {
    if (state) {
      if (mode == SHIFT_LEFT) shiftToLeft();
      else if (mode == SHIFT_RIGHT) shiftToRight();
      else if (mode == SPECTRUM) spectrum();
    }

    if (update_delay > 0) lastUpdate = millis();
  }
}

void LedControl::showSolidColor() {
  if (clr_type == 0) {
    fill_solid(strip, leds, CRGB(strip_color[0], strip_color[1], strip_color[2]));
    FastLED.show();
  } else if (clr_type == 1 or clr_type == 2) {
    led = 0;
    setFade();
  }
}

void LedControl::setColor(int* rgb) {
  for (int i = 0; i < 3; i++) strip_color[i] = rgb[i];

  if (mode == 0x1) showSolidColor();
}

void LedControl::setColorType(int type) {
  clr_type = type;
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

/*void LedControl::fade() {
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
}*/

void LedControl::setSpectrumInfo(int intensity, int decay, int cutoff, int mxintensity, int animType) {
  spectrumDecay = decay;
  spectrumCutoff = cutoff;
  animation = animType;

  if (mxintensity == 0) {
    if (!autoMode) {
      autoMode = true;
      maxVal = 0;
    }
  } else {
    autoMode = false;
    maxVal = mxintensity;
  }

  led = 0;
}

void LedControl::spectrum() {
  int rval = sample();
  if (rval > maxVal and autoMode) {
    maxVal = rval;
  }

  if (autoMode and millis() - lastAutoUpdate >= 500) {
    int tmp = maxVal;
    byte buf[7] = {0x1, 0x0};
    
    for (int i = 0; i < 5; i++) {
      if (tmp > 255) {
        buf[i + 2] = 0xff;
        tmp -= 255;
      } else if (tmp <= 255 and tmp > 0) {
        buf[i + 2] = tmp;
        tmp = 0;
      } else {
        buf[i + 2] = 0;
      }
    }
    
    ws->sendBuff(buf, 7); 

    lastAutoUpdate = millis();
  }
  
  if (rval - lval > 10) {
    lval = rval;
    l_action = millis();
  } else {
    if (millis() - l_action >= 1 and lval > 0) {
      int decay = ceil(((float)spectrumDecay / 255.0) * ((float)maxVal / 4.0));
      if (lval >= decay) lval -= decay;
      else lval = 0;
      l_action = millis();
    }
  }

  if (millis() - l_action >= 5000 and autoMode) maxVal = 0;

  float intensity = 0.0;
  if (maxVal > 0) {
    if (autoMode) intensity = (float)lval / ((float)maxVal * 0.8);
    else intensity = (float)lval / (float)maxVal;
  }

  /*Serial.print("maxVal:");
  Serial.print(maxVal);
  Serial.print(", ");
  Serial.print("signalVal:");
  Serial.print(rval);
  Serial.print(", ");
  Serial.print("ledVal:");
  Serial.print(lval);
  Serial.print(", ");
  Serial.print("Intensity:");
  Serial.println(intensity * 100);*/

  if (intensity > 1.0) intensity = 1.0;

  if (animation == 0) animateSolid(intensity);
  else if (animation == 1) animateLine(intensity);
}

int LedControl::sample() {
  int smax = 0;
  int smin = 1023;
  
  for (int i = 0; i < 200; i++) {
    int rval = analogRead(34);
    
    if (rval > smax) smax = rval;
    if (rval < smin) smin = rval;

    /*Serial.print("signal:");
    Serial.println(rval);*/
  }

  if (smax - smin < spectrumCutoff) return 0;

  return smax - smin;
}

void LedControl::animateSolid(float intensity) {
  int color[3];
  int brg_c = round(intensity * 50);

  if (led < brg_c) {
    if (millis() - l_d > 10) {
      led++;
      l_d = millis();
    }
  } else if (led > brg_c) {
    led = brg_c;
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
    if (clr_type == 0) {
      strip[led++] = CRGB(strip_color[0], strip_color[1], strip_color[2]);
    } else if (clr_type == 1 or clr_type == 2) {
      int fade[3];
      calcLinearFade((double)led / (double)leds, p_sz, p, fade);
      strip[led++] = CRGB(fade[0], fade[1], fade[2]);
    }
  } else if (led > leds_c) {
    strip[led--] = CRGB(0, 0, 0);
  }

  FastLED.show();
}

void LedControl::shiftToLeft() {
  if (clr_type == 1 or clr_type == 2) {
    setFade();
  }

  if (--led < 0) led = leds - 1;
}

void LedControl::shiftToRight() {
  if (clr_type == 1 or clr_type == 2) {
    setFade();
  }
  
  if (++led == leds) led = 0;
}

void LedControl::setFade() {
  for (int i = 0; i < leds; i++) {
    int fade[3];
    int mtl = 0;
    
    if (led + i >= leds) mtl = 1;
    
    calcInfiniteFade((double)((led + i) - (leds * mtl)) / (double)leds, p_sz, p, fade);
    
    strip[i] = CRGB(fade[0], fade[1], fade[2]);
  }
  
  FastLED.show();
}

void LedControl::calcInfiniteFade(double intensity, int ls_size, double **phases, int* result) {
  //Fix intensity
  if (intensity > 1) intensity = 1.0;

  //Start Phase
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

void LedControl::calcLinearFade(double intensity, int ls_size, double **phases, int* result) {
  //Fix intensity
  if (intensity > 1) intensity = 1.0;
  ls_size -= 1;

  //Start Phase
  int ph = floor((double)ls_size * intensity);

  //End Phase
  int endph;
  if (ph == ls_size) endph = ph;
  else endph = ph + 1;

  //Phase value
  double phase_n = (1.0 / (double)ls_size) * ph;

  //Phase intensity
  if (phase_n > 0) intensity = (intensity - phase_n) / phase_n;
  else intensity *= ls_size;

  for (int i = 0; i < 3; i++) result[i] = round(intensity * (phases[endph][i] - phases[ph][i]) + phases[ph][i]);
}
