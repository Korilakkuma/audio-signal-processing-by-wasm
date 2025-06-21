const paddingTop    = 24;
const paddingRight  = 24;
const paddingBottom = 30;
const paddingLeft   = 60;

const fillColor = 'rgba(153 153 153 / 60%)';

const minFrequency =  62.5;
const maxFrequency = 16000;

const frequencies = [62.5, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

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
 * @param {duration} number
 */
const renderCoordinateTexts = (svg, analyser, sampleRate, duration) => {
  const width  = Number(svg.getAttribute('width') ?? 0);
  const height = Number(svg.getAttribute('height') ?? 0);

  const innerWidth  = width  - (paddingLeft + paddingRight);
  const innerHeight = height - (paddingTop  + paddingBottom);

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  const frequencyResolution = sampleRate / analyser.fftSize;

  frequencies.forEach((f) => {
    const x = paddingLeft - 8;
    const y = (paddingTop + innerHeight) - Math.trunc(Math.log10(f / minFrequency) / Math.log10(maxFrequency / minFrequency) * innerHeight);

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

  const samples = Math.ceil(duration * sampleRate);

  for (let n = 0; n < samples; n++) {
    if ((n === 0) || (((n / sampleRate) % 60) === 0)) {
      const x = (n / sampleRate) * (innerWidth / samples) + paddingLeft;
      const y = paddingTop + innerHeight + 20;

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');

      text.textContent = `${n / sampleRate} sec`;

      text.setAttribute('x', (((n / sampleRate) / 60) * (innerWidth / (duration / 60)) + paddingLeft).toString(10));
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
 * @param {time} number
 * @param {duration} number
 */
const renderSpectrogram = (svg, analyser, sampleRate, time, duration) => {
  const width  = Number(svg.getAttribute('width') ?? 0);
  const height = Number(svg.getAttribute('height') ?? 0);

  const innerWidth  = width  - (paddingLeft + paddingRight);
  const innerHeight = height - (paddingTop  + paddingBottom);

  const data = new Uint8Array(analyser.frequencyBinCount);

  analyser.getByteFrequencyData(data);

  const numberOfSamples = 1 / sampleRate;

  const frequencyResolution = sampleRate / analyser.fftSize;

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

  for (let k = 0; k < analyser.frequencyBinCount; k++) {
    if (k === 0) {
      continue;
    }

    const x = (time / duration) * innerWidth + paddingLeft;
    const y = (paddingTop + innerHeight) - Math.trunc(Math.log10((k * frequencyResolution) / minFrequency) / Math.log10(maxFrequency / minFrequency) * innerHeight);

    if (y > (paddingTop + innerHeight)) {
      continue;
    }

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

    let hex = '';

    if (data[k] > 128) {
      hex = `${(Math.trunc(1.5 * data[k]).toString(16))}0000`;
    } else if (data[k] > 64) {
      hex = `ff${(Math.trunc(1.5 * data[k]).toString(16))}00`;
    } else {
      hex = `000${(data[k].toString(16))}f`;
    }

    rect.setAttribute('x', x.toString(10));
    rect.setAttribute('y', (y - (innerHeight / frequencies.length) + 10).toString(10));
    rect.setAttribute('width', '1');
    rect.setAttribute('height', ((innerHeight / frequencies.length)).toString(10));
    rect.setAttribute('fill', `#${hex}`);
    rect.setAttribute('stroke', 'none');

    g.appendChild(rect);
  }

  svg.appendChild(g);
}
