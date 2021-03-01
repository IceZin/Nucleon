#include "Command.h"

int indexOfChr(char* arr[], char* key) {
  Serial.println(key);
  for (int i = 0; i < 4; i++) {
    Serial.println(arr[i]);
    Serial.println(strcmp(arr[i], key));
    if (!strcmp(arr[i], key)) return i;
  }

  return -1;
}

Command::Command() {
  
}

void Command::handleCommand() {
  const int LEN = Serial.read();
  int data[LEN];
  int i = 0;

  long timeout = 1000;
  long start = millis();
  
  recvInProgress = true;

  while (recvInProgress) {
    if (Serial.available() > 0) {
      int dBit = Serial.read();
      data[i] = dBit;
      
      i++;

      if (i == LEN) {
        recvInProgress = false;
        newData = true;
      }
    }

    if (millis() - start >= timeout) {
      recvInProgress = false;
      return;
    }
  }

  if (data[0] == 0x0) {
    strip->stop();
    strip->clear();
  } else if (data[0] == 0x1) {
    strip->stop();
    strip->showSolidColor();
  } else if (data[0] == 0x3) {
    strip->clearHeapMem();
    
    int **tmp;
    tmp = new int*[data[1]];

    for (int i = 0; i < data[1]; i++) {
      tmp[i] = new int[3];
      for (int x = 0; i < 3; i++) {
        tmp[i][x] = data[(i * 3) + x + 2];
      }
    }

    strip->setPhases(tmp);
    strip->start();
    strip->mode = 0x3;
  } else if (data[0] == 0x4) {
    int intensity = data[1];
    int decay = data[2];
    
    int cutoff = 0;
    int mxintensity = 0;

    for (int i = 3; i < 3 + 5; i++) {
      cutoff += data[i];
      mxintensity += data[i + 5];
    }
    
    strip->start();
    strip->setSpectrumInfo(intensity, decay, cutoff, mxintensity);
    strip->mode = 0x4;
  } else if (data[0] == 0xff) {
    int rgb[3];
    for (int i = 0; i < 3; i++) rgb[i] = data[i + 1];
    strip->setColor(rgb);
  }

  clearBuffer();
}

void Command::clearBuffer() {
  while (Serial.available() > 0) Serial.read();
}

void Command::getKeyValue(char* key, char* value) {
  byte i = 0;
  byte d_i = 0;
  byte param = 0;
  bool started = false;
  
  while(true) {
    if (data[i] == ':') {
      key[d_i] = '\0';
      param++;
      d_i = 0;
    } else if (data[i] == '\0') {
      value[d_i] = '\0';
      break;
    } else {
      if (param == 0) {
        key[d_i++] = data[i];
      } else {
        value[d_i++] = data[i];
      }
    }
    
    i++;
  } 
}

char* Command::split(char cs, char ce) {
  int n = 0;
  static char param[sizeof(data)];
  
  if (ce == '\0') {
    for (int i = indexof(cs)+1; i <= strlen(data); i++) {
      param[n] = data[i];
      n++;
    }
  } else {
    for (int i = indexof(cs); i <= indexof(ce); i++) {
      param[n] = data[i];
      n++;
    }
  }
  
  param[n] = '\0';
  return param;
}

bool Command::subchar(int ns, int ne, const char* comp) {
  char command[sizeof(data)];
  
  if (ns < 16 or ne < 16) {
    command[0] = '\0';
    int n = 0;
    
    for (int i = ns; i < ne; i++) {
      command[n] = data[i];
      n++;
    }
    
    command[n] = '\0';
    
    if (!strcmp(command, comp)) {
      return true;
    } else {
      return false;
    }
  } else {
    return false;
  }
}

int Command::indexof(char c) {
  int ind = -1;
  
  for (int i = 0; i < strlen(data); i++) {
    if (data[i] == c) {
      ind = i;
    }
  }
  
  return ind;
}

void Command::removeCharFrom(char* dt, char c) {
  int k = 0;
  byte i = 0;
  
  while (dt[i] != '\0') {
    if (dt[i] != c) {
      dt[k++] = dt[i];
    }
    i++;
  }
  
  dt[k] = '\0';
}

void Command::getList(char* dt, int* list) {
  char* ptr = strtok(dt, "[,]");
  byte i = 0;
  
  while (ptr != NULL) {
    list[i] = atoi(ptr);
    ptr = strtok(NULL, "[,]");
    i++;
  }
  
  memset(dt, 0, sizeof(dt));
  list[i] = -1;
}
