import { describe, expect, it } from "vitest";
import { candidacyOptions } from "./career.js";
import { availableChoices } from "./resolve.js";
import {
  act,
  applyDecision,
  createSession,
  migrateSave,
  parseSave,
  replay,
  serializeSave,
  type CharacterInput,
  type Decision,
  type Session,
} from "./save.js";
import { getEvent, startTurn } from "./turn.js";
import { makeEvent } from "./test-utils.js";
import type { Catalog } from "./types.js";

const catalog: Catalog = {
  events: [
    makeEvent("ev_a", {
      weight: 3,
      choices: [
        {
          id: "bold",
          label: "bold",
          outcomes: [
            { chance: 1, text: "ok", effects: [{ add: "base", value: 8 }] },
            { chance: 1, text: "bad", effects: [{ add: "scandalRisk", value: 5 }] },
          ],
        },
        {
          id: "safe",
          label: "safe",
          outcomes: [{ chance: 1, text: "ok", effects: [{ add: "media", value: 3 }] }],
        },
      ],
    }),
    makeEvent("ev_b", {
      choices: [
        {
          id: "go",
          label: "go",
          outcomes: [{ chance: 1, text: "ok", effects: [{ add: "capital", value: 4 }] }],
        },
      ],
    }),
  ],
};

const character: CharacterInput = {
  originId: "ori_professor",
  party: "pdp",
  age: 30,
  phase: "politica",
  year: 1990,
  resources: { base: 60, media: 50, money: 50, capital: 50 },
};

/** Plays `years` years with the engine directly, recording every action as a Decision. */
function playLive(years: number): { session: Session; decisions: Decision[] } {
  let session = createSession("seed-x", character, "c1");
  const decisions: Decision[] = [];
  const record = (d: Decision) => {
    decisions.push(d);
    session = act(session, catalog, d);
  };
  for (let i = 0; i < years; i++) {
    let opened = startTurn(session.state, catalog);
    while (opened.pending.length > 0) {
      const event = getEvent(catalog, opened.pending[0] as string);
      const options = availableChoices(event, opened);
      const choice = options[opened.player.year % options.length]!;
      session = { ...session, state: opened };
      record({ t: "choice", id: choice.id });
      opened = session.state;
    }
    session = { ...session, state: opened };
    const office = candidacyOptions(opened)[0];
    if (office) record({ t: "stand", office });
    record({ t: "end" });
  }
  return { session, decisions };
}

describe("replay", () => {
  it("reproduces exactly the state of live play from {seed, decisions}", () => {
    const { session } = playLive(12);
    expect(session.state.player.year).toBe(1990 + 12);
    expect(session.save.decisions.length).toBeGreaterThan(12);
    const replayed = replay(session.save, catalog, "c1");
    expect(replayed.state).toEqual(session.state);
  });

  it("goes through JSON without losing anything", () => {
    const { session } = playLive(8);
    const loaded = parseSave(serializeSave(session.save));
    expect(replay(loaded, catalog, "c1").state).toEqual(session.state);
  });

  it("different seeds diverge", () => {
    const a = playLive(6).session;
    const other = createSession("seed-y", character, "c1");
    const b = a.save.decisions.slice(1).reduce((s, d) => {
      try {
        return act(s, catalog, d);
      } catch {
        return s;
      }
    }, other);
    expect(b.state.rng).not.toBe(a.state.rng);
  });

  it("rejects a save made with other content", () => {
    const { session } = playLive(1);
    expect(() => replay(session.save, catalog, "c2")).toThrow(/content/);
  });

  it("requires create first and refuses it later", () => {
    const { session } = playLive(1);
    expect(() => replay({ ...session.save, decisions: [{ t: "end" }] }, catalog, "c1")).toThrow(
      /create/,
    );
    expect(() =>
      applyDecision(session.state, catalog, { t: "create", input: character }),
    ).toThrow();
  });

  it("opens the turn on its own before the first action of a year", () => {
    const s = createSession("s", character, "c1");
    const next = applyDecision(s.state, { events: [] }, { t: "end" });
    expect(next.player.year).toBe(1991);
  });
});

describe("migrateSave", () => {
  const v1 = {
    saveVersion: 1,
    contentVersion: "c1",
    seed: "s",
    decisions: [{ t: "create", input: character }, { t: "end" }],
  };

  it("keeps a current save as it is", () => {
    expect(migrateSave(v1)).toEqual(v1);
  });

  it("upgrades an unversioned v0 save, closing each recorded year", () => {
    const migrated = migrateSave({
      seed: "s",
      character,
      turns: [["bold"], [], ["go", "safe"]],
    });
    expect(migrated.saveVersion).toBe(1);
    expect(migrated.contentVersion).toBe("0");
    expect(migrated.decisions).toEqual([
      { t: "create", input: character },
      { t: "choice", id: "bold" },
      { t: "end" },
      { t: "end" },
      { t: "choice", id: "go" },
      { t: "choice", id: "safe" },
      { t: "end" },
    ]);
  });

  it("rejects newer, malformed and unknown saves", () => {
    expect(() => migrateSave({ ...v1, saveVersion: 2 })).toThrow(/newer/);
    expect(() => migrateSave(null)).toThrow();
    expect(() => migrateSave({ ...v1, decisions: [{ t: "dance" }] })).toThrow(/invalid/);
    expect(() => migrateSave({ seed: 1 })).toThrow(/invalid v0/);
  });
});
