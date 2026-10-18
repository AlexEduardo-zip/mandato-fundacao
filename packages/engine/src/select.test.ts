import { describe, expect, it } from "vitest";
import { defaultConfig } from "./config.js";
import { eligibleEvents, eventWeight, isOnCooldown, selectEvents } from "./select.js";
import { makeEvent, makeState } from "./test-utils.js";
import { startTurn } from "./turn.js";
import type { Catalog, GameState } from "./types.js";

const withHistory = (s: GameState, eventId: string, year: number): GameState => ({
  ...s,
  player: { ...s.player, history: [...s.player.history, { year, kind: "event", eventId }] },
});

describe("eventWeight", () => {
  const s = makeState({ attributes: { oratory: 80 } });
  it("uses the default, a number, or multiplies matching rules", () => {
    expect(eventWeight(makeEvent("a"), s)).toBe(1);
    expect(eventWeight(makeEvent("a", { weight: 4 }), s)).toBe(4);
    const ruled = makeEvent("a", {
      weight: [
        { when: { attr: "oratory", op: ">=", value: 70 }, mult: 3 },
        { when: { attr: "oratory", op: "<=", value: 10 }, mult: 100 },
        { mult: 2 },
      ],
    });
    expect(eventWeight(ruled, s)).toBe(6);
  });
});

describe("eligibleEvents", () => {
  const base = makeState({ year: 1992, attributes: { oratory: 50 } });

  it("filters by condition", () => {
    const catalog: Catalog = {
      events: [
        makeEvent("yes", { when: { phase: "politica" } }),
        makeEvent("no", { when: { phase: "civil" } }),
      ],
    };
    expect(eligibleEvents(base, catalog).map((e) => e.id)).toEqual(["yes"]);
  });

  it("excludes anchors, scheduled-only events and zero weight", () => {
    const catalog: Catalog = {
      events: [
        makeEvent("career"),
        makeEvent("anchor", { kind: "anchor", anchorYear: 1992 }),
        makeEvent("sched", { scheduledOnly: true }),
        makeEvent("zero", { weight: 0 }),
      ],
    };
    expect(eligibleEvents(base, catalog).map((e) => e.id)).toEqual(["career"]);
  });

  it("applies the 3-turn cooldown and per-event overrides", () => {
    const e = makeEvent("e");
    expect(isOnCooldown(withHistory(base, "e", 1991), e)).toBe(true);
    expect(isOnCooldown(withHistory(base, "e", 1990), e)).toBe(true);
    expect(isOnCooldown(withHistory(base, "e", 1989), e)).toBe(false);
    expect(isOnCooldown(base, e)).toBe(false);
    const short = makeEvent("e", { cooldownTurns: 2 });
    expect(isOnCooldown(withHistory(base, "e", 1990), short)).toBe(false);
    const none = makeEvent("e", { cooldownTurns: 0 });
    expect(isOnCooldown(withHistory(base, "e", 1992), none)).toBe(true);
  });
});

describe("selectEvents", () => {
  const catalog: Catalog = {
    events: ["a", "b", "c", "d"].map((id) => makeEvent(`ev_${id}`)),
  };

  it("draws up to the configured count without repeats", () => {
    const { events } = selectEvents(makeState(), catalog);
    expect(events).toHaveLength(defaultConfig.careerEventsPerTurn);
    expect(new Set(events.map((e) => e.id)).size).toBe(events.length);
    const small = selectEvents(makeState(), { events: [makeEvent("only")] });
    expect(small.events).toHaveLength(1);
    expect(selectEvents(makeState(), { events: [] }).events).toEqual([]);
  });

  it("is deterministic per seed and varies across seeds", () => {
    const ids = (seed: string) =>
      selectEvents(makeState({ seed }), catalog).events.map((e) => e.id);
    expect(ids("x")).toEqual(ids("x"));
    const variants = new Set(Array.from({ length: 30 }, (_, i) => ids(`s${i}`).join()));
    expect(variants.size).toBeGreaterThan(3);
  });

  it("favors heavier events", () => {
    const weighted: Catalog = {
      events: [makeEvent("heavy", { weight: 9 }), makeEvent("light", { weight: 1 })],
    };
    const config = { ...defaultConfig, careerEventsPerTurn: 1 };
    let heavy = 0;
    for (let i = 0; i < 400; i++) {
      const { events } = selectEvents(makeState({ seed: `w${i}` }), weighted, config);
      if (events[0]?.id === "heavy") heavy++;
    }
    expect(heavy).toBeGreaterThan(330);
    expect(heavy).toBeLessThan(390);
  });
});

describe("startTurn with event selection", () => {
  it("fires drawn career events, then respects cooldown on the next years", () => {
    const catalog: Catalog = { events: [makeEvent("only", { effects: [{ addTag: "seen" }] })] };
    let s = startTurn(makeState({ year: 1990 }), catalog);
    expect(s.player.tags.seen).toBe(1);
    s = { ...s, turnOpen: false, player: { ...s.player, year: 1991 } };
    s = startTurn(s, catalog);
    expect(s.player.tags.seen).toBe(1);
    s = { ...s, turnOpen: false, player: { ...s.player, year: 1993 } };
    s = startTurn(s, catalog);
    expect(s.player.tags.seen).toBe(2);
  });
});
