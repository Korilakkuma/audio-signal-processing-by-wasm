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
