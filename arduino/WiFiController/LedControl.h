#ifndef LedControl_h
#define LedControl_h

#include "Arduino.h"
#include <FastLED.h>
#include <arduinoFFT.h>

class LedControl {
  public:
    LedControl();
    void clear();
    void start();
    void stop();
    void update();
    void autoUpdate();
    void setupLeds();
    void showSolidColor();
    void setColor(int* rgb);
    void setPhases(int** phases);
    void setFadeS(int* rgb);
    void setFadeE(int* rgb);
    void setLen(int len);
    void setDelay(int ms);
    void clearTemp();
    void clearHeapMem();

    void setSpectrumInfo(int intensity, int spd, int cutoff, int mxintensity);
    
    int8_t mode = 0x00;
    int8_t t = 3;
  private:
    void trail();
    void fade();
    void spectrum();
    void animateSolid(float intensity);
    void animateLine(float intensity);
    void rainbow();
    void calcFade(double intensity, double *phases[3], int* result);

    int sample();
    
    bool state = false;

    int leds = 50;
    int led = 0;
    int trail_len = 10;

    int maxVal = 0;
    int lval = 0;
    int spectrumCutoff = 100;
    int spectrumDecay = 10;
    
    int asset = 0;
    int strip_color[3];
    int** fade_color;
    int update_delay = 0;
    
    int8_t SOLID = 0x1;
    int8_t FADE = 0x2;
    int8_t CHROMA = 0x3;
    int8_t SPECTRUM = 0x4;
    
    long update_ms;
    long info_ms;
    long l_action = 0;
    long l_d = 0;
    
    CRGB strip[50];
    arduinoFFT FFT = arduinoFFT();
};

#endif
