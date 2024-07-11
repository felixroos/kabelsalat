export const clamp = (num, min, max) => {
  [min, max] = [Math.min(min, max), Math.max(min, max)];
  return Math.min(Math.max(num, min), max);
};
