const paddingTop    = 24;
const paddingRight  = 24;
const paddingBottom = 30;
const paddingLeft   = 60;

const fillColor = 'rgba(153 153 153 / 60%)';

const frequencies = [32, 62.5, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

const minFrequency = frequencies[0];
const maxFrequency = frequencies[frequencies.length - 1];

const ratio      = maxFrequency / minFrequency;
const log10Ratio = Math.log10(ratio);

/**
 * @param {Uint8Array[0]} data
 */
const numberToJetColor = (data) => {
  const rgba = 4 * (data / 255);

  const r = Math.max(0, Math.min(255, Math.trunc(Math.min((rgba - 1.5), (0 - rgba + 4.5)) * 255)));
  const g = Math.max(0, Math.min(255, Math.trunc(Math.min((rgba - 0.5), (0 - rgba + 3.5)) * 255)));
  const b = Math.max(0, Math.min(255, Math.trunc(Math.min((rgba + 0.5), (0 - rgba + 2.5)) * 255)));

  return `rgb(${r} ${g} ${b})`;
};

/**
 * @param {SVGSVGElement} svg
 */
const renderSpectrogramGraph = (svg) => {
  const width  = Number(svg.getAttribute('width') ?? 0);
  const height = Number(svg.getAttribute('height') ?? 0);

  const innerWidth  = width  - (paddingLeft + paddingRight);
  const innerHeight = height - (paddingTop  + paddingBottom);

  const rectX = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

  rectX.setAttribute('x', paddingLeft.toString(10));
  rectX.setAttribute('y', (paddingTop + innerHeight).toString(10));
  rectX.setAttribute('width', innerWidth.toString(10));
  rectX.setAttribute('height', '2');
  rectX.setAttribute('fill', fillColor);
  rectX.setAttribute('stroke', 'none');

  const rectY = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

  rectY.setAttribute('x', paddingLeft.toString(10));
  rectY.setAttribute('y', paddingTop.toString(10));
  rectY.setAttribute('width', '2');
  rectY.setAttribute('height', innerHeight.toString(10));
  rectY.setAttribute('fill', fillColor);
  rectY.setAttribute('stroke', 'none');

  svg.appendChild(rectX);
  svg.appendChild(rectY);

  svg.style.backgroundColor = '#000';
};

/**
 * @aaram {SVGSVGElement} svg
 * @param {AnalyserNode} analyser
 * @param {sampleRate} number
 * @param {interval} number
 */
const renderCoordinateTexts = (svg, analyser, sampleRate, interval) => {
  const width  = Number(svg.getAttribute('width') ?? 0);
  const height = Number(svg.getAttribute('height') ?? 0);

  const innerWidth  = width  - (paddingLeft + paddingRight);
  const innerHeight = height - (paddingTop  + paddingBottom);

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  const frequencyResolution = sampleRate / analyser.fftSize;

  frequencies.forEach((f) => {
    const x = paddingLeft - 8;
    const y = (paddingTop + innerHeight) - Math.trunc((Math.log10(f / minFrequency) / log10Ratio) * innerHeight);

    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    if (f > 10000) {
      text.textContent = `${f / 1000} kHz`;
    } else {
      text.textContent = `${f} Hz`;
    }

    text.setAttribute('x', x.toString(10));
    text.setAttribute('y', y.toString(10));
    text.setAttribute('text-anchor', 'end');
    text.setAttribute('stroke', 'none');
    text.setAttribute('fill', fillColor);
    text.setAttribute('font-size', '12px');

    g.appendChild(text);
  });

  const samples = Math.ceil(interval * sampleRate);

  for (let n = 0; n < samples; n++) {
    if ((n === 0) || (((n / sampleRate) % 10) === 0)) {
      const x = (n / sampleRate) * (innerWidth / samples) + paddingLeft;
      const y = paddingTop + innerHeight + 20;

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

      text.textContent = `${n / sampleRate} sec`;

      text.setAttribute('x', (((n / sampleRate) / 10) * (innerWidth / (interval / 10)) + paddingLeft).toString(10));
      text.setAttribute('y', y.toString(10));
      text.setAttribute('text-anchor', 'start');
      text.setAttribute('stroke', 'none');
      text.setAttribute('fill', fillColor);
      text.setAttribute('font-size', '12px');

      g.appendChild(text);
    }
  }

  svg.appendChild(g);
};

/**
 * @param {SVGSVGElement} svg
 * @param {AnalyserNode} analyser
 * @param {sampleRate} number
 * @param {currentTime} number
 * @param {interval} number
 */
const renderSpectrogram = (svg, analyser, sampleRate, currentTime, interval) => {
  const width  = Number(svg.getAttribute('width') ?? 0);
  const height = Number(svg.getAttribute('height') ?? 0);

  const innerWidth  = width  - (paddingLeft + paddingRight);
  const innerHeight = height - (paddingTop  + paddingBottom);

  const data = new Uint8Array(analyser.frequencyBinCount);

  analyser.getByteFrequencyData(data);

  const numberOfSamples = 1 / sampleRate;

  const frequencyResolution = sampleRate / analyser.fftSize;

  let relativeTime = currentTime % interval;

  if ((relativeTime + 1) >= interval) {
    for (const g of svg.querySelectorAll('.spectrogram')) {
      svg.removeChild(g);
    }

    relativeTime = 0;
  }

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  g.classList.add('spectrogram');

  for (let k = 0; k < analyser.frequencyBinCount; k++) {
    if (k === 0) {
      continue;
    }

    const f = k * frequencyResolution;
    const x = (relativeTime / interval) * innerWidth + paddingLeft;
    const y = (paddingTop + innerHeight) - Math.trunc((Math.log10(f / minFrequency) / log10Ratio) * innerHeight);

    if (y > (paddingTop + innerHeight)) {
      continue;
    }

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    const h = (innerHeight / frequencies.length) - 10;

    const color = numberToJetColor(data[k]);

    rect.setAttribute('x', x.toString(10));
    rect.setAttribute('y', (y - (innerHeight / frequencies.length) + h).toString(10));
    rect.setAttribute('width', '1');
    rect.setAttribute('height', h.toString(10));
    rect.setAttribute('fill', color);
    rect.setAttribute('stroke', 'none');

    g.appendChild(rect);
  }

  svg.appendChild(g);
};

/**
 * @param {SVGSVGElement} svg
 */
const clearSpectrogram = (svg) => {
  for (const g of svg.querySelectorAll('.spectrogram')) {
    svg.removeChild(g);
  }
};
