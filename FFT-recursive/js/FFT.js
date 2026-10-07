/**
 * @param {[[number, number]]} complexes
 * @param {boolean} inverse
 */
const dft = (complexes, inverse) => {
  const size = complexes.length;

  if (size === 1) {
    return complexes;
  }

  const halfOfSize = size / 2;

  const evens = [];
  const odds  = [];

  for (let n = 0; n < halfOfSize; n++) {
    evens[n] = complexes[(2 * n) + 0];
    odds[n]  = complexes[(2 * n) + 1];
  }

  dft(evens, inverse);
  dft(odds, inverse);

  const rotators = [];

  const w = (inverse ? (2 * Math.PI) : (-2 * Math.PI)) / size;

  for (let n = 0; n < halfOfSize; n++) {
    const [real, imag] = odds[n];
    const radian = w * n;

    rotators[n] = [((real * Math.cos(radian)) - (imag * Math.sin(radian))), ((real * Math.sin(radian)) + (imag * Math.cos(radian)))];
  }

  for (let n = 0; n < halfOfSize; n++) {
    const [real, imag] = evens[n];

    complexes[n] = [(real + rotators[n][0]), (imag + rotators[n][1])];
  }

  for (let n = halfOfSize; n < size; n++) {
    const [real, imag] = evens[n - halfOfSize];

    complexes[n] = [(real - rotators[n - halfOfSize][0]), (imag - rotators[n - halfOfSize][1])];
  }
};

/**
 * @param {[[number, number]]} complexes
 */
function FFT(complexes) {
  dft(complexes, false);
}

/**
 * @param {[[number, number]]} complexes
 */
function IFFT(complexes) {
  dft(complexes, true);

  const size = complexes.length;

  for (let n = 0; n < size; n++) {
    complexes[n] = [(complexes[n][0] / size), (complexes[n][1] / size)];
  }
}
