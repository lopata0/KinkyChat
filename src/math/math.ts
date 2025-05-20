export function clamp(value: number, min = 1, max = 100): number {
  return Math.max(min, Math.min(max, value));
}