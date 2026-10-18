import { describe, expect, it } from "vitest";
import { startPhase } from "./civil.js";
import { evaluate } from "./evaluation.js";
import { checkForcedEnd, checkRemoval, retire } from "./lifeend.js";
import { makeState } from "./test-utils.js";
import { endTurn, startTurn } from "./turn.js";
import type { GameState } from "./types.js";

const empty = { events: [] };

function scandalous(oversight: number, risk = 100): GameState {
  const s = makeState({ year: 1995, age: 45, office: "deputado" });
  return {
    ...s,
    world: { ...s.world, oversight },
    player: { ...s.player, hidden: { ...s.player.hidden, scandalRisk: risk } },
  };
}

describe("retirement", () => {
  it("is optional from 60 and ends the run", () => {
    expect(() => retire(makeState({ age: 59 }))).toThrow(/before 60/);
    const done = retire(makeState({ age: 60, year: 2010 }));
    expect(done.ended).toBe("aposentadoria");
    expect(done.player.tags.aposentado).toBe(1);
    expect(() => retire(done)).toThrow(/over/);
  });

  it("is forced at 80", () => {
    const s = makeState({ age: 79, year: 2000 });
    const next = endTurn(startTurn(s, empty));
    expect(next.player.age).toBe(80);
    expect(next.ended).toBe("aposentadoria");
  });

  it("retiring at the peak is a special ending, otherwise not", () => {
    const peak = makeState({ age: 62, year: 2012, office: "presidente" });
    const rich = {
      ...peak,
      player: {
        ...peak.player,
        attributes: { ...peak.player.attributes, integrity: 100 },
        resources: { capital: 100, money: 100, base: 100, media: 100 },
        career: { ...peak.player.career, highestRank: 5 },
        tags: { legacy_law: 6, origin_loyal: 3, style_reformer: 4 },
      },
    };
    expect(evaluate(retire(rich)).ending).toBe("aposentado_no_auge");
    expect(evaluate(retire(makeState({ age: 62, year: 2012 }))).ending).toBeNull();
  });
});

describe("era end", () => {
  it("ends the run after the last year of the era", () => {
    const s = makeState({ year: 2026, age: 40 });
    const next = endTurn(startTurn(s, empty));
    expect(next.player.year).toBe(2027);
    expect(next.ended).toBe("fim_da_era");
    expect(checkForcedEnd(makeState({ year: 2026 })).ended).toBeNull();
  });
});

describe("removal from office", () => {
  it("needs a scandal above 85 and a sitting officeholder", () => {
    expect(checkRemoval(scandalous(100, 85)).ended).toBeNull();
    expect(checkRemoval(scandalous(100, 86)).ended).toBe("cassado");
    const base = scandalous(100);
    const civilian = { ...base, player: { ...base.player, office: null } };
    expect(checkRemoval(civilian).ended).toBeNull();
  });

  it("depends on the oversight of the world", () => {
    expect(checkRemoval(scandalous(0)).ended).toBeNull();
    const removed = checkRemoval(scandalous(100));
    expect(removed.ended).toBe("cassado");
    expect(removed.player.office).toBeNull();
    expect(removed.player.tags).toMatchObject({ cassado: 1, ineligible: 1 });
    expect(removed.player.history.at(-1)?.kind).toBe("headline");
  });

  it("happens at the end of the year and yields the Cassado ending", () => {
    const next = endTurn(startTurn(scandalous(100), empty));
    expect(next.ended).toBe("cassado");
    const verdict = evaluate(next);
    expect(verdict.ending).toBe("cassado");
    expect(verdict.endingLabel).toBe("Cassado");
    expect(verdict.archetype).toBe("caido_desgraca");
  });

  it("partial oversight removes only some of the runs", () => {
    let removed = 0;
    for (let i = 0; i < 100; i++) {
      const s = { ...scandalous(50), rng: i * 7919 };
      if (checkRemoval(s).ended) removed++;
    }
    expect(removed).toBeGreaterThan(25);
    expect(removed).toBeLessThan(75);
  });
});

describe("quick start", () => {
  it("skips the civil phase and keeps the origin identity", () => {
    const s = startPhase("q", { originId: "ori_empresario", party: "pdp", age: 35, year: 1992 });
    expect(s.player.phase).toBe("politica");
    expect(s.player.originId).toBe("ori_empresario");
    expect(s.player.civil.entryDoor).toBe("candidatura_direta");
    expect(s.player.civil.joinedPartyYear).toBe(1991);
    expect(s.player.resources.money).toBeGreaterThan(40);
    expect(s.ended).toBeNull();
  });
});
