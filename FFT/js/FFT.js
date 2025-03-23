const RECTANGULAR = 0;
const HANNING     = 1;
const HAMMING     = 2;

// 2^{n}
function pow2(n) {
  if (n == 0) {
    return 1;
  }

  return 2 << (n - 1);
}

function swap(reals, imags, i, k) {
  const tmp_real = reals[i];
  const tmp_imag = imags[i];

  reals[i] = reals[k];
  imags[i] = imags[k];

  reals[k] = tmp_real;
  imags[k] = tmp_imag;
}

function window_function(windows, size, window_function_type) {
  switch (window_function_type) {
    case HANNING: {
      for (let n = 0; n < size; n++) {
        if ((n % 2) === 0) {
          windows[n] = 0.5 - (0.5 * Math.cos(((2 * Math.PI) * n) / size));
        } else {
          windows[n] = 0.5 - (0.5 * Math.cos(((2 * Math.PI) * (n + 0.5)) / size));
        }
      }

      break;
    }

    case HAMMING: {
      for (let n = 0; n < size; n++) {
        if ((n % 2) === 0) {
          windows[n] = 0.54 - (0.46 * Math.cos(((2 * M_PI) * n) / size));
        } else {
          windows[n] = 0.54 - (0.46 * Math.cos(((2 * M_PI) * (n + 0.5)) / size));
        }
      }

      break;
    }

    case RECTANGULAR: {
      for (let n = 0; n < size; n++) {
        windows[n] = 1.0;
      }

      break;
    }
  }
}

function FFT(reals, imags, size) {
  const number_of_stages = Math.log2(size);

  for (let stage = 1; stage <= number_of_stages; stage++) {
    for (let i = 0; i < pow2(stage - 1); i++) {
      const rest = number_of_stages - stage;

      for (let j = 0; j < pow2(rest); j++) {
        const n = i * pow2(rest + 1) + j;
        const m = pow2(rest) + n;

        const w = 2.0 * Math.PI * j * pow2(stage - 1);

        const e_real = reals[n];
        const e_imag = imags[n];
        const o_real = reals[m];
        const o_imag = imags[m];
        const w_real = 0 + Math.cos(w / size);
        const w_imag = 0 - Math.sin(w / size);

        if (stage < number_of_stages) {
          reals[n] = e_real + o_real;
          imags[n] = e_imag + o_imag;
          reals[m] = (w_real * (e_real - o_real)) - (w_imag * (e_imag - o_imag));
          imags[m] = (w_real * (e_imag - o_imag)) + (w_imag * (e_real - o_real));
        } else {
          reals[n] = e_real + o_real;
          imags[n] = e_imag + o_imag;
          reals[m] = e_real - o_real;
          imags[m] = e_imag - o_imag;
        }
      }
    }
  }

  const indexes = new Uint16Array(size);

  for (let stage = 1; stage <= number_of_stages; stage++) {
    let rest = number_of_stages - stage;

    for (let i = 0; i < pow2(stage - 1); i++) {
      indexes[pow2(stage - 1) + i] = indexes[i] + pow2(rest);
    }
  }

  for (let k = 0; k < size; k++) {
    if (indexes[k] <= k) {
      continue;
    }

    swap(reals, imags, indexes[k], k);
  }
}

function IFFT(reals, imags, size) {
  const number_of_stages = Math.log2(size);

  for (let stage = 1; stage <= number_of_stages; stage++) {
    for (let i = 0; i < pow2(stage - 1); i++) {
      const rest = number_of_stages - stage;

      for (let j = 0; j < pow2(rest); j++) {
        const n = i * pow2(rest + 1) + j;
        const m = pow2(rest) + n;

        const w = 2.0 * Math.PI * j * pow2(stage - 1);

        const e_real = reals[n];
        const e_imag = imags[n];
        const o_real = reals[m];
        const o_imag = imags[m];
        const w_real = Math.cos(w / size);
        const w_imag = Math.sin(w / size);

        if (stage < number_of_stages) {
          reals[n] = e_real + o_real;
          imags[n] = e_imag + o_imag;
          reals[m] = (w_real * (e_real - o_real)) - (w_imag * (e_imag - o_imag));
          imags[m] = (w_real * (e_imag - o_imag)) + (w_imag * (e_real - o_real));
        } else {
          reals[n] = e_real + o_real;
          imags[n] = e_imag + o_imag;
          reals[m] = e_real - o_real;
          imags[m] = e_imag - o_imag;
        }
      }
    }
  }

  const indexes = new Uint16Array(size);

  for (let stage = 1; stage <= number_of_stages; stage++) {
    let rest = number_of_stages - stage;

    for (let i = 0; i < pow2(stage - 1); i++) {
      indexes[pow2(stage - 1) + i] = indexes[i] + pow2(rest);
    }
  }

  for (let k = 0; k < size; k++) {
    if (indexes[k] <= k) {
      continue;
    }

    swap(reals, imags, indexes[k], k);
  }

  for (let k = 0; k < size; k++) {
    reals[k] /= size;
    imags[k] /= size;
  }
}
