class NoiseSuppressorProcessor extends AudioWorkletProcessor {
  static FFT(reals, imags, size) {
    const pow2 = (n) => 2 ** n;

    const indexes = new Uint8Array(size);

    const numberOfStages = Math.log2(size);

    for (let stage = 1; stage <= numberOfStages; stage++) {
      for (let i = 0; i < pow2(stage - 1); i++) {
        const rest = numberOfStages - stage;

        for (let j = 0; j < pow2(rest); j++) {
          const n = i * pow2(rest + 1) + j;
          const m = pow2(rest) + n;
          const r = j * pow2(stage - 1);

          const areal = reals[n];
          const aimag = imags[n];
          const breal = reals[m];
          const bimag = imags[m];
          const creal = Math.cos((2.0 * Math.PI * r) / size);
          const cimag = -1 * Math.sin((2.0 * Math.PI * r) / size);

          if (stage < numberOfStages) {
            reals[n] = areal + breal;
            imags[n] = aimag + bimag;
            reals[m] = (creal * (areal - breal)) - (cimag * (aimag - bimag));
            imags[m] = (creal * (aimag - bimag)) + (cimag * (areal - breal));
          } else {
            reals[n] = areal + breal;
            imags[n] = aimag + bimag;
            reals[m] = areal - breal;
            imags[m] = aimag - bimag;
          }
        }
      }
    }

    for (let stage = 1; stage <= numberOfStages; stage++) {
      const rest = numberOfStages - stage;

      for (let i = 0; i < pow2(stage - 1); i++) {
        indexes[pow2(stage - 1) + i] = indexes[i] + pow2(rest);
      }
    }

    for (let k = 0; k < size; k++) {
      if (indexes[k] <= k) {
        continue;
      }

      const real = reals[indexes[k]];
      const imag = imags[indexes[k]];

      reals[indexes[k]] = reals[k];
      imags[indexes[k]] = imags[k];

      reals[k] = real;
      imags[k] = imag;
    }
  }

  static IFFT(reals, imags, size) {
    const pow2 = (n) => 2 ** n;

    const indexes = new Uint8Array(size);

    const numberOfStages = Math.log2(size);

    for (let stage = 1; stage <= numberOfStages; stage++) {
      for (let i = 0; i < pow2(stage - 1); i++) {
        const rest = numberOfStages - stage;

        for (let j = 0; j < pow2(rest); j++) {
          const n = i * pow2(rest + 1) + j;
          const m = pow2(rest) + n;
          const r = j * pow2(stage - 1);

          const areal = reals[n];
          const aimag = imags[n];
          const breal = reals[m];
          const bimag = imags[m];
          const creal = Math.cos((2.0 * Math.PI * r) / size);
          const cimag = Math.sin((2.0 * Math.PI * r) / size);

          if (stage < numberOfStages) {
            reals[n] = areal + breal;
            imags[n] = aimag + bimag;
            reals[m] = (creal * (areal - breal)) - (cimag * (aimag - bimag));
            imags[m] = (creal * (aimag - bimag)) + (cimag * (areal - breal));
          } else {
            reals[n] = areal + breal;
            imags[n] = aimag + bimag;
            reals[m] = areal - breal;
            imags[m] = aimag - bimag;
          }
        }
      }
    }

    for (let stage = 1; stage <= numberOfStages; stage++) {
      const rest = numberOfStages - stage;

      for (let i = 0; i < pow2(stage - 1); i++) {
        indexes[pow2(stage - 1) + i] = indexes[i] + pow2(rest);
      }
    }

    for (let k = 0; k < size; k++) {
      if (indexes[k] <= k) {
        continue;
      }

      const real = reals[indexes[k]];
      const imag = imags[indexes[k]];

      reals[indexes[k]] = reals[k];
      imags[indexes[k]] = imags[k];

      reals[k] = real;
      imags[k] = imag;
    }

    for (let k = 0; k < size; k++) {
      reals[k] /= size;
      imags[k] /= size;
    }
  }

  constructor() {
    super();

    this.threshold = 0;

    this.port.onmessage = (event) => {
      if ((event.data.threshold >= 0) && (event.data.threshold <= 1))  {
        this.threshold = event.data.threshold;
      }
    };
  }

  process(inputs, outputs) {
    console.time(`currentFrame ${currentFrame}`);

    const input  = inputs[0];
    const output = outputs[0];

    const bufferSize = 128;

    for (let channelNumber = 0; channelNumber < input.length; channelNumber++) {
      this.suppress(input[channelNumber], output[channelNumber], bufferSize);
    }

    console.timeEnd(`currentFrame ${currentFrame}`);

    return true;
  }

  suppress(inputs, outputs, fftSize) {
    if (this.threshold === 0) {
      outputs.set(inputs);
      return;
    }

    const inputReals = new Float32Array(inputs);
    const inputImags = new Float32Array(fftSize);

    const outputReals = new Float32Array(fftSize);
    const outputImags = new Float32Array(fftSize);

    const amplitudes = new Float32Array(fftSize);
    const phases     = new Float32Array(fftSize);

    NoiseSuppressorProcessor.FFT(inputReals, inputImags, fftSize);

    for (let k = 0; k < fftSize; k++) {
      amplitudes[k] = Math.sqrt((inputReals[k] ** 2) + (inputImags[k] ** 2));

      if ((inputReals[k] !== 0) && (inputImags[k] !== 0)) {
        phases[k] = Math.atan2(inputImags[k], inputReals[k]);
      }
    }

    for (let k = 0; k < fftSize; k++) {
      amplitudes[k] -= this.threshold;

      if (amplitudes[k] < 0) {
        amplitudes[k] = 0;
      }
    }

    for (let k = 0; k < fftSize; k++) {
      outputReals[k] = amplitudes[k] * Math.cos(phases[k]);
      outputImags[k] = amplitudes[k] * Math.sin(phases[k]);
    }

    NoiseSuppressorProcessor.IFFT(outputReals, outputImags, fftSize);

    outputs.set(outputReals);
  }
}

registerProcessor('NoiseSuppressorProcessor', NoiseSuppressorProcessor);
