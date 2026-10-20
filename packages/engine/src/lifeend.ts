import { defaultConfig, type EngineConfig } from "./config.js";
import { renderTemplate } from "./headlines.js";
import { Rng } from "./rng.js";
import type { GameState } from "./types.js";

function withHeadline(state: GameState, text: string): GameState {
  const entry = { year: state.player.year, kind: "headline" as const, text };
  return { ...state, player: { ...state.player, history: [...state.player.history, entry] } };
}

/** Voluntary retirement from the minimum age; the run ends and the evaluator sees the tag. */
export function retire(state: GameState, config: EngineConfig = defaultConfig): GameState {
  if (state.ended) throw new Error("the run is over");
  if (state.player.age < config.lifeEnd.retireMinAge) {
    throw new Error(`cannot retire before ${config.lifeEnd.retireMinAge}`);
  }
  return forceRetirement(state, config);
}

function forceRetirement(state: GameState, config: EngineConfig): GameState {
  const tag = config.evaluation.tags.retired;
  return {
    ...state,
    ended: "aposentadoria",
    player: { ...state.player, tags: { ...state.player.tags, [tag]: 1 } },
  };
}

/**
 * Above the scandal threshold, a sitting officeholder may be removed; the chance is the
 * oversight of the world. Removal ends the run, bars future candidacies and is recorded.
 */
export function checkRemoval(state: GameState, config: EngineConfig = defaultConfig): GameState {
  const { player } = state;
  if (player.office === null || player.hidden.scandalRisk <= config.lifeEnd.removalScandal) {
    return state;
  }
  const rng = new Rng(state.rng);
  if (!rng.chance(state.world.oversight / config.statMax)) return { ...state, rng: rng.state };

  const templates = config.texts.headlines.removal ?? [];
  const text = templates.length
    ? renderTemplate(rng.pick(templates), {
        office: config.offices[player.office]?.label ?? player.office,
        year: player.year,
      })
    : null;
  const removed = {
    ...state,
    rng: rng.state,
    ended: "cassado" as const,
    player: {
      ...player,
      office: null,
      tags: {
        ...player.tags,
        [config.evaluation.tags.removed]: 1,
        [config.career.ineligibleTag]: 1,
      },
    },
  };
  return text ? withHeadline(removed, text) : removed;
}

/** Counts the years of a politician with no seat and nothing left to run with. */
export function trackDefeat(state: GameState, config: EngineConfig = defaultConfig): GameState {
  const { player } = state;
  if (player.phase !== "politica" || state.ended) return state;
  const { base, capital, money } = player.resources;
  const broke =
    player.office === null && Math.max(base, capital, money) <= config.lifeEnd.brokeResource;
  const brokeYears = broke ? player.career.brokeYears + 1 : 0;
  const next = { ...state, player: { ...player, career: { ...player.career, brokeYears } } };
  return brokeYears >= config.lifeEnd.brokeYearsToEnd ? { ...next, ended: "derrota" } : next;
}

/** Closes the run when the calendar or the age forces it. Runs after the year advances. */
export function checkForcedEnd(state: GameState, config: EngineConfig = defaultConfig): GameState {
  if (state.ended) return state;
  if (state.player.age >= config.lifeEnd.retireForcedAge) return forceRetirement(state, config);
  if (state.player.year > config.eraEndYear) return { ...state, ended: "fim_da_era" };
  return state;
}
