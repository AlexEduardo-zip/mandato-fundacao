import { evaluateCondition } from "./conditions.js";
import { defaultConfig, type EngineConfig } from "./config.js";
import { expireMandate } from "./career.js";
import { closeCivilYear } from "./civil.js";
import { checkForcedEnd, checkRemoval, trackDefeat } from "./lifeend.js";
import { applyEffects, takeDueScheduled } from "./effects.js";
import { Rng } from "./rng.js";
import { selectEvents } from "./select.js";
import type { Catalog, GameEvent, GameState, ScheduledEvent } from "./types.js";

export function getEvent(catalog: Catalog, id: string): GameEvent {
  const event = catalog.events.find((e) => e.id === id);
  if (!event) throw new Error(`unknown event: ${id}`);
  return event;
}

/** Records the event, applies its effects and queues it when it asks for a decision. */
export function fireEvent(
  state: GameState,
  event: GameEvent,
  config: EngineConfig = defaultConfig,
): GameState {
  const entry = {
    year: state.player.year,
    kind: event.kind === "anchor" ? ("anchor" as const) : ("event" as const),
    eventId: event.id,
  };
  let next: GameState = {
    ...state,
    player: { ...state.player, history: [...state.player.history, entry] },
  };
  next = applyEffects(next, [...(event.worldEffects ?? []), ...(event.effects ?? [])], config);
  if (event.choices && event.choices.length > 0) {
    next = { ...next, pending: [...next.pending, event.id] };
  }
  return next;
}

function applyAnchors(state: GameState, catalog: Catalog, config: EngineConfig): GameState {
  const anchors = catalog.events
    .filter((e) => e.kind === "anchor" && e.anchorYear === state.player.year)
    .filter((e) => !e.when || evaluateCondition(e.when, state))
    .sort((a, b) => a.id.localeCompare(b.id));
  return anchors.slice(0, 1).reduce((acc, anchor) => fireEvent(acc, anchor, config), state);
}

function runScheduled(
  state: GameState,
  catalog: Catalog,
  config: EngineConfig,
): { state: GameState; fired: number } {
  const { due, state: rest } = takeDueScheduled(state, state.player.year);
  const rng = new Rng(rest.rng);
  let next = rest;
  let fired = 0;
  const postponed: ScheduledEvent[] = [];
  for (const item of due) {
    if (fired >= config.careerEventsPerTurn) {
      postponed.push({ ...item, dueYear: state.player.year + 1 });
      continue;
    }
    if (item.chance !== undefined && !rng.chance(item.chance)) continue;
    next = fireEvent(next, getEvent(catalog, item.eventId), config);
    fired++;
  }
  next = {
    ...next,
    player: { ...next.player, scheduled: [...next.player.scheduled, ...postponed] },
  };
  return { state: { ...next, rng: rng.state }, fired };
}

/**
 * Opens the year: world anchors, due consequences, then random career events.
 * Afterwards `pending` lists the events that wait for a decision.
 */
export function startTurn(
  state: GameState,
  catalog: Catalog,
  config: EngineConfig = defaultConfig,
): GameState {
  if (state.ended) throw new Error("the run is over");
  if (state.turnOpen) throw new Error("turn already open");
  let next: GameState = { ...state, turnOpen: true };
  next = applyAnchors(next, catalog, config);
  const scheduled = runScheduled(next, catalog, config);
  next = scheduled.state;
  const drawn = selectEvents(next, catalog, config, config.careerEventsPerTurn - scheduled.fired);
  next = drawn.events.reduce((acc, event) => fireEvent(acc, event, config), {
    ...next,
    rng: drawn.rng,
  });
  return next;
}

/** Closes the year: advances the calendar and age. All pending decisions must be resolved. */
export function endTurn(state: GameState, config: EngineConfig = defaultConfig): GameState {
  if (!state.turnOpen) throw new Error("no open turn");
  if (state.pending.length > 0) throw new Error("decisions still pending");
  const closed = trackDefeat(
    closeCivilYear(expireMandate(checkRemoval(state, config), config), config),
    config,
  );
  return checkForcedEnd(
    {
      ...closed,
      turnOpen: false,
      player: { ...closed.player, year: closed.player.year + 1, age: closed.player.age + 1 },
    },
    config,
  );
}
