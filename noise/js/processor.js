class NoiseGeneratorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.type = '';

    this.b0 = 0;
    this.b1 = 0;
    this.b2 = 0;
    this.b3 = 0;
    this.b4 = 0;
    this.b5 = 0;
    this.b6 = 0;

    this.lastOut = 0;

    this.port.onmessage = (event) => {
      switch (event.data.type) {
        case 'whitenoise':
        case 'pinknoise':
        case 'browniannoise': {
          this.type = event.data.type;
          break;
        }

        default: {
          this.type = '';
          break;
        }
      }
    };
  }

  process(inputs, outputs) {
    console.time(`currentFrame ${currentFrame}`);

    const output = outputs[0];

    const bufferSize = 128;

    for (let channelNumber = 0; channelNumber < output.length; channelNumber++) {
      switch (this.type) {
        case 'whitenoise': {
          for (let n = 0; n < bufferSize; n++) {
            output[channelNumber][n] = (2 * Math.random()) - 1;
          }

          break;
        }

        case 'pinknoise': {
          for (let n = 0; n < bufferSize; n++) {
            const white = (2 * Math.random()) - 1;

            this.b0 = (0.99886 * this.b0) + (white * 0.0555179);
            this.b1 = (0.99332 * this.b1) + (white * 0.0750759);
            this.b2 = (0.96900 * this.b2) + (white * 0.1538520);
            this.b3 = (0.86650 * this.b3) + (white * 0.3104856);
            this.b4 = (0.55000 * this.b4) + (white * 0.5329522);
            this.b5 = (-0.7616 * this.b5) - (white * 0.0168980);

            output[channelNumber][n] = this.b0 + this.b1 + this.b2 + this.b3 + this.b4 + this.b5 + this.b6 + (white * 0.5362);
            output[channelNumber][n] *= 0.11;

            this.b6 = white * 0.115926;
          }

          break;
        }

        case 'browniannoise': {
          for (let n = 0; n < bufferSize; n++) {
            const white = (2 * Math.random()) - 1;

            output[channelNumber][n] = (this.lastOut + (0.02 * white)) / 1.02;

            this.lastOut = (this.lastOut + (0.02 * white)) / 1.02;

            output[channelNumber][n] *= 3.5;
          }

          break;
        }
      }
    }

    console.timeEnd(`currentFrame ${currentFrame}`);

    return true;
  }
}

registerProcessor('NoiseGeneratorProcessor', NoiseGeneratorProcessor);
