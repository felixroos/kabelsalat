// based on https://gist.githubusercontent.com/flpvsk/047140b31c968001dc563998f7440cc1/raw/cc7e9681cd5ad88a8edcfcdcb218a3d7d4af9c2b/recorderWorkletProcessor.js

class RecorderWorklet extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: "isRecording",
        defaultValue: 0,
      },
    ];
  }

  constructor() {
    super();
    this._bufferSize = 2048;
    this._buffer = new Float32Array(this._bufferSize);
    this._initBuffer();
  }

  _initBuffer() {
    this._bytesWritten = 0;
  }

  _isBufferEmpty() {
    return this._bytesWritten === 0;
  }

  _isBufferFull() {
    return this._bytesWritten === this._bufferSize;
  }

  _appendToBuffer(value) {
    if (this._isBufferFull()) {
      this._flush();
    }

    this._buffer[this._bytesWritten] = value;
    this._bytesWritten += 1;
  }

  _flush() {
    let buffer = this._buffer;
    if (this._bytesWritten < this._bufferSize) {
      buffer = buffer.slice(0, this._bytesWritten);
    }

    this.port.postMessage({
      eventType: "data",
      audioBuffer: buffer,
    });

    this._initBuffer();
  }

  _recordingStopped() {
    this.port.postMessage({
      eventType: "stop",
    });
  }

  process(inputs, outputs, parameters) {
    const isRecordingValues = parameters.isRecording;

    const output = outputs[0];
    const input = inputs[0];
    const outChannel0 = output[0];
    const outChannel1 = output[1];

    let shouldRecord = false;
    for (let i = 0; i < outChannel0.length; i++) {
      if (i < isRecordingValues.length) {
        shouldRecord = isRecordingValues[i] === 1;
      }

      if (!shouldRecord && !this._isBufferEmpty()) {
        this._flush();
        this._recordingStopped();
      }

      if (shouldRecord) {
        this._appendToBuffer(input[0][i]);
        this._appendToBuffer(input[1][i]);
      }

      outChannel0[i] = input[0][i];
      outChannel1[i] = input[1][i];
    }

    return true;
  }
}

registerProcessor("recorder", RecorderWorklet);
