class FFT {
  constructor(size) {
    this.size = size | 0;

    if (this.size <= 1 || (this.size & (this.size - 1)) !== 0) {
      throw new Error('FFT size must be a power of two and bigger than 1');
    }

    this._csize = size << 1;

    const table = new Array(this.size * 2);

    for (let i = 0; i < table.length; i += 2) {
      const angle = Math.PI * i / this.size;

      table[i + 0] = Math.cos(angle);
      table[i + 1] = 0 - Math.sin(angle);
    }

    this.table = table;

    // Find size's power of two
    let power = 0;

    for (let t = 1; this.size > t; t <<= 1) {
      ++power;
    }

    // Calculate initial step's width:
    //   * If we are full radix-4 - it is 2x smaller to give inital len=8
    //   * Otherwise it is the same as `power` to give len=4
    this._width = power % 2 === 0 ? power - 1 : power;

    // Pre-compute bit-reversal patterns
    this._bitrev = new Array(1 << this._width);

    for (let i = 0; i < this._bitrev.length; i++) {
      this._bitrev[i] = 0;

      for (let shift = 0; shift < this._width; shift += 2) {
        let revShift = this._width - shift - 2;

        this._bitrev[i] |= ((i >>> shift) & 3) << revShift;
      }
    }

    this._out = null;
    this._data = null;
    this._inv = 0;
  }

  createComplexArray() {
    const complexes = new Float32Array(this._csize);

    for (let i = 0; i < this._csize; i++) {
      complexes[i] = 0;
    }

    return complexes;
  }

  fromComplexArray(complex, storage) {
    const complexes = storage || new Array(complex.length >>> 1);

    for (let i = 0; i < complex.length; i += 2) {
      complexes[i >>> 1] = complex[i];
    }

    return complexes;
  }

  completeSpectrum(spectrum) {
    const size = this._csize;
    const half = size >>> 1;

    for (let i = 2; i < half; i += 2) {
      spectrum[size - i + 0] =  spectrum[i + 0];
      spectrum[size - i + 1] = -spectrum[i + 1];
    }
  }

  realTransform(out, data) {
    if (out === data) {
      throw new Error('Input and output buffers must be different');
    }

    this._out = out;
    this._data = data;
    this._inv = 0;
    this._realTransform4();
    this._out = null;
    this._data = null;
  }

  inverseTransform(out, data) {
    if (out === data) {
      throw new Error('Input and output buffers must be different');
    }

    this._out = out;
    this._data = data;
    this._inv = 1;
    this._transform4();

    for (let n = 0; n < out.length; n++) {
      out[n] /= this.size;
    }

    this._out = null;
    this._data = null;
  };

