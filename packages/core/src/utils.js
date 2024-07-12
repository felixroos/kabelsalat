/**
 * Assert that a condition holds true
 */
export function assert(condition, errorText) {
  if (!errorText) errorText = "assertion failed";

  if (!condition) {
    throw new Error(errorText);
  }
}

export const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

// Linear interpolation between two values
export function lerp(x, y0, y1) {
  if (x <= 0) return y0;
  if (x >= 1) return y1;

  return y0 + x * (y1 - y0);
}

// Trigger a file download in the browser
export function downloadFile(bytes, filename, mimeType) {
  const blob = new Blob([bytes], {type: mimeType});
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
