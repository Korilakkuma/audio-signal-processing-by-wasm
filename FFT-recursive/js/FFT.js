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
      for (let n = 0; n < halfOfSize; n++) {
        const evenIndex = n + block;
        const oddIndex  = n + block + halfOfSize;

        const [oddReal, oddImag] = complexes[oddIndex];

        const radian = omega * n;

        const rotatorReal = (oddReal * Math.cos(radian)) - (oddImag * Math.sin(radian));
        const rotatorImag = (oddReal * Math.sin(radian)) + (oddImag * Math.cos(radian));

        const [evenReal, evenImag] = complexes[evenIndex];

        complexes[evenIndex] = [(evenReal + rotatorReal), (evenImag + rotatorImag)];
        complexes[oddIndex]  = [(evenReal - rotatorReal), (evenImag - rotatorImag)];
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
