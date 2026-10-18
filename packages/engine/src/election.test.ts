import { describe, expect, it } from "vitest";
import { defaultConfig } from "./config.js";
import { baseScore, generateAdversaries, runElection } from "./election.js";
import { Rng } from "./rng.js";
import { makeState } from "./test-utils.js";

const strong = () =>
  makeState({
    resources: { base: 100, media: 100, money: 100, capital: 100 },
    attributes: { electoralStrategy: 100 },
  });

describe("baseScore", () => {
  it("follows the doc 09 formula", () => {
    const s = makeState({
      resources: { base: 60, media: 40, money: 20, capital: 10 },
      attributes: { electoralStrategy: 50 },
    });
    // 0.30*60 + 0.15*40 + 0.15*20 + 0.10*50 + 0.15*50 + 0.15*10
    expect(baseScore(s)).toBeCloseTo(18 + 6 + 3 + 5 + 7.5 + 1.5);
  });

  it("subtracts scandals and polarization rejection", () => {
    const s = makeState();
    const clean = baseScore(s);
    const scandal = { ...s, player: { ...s.player, tags: { scandal_active: 2 } } };
    expect(baseScore(scandal)).toBeCloseTo(clean - 8);
    const polarized = { ...s, world: { ...s.world, polarization: 80 } };
    expect(baseScore(polarized)).toBeCloseTo(clean - 6);
  });
});

describe("generateAdversaries", () => {
  it("stays within the mean +-10 and is deterministic", () => {
    const a = generateAdversaries(new Rng(1), "presidente");
    expect(a).toHaveLength(defaultConfig.offices.presidente!.adversaries);
    for (const x of a) expect(Math.abs(x - 65)).toBeLessThanOrEqual(10);
    expect(generateAdversaries(new Rng(1), "presidente")).toEqual(a);
  });

  it("rejects unknown offices", () => {
    expect(() => generateAdversaries(new Rng(1), "rei")).toThrow(/unknown office/);
  });
});

describe("runElection", () => {
  it("is deterministic for the same state", () => {
    const s = makeState();
    expect(runElection(s, "prefeito")).toEqual(runElection(s, "prefeito"));
  });

  it("advances the rng and logs the race in the history", () => {
    const s = makeState();
    const { state, result } = runElection(s, "vereador");
    expect(state.rng).not.toBe(s.rng);
    expect(state.player.history.at(-1)).toMatchObject({
      kind: "election",
      office: "vereador",
      won: result.won,
      votePct: result.votePct,
    });
    expect(state.player.office).toBe(s.player.office);
  });

  it("a maxed candidate wins every race, a broke one loses the majoritarian ones", () => {
    for (const office of Object.keys(defaultConfig.offices)) {
      expect(runElection(strong(), office).result.won, office).toBe(true);
    }
    const weak = makeState({
      resources: { base: 0, media: 0, money: 0, capital: 0 },
      attributes: { electoralStrategy: 0 },
    });
    expect(runElection(weak, "presidente").result.won).toBe(false);
  });

  it("vote shares add up to 100% and win rate rises with strength", () => {
    const { result } = runElection(makeState(), "governador");
    const total = result.votePct + result.adversaries.reduce((a, r) => a + r.votePct, 0);
    expect(total).toBeGreaterThan(99);
    expect(total).toBeLessThan(101);

    const rate = (resources: number) => {
      let wins = 0;
      for (let i = 0; i < 200; i++) {
        const s = makeState({
          seed: `s${i}`,
          resources: { base: resources, media: resources, money: resources, capital: resources },
        });
        if (runElection(s, "prefeito").result.won) wins++;
      }
      return wins;
    };
    expect(rate(90)).toBeGreaterThan(rate(30));
  });

  it("proportional races are easier than majoritarian ones at equal strength", () => {
    const count = (office: string) => {
      let wins = 0;
      for (let i = 0; i < 300; i++) {
        const s = makeState({
          seed: `p${i}`,
          resources: { base: 70, media: 70, money: 70, capital: 70 },
          attributes: { electoralStrategy: 70 },
        });
        if (runElection(s, office).result.won) wins++;
      }
      return wins;
    };
    expect(count("vereador")).toBeGreaterThan(count("prefeito"));
  });
});
