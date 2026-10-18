import { describe, expect, it } from "vitest";
import { candidacyOptions } from "./career.js";
import { availableDoors } from "./civil.js";
import { defaultConfig } from "./config.js";
import { evaluate } from "./evaluation.js";
import { availableChoices } from "./resolve.js";
import {
  act,
  createSession,
  parseSave,
  replay,
  serializeSave,
  type CharacterInput,
  type Decision,
  type Session,
} from "./save.js";
import { makeEvent } from "./test-utils.js";
import { getEvent, startTurn } from "./turn.js";
import type { Catalog } from "./types.js";

const civilEvent = (id: string) =>
  makeEvent(id, {
    when: { phase: "civil" },
    weight: 4,
    choices: [
      {
        id: "lead",
        label: "Assumir a frente",
        outcomes: [
          {
            chance: 1,
            text: "A categoria reconhece a liderança.",
            effects: [
              { add: "prestige", value: 12 },
              { add: "network", value: 8 },
              { addTag: "entity_leader" },
            ],
          },
        ],
      },
      {
        id: "quiet",
        label: "Ficar na sua",
        outcomes: [{ chance: 1, text: "Nada acontece.", effects: [] }],
      },
    ],
  });

const careerEvent = makeEvent("ev_mandato", {
  when: { phase: "politica" },
  weight: 2,
  choices: [
    {
      id: "deliver",
      label: "Entregar",
      outcomes: [
        {
          chance: 3,
          text: "Obra entregue.",
          effects: [{ add: "base", value: 4 }, { addTag: "style_reformer" }],
        },
        { chance: 1, text: "Atraso e crítica.", effects: [{ add: "scandalRisk", value: 3 }] },
      ],
    },
  ],
});

const catalog: Catalog = {
  events: [civilEvent("ev_a"), civilEvent("ev_b"), civilEvent("ev_c"), careerEvent],
};

const character: CharacterInput = {
  originId: "ori_sindicalista",
  party: "pdp",
  age: 30,
  year: 1988,
  points: { articulation: 20, electoralStrategy: 20 },
};

type Strategy = "career" | "stay_civil";

/** Plays a whole run with a fixed strategy, recording each action as a decision. */
function play(seed: string, strategy: Strategy): Session {
  let session = createSession(seed, character, "c1");
  const record = (d: Decision) => {
    session = act(session, catalog, d);
  };
  for (let guard = 0; guard < 80 && !session.state.ended; guard++) {
    let opened = startTurn(session.state, catalog);
    session = { ...session, state: opened };
    while (opened.pending.length > 0) {
      const event = getEvent(catalog, opened.pending[0] as string);
      const choices = availableChoices(event, opened);
      record({ t: "choice", id: (choices[0] as { id: string }).id });
      opened = session.state;
    }
    const { player } = opened;
    if (player.phase === "civil") {
      if (strategy === "career") {
        if (player.civil.joinedPartyYear === null) record({ t: "join" });
        const doors = availableDoors(session.state);
        if (doors[0]) {
          record({ t: "door", id: doors[0] });
        } else if (session.state.player.civil.lastChance) {
          record({ t: "decline" });
        }
      }
    } else {
      const options = candidacyOptions(session.state).sort(
        (a, b) => (defaultConfig.offices[b]?.rank ?? 0) - (defaultConfig.offices[a]?.rank ?? 0),
      );
      if (options[0]) record({ t: "stand", office: options[0] });
      if (player.age >= 60) {
        record({ t: "retire" });
        continue;
      }
    }
    if (!session.state.ended) record({ t: "end" });
  }
  return session;
}

describe("complete run from civil life to the final verdict", () => {
  it("goes through the door, the elections and ends with a verdict", () => {
    const session = play("run-1", "career");
    const { state, save } = session;
    const kinds = new Set(save.decisions.map((d) => d.t));
    expect(state.ended).not.toBeNull();
    expect(state.player.civil.entryDoor).not.toBeNull();
    expect(state.player.civil.turns).toBeGreaterThanOrEqual(3);
    for (const k of ["create", "join", "door", "choice", "stand", "end"]) {
      expect(kinds.has(k as Decision["t"]), k).toBe(true);
    }
    expect(state.player.history.some((h) => h.kind === "election")).toBe(true);

    const verdict = evaluate(state);
    expect(verdict.total).toBeGreaterThan(0);
    expect(verdict.legacyTier).toBeGreaterThanOrEqual(1);
    expect(verdict.summary).toContain("Da origem como Sindicalista");
    expect(verdict.timeline.length).toBeGreaterThan(0);
  });

  it("is deterministic: same seed and strategy give the same run", () => {
    const a = play("run-1", "career");
    const b = play("run-1", "career");
    expect(b.save).toEqual(a.save);
    expect(b.state).toEqual(a.state);
    expect(evaluate(b.state)).toEqual(evaluate(a.state));
  });

  it("different seeds give different runs", () => {
    const a = play("run-1", "career");
    const b = play("run-2", "career");
    expect(b.state.rng).not.toBe(a.state.rng);
  });

  it("replays from the saved seed and decisions, even through JSON", () => {
    const session = play("run-1", "career");
    const loaded = parseSave(serializeSave(session.save));
    const replayed = replay(loaded, catalog, "c1");
    expect(replayed.state).toEqual(session.state);
    expect(evaluate(replayed.state)).toEqual(evaluate(session.state));
  });

  it("a character who never opens a door ends in civil life", () => {
    const session = play("run-3", "stay_civil");
    expect(session.state.ended).toBe("vida_civil");
    expect(session.state.player.phase).toBe("civil");
    const verdict = evaluate(session.state);
    expect(verdict.ending).toBe("vida_civil");
    expect(verdict.endingLabel).toBe("Permaneceu na vida civil");
    expect(replay(session.save, catalog, "c1").state).toEqual(session.state);
  });
});
