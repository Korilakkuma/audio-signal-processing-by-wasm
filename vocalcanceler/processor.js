class VocalCancelerProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.instance = null;
    this.depth = 0;

    this.port.onmessage = (event) => {
      if (event.data.bytes instanceof ArrayBuffer) {
        WebAssembly
          .instantiate(event.data.bytes)
          .then(async ({ instance }) => {
            this.instance = instance;
          })
          .catch(console.error);
      } else if ((event.data.depth >= 0) && (event.data.depth <= 1))  {
        this.depth = event.data.depth;
      }
    };
  }

  process(inputs, outputs) {
    if (this.instance === null) {
      return false;
    }

    const input  = inputs[0];
    const output = outputs[0];

    if ((input.length !== 2) || (output.length !== 2)) {
      output[0].set(input[0]);

      return true;
    }

    const inputLs  = input[0];
    const inputRs  = input[1];
    const outputLs = output[0];
    const outputRs = output[1];

    const linearMemory = this.instance.exports.memory.buffer;

    const inputOffsetL = this.instance.exports.alloc_memory_inputLs();
    const inputOffsetR = this.instance.exports.alloc_memory_inputRs();

    const inputLinearMemoryLs = new Float32Array(linearMemory, inputOffsetL, 128);
    const inputLinearMemoryRs = new Float32Array(linearMemory, inputOffsetR, 128);

    inputLinearMemoryLs.set(inputLs);
    inputLinearMemoryRs.set(inputRs);

    const outputOffsetL = this.instance.exports.vocalcancelerL(this.depth);
    const outputOffsetR = this.instance.exports.vocalcancelerR(this.depth);

    outputLs.set(new Float32Array(linearMemory, outputOffsetL, 128));
    outputRs.set(new Float32Array(linearMemory, outputOffsetR, 128));

    return true;
  }
}

registerProcessor('VocalCancelerProcessor', VocalCancelerProcessor);
