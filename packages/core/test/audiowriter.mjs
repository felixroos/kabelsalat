import { Writable } from "stream";

export class AudioWriter {
  constructor(dsp, options = {}) {
    const { sampleRate = 44100, bufferSize = 1024 } = options;
    this.sampleRate = sampleRate;
    this.bufferSize = bufferSize;
    this.bytes = 4; // 4 bytes per 32-bit float
    this.sample = 0;
    this.dsp = dsp;
    this.buffer = Buffer.alloc(bufferSize * this.bytes);
    this.audioStream = new Writable({
      write(chunk, _, callback) {
        process.stdout.write(chunk, callback);
      },
    });
  }

  start() {
    const writeAudio = () =>
      this.audioStream.write(this.generateSamples(), writeAudio);
    writeAudio();
  }

  stop() {
    this.audioStream.destroy();
  }

  generateSamples() {
    for (let j = 0; j < this.bufferSize; j++) {
      const sample = this.dsp(this.sample + j);
      this.buffer.writeFloatLE(sample, j * this.bytes);
    }
    this.sample += this.bufferSize;
    return this.buffer;
  }
}
