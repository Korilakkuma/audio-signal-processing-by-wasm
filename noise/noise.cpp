#include <stdlib.h>
#include <math.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

static float *outputRs = NULL;
static float *outputLs = NULL;

static float b0 = 0.0f;
static float b1 = 0.0f;
static float b2 = 0.0f;
static float b3 = 0.0f;
static float b4 = 0.0f;
static float b5 = 0.0f;
static float b6 = 0.0f;

static float last_out = 0.0f;

#ifdef __cplusplus
extern "C" {
#endif

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *whitenoiseL(const unsigned int time, const int buffer_size) {
  if (outputLs) {
    free(outputLs);
  }

  srand(time);

  outputLs = (float *)calloc(buffer_size, sizeof(float));

  for (int n = 0; n < buffer_size; n++) {
    outputLs[n] = (float)((2.0f * ((float)rand() / (RAND_MAX + 1.0))) - 1.0f);
  }

  return outputLs;
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *whitenoiseR(const unsigned int time, const int buffer_size) {
  if (outputRs) {
    free(outputRs);
  }

  srand(time);

  outputRs = (float *)calloc(buffer_size, sizeof(float));

  for (int n = 0; n < buffer_size; n++) {
    outputRs[n] = (float)((2.0f * ((float)rand() / (RAND_MAX + 1.0))) - 1.0f);
  }

  return outputRs;
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *pinknoiseL(const unsigned int time, const int buffer_size) {
  if (outputLs) {
    free(outputLs);
  }

  srand(time);

  outputLs = (float *)calloc(buffer_size, sizeof(float));

  for (int n = 0; n < buffer_size; n++) {
    float white = (float)((2.0f * ((float)rand() / (RAND_MAX + 1.0))) - 1.0f);

    b0 = (0.99886f * b0) + (white * 0.0555179f);
    b1 = (0.99332f * b1) + (white * 0.0750759f);
    b2 = (0.96900f * b2) + (white * 0.1538520f);
    b3 = (0.86650f * b3) + (white * 0.3104856f);
    b4 = (0.55000f * b4) + (white * 0.5329522f);
    b5 = (-0.7616f * b5) - (white * 0.0168980f);

    outputLs[n] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + (white * 0.5362f);
    outputLs[n] *= 0.11f;

    b6 = white * 0.115926f;
  }

  return outputLs;
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *pinknoiseR(const unsigned int time, const int buffer_size) {
  if (outputRs) {
    free(outputRs);
  }

  srand(time);

  outputRs = (float *)calloc(buffer_size, sizeof(float));

  for (int n = 0; n < buffer_size; n++) {
    float white = (float)((2.0f * ((float)rand() / (RAND_MAX + 1.0))) - 1.0f);

    b0 = (0.99886f * b0) + (white * 0.0555179f);
    b1 = (0.99332f * b1) + (white * 0.0750759f);
    b2 = (0.96900f * b2) + (white * 0.1538520f);
    b3 = (0.86650f * b3) + (white * 0.3104856f);
    b4 = (0.55000f * b4) + (white * 0.5329522f);
    b5 = (-0.7616f * b5) - (white * 0.0168980f);

    outputRs[n] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + (white * 0.5362f);
    outputRs[n] *= 0.11f;

    b6 = white * 0.115926f;
  }

  return outputRs;
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *browniannoiseL(const unsigned int time, const int buffer_size) {
  if (outputLs) {
    free(outputLs);
  }

  srand(time);

  outputLs = (float *)calloc(buffer_size, sizeof(float));

  for (int n = 0; n < buffer_size; n++) {
    float white = (float)((2.0f * ((float)rand() / (RAND_MAX + 1.0))) - 1.0f);

    outputLs[n] = (last_out + (0.02f * white)) / 1.02f;

    last_out = (last_out + (0.02f * white)) / 1.02f;

    outputLs[n] *= 3.5f;
  }

  return outputLs;
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *browniannoiseR(const unsigned int time, const int buffer_size) {
  if (outputRs) {
    free(outputRs);
  }

  srand(time);

  outputRs = (float *)calloc(buffer_size, sizeof(float));

  for (int n = 0; n < buffer_size; n++) {
    float white = (float)((2.0f * ((float)rand() / (RAND_MAX + 1.0))) - 1.0f);

    outputRs[n] = (last_out + (0.02f * white)) / 1.02f;

    last_out = (last_out + (0.02f * white)) / 1.02f;

    outputRs[n] *= 3.5f;
  }

  return outputRs;
}

#ifdef __cplusplus
}
#endif
