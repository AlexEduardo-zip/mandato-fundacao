export type RngState = number;

// xmur3: string -> 32-bit hash
export function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

export function createRngState(seed: string): RngState {
  return hashSeed(seed);
}

// mulberry32 with an explicit, serializable state so callers can thread it through immutable game state
export class Rng {
  private s: number;

  constructor(state: RngState) {
    this.s = state >>> 0;
  }

  get state(): RngState {
    return this.s;
  }

  float(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(this.s ^ (this.s >>> 15), 1 | this.s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max], both inclusive. */
  int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`invalid int range [${min}, ${max}]`);
    }
    return min + Math.floor(this.float() * (max - min + 1));
  }

  chance(probability: number): boolean {
    return this.float() < probability;
  }

  /** Normal draw (Box-Muller), consuming two floats. */
  gaussian(mean: number, sigma: number): number {
    const u = 1 - this.float();
    const v = this.float();
    return mean + sigma * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new RangeError("cannot pick from an empty list");
    return items[this.int(0, items.length - 1)] as T;
  }

  /** Index drawn proportionally to non-negative weights; falls back to 0 when all weights are zero. */
  weightedIndex(weights: readonly number[]): number {
    if (weights.length === 0) throw new RangeError("cannot draw from empty weights");
    let total = 0;
    for (const w of weights) {
      if (w < 0 || !Number.isFinite(w)) throw new RangeError(`invalid weight ${w}`);
      total += w;
    }
    const roll = this.float();
    if (total === 0) return 0;
    let acc = 0;
    let last = 0;
    for (let i = 0; i < weights.length; i++) {
      const w = weights[i] as number;
      if (w === 0) continue;
      last = i;
      acc += w / total;
      if (roll < acc) return i;
    }
    return last;
  }
}
