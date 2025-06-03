/**
 * This class extends `AudioWorkletProcessor`.
 */
export class OverlapAddProcessor extends AudioWorkletProcessor {
  static RENDER_QUANTUM_SIZE = 128;

  constructor(options) {
    super(options);

    this.frameSize = 2048;
    this.hopSize   = 128;

    this.numberOfOverlaps = this.frameSize / this.hopSize;

    this.inputBuffers       = [[]];  /** @type {[Float32Array[]]} */
    this.inputBuffersHead   = [[]];  /** @type {[Float32Array[]]} */
    this.inputBuffersToSend = [[]];  /** @type {[Float32Array[]]} */

    this.outputBuffers           = [[]];  /** @type {[Float32Array[]]} */
    this.outputBuffersToRetrieve = [[]];  /** @type {[Float32Array[]]} */

    if (options.processorOptions) {
      this.frameSize = options.processorOptions.frameSize ?? 2048;
    }

    this.allocateInputChannels(1);
    this.allocateOutputChannels(1);
  }

  /**
   * @param {[Float32Array[]]} inputs
   * @param {[Float32Array[]]} outputs
   * @param {{ [parameterName: string]: Float32Array }} parameters
   * @abstract
   */
  processOverlapAdd(inputs, outputs, parameters) {}

  /**
   * @param {[Float32Array[]]} inputs
   * @param {[Float32Array[]]} outputs
   * @param {{ [parameterName: string]: Float32Array }} parameters
   * @override
   */
  process(inputs, outputs, parameters) {
    this.reallocateChannelsIfNeeded(inputs, outputs);

    this.readInputs(inputs);
    this.shiftInputBuffers();
    this.prepareInputBuffersToSend();
    this.processOverlapAdd(this.inputBuffersToSend, this.outputBuffersToRetrieve, parameters);
    this.handleOutputBuffersToRetrieve();
    this.writeOutputs(outputs);
    this.shiftOutputBuffers();

    return true;
  }

  reallocateChannelsIfNeeded(inputs, outputs) {
    const inputNumberOfChannels = inputs[0].length;

    if (inputNumberOfChannels !== this.inputBuffers[0].length) {
      this.allocateInputChannels(inputNumberOfChannels);
    }

    const outputNumberOfChannels = outputs[0].length;

    if (outputNumberOfChannels !== this.outputBuffers[0].length) {
      this.allocateOutputChannels(outputNumberOfChannels);
    }
  }

  allocateInputChannels(numberOfChannels) {
    this.inputBuffers = [[]];

    for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
      this.inputBuffers[0][channelNumber] = new Float32Array(this.frameSize + OverlapAddProcessor.RENDER_QUANTUM_SIZE);
    }

    this.inputBuffersHead   = [[]];
    this.inputBuffersToSend = [[]];

    for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
      this.inputBuffersHead[0][channelNumber]   = this.inputBuffers[0][channelNumber].subarray(0, this.frameSize);
      this.inputBuffersToSend[0][channelNumber] = new Float32Array(this.frameSize);
    }
  }

  allocateOutputChannels(numberOfChannels) {
    this.outputBuffers = [[]];

    for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
      this.outputBuffers[0][channelNumber] = new Float32Array(this.frameSize);
    }

    this.outputBuffersToRetrieve = [[]];

    for (let channelNumber = 0; channelNumber < numberOfChannels; channelNumber++) {
      this.outputBuffersToRetrieve[0][channelNumber] = new Float32Array(this.frameSize);
    }
  }

  readInputs(inputs) {
    if (inputs[0].length && (inputs[0][0].length === 0)) {
      for (let channelNumber = 0; channelNumber < this.inputBuffers[0].length; channelNumber++) {
        this.inputBuffers[0][channelNumber].fill(0, this.frameSize);
      }

      return;
    }

    for (let channelNumber = 0; channelNumber < this.inputBuffers[0].length; channelNumber++) {
      this.inputBuffers[0][channelNumber].set(inputs[0][channelNumber], this.frameSize);
    }
  }

  writeOutputs(outputs) {
    for (let channelNumber = 0; channelNumber < this.inputBuffers[0].length; channelNumber++) {
      outputs[0][channelNumber].set(this.outputBuffers[0][channelNumber].subarray(0, OverlapAddProcessor.RENDER_QUANTUM_SIZE));
    }
  }

  shiftInputBuffers() {
    for (let channelNumber = 0; channelNumber < this.inputBuffers[0].length; channelNumber++) {
      this.inputBuffers[0][channelNumber].copyWithin(0, OverlapAddProcessor.RENDER_QUANTUM_SIZE);
    }
  }

  shiftOutputBuffers() {
    for (let channelNumber = 0; channelNumber < this.outputBuffers[0].length; channelNumber++) {
      this.outputBuffers[0][channelNumber].copyWithin(0, OverlapAddProcessor.RENDER_QUANTUM_SIZE);
      this.outputBuffers[0][channelNumber].subarray(this.frameSize - OverlapAddProcessor.RENDER_QUANTUM_SIZE).fill(0);
    }
  }

  prepareInputBuffersToSend() {
    for (let channelNumber = 0; channelNumber < this.inputBuffers[0].length; channelNumber++) {
      this.inputBuffersToSend[0][channelNumber].set(this.inputBuffersHead[0][channelNumber]);
    }
  }

  handleOutputBuffersToRetrieve() {
    for (let channelNumber = 0; channelNumber < this.outputBuffers[0].length; channelNumber++) {
      for (let n = 0; n < this.frameSize; n++) {
        this.outputBuffers[0][channelNumber][n] += this.outputBuffersToRetrieve[0][channelNumber][n] / this.numberOfOverlaps;
      }
    }
  }
}
