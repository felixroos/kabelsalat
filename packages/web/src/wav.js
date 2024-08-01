// based on https://github.com/Experience-Monks/audiobuffer-to-wav

export function audioBuffersToWav(buffers, sampleRate, numChannels) {
  if (buffers.length < 1) {
    return undefined;
  }

  const firstBuffer = buffers[0];
  const format = 3;
  const bitDepth = 32;

  const numSamples = buffers.map(buf => buf.length)
        .reduce((a,b) => a+b, 0);

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const headerSize = 44;
  const outputBuffer = new ArrayBuffer(headerSize + numSamples * bytesPerSample);
  const view = new DataView(outputBuffer);

  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* RIFF chunk length */
  view.setUint32(4, 36 + numSamples * bytesPerSample, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */
  view.setUint32(28, sampleRate * blockAlign, true);
  /* block align (channel count * bytes per sample) */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, numSamples * bytesPerSample, true);
  let bufferOffset = 44;
  for (const buffer of buffers) {
    writeFloat32(view, bufferOffset, buffer);
    bufferOffset += buffer.length * bytesPerSample;
  }

  return outputBuffer;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function writeFloat32(view, offset, input) {
  for (var i = 0; i < input.length; i++, offset += 4) {
    view.setFloat32(offset, input[i], true);
  }
}
