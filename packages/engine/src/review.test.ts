import { describe, expect, it } from "vitest";
import { checkCandidacy, expireMandate, mandateLastYear, stand } from "./career.js";
import { baseScore } from "./election.js";
import { createCharacter } from "./origins.js";
import { checkRemoval, trackDefeat } from "./lifeend.js";
import { makeEvent, makeState } from "./test-utils.js";
import { endTurn, startTurn } from "./turn.js";
import { checkDoor, joinParty } from "./civil.js";
import type { Catalog, GameState } from "./types.js";

const strong = (over: Parameters<typeof makeState>[0] = {}) =>
  makeState({
    resources: { base: 100, media: 100, money: 100, capital: 100 },
    attributes: { electoralStrategy: 100 },
    ...over,
  });

describe("last chance without affiliation", () => {
  it("can be accepted even by someone who never joined a party", () => {
    const base = createCharacter("s", { originId: "ori_sindicalista", party: "pdp", age: 30 });
    const s: GameState = {
      ...base,
      player: { ...base.player, civil: { ...base.player.civil, turns: 7, lastChance: true } },
    };
    expect(s.player.civil.joinedPartyYear).toBeNull();
    expect(checkDoor(s, "candidatura_direta")).toMatchObject({ ok: true });
    expect(joinParty(s).player.civil.joinedPartyYear).toBe(1988);
  });
});

describe("one candidacy per year and no step down", () => {
  it("blocks a second race in the same year", () => {
    const lost = stand(
      makeState({
        year: 1992,
        age: 40,
        resources: { base: 0, media: 0, money: 0, capital: 0 },
        attributes: { electoralStrategy: 0 },
      }),
      "vereador",
    ).state;
    expect(checkCandidacy(lost, "vereador")).toEqual({
      ok: false,
      reason: "already ran this year",
    });
  });

  it("does not let a senator run for a lower office", () => {
    const s = strong({ year: 1994, age: 50, office: "senador" });
    expect(checkCandidacy(s, "deputado")).toEqual({
      ok: false,
      reason: "below the current office",
    });
  });
});

describe("the 1989 president", () => {
  it("keeps the seat until the 1994 election, so reelection limits apply", () => {
    expect(mandateLastYear("presidente", 1989)).toBe(1994);
    expect(mandateLastYear("prefeito", 1992)).toBe(1996);
    expect(mandateLastYear("senador", 1990)).toBe(1998);
    const s = makeState({ year: 1993, age: 50, office: "presidente" });
    s.player.career.termStartYear = 1989;
    expect(expireMandate(s).player.office).toBe("presidente");
    expect(expireMandate({ ...s, player: { ...s.player, year: 1994 } }).player.office).toBeNull();
    const in1994 = { ...s, player: { ...s.player, year: 1994 } };
    expect(checkCandidacy(in1994, "presidente")).toEqual({
      ok: false,
      reason: "reelection not allowed yet",
    });
  });
});

describe("turn limits of doc 09", () => {
  const consequence = (id: string) =>
    makeEvent(id, {
      scheduledOnly: true,
      choices: [{ id: "ok", label: "ok", outcomes: [{ chance: 1, text: "x", effects: [] }] }],
    });
  const random = (id: string) =>
    makeEvent(id, {
      choices: [{ id: "ok", label: "ok", outcomes: [{ chance: 1, text: "x", effects: [] }] }],
    });

  it("fires at most 2 career events per turn, postponing the rest", () => {
    const catalog: Catalog = {
      events: [consequence("c1"), consequence("c2"), consequence("c3"), random("r1"), random("r2")],
    };
    let s = makeState({ year: 1995 });
    s = {
      ...s,
      player: {
        ...s.player,
        scheduled: ["c1", "c2", "c3"].map((eventId) => ({ eventId, dueYear: 1995 })),
      },
    };
    const opened = startTurn(s, catalog);
    expect(opened.pending).toEqual(["c1", "c2"]);
    expect(opened.player.scheduled).toEqual([{ eventId: "c3", dueYear: 1996 }]);
  });

  it("fires only one anchor per year", () => {
    const anchor = (id: string) => makeEvent(id, { kind: "anchor", anchorYear: 1995 });
    const opened = startTurn(makeState({ year: 1995 }), { events: [anchor("a1"), anchor("a2")] });
    expect(opened.player.history.filter((h) => h.kind === "anchor")).toHaveLength(1);
  });
});

describe("creation rules cannot be bypassed", () => {
  it("ignores raw attribute overrides", () => {
    const s = createCharacter("s", {
      originId: "ori_professor",
      party: "pdp",
      age: 30,
      attributes: { oratory: 100 },
    });
    expect(s.player.attributes.oratory).toBe(36);
  });
});

describe("removal in the last year of a mandate", () => {
  it("removal wins over the normal end of the mandate", () => {
    const s = makeState({ year: 1995, age: 45, office: "deputado" });
    s.player.career.termStartYear = 1990;
    s.player.hidden.scandalRisk = 100;
    s.world.oversight = 100;
    expect(s.player.year).toBeGreaterThanOrEqual(mandateLastYear("deputado", 1990));
    const closed = endTurn(startTurn(s, { events: [] }));
    expect(closed.ended).toBe("cassado");
    expect(closed.player.tags.ineligible).toBe(1);
    expect(checkRemoval(s).ended).toBe("cassado");
  });
});

describe("defeat without a way back", () => {
  const broke = () => {
    const s = makeState({
      year: 2000,
      age: 45,
      resources: { base: 5, media: 0, money: 0, capital: 5 },
    });
    s.player.career.highestRank = 1;
    return s;
  };

  it("ends after four broke years out of office", () => {
    let s = broke();
    for (let i = 1; i <= 3; i++) {
      s = trackDefeat(s);
      expect(s.ended).toBeNull();
      expect(s.player.career.brokeYears).toBe(i);
    }
    expect(trackDefeat(s).ended).toBe("derrota");
  });

  it("resets when the player has a seat or recovers resources", () => {
    const s = trackDefeat(trackDefeat(broke()));
    const rich = { ...s, player: { ...s.player, resources: { ...s.player.resources, money: 50 } } };
    expect(trackDefeat(rich).player.career.brokeYears).toBe(0);
    const seat = { ...s, player: { ...s.player, office: "vereador" } };
    expect(trackDefeat(seat).player.career.brokeYears).toBe(0);
  });
});

describe("scandal risk in the election score", () => {
  it("counts as an active scandal above 60", () => {
    const s = makeState();
    const risky = {
      ...s,
      player: { ...s.player, hidden: { ...s.player.hidden, scandalRisk: 61 } },
    };
    const edge = { ...s, player: { ...s.player, hidden: { ...s.player.hidden, scandalRisk: 60 } } };
    expect(baseScore(risky)).toBeCloseTo(baseScore(s) - 4);
    expect(baseScore(edge)).toBeCloseTo(baseScore(s));
  });
});
