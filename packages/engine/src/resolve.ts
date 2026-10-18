import { evaluateCondition } from "./conditions.js";
import { defaultConfig, type EngineConfig } from "./config.js";
import { applyEffects } from "./effects.js";
import { Rng } from "./rng.js";
import { getStat } from "./stats.js";
import { endTurn, getEvent, startTurn } from "./turn.js";
import type { Catalog, Choice, GameEvent, GameState, Outcome } from "./types.js";

/** Relative weight of an outcome, evaluated against the current state. */
export function outcomeChance(outcome: Outcome, state: GameState): number {
  const { chance } = outcome;
  if (typeof chance === "number") return Math.max(chance, 0);
  const raw =
    chance.base +
    (chance.terms ?? []).reduce(
      (acc, t) => acc + (t.coef * getStat(state.player, t.stat)) / 100,
      0,
    );
  return Math.min(chance.max ?? 1, Math.max(chance.min ?? 0, raw));
}

export function availableChoices(event: GameEvent, state: GameState): Choice[] {
  return (event.choices ?? []).filter((c) => !c.requires || evaluateCondition(c.requires, state));
}

/** Resolves the first pending event with the given choice: draws an outcome and applies its effects. */
export function decide(
  state: GameState,
  catalog: Catalog,
  choiceId: string,
  config: EngineConfig = defaultConfig,
): GameState {
  const eventId = state.pending[0];
  if (eventId === undefined) throw new Error("no pending decision");
  const event = getEvent(catalog, eventId);
  const choice = (event.choices ?? []).find((c) => c.id === choiceId);
  if (!choice) throw new Error(`unknown choice ${choiceId} for event ${eventId}`);
  if (choice.requires && !evaluateCondition(choice.requires, state)) {
    throw new Error(`choice ${choiceId} is not available`);
  }
  if (choice.outcomes.length === 0) throw new Error(`choice ${choiceId} has no outcomes`);

  const rng = new Rng(state.rng);
  const index = rng.weightedIndex(choice.outcomes.map((o) => outcomeChance(o, state)));
  const outcome = choice.outcomes[index] as Outcome;

  let next: GameState = {
    ...state,
    rng: rng.state,
    pending: state.pending.slice(1),
    player: {
      ...state.player,
      history: [
        ...state.player.history,
        {
          year: state.player.year,
          kind: "choice",
          eventId,
          choiceId,
          outcomeIndex: index,
          text: outcome.text,
        },
      ],
    },
  };
  next = applyEffects(next, outcome.effects, config);
  return next;
}

export type Chooser = (event: GameEvent, choices: Choice[], state: GameState) => string;

/** Plays one full year: opens it, answers every pending decision with `choose`, closes it. */
export function playTurn(
  state: GameState,
  catalog: Catalog,
  choose: Chooser,
  config: EngineConfig = defaultConfig,
): GameState {
  let next = startTurn(state, catalog, config);
  while (next.pending.length > 0) {
    const event = getEvent(catalog, next.pending[0] as string);
    const choices = availableChoices(event, next);
    if (choices.length === 0) throw new Error(`no available choice for event ${event.id}`);
    next = decide(next, catalog, choose(event, choices, next), config);
  }
  return endTurn(next, config);
}
