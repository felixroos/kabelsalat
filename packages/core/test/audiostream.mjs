import { Readable } from "node:stream";

export const audiogen = /* async  */ function* (dsp, options = {}) {
  const { sampleRate = 44100, bufferSize = 128, duration = 0 } = options;
  let sample = 0;
  const bytes = 4; // 4 bytes per 32-bit float
  const isr = 1 / sampleRate;

  while (!duration || sample * isr < duration) {
    const buffer = Buffer.alloc(bufferSize * bytes);
    for (let j = 0; j < bufferSize; j++) {
      const sampleValue = dsp(sample + j);
      buffer.writeFloatLE(sampleValue, j * bytes);
    }
    sample += bufferSize;
    yield buffer;

    //await new Promise((resolve) => setImmediate(resolve));
  }
  return null;
};

export const audiostream = (dsp, options) =>
  Readable.from(audiogen(dsp, options));

// example usage:
/* const options = { sampleRate: 44100, bufferSize: 2048, duration: 2 };
let dsp = (sample) => Math.sin((2 * Math.PI * 440 * sample) / 44100);
export const writer = audiostream(dsp, options);
writer.pipe(process.stdout); */

// run with
/*
node audiostream.mjs | ffplay -f f32le -ar 44100 -nodisp -autoexit - 
*/
