import { Writable } from "node:stream";

export class AudioWriter {
  constructor(dsp, options = {}) {
    const { sampleRate = 44100, bufferSize = 1024, duration = 0 } = options;
    this.duration = duration;
    this.sampleRate = sampleRate;
    this.isr = 1 / sampleRate;
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
    const writeAudio = () => {
      const buffer = this.generateSamples();
      if (buffer) {
        this.audioStream.write(buffer, writeAudio);
      }
    };
    writeAudio();
  }

  stop() {
    this.audioStream.destroy();
  }

  generateSamples() {
    if (this.duration && this.sample * this.isr > this.duration) {
      return;
    }
    for (let j = 0; j < this.bufferSize; j++) {
      const sample = this.dsp(this.sample + j);
      this.buffer.writeFloatLE(sample, j * this.bytes);
    }
    this.sample += this.bufferSize;
    return this.buffer;
  }
}
