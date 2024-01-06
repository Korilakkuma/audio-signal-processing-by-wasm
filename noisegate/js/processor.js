class NoiseGateProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.level = 0;

    this.port.onmessage = (event) => {
      if ((event.data.level >= 0) && (event.data.level <= 1))  {
        this.level = event.data.level;
      }
    };
  }

  process(inputs, outputs) {
    console.time(`currentFrame ${currentFrame}`);

    const input  = inputs[0];
    const output = outputs[0];

    const bufferSize = 128;

    for (let channelNumber = 0; channelNumber < input.length; channelNumber++) {
      for (let n = 0; n < bufferSize; n++) {
        output[channelNumber][n] = (Math.abs(input[channelNumber][n]) > this.level) ? input[channelNumber][n] : 0;
      }
    }

    console.timeEnd(`currentFrame ${currentFrame}`);

    return true;
  }
}

registerProcessor('NoiseGateProcessor', NoiseGateProcessor);
