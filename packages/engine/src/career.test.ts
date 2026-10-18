import { describe, expect, it } from "vitest";
import {
  addParallel,
  candidacyOptions,
  checkCandidacy,
  expireMandate,
  isElectionYear,
  removeParallel,
  stand,
} from "./career.js";
import { makeState } from "./test-utils.js";
import { endTurn, startTurn } from "./turn.js";

const strong = (over: Parameters<typeof makeState>[0] = {}) =>
  makeState({
    resources: { base: 100, media: 100, money: 100, capital: 100 },
    attributes: { electoralStrategy: 100 },
    ...over,
  });

describe("isElectionYear", () => {
  it("follows the municipal and general cycles", () => {
    expect([1988, 1992, 1996, 2024].every((y) => isElectionYear("prefeito", y))).toBe(true);
    expect(isElectionYear("prefeito", 1990)).toBe(false);
    expect([1990, 1994, 2022].every((y) => isElectionYear("deputado", y))).toBe(true);
    expect(isElectionYear("deputado", 1988)).toBe(false);
  });

  it("treats the 1989 presidential race as a special case", () => {
    expect(isElectionYear("presidente", 1989)).toBe(true);
    expect(isElectionYear("presidente", 1990)).toBe(false);
    expect(isElectionYear("presidente", 1994)).toBe(true);
    expect(isElectionYear("presidente", 1993)).toBe(false);
  });
});

describe("checkCandidacy", () => {
  it("requires politics, age, election year and no ineligibility", () => {
    expect(checkCandidacy(makeState({ phase: "civil", year: 1992 }), "vereador").ok).toBe(false);
    expect(checkCandidacy(makeState({ year: 1992, age: 17 }), "vereador")).toEqual({
      ok: false,
      reason: "too young",
    });
    expect(checkCandidacy(makeState({ year: 1991 }), "vereador")).toEqual({
      ok: false,
      reason: "no election",
    });
    const banned = makeState({ year: 1992 });
    banned.player.tags = { ineligible: 1 };
    expect(checkCandidacy(banned, "vereador")).toEqual({ ok: false, reason: "ineligible" });
    expect(checkCandidacy(makeState({ year: 1992 }), "vereador").ok).toBe(true);
  });

  it("applies the minimum ages of doc 09", () => {
    const at = (office: string, age: number, held: string) =>
      checkCandidacy(makeState({ year: 1994, age, office: held }), office).ok;
    expect(at("deputado", 21, "vereador")).toBe(true);
    expect(at("deputado", 20, "vereador")).toBe(false);
    expect(at("governador", 29, "deputado")).toBe(false);
    expect(at("governador", 30, "deputado")).toBe(true);
    expect(at("senador", 34, "deputado")).toBe(false);
    expect(at("senador", 35, "deputado")).toBe(true);
    expect(at("presidente", 34, "governador")).toBe(false);
    expect(at("presidente", 35, "governador")).toBe(true);
  });

  it("starts from the entry offices and climbs at most two ranks above the highest office", () => {
    const novice = makeState({ year: 1994, age: 50 });
    expect(candidacyOptions(novice)).toEqual(["deputado"]);
    const councilor = makeState({ year: 1996, age: 50, office: "vereador" });
    expect(candidacyOptions(councilor)).toEqual(["vereador", "prefeito"]);
    const deputy = makeState({ year: 1998, age: 50, office: "deputado" });
    expect(candidacyOptions(deputy).sort()).toEqual([
      "deputado",
      "governador",
      "presidente",
      "senador",
    ]);
  });

  it("allows executive reelection once, and only from 1997", () => {
    const early = makeState({ year: 1992, age: 40, office: "prefeito" });
    expect(checkCandidacy(early, "prefeito")).toEqual({
      ok: false,
      reason: "reelection not allowed yet",
    });
    const first = makeState({ year: 2000, age: 40, office: "prefeito" });
    expect(checkCandidacy(first, "prefeito").ok).toBe(true);
    const second = {
      ...first,
      player: { ...first.player, career: { ...first.player.career, consecutiveTerms: 2 } },
    };
    expect(checkCandidacy(second, "prefeito")).toEqual({ ok: false, reason: "term limit reached" });
  });

  it("does not limit legislative reelection", () => {
    const s = makeState({ year: 2002, age: 50, office: "deputado" });
    s.player.career.consecutiveTerms = 5;
    expect(checkCandidacy(s, "deputado").ok).toBe(true);
  });
});

