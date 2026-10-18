import { isElectionYear } from "./career.js";
import { evaluateCondition } from "./conditions.js";
import { defaultConfig, type DoorConfig, type EngineConfig } from "./config.js";
import { applyEffects } from "./effects.js";
import { officeConfig } from "./election.js";
import { originConfig } from "./origins.js";
import type { EntryDoorId, GameState, OfficeId } from "./types.js";

export type DoorCheck = { ok: true; office: OfficeId } | { ok: false; reason: string };

export function doorConfig(id: EntryDoorId, config: EngineConfig = defaultConfig): DoorConfig {
  const door = config.civil.doors[id];
  if (!door) throw new Error(`unknown door: ${id}`);
  return door;
}

/** Records the party affiliation; the electoral deadline counts from this year. */
export function joinParty(state: GameState, party?: string): GameState {
  if (state.ended) throw new Error("the run is over");
  const { player } = state;
  return {
    ...state,
    player: {
      ...player,
      party: party ?? player.party,
      civil: { ...player.civil, joinedPartyYear: player.civil.joinedPartyYear ?? player.year },
    },
  };
}

/** First election year, from now on, that an affiliation made in `joinedYear` can still reach. */
export function firstWindow(
  office: OfficeId,
  fromYear: number,
  joinedYear: number,
  config: EngineConfig = defaultConfig,
): number | null {
  for (let y = Math.max(fromYear, joinedYear + 1); y <= fromYear + 12; y++) {
    if (isElectionYear(office, y, config)) return y;
  }
  return null;
}

function targetOffice(state: GameState, door: DoorConfig): OfficeId {
  return door.upgrade && evaluateCondition(door.upgrade.when, state)
    ? door.upgrade.office
    : door.leadsTo;
}

/** Can the player open this door now? Entry rules: minimum age, affiliation, deadline, window. */
export function checkDoor(
  state: GameState,
  doorId: EntryDoorId,
  config: EngineConfig = defaultConfig,
  options: { quickStart?: boolean } = {},
): DoorCheck {
  const { player } = state;
  const door = doorConfig(doorId, config);
  if (state.ended) return { ok: false, reason: "the run is over" };
  if (player.phase !== "civil") return { ok: false, reason: "not in civil life" };

  const waived =
    options.quickStart || (player.civil.lastChance && doorId === config.civil.lastChanceDoor);
  if (!waived) {
    if (player.civil.turns < door.minTurns) return { ok: false, reason: "too soon" };
    if (!evaluateCondition(door.requires, state))
      return { ok: false, reason: "requirements not met" };
  }
  const office = targetOffice(state, door);
  const cfg = officeConfig(office, config);
  if (options.quickStart) return { ok: true, office };

  const joined = player.civil.joinedPartyYear;
  if (joined === null) return { ok: false, reason: "not affiliated" };
  const window = firstWindow(office, player.year, joined, config);
  if (window === null) return { ok: false, reason: "no election window" };
  if (player.age + (window - player.year) < cfg.minAge) return { ok: false, reason: "too young" };
  return { ok: true, office };
}

export function availableDoors(
  state: GameState,
  config: EngineConfig = defaultConfig,
): EntryDoorId[] {
  return Object.keys(config.civil.doors).filter((id) => checkDoor(state, id, config).ok);
}

/** Civil prestige and network become base, capital and money, scaled by origin and door. */
export function conversionGains(
  state: GameState,
  doorId: EntryDoorId,
  config: EngineConfig = defaultConfig,
) {
  const { civil, originId } = state.player;
  const origin = originConfig(originId, config);
  const door = doorConfig(doorId, config);
  const natural = origin.naturalDoors.includes(doorId) ? config.civil.naturalDoorBonus : 1;
  return {
    base: Math.round(civil.prestige * origin.conversion.toBase * door.conversion.base * natural),
    capital: Math.round(
      civil.network * origin.conversion.toCapital * door.conversion.capital * natural,
    ),
    money: Math.round(
      civil.network *
        origin.conversion.toMoney *
        door.conversion.money *
        config.civil.moneyFromNetwork *
        natural,
    ),
  };
}

/** Walks through the door: converts civil standing and starts the political phase. */
export function openDoor(
  state: GameState,
  doorId: EntryDoorId,
  config: EngineConfig = defaultConfig,
  options: { quickStart?: boolean } = {},
): GameState {
  const check = checkDoor(state, doorId, config, options);
  if (!check.ok) throw new Error(`cannot open ${doorId}: ${check.reason}`);
  const door = doorConfig(doorId, config);
  const gains = conversionGains(state, doorId, config);
  const { player } = state;
  const joined = player.civil.joinedPartyYear ?? player.year - 1;
  const window = options.quickStart ? null : firstWindow(check.office, player.year, joined, config);

  let next = applyEffects(
    state,
    [
      { add: "base", value: gains.base },
      { add: "capital", value: gains.capital },
      { add: "money", value: gains.money },
      { addTag: `door_${doorId}` },
      ...(door.tags ?? []).map((tag) => ({ addTag: tag })),
    ],
    config,
  );
  next = {
    ...next,
    player: {
      ...next.player,
      phase: "politica",
      civil: {
        ...next.player.civil,
        joinedPartyYear: joined,
        entryDoor: doorId,
        entryDoorsOpen: [],
        plannedOffice: check.office,
        windowYear: window,
        lastChance: false,
      },
    },
  };
  return next;
}

export function refreshDoors(state: GameState, config: EngineConfig = defaultConfig): GameState {
  if (state.player.phase !== "civil") return state;
  const entryDoorsOpen = availableDoors(state, config);
  return {
    ...state,
    player: { ...state.player, civil: { ...state.player.civil, entryDoorsOpen } },
  };
}

/** Closes a civil year: counts it, refreshes the doors and handles the last-chance rule. */
export function closeCivilYear(state: GameState, config: EngineConfig = defaultConfig): GameState {
  if (state.player.phase !== "civil") return state;
  const { civil } = state.player;
  if (civil.lastChance) return { ...state, ended: "vida_civil" };
  const turns = civil.turns + 1;
  const counted = {
    ...state,
    player: {
      ...state.player,
      civil: { ...civil, turns, lastChance: turns >= config.civil.maxTurns },
    },
  };
  return refreshDoors(counted, config);
}

/** Refuses the last chance: the run ends in civil life. */
export function declineLastChance(state: GameState): GameState {
  if (state.player.phase !== "civil" || !state.player.civil.lastChance) {
    throw new Error("no last chance on offer");
  }
  return { ...state, ended: "vida_civil" };
}
