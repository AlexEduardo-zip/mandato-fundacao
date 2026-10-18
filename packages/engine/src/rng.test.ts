import { describe, expect, it } from "vitest";
import { Rng, createRngState, hashSeed } from "./rng.js";

const sequence = (seed: string, n: number) => {
  const rng = new Rng(createRngState(seed));
  return Array.from({ length: n }, () => rng.float());
};

describe("rng", () => {
  it("hashes seeds deterministically", () => {
    expect(hashSeed("mandato")).toBe(3647818244);
    expect(hashSeed("a")).not.toBe(hashSeed("b"));
  });

  it("produces the same sequence for the same seed", () => {
    expect(sequence("seed-1", 50)).toEqual(sequence("seed-1", 50));
  });

  it("pins the first values for a known seed", () => {
    expect(sequence("mandato", 3)).toEqual([
      0.12553136702626944, 0.6098698629066348, 0.02930133673362434,
    ]);
  });

  it("produces different sequences for different seeds", () => {
    expect(sequence("seed-1", 10)).not.toEqual(sequence("seed-2", 10));
  });

  it("stays within [0, 1)", () => {
    for (const v of sequence("range", 2000)) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("resumes exactly from a saved state", () => {
    const a = new Rng(createRngState("resume"));
    a.float();
    a.float();
    const b = new Rng(a.state);
    expect([a.float(), a.float()]).toEqual([b.float(), b.float()]);
  });

  it("draws integers inclusive of both bounds", () => {
    const rng = new Rng(createRngState("ints"));
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(rng.int(1, 4));
    expect([...seen].sort()).toEqual([1, 2, 3, 4]);
    expect(() => rng.int(3, 1)).toThrow(RangeError);
  });

  it("has a roughly uniform mean", () => {
    const values = sequence("mean", 10000);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    expect(mean).toBeGreaterThan(0.48);
    expect(mean).toBeLessThan(0.52);
  });

  it("respects weights, including zero and invalid ones", () => {
    const rng = new Rng(createRngState("weights"));
    const counts = [0, 0, 0];
    for (let i = 0; i < 4000; i++) counts[rng.weightedIndex([1, 0, 3])]!++;
    expect(counts[1]).toBe(0);
    expect(counts[2]! / counts[0]!).toBeGreaterThan(2.4);
    expect(counts[2]! / counts[0]!).toBeLessThan(3.6);
    expect(rng.weightedIndex([0, 0])).toBe(0);
    expect(() => rng.weightedIndex([])).toThrow(RangeError);
    expect(() => rng.weightedIndex([-1, 2])).toThrow(RangeError);
  });

  it("picks from a list and rejects an empty one", () => {
    const rng = new Rng(createRngState("pick"));
    expect(["a", "b", "c"]).toContain(rng.pick(["a", "b", "c"]));
    expect(() => rng.pick([])).toThrow(RangeError);
  });
});

describe("gaussian", () => {
  it("has roughly the requested mean and sigma and is deterministic", () => {
    const rng = new Rng(createRngState("gauss"));
    const xs = Array.from({ length: 4000 }, () => rng.gaussian(10, 6));
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, b) => a + (b - mean) ** 2, 0) / xs.length);
    expect(mean).toBeGreaterThan(9.5);
    expect(mean).toBeLessThan(10.5);
    expect(sd).toBeGreaterThan(5.6);
    expect(sd).toBeLessThan(6.4);
    expect(new Rng(5).gaussian(0, 1)).toBe(new Rng(5).gaussian(0, 1));
  });
});
