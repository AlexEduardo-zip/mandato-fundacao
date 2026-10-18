import { evaluateCondition } from "./conditions.js";
import { defaultConfig, type EngineConfig } from "./config.js";
import { expireMandate } from "./career.js";
import { applyEffects, takeDueScheduled } from "./effects.js";
import { Rng } from "./rng.js";
import { selectEvents } from "./select.js";
import type { Catalog, GameEvent, GameState } from "./types.js";

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
  return anchors.reduce((acc, anchor) => fireEvent(acc, anchor, config), state);
}

function runScheduled(state: GameState, catalog: Catalog, config: EngineConfig): GameState {
  const { due, state: rest } = takeDueScheduled(state, state.player.year);
  const rng = new Rng(rest.rng);
  let next = rest;
  for (const item of due) {
    if (item.chance !== undefined && !rng.chance(item.chance)) continue;
    next = fireEvent(next, getEvent(catalog, item.eventId), config);
  }
  return { ...next, rng: rng.state };
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
  if (state.turnOpen) throw new Error("turn already open");
  let next: GameState = { ...state, turnOpen: true };
  next = applyAnchors(next, catalog, config);
  next = runScheduled(next, catalog, config);
  const drawn = selectEvents(next, catalog, config);
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
  const closed = expireMandate(state, config);
  return {
    ...closed,
    turnOpen: false,
    player: { ...closed.player, year: closed.player.year + 1, age: closed.player.age + 1 },
  };
}
