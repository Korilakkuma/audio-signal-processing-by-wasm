/**
 * Divede and Conquer
 *
 * @param {[[Float32Array, Float32Array]]} complexes
 * @param {boolean} inverse
 */
const dft = (complexes, inverse) => {
  if (complexes.length === 1) {
    return complexes;
  }

  const evens = dft(complexes.filter((_, index) => index % 2 === 0), inverse);
  const odds  = dft(complexes.filter((_, index) => index % 2 === 1), inverse);

  const w = (inverse ? (2 * Math.PI) : (-2 * Math.PI)) / complexes.length;

  const rotators = odds.map(([real, imag], index) => {
    const radian = w * index;

    return [((real * Math.cos(radian)) - (imag * Math.sin(radian))), ((real * Math.sin(radian)) + (imag * Math.cos(radian)))];
  });

  return evens
    .map(([real, imag], index) => {
      return [real + rotators[index][0], imag + rotators[index][1]];
    }).concat(evens.map(([real, imag], index) => {
      return [real - rotators[index][0], imag - rotators[index][1]];
    }));
};

/**
 *
 * @param {Float32Array} reals
 * @param {Float32Array} imags
 */
function FFT(reals, imags) {
  const complexes = [];

  for (let n = 0, len = reals.length; n < len; n++) {
    complexes[n] = new Float32Array([reals[n], imags[n]]);
  }

  console.log(complexes);
  return dft(complexes, false);
}

/**
 *
 * @param {Float32Array} reals
 * @param {Float32Array} imags
 */
function IFFT(reals, imags) {
  const complexes = [];

  for (let n = 0, len = reals.length; n < len; n++) {
    complexes[n] = new Float32Array([reals[n], imags[n]]);
  }

  return dft(complexes, true).map(([real, imag]) => [(real / reals.length), (imag / imags.length)]);
}

function runTest() {
  const cmul = ([ax, ay], [bx, by]) => {
    return [ax * bx - ay * by, ax * by + ay * bx];
  };

  const cmulv1 = (a1d, b1d) => a1d.map((a, i) => {
    return cmul(a, b1d[i]);
  });

  // from example: https://atcoder.jp/contests/atc001/tasks/fft_c
  const N = 4;

  // for convolution, expand 2N with 0 at N...2N
  const real0s = new Float32Array([1, 2, 3, 4, 0, 0, 0, 0]);
  const real1s = new Float32Array([1, 2, 4, 8, 0, 0, 0, 0]);
  const imag0s = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);
  const imag1s = new Float32Array([0, 0, 0, 0, 0, 0, 0, 0]);

  const spectrums = cmulv1(FFT(real0s, imag0s), FFT(real1s, imag1s));

  const result = IFFT(spectrums.map(([real, _]) => real), spectrums.map(([_, imag]) => imag));

  console.log(result.map(([r, i]) => Math.round(r) >>> 0));
}

runTest();
