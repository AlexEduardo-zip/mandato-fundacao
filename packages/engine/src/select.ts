import { evaluateCondition } from "./conditions.js";
import { defaultConfig, type EngineConfig } from "./config.js";
import { Rng } from "./rng.js";
import type { Catalog, GameEvent, GameState } from "./types.js";

export function lastFiredYear(state: GameState, eventId: string): number | undefined {
  let last: number | undefined;
  for (const h of state.player.history) {
    if ((h.kind === "event" || h.kind === "anchor") && h.eventId === eventId) last = h.year;
  }
  return last;
}

export function isOnCooldown(
  state: GameState,
  event: GameEvent,
  config: EngineConfig = defaultConfig,
): boolean {
  const last = lastFiredYear(state, event.id);
  if (last === undefined) return false;
  const cooldown = Math.max(event.cooldownTurns ?? config.eventCooldownTurns, 1);
  return state.player.year - last < cooldown;
}

export function eventWeight(
  event: GameEvent,
  state: GameState,
  config: EngineConfig = defaultConfig,
): number {
  const { weight } = event;
  if (typeof weight === "number") return weight;
  if (weight === undefined) return config.defaultEventWeight;
  return weight.reduce(
    (acc, rule) => (!rule.when || evaluateCondition(rule.when, state) ? acc * rule.mult : acc),
    config.defaultEventWeight,
  );
}

/** Career events that may be drawn now: right condition, not scheduled-only, off cooldown, weight > 0. */
export function eligibleEvents(
  state: GameState,
  catalog: Catalog,
  config: EngineConfig = defaultConfig,
): GameEvent[] {
  return catalog.events
    .filter((e) => e.kind === "career" && !e.scheduledOnly)
    .filter((e) => !e.when || evaluateCondition(e.when, state))
    .filter((e) => !isOnCooldown(state, e, config))
    .filter((e) => eventWeight(e, state, config) > 0)
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Weighted draw without replacement of up to `limit` events (default `config.careerEventsPerTurn`). */
export function selectEvents(
  state: GameState,
  catalog: Catalog,
  config: EngineConfig = defaultConfig,
  limit: number = config.careerEventsPerTurn,
): { events: GameEvent[]; rng: number } {
  const pool = eligibleEvents(state, catalog, config);
  const rng = new Rng(state.rng);
  const picked: GameEvent[] = [];
  while (picked.length < limit && pool.length > 0) {
    const index = rng.weightedIndex(pool.map((e) => eventWeight(e, state, config)));
    picked.push(pool.splice(index, 1)[0] as GameEvent);
  }
  return { events: picked, rng: rng.state };
}
