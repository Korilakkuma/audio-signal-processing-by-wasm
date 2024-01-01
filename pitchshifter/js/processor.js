class PitchShifterProcessor extends AudioWorkletProcessor {
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

    this.pitch = 1;

    this.port.onmessage = (event) => {
      if (event.data.pitch > 0)  {
        this.pitch = event.data.pitch;
      }
    };
  }

  process(inputs, outputs) {
    console.time(`currentFrame ${currentFrame}`);

    const input  = inputs[0];
    const output = outputs[0];

    const bufferSize = 128;

    for (let channelNumber = 0; channelNumber < input.length; channelNumber++) {
      this.shift(input[channelNumber], output[channelNumber], bufferSize);
    }

    console.timeEnd(`currentFrame ${currentFrame}`);

    return true;
  }

  shift(inputs, outputs, fftSize) {
    if (this.pitch === 1) {
      outputs.set(inputs);
      return;
    }

    const inputReals = new Float32Array(inputs);
    const inputImags = new Float32Array(fftSize);

    PitchShifterProcessor.FFT(inputReals, inputImags, fftSize);

    const outputReals = new Float32Array(fftSize);
    const outputImags = new Float32Array(fftSize);

    for (let i = 0; i < fftSize; i++) {
      const offset = Math.trunc(this.pitch * i);

      let eq = 1;

      if (i > (fftSize / 2)) {
        eq = 0;
      }

      if ((offset >= 0) && (offset < fftSize)) {
        outputReals[offset] += PitchShifterProcessor.GAIN_CORRECTION * eq * inputReals[i];
        outputImags[offset] += PitchShifterProcessor.GAIN_CORRECTION * eq * inputImags[i];
      }
    }

    PitchShifterProcessor.IFFT(outputReals, outputImags, fftSize);

    outputs.set(outputReals);
  }
}

registerProcessor('PitchShifterProcessor', PitchShifterProcessor);
