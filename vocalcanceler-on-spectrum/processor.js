const pow2 = (n) => 2 ** n;

function FFT(reals, imags, size) {
  const indexes = new Uint16Array(size);

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

function IFFT(reals, imags, size) {
  const indexes = new Uint16Array(size);

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

class OLAProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super(options);

    this.numberOfInputs  = options.numberOfInputs;
    this.numberOfOutputs = options.numberOfOutputs;

    this.blockSize = options.processorOptions.blockSize;

     // TODO for now, the only support hop size is the size of a web audio block
    this.hopSize = 128;

    this.numberOfOverlap = this.blockSize / this.hopSize;

    // pre-allocate input buffers (will be reallocated if needed)
    this.inputBuffers      = new Array(this.numberOfInputs);
    this.inputBuffersHead   = new Array(this.numberOfInputs);
    this.inputBuffersToSend = new Array(this.numberOfInputs);

    // default to 1 channel per input until we know more
    for (let i = 0; i < this.numberOfInputs; i++) {
      this.allocateInputChannels(i, 1);
    }

    // pre-allocate input buffers (will be reallocated if needed)
    this.outputBuffers           = new Array(this.numberOfOutputs);
    this.outputBuffersToRetrieve = new Array(this.numberOfOutputs);

    // default to 1 channel per output until we know more
    for (let i = 0; i < this.numberOfOutputs; i++) {
      this.allocateOutputChannels(i, 1);
    }
  }

  /** Handles dynamic reallocation of input/output channels buffer
   (channel numbers may vary during lifecycle) **/
  reallocateChannelsIfNeeded(inputs, outputs) {
    for (let i = 0; i < this.numberOfInputs; i++) {
      const numberOfChannels = inputs[i].length;

      if (numberOfChannels !== this.inputBuffers[i].length) {
        this.allocateInputChannels(i, numberOfChannels);
      }
    }

    for (let i = 0; i < this.numberOfOutputs; i++) {
      const numberOfChannels = outputs[i].length;

      if (numberOfChannels !== this.outputBuffers[i].length) {
        this.allocateOutputChannels(i, numberOfChannels);
      }
    }
  }

  allocateInputChannels(inputIndex, numberOfChannels) {
    // allocate input buffers

    this.inputBuffers[inputIndex] = new Array(numberOfChannels);

    for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
      this.inputBuffers[inputIndex][channelNumber] = new Float32Array(this.blockSize + 128);
      this.inputBuffers[inputIndex][channelNumber].fill(0);
    }

    // allocate input buffers to send and head pointers to copy from
    // (cannot directly send a pointer/subarray because input may be modified)
    this.inputBuffersHead[inputIndex]   = new Array(numberOfChannels);
    this.inputBuffersToSend[inputIndex] = new Array(numberOfChannels);

    for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
      this.inputBuffersHead[inputIndex][channelNumber]   = this.inputBuffers[inputIndex][channelNumber].subarray(0, this.blockSize);
      this.inputBuffersToSend[inputIndex][channelNumber] = new Float32Array(this.blockSize);
    }
  }

  allocateOutputChannels(outputIndex, numberOfChannels) {
    // allocate output buffers
    this.outputBuffers[outputIndex] = new Array(numberOfChannels);

    for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
      this.outputBuffers[outputIndex][channelNumber] = new Float32Array(this.blockSize);
      this.outputBuffers[outputIndex][channelNumber].fill(0);
    }

    // allocate output buffers to retrieve
    // (cannot send a pointer/subarray because new output has to be add to exising output)
    this.outputBuffersToRetrieve[outputIndex] = new Array(numberOfChannels);

    for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
      this.outputBuffersToRetrieve[outputIndex][channelNumber] = new Float32Array(this.blockSize);
      this.outputBuffersToRetrieve[outputIndex][channelNumber].fill(0);
    }
  }

  /** Read next web audio block to input buffers **/
  readInputs(inputs) {
    // when playback is paused, we may stop receiving new samples
    if (inputs[0].length && (inputs[0][0].length === 0)) {
      for (let index = 0; index < this.numberOfInputs; index++) {
        for (let channelNumber = 0; channelNumber < this.inputBuffers[index].length; channelNumber++) {
          this.inputBuffers[index][channelNumber].fill(0, this.blockSize);
        }
      }

      return;
    }

    for (let index = 0; index < this.numberOfInputs; index++) {
      for (let channelNumber = 0; channelNumber < this.inputBuffers[index].length; channelNumber++) {
        this.inputBuffers[index][channelNumber].set(inputs[index][channelNumber], this.blockSize);
      }
    }
  }

  /** Write next web audio block from output buffers **/
  writeOutputs(outputs) {
    for (let index = 0; index < this.numberOfOutputs; index++) {
      for (let channelNumber = 0; channelNumber < this.inputBuffers[index].length; channelNumber++) {
        outputs[index][channelNumber].set(this.outputBuffers[index][channelNumber].subarray(0, 128));
      }
    }
  }

  /** Shift left content of input buffers to receive new web audio block **/
  shiftInputBuffers() {
    for (let index = 0; index < this.numberOfInputs; index++) {
      for (let channelNumber = 0; channelNumber < this.inputBuffers[index].length; channelNumber++) {
        this.inputBuffers[index][channelNumber].copyWithin(0, 128);
      }
    }
  }

  /** Shift left content of output buffers to receive new web audio block **/
  shiftOutputBuffers() {
    for (let index = 0; index < this.numberOfOutputs; index++) {
      for (let channelNumber = 0; channelNumber < this.outputBuffers[index].length; channelNumber++) {
        this.outputBuffers[index][channelNumber].copyWithin(0, 128);
        this.outputBuffers[index][channelNumber].subarray(this.blockSize - 128).fill(0);
      }
    }
  }

  /** Copy contents of input buffers to buffer actually sent to process **/
  prepareInputBuffersToSend() {
    for (let index = 0; index < this.numberOfInputs; index++) {
      for (let channelNumber = 0; channelNumber < this.inputBuffers[index].length; channelNumber++) {
        this.inputBuffersToSend[index][channelNumber].set(this.inputBuffersHead[index][channelNumber]);
      }
    }
  }

  /** Add contents of output buffers just processed to output buffers **/
  handleOutputBuffersToRetrieve() {
    for (let index = 0; index < this.numberOfOutputs; index++) {
      for (let channelNumber = 0; channelNumber < this.outputBuffers[index].length; channelNumber++) {
        for (let n = 0; n < this.blockSize; n++) {
          this.outputBuffers[index][channelNumber][n] += this.outputBuffersToRetrieve[index][channelNumber][n] / this.numberOfOverlap;
        }
      }
    }
  }

  process(inputs, outputs, params) {
    this.reallocateChannelsIfNeeded(inputs, outputs);

    this.readInputs(inputs);
    this.shiftInputBuffers();
    this.prepareInputBuffersToSend()
    this.processOLA(this.inputBuffersToSend, this.outputBuffersToRetrieve, params);
    this.handleOutputBuffersToRetrieve();
    this.writeOutputs(outputs);
    this.shiftOutputBuffers();

    return true;
  }

  processOLA(inputs, outputs, params) {
    console.assert(false, "Not overriden");
  }
}

