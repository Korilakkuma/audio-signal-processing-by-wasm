import { OverlapAddProcessor } from '../overlap-add/processor.js';

class ResamplingProcessor extends OverlapAddProcessor {
  static SIZE_OF_SINC = 48;

  static sinc(n) {
    if (n === 0) {
      return 1;
    }

    return Math.sin(n) / n;
  }

  constructor(options) {
    super(options);

    this.pitch = 1;

    this.port.onmessage = (event) => {
      if (event.data > 0) {
        this.pitch = event.data;
      }
    };
  }

  processOverlapAdd(inputs, outputs) {
    const input  = inputs[0];
    const output = outputs[0];

    const numberOfChannels = input.length;

    const length = Math.trunc(this.frameSize / this.pitch);

    for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
      const tmp = new Float32Array(length);

      for (let n = 0; n < length; n++) {
        const t = this.pitch * n;
        const offset = Math.trunc(t);

        const halfOfSincSize = ResamplingProcessor.SIZE_OF_SINC / 2;

        for (let m = (offset - halfOfSincSize); m <= (offset + halfOfSincSize); m++) {
          if ((m >= 0) && (m < this.frameSize)) {
            tmp[n] += input[channelNumber][m] * ResamplingProcessor.sinc(Math.PI * (t - m));
          }
        }
      }

      output[channelNumber].set(tmp);
    }
  }
}

registerProcessor('ResamplingProcessor', ResamplingProcessor);
