import { describe, expect, it } from "vitest";
import { availableChoices, decide, outcomeChance, playTurn } from "./resolve.js";
import { makeEvent, makeState } from "./test-utils.js";
import { startTurn } from "./turn.js";
import { STAT_IDS, WORLD_KEYS, type Catalog, type GameEvent, type GameState } from "./types.js";

const gamble: GameEvent = makeEvent("ev_gamble", {
  choices: [
    {
      id: "risk",
      label: "Arriscar",
      outcomes: [
        { chance: 3, text: "Deu certo", effects: [{ add: "capital", value: 10 }] },
        { chance: 1, text: "Deu errado", effects: [{ add: "capital", value: -10 }] },
      ],
    },
    {
      id: "safe",
      label: "Recuar",
      outcomes: [{ chance: 1, text: "Nada acontece", effects: [{ addTag: "recuou" }] }],
    },
    {
      id: "rich",
      label: "Pagar",
      requires: { attr: "money", op: ">=", value: 50 },
      outcomes: [{ chance: 1, text: "Pago", effects: [{ add: "money", value: -50 }] }],
    },
  ],
});
const catalog: Catalog = { events: [gamble] };

const open = (seed = "d", overrides = {}): GameState =>
  startTurn(makeState({ seed, ...overrides }), catalog);

describe("outcomeChance", () => {
  const s = makeState({ attributes: { oratory: 80 } });
  it("returns plain numbers (floored at 0) and evaluates formulas against stats", () => {
    expect(outcomeChance({ chance: 2, text: "", effects: [] }, s)).toBe(2);
    expect(outcomeChance({ chance: -1, text: "", effects: [] }, s)).toBe(0);
    const formula = { base: 0.2, terms: [{ stat: "oratory" as const, coef: 0.5 }] };
    expect(outcomeChance({ chance: formula, text: "", effects: [] }, s)).toBeCloseTo(0.6);
    expect(outcomeChance({ chance: { ...formula, max: 0.5 }, text: "", effects: [] }, s)).toBe(0.5);
    expect(outcomeChance({ chance: { base: -3 }, text: "", effects: [] }, s)).toBe(0);
  });
});

describe("decide", () => {
  it("applies the drawn outcome's effects, logs the choice and pops the queue", () => {
    const s = open();
    expect(s.pending).toEqual(["ev_gamble"]);
    const next = decide(s, catalog, "safe");
    expect(next.pending).toEqual([]);
    expect(next.player.tags.recuou).toBe(1);
    expect(next.player.history.at(-1)).toEqual({
      year: 1988,
      kind: "choice",
      eventId: "ev_gamble",
      choiceId: "safe",
      outcomeIndex: 0,
      text: "Nada acontece",
    });
  });

  it("is deterministic for a seed and covers every outcome across seeds", () => {
    const run = (seed: string) => decide(open(seed), catalog, "risk");
    expect(run("same")).toEqual(run("same"));
    const capitals = Array.from({ length: 300 }, (_, i) => run(`s${i}`).player.resources.capital);
    const wins = capitals.filter((c) => c === 20).length;
    expect(wins + capitals.filter((c) => c === 0).length).toBe(300);
    expect(wins).toBeGreaterThan(190);
    expect(wins).toBeLessThan(260);
  });

  it("rejects unavailable, unknown and out-of-turn choices", () => {
    expect(() => decide(open(), catalog, "rich")).toThrow(/not available/);
    expect(() => decide(open(), catalog, "nope")).toThrow(/unknown choice/);
    expect(() => decide(makeState(), catalog, "risk")).toThrow(/no pending/);
    const rich = open("d", { resources: { money: 60 } });
    expect(decide(rich, catalog, "rich").player.resources.money).toBe(10);
  });

  it("lists only choices whose requirement holds", () => {
    expect(availableChoices(gamble, open()).map((c) => c.id)).toEqual(["risk", "safe"]);
    const rich = open("d", { resources: { money: 60 } });
    expect(availableChoices(gamble, rich).map((c) => c.id)).toEqual(["risk", "safe", "rich"]);
  });

  it("does not mutate the input state", () => {
    const s = open();
    const before = JSON.stringify(s);
    decide(s, catalog, "risk");
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe("playTurn over many years", () => {
  const eventPool: Catalog = {
    events: [
      gamble,
      makeEvent("ev_boom", {
        effects: [
          { addWorld: "economy", value: 40 },
          { add: "money", value: 30 },
        ],
      }),
      makeEvent("ev_crash", {
        effects: [
          { addWorld: "economy", value: -40 },
          { add: "capital", value: -30 },
        ],
      }),
      makeEvent("ev_follow", {
        scheduledOnly: true,
        effects: [{ add: "scandalRisk", value: 20 }],
      }),
      makeEvent("ev_plant", {
        effects: [{ schedule: { eventId: "ev_follow", delayYears: 1 } }],
      }),
    ],
  };
  const first = (_e: GameEvent, choices: { id: string }[]) => choices[0]!.id;

  const run = (seed: string, years = 30) => {
    let s = makeState({ seed, year: 1988, age: 25 });
    for (let i = 0; i < years; i++) s = playTurn(s, eventPool, first);
    return s;
  };

  it("replays identically for the same seed and diverges for another", () => {
    expect(run("alpha")).toEqual(run("alpha"));
    expect(run("alpha")).not.toEqual(run("beta"));
  });

  it("keeps every stat and world variable inside 0..100", () => {
    for (let i = 0; i < 20; i++) {
      const s = run(`prop-${i}`);
      const { player, world } = s;
      for (const id of STAT_IDS) {
        const v =
          player.attributes[id as "oratory"] ??
          player.resources[id as "capital"] ??
          player.civil[id as "prestige"] ??
          player.hidden[id as "scandalRisk"];
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(100);
      }
      for (const k of WORLD_KEYS) {
        expect(world[k]).toBeGreaterThanOrEqual(0);
        expect(world[k]).toBeLessThanOrEqual(100);
      }
      expect(player.year).toBe(2018);
      expect(player.age).toBe(55);
    }
  });
});
