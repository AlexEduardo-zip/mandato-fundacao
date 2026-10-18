import { describe, expect, it } from "vitest";
import { applyEffect, applyEffects, takeDueScheduled } from "./effects.js";
import { makeState } from "./test-utils.js";
import { STAT_IDS } from "./types.js";

describe("applyEffect", () => {
  it("adds to attributes, resources, civil and hidden stats", () => {
    let s = makeState({ attributes: { oratory: 50 }, resources: { money: 20 }, prestige: 10 });
    s = applyEffects(s, [
      { add: "oratory", value: 7 },
      { add: "money", value: -5 },
      { add: "prestige", value: 3 },
      { add: "scandalRisk", value: 12 },
    ]);
    expect(s.player.attributes.oratory).toBe(57);
    expect(s.player.resources.money).toBe(15);
    expect(s.player.civil.prestige).toBe(13);
    expect(s.player.hidden.scandalRisk).toBe(12);
  });

  it("clamps every stat to 0..100", () => {
    for (const stat of STAT_IDS) {
      const up = applyEffect(makeState(), { add: stat, value: 500 });
      const down = applyEffect(makeState(), { add: stat, value: -500 });
      const set = applyEffect(makeState(), { set: stat, value: 250 });
      const values = [up, down, set].map((st) => [
        st.player.attributes[stat as "oratory"],
        st.player.resources[stat as "capital"],
        st.player.civil[stat as "prestige"],
        st.player.hidden[stat as "scandalRisk"],
      ]);
      for (const v of values.flat().filter((x) => typeof x === "number")) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
    }
    expect(applyEffect(makeState(), { add: "base", value: 500 }).player.resources.base).toBe(100);
    expect(applyEffect(makeState(), { add: "base", value: -500 }).player.resources.base).toBe(0);
  });

  it("sets a stat to an absolute value", () => {
    const s = applyEffect(makeState(), { set: "capital", value: 42 });
    expect(s.player.resources.capital).toBe(42);
  });

  it("moves the world, clamped", () => {
    let s = applyEffect(makeState(), { addWorld: "economy", value: -20 });
    expect(s.world.economy).toBe(30);
    s = applyEffect(s, { addWorld: "economy", value: -200 });
    expect(s.world.economy).toBe(0);
  });

  it("adds, accumulates and removes tags", () => {
    let s = applyEffect(makeState(), { addTag: "aliado_centrao" });
    expect(s.player.tags.aliado_centrao).toBe(1);
    s = applyEffect(s, { addTag: "aliado_centrao", value: 2 });
    expect(s.player.tags.aliado_centrao).toBe(3);
    s = applyEffect(s, { removeTag: "aliado_centrao" });
    expect(s.player.tags).not.toHaveProperty("aliado_centrao");
    expect(applyEffect(s, { removeTag: "inexistente" }).player.tags).toEqual({});
  });

  it("schedules consequences relative to the current year", () => {
    const s = applyEffects(makeState({ year: 1990 }), [
      { schedule: { eventId: "ev_a", delayYears: 2 } },
      { schedule: { eventId: "ev_b", delayYears: 0, chance: 0.5 } },
    ]);
    expect(s.player.scheduled).toEqual([
      { eventId: "ev_a", dueYear: 1992 },
      { eventId: "ev_b", dueYear: 1990, chance: 0.5 },
    ]);
    expect(() => applyEffect(s, { schedule: { eventId: "ev_c", delayYears: -1 } })).toThrow(
      /delayYears/,
    );
  });

  it("sets the office and records headlines in history", () => {
    let s = applyEffect(makeState({ year: 1992 }), { setOffice: "prefeito" });
    expect(s.player.office).toBe("prefeito");
    s = applyEffect(s, { headline: "Manchete" });
    expect(s.player.history).toEqual([{ year: 1992, kind: "headline", text: "Manchete" }]);
  });

  it("does not mutate the input state", () => {
    const s = makeState();
    const before = JSON.stringify(s);
    applyEffects(s, [
      { add: "oratory", value: 5 },
      { addTag: "x" },
      { addWorld: "mood", value: 5 },
      { schedule: { eventId: "e", delayYears: 1 } },
      { headline: "h" },
    ]);
    expect(JSON.stringify(s)).toBe(before);
  });

  it("rejects unknown stats, world keys and effects", () => {
    expect(() => applyEffect(makeState(), { add: "charisma" as never, value: 1 })).toThrow(/stat/);
    expect(() => applyEffect(makeState(), { addWorld: "weather" as never, value: 1 })).toThrow(
      /world key/,
    );
    expect(() => applyEffect(makeState(), { bogus: 1 } as never)).toThrow(/unknown effect/);
  });
});

describe("takeDueScheduled", () => {
  it("splits due entries (including overdue ones) from future ones", () => {
    const s = applyEffects(makeState({ year: 1990 }), [
      { schedule: { eventId: "now", delayYears: 0 } },
      { schedule: { eventId: "later", delayYears: 3 } },
    ]);
    const { due, state } = takeDueScheduled(s, 1991);
    expect(due.map((d) => d.eventId)).toEqual(["now"]);
    expect(state.player.scheduled.map((d) => d.eventId)).toEqual(["later"]);
  });
});
