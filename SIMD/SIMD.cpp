#include <stdlib.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <wasm_simd128.h>
#endif

static float *inputs = nullptr;

#ifdef __cplusplus
extern "C" {
#endif

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float SIMD(const size_t size) {
  float result = 0.0f;

#ifdef __WASM_SIMD128_H
  v128_t v = wasm_f32x4_make(0.0f, 0.0f, 0.0f, 0.0f);

  for (int i = 0; i < size; i += 8) {
    v128_t v1 = wasm_f32x4_make(inputs[i + 0], inputs[i + 1], inputs[i + 2], inputs[i + 3]);
    v128_t v2 = wasm_f32x4_make(inputs[i + 4], inputs[i + 5], inputs[i + 6], inputs[i + 7]);

    v128_t v3 = wasm_f32x4_add(v1, v2);

    v = wasm_f32x4_add(v, v3);
  }

  result += wasm_f32x4_extract_lane(v, 0);
  result += wasm_f32x4_extract_lane(v, 1);
  result += wasm_f32x4_extract_lane(v, 2);
  result += wasm_f32x4_extract_lane(v, 3);
#else
  for (int i = 0; i < size; i++) {
    result += inputs[i];
  }
#endif

  return result;
}

#ifdef __EMSCRIPTEN__
EMSCRIPTEN_KEEPALIVE
#endif
float *alloc_memory_inputs(const size_t buffer_size) {
  if (inputs) {
    free(inputs);
  }

  inputs = (float *)calloc(buffer_size, sizeof(float));

  return inputs;
}

#ifdef __cplusplus
}
#endif