class VocalCancelerProcessor extends OLAProcessor {
  static generateHanningWindow(size) {
    const hanning = new Float32Array(size);

    for (let n = 0; n < size; n++) {
      if ((n % 2) === 0) {
        hanning[n] = 0.5 - (0.5 * Math.cos((2 * Math.PI * n) / size));
      } else {
        hanning[n] = 0.5 - (0.5 * Math.cos((2 * Math.PI * (n + 0.5)) / size));
      }
    }

    return hanning;
  }

  constructor(options) {
    super(options);

    this.hanningWindow = VocalCancelerProcessor.generateHanningWindow(this.blockSize);

    this.depth        = 0;
    this.minFrequency = 200;
    this.maxFrequency = 8000;
    this.threshold    = 0.01;

    this.port.onmessage = (event) => {
      if (event.data.depth >= 0)  {
        this.depth = event.data.depth;
      }

      if (event.data.frequency >= 0)  {
        this.minFrequency = event.data.frequency;
      }

      if (event.data.range >= 0)  {
        this.maxFrequency = this.minFrequency + event.data.range;
      }

      if (event.data.threshold >= 0)  {
        this.threshold = event.data.threshold;
      }
    };
  }

  processOLA(inputs, outputs) {
    for (let i = 0; i < this.numberOfInputs; i++) {
      const inputLs = inputs[i][0];
      const inputRs = inputs[i][1];

      const outputLs = outputs[i][0];
      const outputRs = outputs[i][1];

      const realLs = new Float32Array(this.blockSize);
      const realRs = new Float32Array(this.blockSize);
      const imagLs = new Float32Array(this.blockSize);
      const imagRs = new Float32Array(this.blockSize);

      for (let n = 0; n < this.blockSize; n++) {
        realLs[n] = inputLs[n];
        realRs[n] = inputRs[n];
        imagLs[n] = 0;
        imagRs[n] = 0;
      }

      // this.applyHanningWindow(inputLs);
      // this.applyHanningWindow(inputRs);

      FFT(realLs, imagLs, this.blockSize);
      FFT(realRs, imagRs, this.blockSize);

      const absLs = new Float32Array(this.blockSize);
      const absRs = new Float32Array(this.blockSize);
      const argLs = new Float32Array(this.blockSize);
      const argRs = new Float32Array(this.blockSize);

      for (let k = 0; k < this.blockSize; k++) {
        absLs[k] = Math.sqrt(realLs[k] ** 2 + imagLs[k] ** 2);
        absRs[k] = Math.sqrt(realRs[k] ** 2 + imagRs[k] ** 2);
        argLs[k] = Math.atan2(imagLs[k], realLs[k]);
        argRs[k] = Math.atan2(imagRs[k], realRs[k]);
      }

      const min = Math.trunc(this.minFrequency * (this.blockSize / sampleRate));
      const max = Math.trunc(this.maxFrequency * (this.blockSize / sampleRate));

      for (let k = min; k < max; k++) {
        const numerator   = Math.pow((absLs[k] - absRs[k]), 2);
        const denominator = Math.pow((absLs[k] + absRs[k]), 2);

        if (denominator != 0) {
          const diff = numerator / denominator;

          if (diff < this.threshold) {
            absLs[k] = 0.000001;
            absRs[k] = 0.000001;

            absLs[this.blockSize - k] = absLs[k];
            absRs[this.blockSize - k] = absRs[k];
          }
        }
      }

      // Euler's formula
      // abs * exp(j * arg) = abs * (cos(arg) + j * sin(arg))
      for (let k = 0; k < this.blockSize; k++) {
        realLs[k] = absLs[k] * Math.cos(argLs[k]);
        realRs[k] = absRs[k] * Math.cos(argRs[k]);
        imagLs[k] = absLs[k] * Math.sin(argLs[k]);
        imagRs[k] = absRs[k] * Math.sin(argRs[k]);
      }

      IFFT(realLs, imagLs, this.blockSize);
      IFFT(realRs, imagRs, this.blockSize);

      // this.applyHanningWindow(realLs);
      // this.applyHanningWindow(realRs);

      for (let n = 0; n < this.blockSize; n++) {
        outputLs[n] = ((1 - this.depth) * inputLs[n]) + (this.depth * realLs[n]);
        outputRs[n] = ((1 - this.depth) * inputRs[n]) + (this.depth * realRs[n]);
      }
    }
  }

  applyHanningWindow(input) {
    for (let n = 0; n < this.blockSize; n++) {
      input[n] *= this.hanningWindow[n];
    }
  }
}

registerProcessor('VocalCancelerProcessor', VocalCancelerProcessor);