describe("stand and mandates", () => {
  it("a win takes the seat and starts the mandate", () => {
    const { state, result } = stand(strong({ year: 1992, age: 40 }), "prefeito");
    expect(result.won).toBe(true);
    expect(state.player.office).toBe("prefeito");
    expect(state.player.career).toMatchObject({
      termStartYear: 1992,
      consecutiveTerms: 1,
      highestRank: 2,
    });
  });

  it("a loss keeps the current seat", () => {
    const weak = makeState({
      year: 1994,
      age: 50,
      office: "deputado",
      resources: { base: 0, media: 0, money: 0, capital: 0 },
      attributes: { electoralStrategy: 0 },
    });
    const { state, result } = stand(weak, "governador");
    expect(result.won).toBe(false);
    expect(state.player.office).toBe("deputado");
  });

  it("refuses an invalid candidacy", () => {
    expect(() => stand(makeState({ year: 1991 }), "vereador")).toThrow(/cannot run/);
  });

  it("reelection counts consecutive terms and renews the mandate", () => {
    let s = strong({ year: 1996, age: 40 });
    s = stand(s, "prefeito").state;
    s = { ...s, player: { ...s.player, year: 2000 } };
    s = stand(s, "prefeito").state;
    expect(s.player.career).toMatchObject({ termStartYear: 2000, consecutiveTerms: 2 });
    expect(expireMandate(s).player.office).toBe("prefeito");
  });

  it("the mandate lapses after its last year when nothing renews it", () => {
    const s = stand(strong({ year: 1992, age: 40 }), "prefeito").state;
    for (const year of [1993, 1994, 1995]) {
      expect(expireMandate({ ...s, player: { ...s.player, year } }).player.office).toBe("prefeito");
    }
    const lapsed = expireMandate({ ...s, player: { ...s.player, year: 1996 } });
    expect(lapsed.player.office).toBeNull();
    expect(lapsed.player.career.termStartYear).toBeNull();
    expect(lapsed.player.career.highestRank).toBe(2);
  });

  it("senators serve eight years", () => {
    const s = makeState({ year: 1990, age: 50, office: "senador" });
    expect(expireMandate({ ...s, player: { ...s.player, year: 1997 } }).player.office).toBe(
      "senador",
    );
    expect(expireMandate({ ...s, player: { ...s.player, year: 1998 } }).player.office).toBeNull();
  });

  it("endTurn drops an expired mandate while advancing the calendar", () => {
    const s = makeState({ year: 1996, age: 40, office: "vereador" });
    s.player.career.termStartYear = 1992;
    const closed = endTurn(startTurn(s, { events: [] }));
    expect(closed.player.office).toBeNull();
    expect(closed.player.year).toBe(1997);
  });
});

describe("parallel offices", () => {
  it("attaches compatible appointments and drops them with the seat", () => {
    const s = makeState({ year: 1994, age: 40, office: "deputado" });
    const withSec = addParallel(s, "secretario");
    expect(withSec.player.career.parallel).toEqual(["secretario"]);
    expect(addParallel(withSec, "secretario")).toEqual(withSec);
    expect(removeParallel(withSec, "secretario").player.career.parallel).toEqual([]);
    const lapsed = expireMandate({ ...withSec, player: { ...withSec.player, year: 1998 } });
    expect(lapsed.player.career.parallel).toEqual([]);
  });

  it("rejects unknown or incompatible appointments", () => {
    const mayor = makeState({ year: 1996, office: "prefeito" });
    expect(() => addParallel(mayor, "secretario")).toThrow(/not compatible/);
    expect(() => addParallel(mayor, "xyz")).toThrow(/unknown/);
    expect(() => addParallel(makeState(), "secretario")).toThrow();
  });
});
