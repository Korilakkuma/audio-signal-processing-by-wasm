#include <stdlib.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

static const int buffer_size = 128;

static float *inputLs  = nullptr;
static float *inputRs  = nullptr;
static float *outputLs = nullptr;
static float *outputRs = nullptr;

#ifdef __cplusplus
extern "C" {
#endif

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *vocalcancelerL(const float depth) {
  if (outputLs) {
    free(outputLs);
  }

  outputLs = (float *)calloc(buffer_size, sizeof(float));

  for (int n = 0; n < buffer_size; n++) {
    outputLs[n] = inputLs[n] - (depth * inputRs[n]);
  }

  return outputLs;
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *vocalcancelerR(const float depth) {
  if (outputRs) {
    free(outputRs);
  }

  outputRs = (float *)calloc(buffer_size, sizeof(float));

  for (int n = 0; n < buffer_size; n++) {
    outputRs[n] = inputRs[n] - (depth * inputLs[n]);
  }

  return outputRs;
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *alloc_memory_inputLs(void) {
  if (inputLs) {
    free(inputLs);
  }

  inputLs = (float *)calloc(buffer_size, sizeof(float));

  return inputLs;
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *alloc_memory_inputRs(void) {
  if (inputRs) {
    free(inputRs);
  }

  inputRs = (float *)calloc(buffer_size, sizeof(float));

  return inputRs;
}
#ifdef __cplusplus
}
#endif
