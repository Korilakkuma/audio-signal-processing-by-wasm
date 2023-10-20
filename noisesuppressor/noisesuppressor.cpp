#include <stdlib.h>
#include <math.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

static float *inputLs  = NULL;
static float *inputRs  = NULL;
static float *outputLs = NULL;
static float *outputRs = NULL;

static inline int pow2(int n);
static inline void swap(float *reals, float *imags, int i, int k);

static void FFT(float *reals, float *imags, int size);
static void IFFT(float *reals, float *imags, int size);

#ifdef __cplusplus
extern "C" {
#endif

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *noisesuppressorL(const float threshold, const int buffer_size) {
  if (outputLs) {
    free(outputLs);
  }

  outputLs = (float *)calloc(buffer_size, sizeof(float));

  float *input_reals  = (float *)calloc(buffer_size, sizeof(float));
  float *input_imags  = (float *)calloc(buffer_size, sizeof(float));
  float *output_reals = (float *)calloc(buffer_size, sizeof(float));
  float *output_imags = (float *)calloc(buffer_size, sizeof(float));

  float *amplitudes = (float *)calloc(buffer_size, sizeof(float));
  float *phases     = (float *)calloc(buffer_size, sizeof(float));

  for (int n = 0; n < buffer_size; n++) {
    input_reals[n] = inputLs[n];
    input_imags[n] = 0.0f;
  }

  FFT(input_reals, input_imags, buffer_size);

  for (int k = 0; k < buffer_size; k++) {
    amplitudes[k] = sqrtf((input_reals[k] * input_reals[k]) + (input_imags[k] * input_imags[k]));

    if ((input_imags[k] != 0.0f) && (input_reals[k] != 0.0f)) {
      phases[k] = atan2f(input_imags[k], input_reals[k]);
    }
  }

  for (int k = 0; k < buffer_size; k++) {
    amplitudes[k] -= threshold;

    if (amplitudes[k] < 0.0f) {
      amplitudes[k] = 0.0f;
    }
  }

  for (int k = 0; k < buffer_size; k++) {
    output_reals[k] = amplitudes[k] * cosf(phases[k]);
    output_imags[k] = amplitudes[k] * sinf(phases[k]);
  }

  IFFT(output_reals, output_imags, buffer_size);

  for (int n = 0; n < buffer_size; n++) {
    outputLs[n] = output_reals[n];
  }

  free(input_reals);
  free(input_imags);
  free(output_reals);
  free(output_imags);
  free(amplitudes);
  free(phases);

  return outputLs;
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *noisesuppressorR(const float threshold, const int buffer_size) {
  if (outputRs) {
    free(outputRs);
  }

  outputRs = (float *)calloc(buffer_size, sizeof(float));

  float *input_reals  = (float *)calloc(buffer_size, sizeof(float));
  float *input_imags  = (float *)calloc(buffer_size, sizeof(float));
  float *output_reals = (float *)calloc(buffer_size, sizeof(float));
  float *output_imags = (float *)calloc(buffer_size, sizeof(float));

  float *amplitudes = (float *)calloc(buffer_size, sizeof(float));
  float *phases     = (float *)calloc(buffer_size, sizeof(float));

  for (int n = 0; n < buffer_size; n++) {
    input_reals[n] = inputRs[n];
    input_imags[n] = 0.0f;
  }

  FFT(input_reals, input_imags, buffer_size);

  for (int k = 0; k < buffer_size; k++) {
    amplitudes[k] = sqrtf((input_reals[k] * input_reals[k]) + (input_imags[k] * input_imags[k]));

    if ((input_imags[k] != 0.0f) && (input_reals[k] != 0.0f)) {
      phases[k] = atan2f(input_imags[k], input_reals[k]);
    }
  }

  for (int k = 0; k < buffer_size; k++) {
    amplitudes[k] -= threshold;

    if (amplitudes[k] < 0.0f) {
      amplitudes[k] = 0.0f;
    }
  }

  for (int k = 0; k < buffer_size; k++) {
    output_reals[k] = amplitudes[k] * cosf(phases[k]);
    output_imags[k] = amplitudes[k] * sinf(phases[k]);
  }

  IFFT(output_reals, output_imags, buffer_size);

  for (int n = 0; n < buffer_size; n++) {
    outputRs[n] = output_reals[n];
  }

  free(input_reals);
  free(input_imags);
  free(output_reals);
  free(output_imags);
  free(amplitudes);
  free(phases);

  return outputRs;
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *alloc_memory_inputLs(const int buffer_size) {
  if (inputLs) {
    free(inputLs);
  }

  inputLs = (float *)calloc(buffer_size, sizeof(float));

  return inputLs;
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *alloc_memory_inputRs(const int buffer_size) {
  if (inputRs) {
    free(inputRs);
  }

  inputRs = (float *)calloc(buffer_size, sizeof(float));

  return inputRs;
}

#ifdef __cplusplus
}
#endif

static inline int pow2(int n) {
  if (n == 0) {
    return 1;
  }

  return 2 << (n - 1);
}

static inline void swap(float *reals, float *imags, int i, int k) {
  float tmp_real;
  float tmp_imag;

  tmp_real = reals[i];
  tmp_imag = imags[i];

  reals[i] = reals[k];
  imags[i] = imags[k];

  reals[k] = tmp_real;
  imags[k] = tmp_imag;
}

static void FFT(float *reals, float *imags, int size) {
  int number_of_stages = (int)log2((double)size);

  for (int stage = 1; stage <= number_of_stages; stage++) {
    for (int i = 0; i < pow2(stage - 1); i++) {
      int rest = number_of_stages - stage;

      for (int j = 0; j < pow2(rest); j++) {
        int n = i * pow2(rest + 1) + j;
        int m = pow2(rest) + n;
        int r = j * pow2(stage - 1);

        float a_real = reals[n];
        float a_imag = imags[n];
        float b_real = reals[m];
        float b_imag = imags[m];
        float c_real = cosf((2.0f * M_PI * r) / size);
        float c_imag = 0 - sinf((2.0f * M_PI * r) / size);

        if (stage < number_of_stages) {
          reals[n] = a_real + b_real;
          imags[n] = a_imag + b_imag;
          reals[m] = (c_real * (a_real - b_real)) - (c_imag * (a_imag - b_imag));
          imags[m] = (c_real * (a_imag - b_imag)) + (c_imag * (a_real - b_real));
        } else {
          reals[n] = a_real + b_real;
          imags[n] = a_imag + b_imag;
          reals[m] = a_real - b_real;
          imags[m] = a_imag - b_imag;
        }
      }
    }
  }

  int *index = (int *)calloc(size, sizeof(int));

  for (int stage = 1; stage <= number_of_stages; stage++) {
    int rest = number_of_stages - stage;

    for (int i = 0; i < pow2(stage - 1); i++) {
      index[pow2(stage - 1) + i] = index[i] + pow2(rest);
    }
  }

  for (int k = 0; k < size; k++) {
    if (index[k] <= k) {
      continue;
    }

    swap(reals, imags, index[k], k);
  }

  free(index);
}

static void IFFT(float *reals, float *imags, int size) {
  int number_of_stages = (int)log2((double)size);

  for (int stage = 1; stage <= number_of_stages; stage++) {
    for (int i = 0; i < pow2(stage - 1); i++) {
      int rest = number_of_stages - stage;

      for (int j = 0; j < pow2(rest); j++) {
        int n = i * pow2(rest + 1) + j;
        int m = pow2(rest) + n;
        int r = j * pow2(stage - 1);

        float a_real = reals[n];
        float a_imag = imags[n];
        float b_real = reals[m];
        float b_imag = imags[m];
        float c_real = cosf((2.0f * M_PI * r) / size);
        float c_imag = sinf((2.0f * M_PI * r) / size);

        if (stage < number_of_stages) {
          reals[n] = a_real + b_real;
          imags[n] = a_imag + b_imag;
          reals[m] = (c_real * (a_real - b_real)) - (c_imag * (a_imag - b_imag));
          imags[m] = (c_real * (a_imag - b_imag)) + (c_imag * (a_real - b_real));
        } else {
          reals[n] = a_real + b_real;
          imags[n] = a_imag + b_imag;
          reals[m] = a_real - b_real;
          imags[m] = a_imag - b_imag;
        }
      }
    }
  }

  int *index = (int *)calloc(size, sizeof(int));

  for (int stage = 1; stage <= number_of_stages; stage++) {
    int rest = number_of_stages - stage;

    for (int i = 0; i < pow2(stage - 1); i++) {
      index[pow2(stage - 1) + i] = index[i] + pow2(rest);
    }
  }

  for (int k = 0; k < size; k++) {
    if (index[k] <= k) {
      continue;
    }

    swap(reals, imags, index[k], k);
  }

  for (int k = 0; k < size; k++) {
    reals[k] /= size;
    imags[k] /= size;
  }

  free(index);
}
