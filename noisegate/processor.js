class NoiseGateProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.instance = null;
    this.level = 0;

    this.port.onmessage = (event) => {
      if (event.data.bytes instanceof ArrayBuffer) {
        WebAssembly
          .instantiate(event.data.bytes)
          .then(async ({ instance }) => {
            this.instance = instance;
          })
          .catch(console.error);
      } else if ((event.data.level >= 0) && (event.data.level <= 1))  {
        this.level = event.data.level;
      }
    };
  }

  process(inputs, outputs) {
    if (this.instance === null) {
      return false;
    }

    console.time(`currentFrame ${currentFrame}`);

    const input  = inputs[0];
    const output = outputs[0];

    const linearMemory = this.instance.exports.memory.buffer;

    for (let channelNumber = 0; channelNumber < input.length; channelNumber++) {
      const offsetInput = this.instance.exports.alloc_memory_inputs();

      const inputLinearMemory = new Float32Array(linearMemory, offsetInput, 128);

      inputLinearMemory.set(input[channelNumber]);

      const offsetOutput = this.instance.exports.noisegate(this.level);

      output[channelNumber].set(new Float32Array(linearMemory, offsetOutput, 128));
    }

    console.timeEnd(`currentFrame ${currentFrame}`);

    return true;
  }
}

registerProcessor('NoiseGateProcessor', NoiseGateProcessor);
