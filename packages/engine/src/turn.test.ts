import { describe, expect, it } from "vitest";
import { makeEvent, makeState } from "./test-utils.js";
import { endTurn, fireEvent, getEvent, startTurn } from "./turn.js";
import type { Catalog } from "./types.js";

const anchor = makeEvent("ev_anchor_90", {
  kind: "anchor",
  anchorYear: 1990,
  worldEffects: [{ addWorld: "economy", value: -20 }],
});

describe("startTurn", () => {
  it("applies anchors of the current year to the world, and only that year", () => {
    const catalog: Catalog = { events: [anchor] };
    const in1990 = startTurn(makeState({ year: 1990 }), catalog);
    expect(in1990.world.economy).toBe(30);
    expect(in1990.player.history).toEqual([
      { year: 1990, kind: "anchor", eventId: "ev_anchor_90" },
    ]);
    expect(startTurn(makeState({ year: 1991 }), catalog).world.economy).toBe(50);
  });

  it("skips anchors whose condition fails", () => {
    const conditional = { ...anchor, when: { phase: "civil" as const } };
    const s = startTurn(makeState({ year: 1990 }), { events: [conditional] });
    expect(s.world.economy).toBe(50);
  });

  it("fires due scheduled events and drops them from the agenda", () => {
    const consequence = makeEvent("ev_cons", {
      scheduledOnly: true,
      effects: [{ add: "money", value: 5 }],
    });
    const catalog: Catalog = { events: [consequence] };
    let s = makeState({ year: 1990 });
    s = { ...s, player: { ...s.player, scheduled: [{ eventId: "ev_cons", dueYear: 1990 }] } };
    const next = startTurn(s, catalog);
    expect(next.player.resources.money).toBe(15);
    expect(next.player.scheduled).toEqual([]);
    expect(next.player.history).toEqual([{ year: 1990, kind: "event", eventId: "ev_cons" }]);
  });

  it("keeps future scheduled events untouched", () => {
    let s = makeState({ year: 1990 });
    s = { ...s, player: { ...s.player, scheduled: [{ eventId: "ev_cons", dueYear: 1992 }] } };
    const next = startTurn(s, { events: [makeEvent("ev_cons", { scheduledOnly: true })] });
    expect(next.player.scheduled).toHaveLength(1);
    expect(next.player.history).toEqual([]);
  });

  it("rolls the chance of a scheduled event deterministically", () => {
    const consequence = makeEvent("ev_cons", {
      scheduledOnly: true,
      effects: [{ addTag: "fired" }],
    });
    const run = (seed: string) => {
      let s = makeState({ year: 1990, seed });
      s = {
        ...s,
        player: {
          ...s.player,
          scheduled: [{ eventId: "ev_cons", dueYear: 1990, chance: 0.5 }],
        },
      };
      return startTurn(s, { events: [consequence] });
    };
    expect(run("a")).toEqual(run("a"));
    const fired = Array.from({ length: 200 }, (_, i) => run(`seed-${i}`).player.tags.fired ?? 0);
    const hits = fired.filter((v) => v === 1).length;
    expect(hits).toBeGreaterThan(70);
    expect(hits).toBeLessThan(130);
    expect(run("never").player.scheduled).toEqual([]);
  });

  it("never fires chance 0 and always fires chance 1", () => {
    const consequence = makeEvent("ev_cons", {
      scheduledOnly: true,
      effects: [{ addTag: "fired" }],
    });
    const make = (chance: number) => {
      const s = makeState({ year: 1990 });
      return startTurn(
        {
          ...s,
          player: { ...s.player, scheduled: [{ eventId: "ev_cons", dueYear: 1990, chance }] },
        },
        { events: [consequence] },
      );
    };
    expect(make(0).player.tags.fired).toBeUndefined();
    expect(make(1).player.tags.fired).toBe(1);
  });

  it("queues events that have choices", () => {
    const withChoice = makeEvent("ev_choice", {
      scheduledOnly: true,
      choices: [{ id: "c1", label: "ok", outcomes: [{ chance: 1, text: "t", effects: [] }] }],
    });
    let s = makeState({ year: 1990 });
    s = { ...s, player: { ...s.player, scheduled: [{ eventId: "ev_choice", dueYear: 1990 }] } };
    expect(startTurn(s, { events: [withChoice] }).pending).toEqual(["ev_choice"]);
  });

  it("refuses to open a turn twice and fails on unknown scheduled events", () => {
    const open = startTurn(makeState(), { events: [] });
    expect(() => startTurn(open, { events: [] })).toThrow(/already open/);
    let s = makeState({ year: 1990 });
    s = { ...s, player: { ...s.player, scheduled: [{ eventId: "missing", dueYear: 1990 }] } };
    expect(() => startTurn(s, { events: [] })).toThrow(/unknown event/);
  });

  it("does not mutate the input state", () => {
    const s = makeState({ year: 1990 });
    const before = JSON.stringify(s);
    startTurn(s, { events: [anchor] });
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("endTurn", () => {
  it("advances year and age and closes the turn", () => {
    const open = startTurn(makeState({ year: 1990, age: 30 }), { events: [] });
    const closed = endTurn(open);
    expect(closed.player.year).toBe(1991);
    expect(closed.player.age).toBe(31);
    expect(closed.turnOpen).toBe(false);
  });

  it("requires an open turn and no pending decisions", () => {
    expect(() => endTurn(makeState())).toThrow(/no open turn/);
    const open = startTurn(makeState(), { events: [] });
    expect(() => endTurn({ ...open, pending: ["x"] })).toThrow(/pending/);
  });
});

describe("getEvent / fireEvent", () => {
  it("looks events up by id", () => {
    const e = makeEvent("ev_x");
    expect(getEvent({ events: [e] }, "ev_x")).toBe(e);
    expect(() => getEvent({ events: [e] }, "nope")).toThrow(/unknown event/);
  });

  it("applies both effects and worldEffects when firing", () => {
    const e = makeEvent("ev_x", {
      effects: [{ add: "media", value: 4 }],
      worldEffects: [{ addWorld: "mood", value: 3 }],
    });
    const s = fireEvent(makeState(), e);
    expect(s.player.resources.media).toBe(14);
    expect(s.world.mood).toBe(53);
  });
});
