class NoiseGeneratorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.instance = null;
    this.type = '';

    this.port.onmessage = (event) => {
      if (event.data.bytes instanceof ArrayBuffer) {
        WebAssembly
          .instantiate(event.data.bytes)
          .then(async ({ instance }) => {
            this.instance = instance;
          })
          .catch(console.error);
      } else {
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
      }
    };
  }

  process(inputs, outputs) {
    if (this.instance === null) {
      return true;
    }

    const output = outputs[0];

    const linearMemory = this.instance.exports.memory.buffer;

    for (let channelNumber = 0; channelNumber < output.length; channelNumber++) {
      switch (this.type) {
        case 'whitenoise': {
          const offsetOutput = this.instance.exports.whitenoise(currentFrame);

          output[channelNumber].set(new Float32Array(linearMemory, offsetOutput, 128));

          break;
        }

        case 'pinknoise': {
          const offsetOutput = this.instance.exports.pinknoise(currentFrame);

          output[channelNumber].set(new Float32Array(linearMemory, offsetOutput, 128));

          break;
        }

        case 'browniannoise': {
          const offsetOutput = this.instance.exports.browniannoise(currentFrame);

          output[channelNumber].set(new Float32Array(linearMemory, offsetOutput, 128));

          break;
        }
      }
    }

    return true;
  }
}

registerProcessor('NoiseGeneratorProcessor', NoiseGeneratorProcessor);
