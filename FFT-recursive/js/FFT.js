/**
 * @param {[[number, number]]} complexes
 * @param {boolean} inverse
 */
const dft = (complexes, inverse) => {
  const length = complexes.length;

  if (length === 1) {
    return;
  }

  let j = 0;

  for (let n = 0; n < length; n++) {
    if (n < j) {
      const tmp = complexes[n];

      complexes[n] = complexes[j];
      complexes[j] = tmp;
    }

    let bit = length >> 1;

    while (bit & j) {
      j ^= bit;
      bit >>= 1;
    }

    j ^= bit;
  }

  for (let size = 2;  size <= complexes.length; size *= 2) {
    const halfOfSize = size / 2;

    const omega = (inverse ? (2 * Math.PI) : (-2 * Math.PI)) / size;

    for (let block = 0; block < length; block += size) {
      const evens = [];
      const odds  = [];

      for (let n = 0; n < halfOfSize; n++) {
        evens[n] = complexes[n + block];
        odds[n]  = complexes[n + block + halfOfSize];
      }

      const rotators = [];

      for (let n = 0; n < halfOfSize; n++) {
        const [real, imag] = odds[n];
        const radian = omega * n;

        rotators[n] = [((real * Math.cos(radian)) - (imag * Math.sin(radian))), ((real * Math.sin(radian)) + (imag * Math.cos(radian)))];
      }

      for (let n = 0; n < halfOfSize; n++) {
        const [real, imag] = evens[n];

        complexes[n + block]              = [(real + rotators[n][0]), (imag + rotators[n][1])];
        complexes[n + block + halfOfSize] = [(real - rotators[n][0]), (imag - rotators[n][1])];
      }
    }
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
