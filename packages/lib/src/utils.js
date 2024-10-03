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
// e.g. lerp(.5,100,300) = 200
export function lerp(x, y0, y1) {
  if (x <= 0) return y0;
  if (x >= 1) return y1;

  return y0 + x * (y1 - y0);
}

// Linear interpolation between two values
// e.g. invLerp(200,100,300) = 0.5
export function invLerp(x, y0, y1) {
  if (x <= y0) return 0;
  if (x >= y1) return 1;
  if (y1 === y0) return 0; // prevent divide by 0
  return (x - y0) / (y1 - y0);
}

// Takes value within [a0,a1] and scales it between [b0,b1]
export function remap(x, a0, a1, b0, b1) {
  let norm = invLerp(x, a0, a1);
  return lerp(norm, b0, b1);
}