  // radix-4 implementation
  //
  _transform4() {
    const out = this._out;
    const size = this._csize;

    // Initial step (permute and transform)
    const width = this._width;

    let step = 1 << width;
    let len = (size / step) << 1;
    let outOff;
    let t;

    if (len === 4) {
      for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
        const off = this._bitrev[t];
        this._singleTransform2(outOff, off, step);
      }
    } else {
      // len === 8
      for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
        const off = this._bitrev[t];
        this._singleTransform4(outOff, off, step);
      }
    }

    // Loop through steps in decreasing order
    const inv = this._inv ? -1 : 1;
    const table = this.table;

    for (step >>= 2; step >= 2; step >>= 2) {
      len = (size / step) << 1;

      const quarterLen = len >>> 2;

      // Loop through offsets in the data
      for (outOff = 0; outOff < size; outOff += len) {
        // Full case
        const limit = outOff + quarterLen;

        for (let i = outOff, k = 0; i < limit; i += 2, k += step) {
          const A = i;
          const B = A + quarterLen;
          const C = B + quarterLen;
          const D = C + quarterLen;

          // Original values
          const Ar = out[A + 0];
          const Ai = out[A + 1];
          const Br = out[B + 0];
          const Bi = out[B + 1];
          const Cr = out[C + 0];
          const Ci = out[C + 1];
          const Dr = out[D + 0];
          const Di = out[D + 1];

          // Middle values
          const MAr = Ar;
          const MAi = Ai;

          const tableBr = table[k];
          const tableBi = inv * table[k + 1];
          const MBr = Br * tableBr - Bi * tableBi;
          const MBi = Br * tableBi + Bi * tableBr;

          const tableCr = table[2 * k];
          const tableCi = inv * table[2 * k + 1];
          const MCr = Cr * tableCr - Ci * tableCi;
          const MCi = Cr * tableCi + Ci * tableCr;

          const tableDr = table[3 * k];
          const tableDi = inv * table[3 * k + 1];
          const MDr = Dr * tableDr - Di * tableDi;
          const MDi = Dr * tableDi + Di * tableDr;

          // Pre-Final values
          const T0r = MAr + MCr;
          const T0i = MAi + MCi;
          const T1r = MAr - MCr;
          const T1i = MAi - MCi;
          const T2r = MBr + MDr;
          const T2i = MBi + MDi;
          const T3r = inv * (MBr - MDr);
          const T3i = inv * (MBi - MDi);

          // Final values
          const FAr = T0r + T2r;
          const FAi = T0i + T2i;

          const FCr = T0r - T2r;
          const FCi = T0i - T2i;

          const FBr = T1r + T3i;
          const FBi = T1i - T3r;

          const FDr = T1r - T3i;
          const FDi = T1i + T3r;

          out[A + 0] = FAr;
          out[A + 1] = FAi;
          out[B + 0] = FBr;
          out[B + 1] = FBi;
          out[C + 0] = FCr;
          out[C + 1] = FCi;
          out[D + 0] = FDr;
          out[D + 1] = FDi;
        }
      }
    }
  }

  _realTransform4() {
    const out  = this._out;
    const size = this._csize;

    // Initial step (permute and transform)
    const width = this._width;

    let step = 1 << width;
    let len = (size / step) << 1;
    let outOff;
    let t;

    if (len === 4) {
      for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
        const off = this._bitrev[t];
        this._singleRealTransform2(outOff, off >>> 1, step >>> 1);
      }
    } else {
      // len === 8
      for (outOff = 0, t = 0; outOff < size; outOff += len, t++) {
        const off = this._bitrev[t];
        this._singleRealTransform4(outOff, off >>> 1, step >>> 1);
      }
    }

    // Loop through steps in decreasing order
    const inv = this._inv ? -1 : 1;
    const table = this.table;

    for (step >>= 2; step >= 2; step >>= 2) {
      len = (size / step) << 1;

      const halfLen = len >>> 1;
      const quarterLen = halfLen >>> 1;
      const hquarterLen = quarterLen >>> 1;

      // Loop through offsets in the data
      for (outOff = 0; outOff < size; outOff += len) {
        for (let i = 0, k = 0; i <= hquarterLen; i += 2, k += step) {
          const A = outOff + i;
          const B = A + quarterLen;
          const C = B + quarterLen;
          const D = C + quarterLen;

          // Original values
          const Ar = out[A];
          const Ai = out[A + 1];
          const Br = out[B];
          const Bi = out[B + 1];
          const Cr = out[C];
          const Ci = out[C + 1];
          const Dr = out[D];
          const Di = out[D + 1];

          // Middle values
          const MAr = Ar;
          const MAi = Ai;

          const tableBr = table[k];
          const tableBi = inv * table[k + 1];
          const MBr = Br * tableBr - Bi * tableBi;
          const MBi = Br * tableBi + Bi * tableBr;

          const tableCr = table[2 * k];
          const tableCi = inv * table[2 * k + 1];
          const MCr = Cr * tableCr - Ci * tableCi;
          const MCi = Cr * tableCi + Ci * tableCr;

          const tableDr = table[3 * k];
          const tableDi = inv * table[3 * k + 1];
          const MDr = Dr * tableDr - Di * tableDi;
          const MDi = Dr * tableDi + Di * tableDr;

          // Pre-Final values
          const T0r = MAr + MCr;
          const T0i = MAi + MCi;
          const T1r = MAr - MCr;
          const T1i = MAi - MCi;
          const T2r = MBr + MDr;
          const T2i = MBi + MDi;
          const T3r = inv * (MBr - MDr);
          const T3i = inv * (MBi - MDi);

          // Final values
          const FAr = T0r + T2r;
          const FAi = T0i + T2i;

          const FBr = T1r + T3i;
          const FBi = T1i - T3r;

          out[A + 0] = FAr;
          out[A + 1] = FAi;
          out[B + 0] = FBr;
          out[B + 1] = FBi;

          // Output final middle point
          if (i === 0) {
            const FCr = T0r - T2r;
            const FCi = T0i - T2i;

            out[C + 0] = FCr;
            out[C + 1] = FCi;

            continue;
          }

          // Do not overwrite ourselves
          if (i === hquarterLen)
            continue;

          // In the flipped case:
          // MAi = -MAi
          // MBr=-MBi, MBi=-MBr
          // MCr=-MCr
          // MDr=MDi, MDi=MDr
          const ST0r = T1r;
          const ST0i = -T1i;
          const ST1r = T0r;
          const ST1i = -T0i;
          const ST2r = -inv * T3i;
          const ST2i = -inv * T3r;
          const ST3r = -inv * T2i;
          const ST3i = -inv * T2r;

          const SFAr = ST0r + ST2r;
          const SFAi = ST0i + ST2i;

          const SFBr = ST1r + ST3i;
          const SFBi = ST1i - ST3r;

          const SA = outOff + quarterLen - i;
          const SB = outOff + halfLen - i;

          out[SA + 0] = SFAr;
          out[SA + 1] = SFAi;
          out[SB + 0] = SFBr;
          out[SB + 1] = SFBi;
        }
      }
    }
  }

  // radix-2 implementation
  //
  // NOTE: Only called for len=4
  _singleTransform2(outOff, off, step) {
    const out  = this._out;
    const data = this._data;

    const evenR = data[off + 0];
    const evenI = data[off + 1];
    const oddR  = data[off + step];
    const oddI  = data[off + step + 1];

    const leftR  = evenR + oddR;
    const leftI  = evenI + oddI;
    const rightR = evenR - oddR;
    const rightI = evenI - oddI;

    out[outOff + 0] = leftR;
    out[outOff + 1] = leftI;
    out[outOff + 2] = rightR;
    out[outOff + 3] = rightI;
  }

  // radix-4
  //
  // NOTE: Only called for len=8
  _singleTransform4(outOff, off, step) {
    const out   = this._out;
    const data  = this._data;
    const inv   = this._inv ? -1 : 1;
    const step2 = step * 2;
    const step3 = step * 3;

    // Original values
    const Ar = data[off + 0];
    const Ai = data[off + 1];
    const Br = data[off + step + 0];
    const Bi = data[off + step + 1];
    const Cr = data[off + step2 + 0];
    const Ci = data[off + step2 + 1];
    const Dr = data[off + step3 + 0];
    const Di = data[off + step3 + 1];

    // Pre-Final values
    const T0r = Ar + Cr;
    const T0i = Ai + Ci;
    const T1r = Ar - Cr;
    const T1i = Ai - Ci;
    const T2r = Br + Dr;
    const T2i = Bi + Di;
    const T3r = inv * (Br - Dr);
    const T3i = inv * (Bi - Di);

    // Final values
    const FAr = T0r + T2r;
    const FAi = T0i + T2i;

    const FBr = T1r + T3i;
    const FBi = T1i - T3r;

    const FCr = T0r - T2r;
    const FCi = T0i - T2i;

    const FDr = T1r - T3i;
    const FDi = T1i + T3r;

    out[outOff + 0] = FAr;
    out[outOff + 1] = FAi;
    out[outOff + 2] = FBr;
    out[outOff + 3] = FBi;
    out[outOff + 4] = FCr;
    out[outOff + 5] = FCi;
    out[outOff + 6] = FDr;
    out[outOff + 7] = FDi;
  }

  // radix-2 implementation
  //
  // NOTE: Only called for len=4
  _singleRealTransform2(outOff, off, step) {
    const out  = this._out;
    const data = this._data;

    const evenR = data[off + 0];
    const oddR  = data[off + step];

    const leftR  = evenR + oddR;
    const rightR = evenR - oddR;

    out[outOff + 0] = leftR;
    out[outOff + 1] = 0;
    out[outOff + 2] = rightR;
    out[outOff + 3] = 0;
  }

  // radix-4
  //
  // NOTE: Only called for len=8
  _singleRealTransform4(outOff, off, step) {
    const out   = this._out;
    const data  = this._data;
    const inv   = this._inv ? -1 : 1;
    const step2 = step * 2;
    const step3 = step * 3;

    // Original values
    const Ar = data[off + 0];
    const Br = data[off + step];
    const Cr = data[off + step2];
    const Dr = data[off + step3];

    // Pre-Final values
    const T0r = Ar + Cr;
    const T1r = Ar - Cr;
    const T2r = Br + Dr;
    const T3r = inv * (Br - Dr);

    // Final values
    const FAr = T0r + T2r;

    const FBr = T1r;
    const FBi = -T3r;

    const FCr = T0r - T2r;

    const FDr = T1r;
    const FDi = T3r;

    out[outOff + 0] = FAr;
    out[outOff + 1] = 0;
    out[outOff + 2] = FBr;
    out[outOff + 3] = FBi;
    out[outOff + 4] = FCr;
    out[outOff + 5] = 0;
    out[outOff + 6] = FDr;
    out[outOff + 7] = FDi;
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
