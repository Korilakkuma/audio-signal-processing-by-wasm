class NoiseSuppressorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.instance = null;
    this.threshold = 0;

    this.port.onmessage = (event) => {
      if (event.data.bytes instanceof ArrayBuffer) {
        WebAssembly
          .instantiate(event.data.bytes)
          .then(async ({ instance }) => {
            this.instance = instance;
          })
          .catch(console.error);
      } else if ((event.data.threshold >= 0) && (event.data.threshold <= 1))  {
        this.threshold = event.data.threshold;
      }
    };
  }

  process(inputs, outputs) {
    if (this.instance === null) {
      return false;
    }

    const input  = inputs[0];
    const output = outputs[0];

    const linearMemory = this.instance.exports.memory.buffer;

    for (let channelNumber = 0; channelNumber < input.length; channelNumber++) {
      const offsetInput = this.instance.exports.alloc_memory_inputs();

      const inputLinearMemory = new Float32Array(linearMemory, offsetInput, 128);

      inputLinearMemory.set(input[channelNumber]);

      const offsetOutput = this.instance.exports.noisesuppressor(this.threshold);

      output[channelNumber].set(new Float32Array(linearMemory, offsetOutput, 128));
    }

    return true;
  }
}

registerProcessor('NoiseSuppressorProcessor', NoiseSuppressorProcessor);
