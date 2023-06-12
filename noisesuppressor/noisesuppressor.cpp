#include <math.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

inline int pow2(int n);
inline void swap(float *real, float *imag, int i, int k);

void FFT(float *real, float *imag, int N);
void IFFT(float *real, float *imag, int N);

#ifdef __cplusplus
extern "C" {
#endif

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
void noisesuppressor(double threshold, float *inputs, float *outputs, int buffer_size) {
  float *input_reals  = (float *)calloc(buffer_size, sizeof(float));
  float *input_imags  = (float *)calloc(buffer_size, sizeof(float));
  float *output_reals = (float *)calloc(buffer_size, sizeof(float));
  float *output_imags = (float *)calloc(buffer_size, sizeof(float));

  float *amplitudes = (float *)calloc(buffer_size, sizeof(float));
  float *phases     = (float *)calloc(buffer_size, sizeof(float));

  for (int n = 0; n < buffer_size; n++) {
    input_reals[n] = inputs[n];
    input_imags[n] = 0.0f;
  }

  FFT(input_reals, input_imags, buffer_size);

  for (int k = 0; k < buffer_size; k++) {
    amplitudes[k] = sqrt((input_reals[k] * input_reals[k]) + (input_imags[k] * input_imags[k]));

    if ((input_imags[k] != 0.0) && (input_reals[k] != 0.0)) {
      phases[k] = atan2(input_imags[k], input_reals[k]);
    }
  }

  for (int k = 0; k < buffer_size; k++) {
    amplitudes[k] -= threshold;

    if (amplitudes[k] < 0.0) {
      amplitudes[k] = 0.0f;
    }
  }

  for (int k = 0; k < buffer_size; k++) {
    output_reals[k] = amplitudes[k] * cos(phases[k]);
    output_imags[k] = amplitudes[k] * sin(phases[k]);
  }

  IFFT(output_reals, output_imags, buffer_size);

  for (int n = 0; n < buffer_size; n++) {
    outputs[n] = output_reals[n];
  }

  free(input_reals);
  free(input_imags);
  free(output_reals);
  free(output_imags);
  free(amplitudes);
  free(phases);
}

#ifdef __cplusplus
}
#endif

inline int pow2(int n) {
  if (n == 0) {
    return 1;
  }

  return 2 << (n - 1);
}

inline void swap(float *real, float *imag, int i, int k) {
  float tmp_real;
  float tmp_imag;

  tmp_real = real[i];
  tmp_imag = imag[i];

  real[i] = real[k];
  imag[i] = imag[k];

  real[k] = tmp_real;
  imag[k] = tmp_imag;
}

void FFT(float *real, float *imag, int N) {
  int number_of_stages = log2(N);

  for (int stage = 1; stage <= number_of_stages; stage++) {
    for (int i = 0; i < pow2(stage - 1); i++) {
      int rest = number_of_stages - stage;

      for (int j = 0; j < pow2(rest); j++) {
        int n = i * pow2(rest + 1) + j;
        int m = pow2(rest) + n;
        int r = j * pow2(stage - 1);

        float a_real = real[n];
        float a_imag = imag[n];
        float b_real = real[m];
        float b_imag = imag[m];
        float c_real = cos((2.0 * M_PI * r) / N);
        float c_imag = 0 - sin((2.0 * M_PI * r) / N);

        if (stage < number_of_stages) {
          real[n] = a_real + b_real;
          imag[n] = a_imag + b_imag;
          real[m] = (c_real * (a_real - b_real)) - (c_imag * (a_imag - b_imag));
          imag[m] = (c_real * (a_imag - b_imag)) + (c_imag * (a_real - b_real));
        } else {
          real[n] = a_real + b_real;
          imag[n] = a_imag + b_imag;
          real[m] = a_real - b_real;
          imag[m] = a_imag - b_imag;
        }
      }
    }
  }

  int *index = (int *)calloc(N, sizeof(int));

  for (int stage = 1; stage <= number_of_stages; stage++) {
    int rest = number_of_stages - stage;

    for (int i = 0; i < pow2(stage - 1); i++) {
      index[pow2(stage - 1) + i] = index[i] + pow2(rest);
    }
  }

  for (int k = 0; k < N; k++) {
    if (index[k] <= k) {
      continue;
    }

    swap(real, imag, index[k], k);
  }

  free(index);
}

void IFFT(float *real, float *imag, int N) {
  int number_of_stages = log2(N);

  for (int stage = 1; stage <= number_of_stages; stage++) {
    for (int i = 0; i < pow2(stage - 1); i++) {
      int rest = number_of_stages - stage;

      for (int j = 0; j < pow2(rest); j++) {
        int n = i * pow2(rest + 1) + j;
        int m = pow2(rest) + n;
        int r = j * pow2(stage - 1);

        float a_real = real[n];
        float a_imag = imag[n];
        float b_real = real[m];
        float b_imag = imag[m];
        float c_real = cos((2.0 * M_PI * r) / N);
        float c_imag = sin((2.0 * M_PI * r) / N);

        if (stage < number_of_stages) {
          real[n] = a_real + b_real;
          imag[n] = a_imag + b_imag;
          real[m] = (c_real * (a_real - b_real)) - (c_imag * (a_imag - b_imag));
          imag[m] = (c_real * (a_imag - b_imag)) + (c_imag * (a_real - b_real));
        } else {
          real[n] = a_real + b_real;
          imag[n] = a_imag + b_imag;
          real[m] = a_real - b_real;
          imag[m] = a_imag - b_imag;
        }
      }
    }
  }

  int *index = (int *)calloc(N, sizeof(int));

  for (int stage = 1; stage <= number_of_stages; stage++) {
    int rest = number_of_stages - stage;

    for (int i = 0; i < pow2(stage - 1); i++) {
      index[pow2(stage - 1) + i] = index[i] + pow2(rest);
    }
  }

  for (int k = 0; k < N; k++) {
    if (index[k] <= k) {
      continue;
    }

    swap(real, imag, index[k], k);
  }

  for (int k = 0; k < N; k++) {
    real[k] /= N;
    imag[k] /= N;
  }

  free(index);
}
