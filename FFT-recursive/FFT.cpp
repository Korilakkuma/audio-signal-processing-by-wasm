#include <stdbool.h>
#include <stdlib.h>
#include <math.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#endif

typedef enum {
  RECTANGULAR,
  HANNING,
  HAMMING
} WINDOW_FUNCTION;


static float *complexes = nullptr;

static void dft(float *complexes, const size_t length, const bool inverse) {
  if (length == 1) {
    return;
  }

  int j = 0;

  for (int n = 0; n < length; n++) {
    if (n < j) {
      int real_n = (2 * n) + 0;
      int imag_n = (2 * n) + 1;
      int real_j = (2 * j) + 0;
      int imag_j = (2 * j) + 1;

      float tmp_real = complexes[real_n];
      float tmp_imag = complexes[imag_n];

      complexes[real_n] = complexes[real_j];
      complexes[imag_n] = complexes[imag_j];

      complexes[real_j] = tmp_real;
      complexes[imag_j] = tmp_imag;
    }

    int bit = length >> 1;

    while (bit & j) {
      j ^= bit;
      bit >>= 1;
    }

    j ^= bit;
  }

  for (int size = 2; size <= length; size *= 2) {
    int half_of_size = size / 2;

    float omega = (inverse ? (2.0f * M_PI) : (-2.0f * M_PI)) / size;

    for (int block = 0; block < length; block += size) {
      for (int n = 0; n < half_of_size; n++) {
        int even_index = 2 * (n + block);
        int odd_index  = 2 * (n + block + half_of_size);

        float odd_real = complexes[odd_index + 0];
        float odd_imag = complexes[odd_index + 1];

        float radian = omega * n;

        float rotator_real = (odd_real * cosf(radian)) - (odd_imag * sinf(radian));
        float rotator_imag = (odd_real * sinf(radian)) + (odd_imag * cosf(radian));

        float even_real = complexes[even_index + 0];
        float even_imag = complexes[even_index + 1];

        complexes[even_index + 0] = even_real + rotator_real;
        complexes[even_index + 1] = even_imag + rotator_imag;

        complexes[odd_index + 0] = even_real - rotator_real;
        complexes[odd_index + 1] = even_imag - rotator_imag;
      }
    }
  }
}

#ifdef __cplusplus
extern "C" {
#endif

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
void window_function(float *const window, const size_t size, const WINDOW_FUNCTION function) {
  switch (function) {
    case HANNING: {
      if (size & 0x00000001) {
        for (int n = 0; n < size; n++) {
          window[n] = 0.5 - (0.5 * cosf(((2 * M_PI) * (n + 0.5)) / size));
        }
      } else {
        for (int n = 0; n < size; n++) {
          window[n] = 0.5 - (0.5 * cosf(((2 * M_PI) * n) / size));
        }
      }

      break;
    }

    case HAMMING: {
      if (size & 0x00000001) {
        for (int n = 0; n < size; n++) {
          window[n] = 0.54 - (0.46 * cosf(((2 * M_PI) * (n + 0.5)) / size));
        }
      } else {
        for (int n = 0; n < size; n++) {
          window[n] = 0.54 - (0.46 * cosf(((2 * M_PI) * n) / size));
        }
      }

      break;
    }

    case RECTANGULAR: {
      for (int n = 0; n < size; n++) {
        window[n] = 1.0f;
      }

      break;
    }
  }
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
void FFT(const size_t length) {
  dft(complexes, length, false);
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
void IFFT(const size_t length) {
  dft(complexes, length, true);

  for (int n = 0; n < length; n++) {
    complexes[n] /= length;
  }
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *alloc_memory(const size_t buffer_size) {
  if (complexes) {
    free(complexes);
  }

  complexes = (float *)calloc(buffer_size, sizeof(float));

  return complexes;
}

#ifdef __cplusplus
}
#endif
