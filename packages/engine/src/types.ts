export const ATTR_IDS = [
  "oratory",
  "articulation",
  "management",
  "electoralStrategy",
  "ambition",
  "integrity",
  "pragmatism",
  "resilience",
] as const;
export const RESOURCE_IDS = ["capital", "money", "base", "media"] as const;
export const CIVIL_STAT_IDS = ["prestige", "network"] as const;
export const HIDDEN_STAT_IDS = ["scandalRisk"] as const;
export const STAT_IDS = [
  ...ATTR_IDS,
  ...RESOURCE_IDS,
  ...CIVIL_STAT_IDS,
  ...HIDDEN_STAT_IDS,
] as const;
export const WORLD_KEYS = [
  "economy",
  "mood",
  "congressFragmentation",
  "mediaPressure",
  "oversight",
  "polarization",
] as const;

export type AttrId = (typeof ATTR_IDS)[number];
export type ResourceId = (typeof RESOURCE_IDS)[number];
/** Any numeric stat of the player that conditions and effects can address (all within 0..100). */
export type StatId = (typeof STAT_IDS)[number];
export type WorldKey = (typeof WORLD_KEYS)[number];

export type OriginId = string;
export type OfficeId = string;
export type PartyId = string;
export type EntryDoorId = string;
export type Phase = "civil" | "politica";
export type Op = ">=" | "<=" | "==";

export type WorldState = Record<WorldKey, number>;

export interface ScheduledEvent {
  eventId: string;
  dueYear: number;
  chance?: number;
}

export interface HistoryEntry {
  year: number;
  kind: "anchor" | "event" | "choice" | "headline" | "election";
  eventId?: string;
  choiceId?: string;
  outcomeIndex?: number;
  text?: string;
  office?: OfficeId;
  won?: boolean;
  votePct?: number;
}

export interface CivilState {
  prestige: number;
  network: number;
  /** Doors whose requirements hold right now (refreshed at the end of each civil year). */
  entryDoorsOpen: EntryDoorId[];
  /** Completed civil years. */
  turns: number;
  joinedPartyYear: number | null;
  entryDoor: EntryDoorId | null;
  /** Office the opened door leads to; the first race must be for it. */
  plannedOffice: OfficeId | null;
  /** First election year the door converts into a candidacy. */
  windowYear: number | null;
  /** The last-chance offer after the final civil year is on the table. */
  lastChance: boolean;
}

export interface CareerState {
  /** Year the current mandate began; null without an office. */
  termStartYear: number | null;
  /** Consecutive mandates in the current office. */
  consecutiveTerms: number;
  /** Highest ladder rank ever held (0 = none). */
  highestRank: number;
  /** Consecutive years out of office with no resources to run again. */
  brokeYears: number;
  /** Appointments held alongside the seat. */
  parallel: OfficeId[];
}

export interface PlayerState {
  year: number;
  age: number;
  phase: Phase;
  originId: OriginId;
  civil: CivilState;
  office: OfficeId | null;
  career: CareerState;
  party: PartyId;
  attributes: Record<AttrId, number>;
  resources: Record<ResourceId, number>;
  hidden: { scandalRisk: number; synergies: string[] };
  tags: Record<string, number>;
  scheduled: ScheduledEvent[];
  history: HistoryEntry[];
}

export type EndReason = "vida_civil" | "cassado" | "aposentadoria" | "fim_da_era" | "derrota";

export interface GameState {
  player: PlayerState;
  world: WorldState;
  rng: number;
  /** Ids of fired events that still wait for a decision, in order. */
  pending: string[];
  turnOpen: boolean;
  /** Set once the run is over; no further turns are allowed. */
  ended: EndReason | null;
}

export type Condition =
  | { all: Condition[] }
  | { any: Condition[] }
  | { not: Condition }
  | { attr: StatId; op: Op; value: number }
  | { hasTag: string; min?: number }
  | { office: OfficeId | OfficeId[] }
  | { phase: Phase }
  | { origin: OriginId | OriginId[] }
  | { age: { op: Op; value: number } }
  | { yearBetween: [number, number] }
  | { world: WorldKey; op: Op; value: number };

export type Effect =
  | { add: StatId; value: number }
  | { set: StatId; value: number }
  | { addWorld: WorldKey; value: number }
  | { addTag: string; value?: number }
  | { removeTag: string }
  | { schedule: { eventId: string; delayYears: number; chance?: number } }
  | { setOffice: OfficeId }
  | { headline: string };

/** Probability from stats: base + sum(coef * stat / 100), clamped to [min, max] (default 0..1). */
export interface Formula {
  base: number;
  terms?: { stat: StatId; coef: number }[];
  min?: number;
  max?: number;
}

/** Multiplies the event weight by `mult` when `when` holds (always, if `when` is absent). */
export interface WeightRule {
  when?: Condition;
  mult: number;
}

export interface Outcome {
  /** Relative weight among the choice's outcomes; they need not sum to 1. */
  chance: number | Formula;
  text: string;
  effects: Effect[];
}

export interface Choice {
  id: string;
  label: string;
  requires?: Condition;
  outcomes: Outcome[];
}

export interface GameEvent {
  id: string;
  kind: "anchor" | "career";
  title: string;
  text: string;
  when?: Condition;
  weight?: number | WeightRule[];
  anchorYear?: number;
  /** Effects applied when the event fires (anchors use them to move the world). */
  worldEffects?: Effect[];
  effects?: Effect[];
  choices?: Choice[];
  tags?: string[];
  /** Never drawn at random; only fires through `schedule`. */
  scheduledOnly?: boolean;
  cooldownTurns?: number;
}

export interface Catalog {
  events: readonly GameEvent[];
}
