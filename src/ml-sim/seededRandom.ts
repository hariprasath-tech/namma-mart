/**
 * Deterministic pseudo-random number generator using Mulberry32 algorithm.
 * Guarantees that the same seed produces identical demo data across sessions.
 */
export function createSeededRandom(seed: number | string = 1969) {
  let s = typeof seed === 'string'
    ? Array.from(seed).reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) | 0, 0)
    : seed;

  return function next(): number {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
