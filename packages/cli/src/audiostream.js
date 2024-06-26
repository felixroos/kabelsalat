import { Readable } from "node:stream";

export const audiogen = async function* (dsp, options = {}) {
  const { bufferSize = 128, channels = 2 } = options;
  let sample = 0;
  const bytes = 4; // 32-bit float = 4 bytes
  while (true) {
    const buffer = Buffer.alloc(bufferSize * channels * bytes);
    for (let j = 0; j < bufferSize; j++) {
      const samples = dsp(sample + j);

      for (let c = 0; c < channels; c++) {
        buffer.writeFloatLE(samples[c], (j * channels + c) * bytes); // interleaved
      }
    }
    sample += bufferSize;
    yield buffer;

    await new Promise((resolve) => setImmediate(resolve));
  }
};

export const audiostream = (dsp, options) =>
  Readable.from(audiogen(dsp, options));

// example usage:
/* const options = { sampleRate: 44100, bufferSize: 2048 };
let dsp = (sample) => Math.sin((2 * Math.PI * 440 * sample) / 44100);
export const writer = audiostream(dsp, options);
writer.pipe(process.stdout); */

// run with
/*
node audiostream.mjs | ffplay -f f32le -ar 44100 -nodisp -autoexit - 
*/
