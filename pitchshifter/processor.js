class PitchShifterProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.instance = null;
    this.pitch = 1;

    this.port.onmessage = (event) => {
      if (event.data.bytes instanceof ArrayBuffer) {
        WebAssembly
          .instantiate(event.data.bytes)
          .then(async ({ instance }) => {
            this.instance = instance;
          })
          .catch(console.error);
      } else if (event.data.pitch > 0)  {
        this.pitch = event.data.pitch;
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
      if (this.pitch === 1) {
        output[channelNumber].set(input[channelNumber]);
        continue;
      }

      const inputOffset = this.instance.exports.alloc_memory_inputs();

      const inputLinearMemory = new Float32Array(linearMemory, inputOffset, 128);

      inputLinearMemory.set(input[channelNumber]);

      const outputOffset = this.instance.exports.pitchshifter(this.pitch);

      output[channelNumber].set(new Float32Array(linearMemory, outputOffset, 128));
    }

    console.timeEnd(`currentFrame ${currentFrame}`);

    return true;
  }
}

registerProcessor('PitchShifterProcessor', PitchShifterProcessor);
