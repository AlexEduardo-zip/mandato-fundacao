import { defaultConfig, type EngineConfig } from "./config.js";
import { getStat, isStatId, withStat } from "./stats.js";
import { WORLD_KEYS, type Effect, type GameState, type HistoryEntry } from "./types.js";

const clamp = (value: number, config: EngineConfig) =>
  Math.min(config.statMax, Math.max(config.statMin, value));

function assertStat(id: string): asserts id is Parameters<typeof getStat>[1] {
  if (!isStatId(id)) throw new Error(`unknown stat id in effect: ${id}`);
}

function assertWorldKey(key: string): asserts key is (typeof WORLD_KEYS)[number] {
  if (!(WORLD_KEYS as readonly string[]).includes(key)) {
    throw new Error(`unknown world key in effect: ${key}`);
  }
}

function pushHistory(state: GameState, entry: HistoryEntry): GameState {
  return { ...state, player: { ...state.player, history: [...state.player.history, entry] } };
}

export function applyEffect(
  state: GameState,
  effect: Effect,
  config: EngineConfig = defaultConfig,
): GameState {
  const { player } = state;

  if ("add" in effect) {
    assertStat(effect.add);
    const next = clamp(getStat(player, effect.add) + effect.value, config);
    return { ...state, player: withStat(player, effect.add, next) };
  }
  if ("set" in effect) {
    assertStat(effect.set);
    return { ...state, player: withStat(player, effect.set, clamp(effect.value, config)) };
  }
  if ("addWorld" in effect) {
    assertWorldKey(effect.addWorld);
    const next = clamp(state.world[effect.addWorld] + effect.value, config);
    return { ...state, world: { ...state.world, [effect.addWorld]: next } };
  }
  if ("addTag" in effect) {
    const tags = {
      ...player.tags,
      [effect.addTag]: (player.tags[effect.addTag] ?? 0) + (effect.value ?? 1),
    };
    return { ...state, player: { ...player, tags } };
  }
  if ("removeTag" in effect) {
    const tags = { ...player.tags };
    delete tags[effect.removeTag];
    return { ...state, player: { ...player, tags } };
  }
  if ("schedule" in effect) {
    const { eventId, delayYears, chance } = effect.schedule;
    if (!Number.isInteger(delayYears) || delayYears < 0) {
      throw new Error(`invalid delayYears for ${eventId}: ${delayYears}`);
    }
    const entry = {
      eventId,
      dueYear: player.year + delayYears,
      ...(chance === undefined ? {} : { chance }),
    };
    return { ...state, player: { ...player, scheduled: [...player.scheduled, entry] } };
  }
  if ("setOffice" in effect) {
    const rank = config.offices[effect.setOffice]?.rank ?? 0;
    const same = player.office === effect.setOffice;
    const career = {
      ...player.career,
      termStartYear: same ? player.career.termStartYear : player.year,
      consecutiveTerms: same ? player.career.consecutiveTerms : 1,
      highestRank: Math.max(player.career.highestRank, rank),
    };
    return { ...state, player: { ...player, office: effect.setOffice, career } };
  }
  if ("headline" in effect) {
    return pushHistory(state, { year: player.year, kind: "headline", text: effect.headline });
  }
  throw new Error(`unknown effect: ${JSON.stringify(effect)}`);
}

export function applyEffects(
  state: GameState,
  effects: readonly Effect[],
  config: EngineConfig = defaultConfig,
): GameState {
  return effects.reduce((acc, effect) => applyEffect(acc, effect, config), state);
}

/** Removes and returns scheduled events due in `year` or earlier, keeping the rest in order. */
export function takeDueScheduled(state: GameState, year: number) {
  const due = state.player.scheduled.filter((s) => s.dueYear <= year);
  const rest = state.player.scheduled.filter((s) => s.dueYear > year);
  return { due, state: { ...state, player: { ...state.player, scheduled: rest } } };
}
