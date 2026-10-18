import { defaultConfig, type EngineConfig } from "./config.js";
import { createRngState } from "./rng.js";
import type { AttrId, GameState, Phase, PlayerState, ResourceId } from "./types.js";

export interface NewGameInput {
  seed: string;
  originId: string;
  party: string;
  age: number;
  year?: number;
  phase?: Phase;
  office?: string | null;
  attributes?: Partial<Record<AttrId, number>>;
  resources?: Partial<Record<ResourceId, number>>;
  prestige?: number;
  network?: number;
}

export function createGameState(
  input: NewGameInput,
  config: EngineConfig = defaultConfig,
): GameState {
  const attributes = {
    oratory: config.defaultAttribute,
    articulation: config.defaultAttribute,
    management: config.defaultAttribute,
    electoralStrategy: config.defaultAttribute,
    ambition: config.defaultAttribute,
    integrity: config.defaultAttribute,
    pragmatism: config.defaultAttribute,
    resilience: config.defaultAttribute,
    ...input.attributes,
  };
  const resources = {
    capital: config.defaultResource,
    money: config.defaultResource,
    base: config.defaultResource,
    media: config.defaultResource,
    ...input.resources,
  };
  const year = input.year ?? config.startYear;
  const phase = input.phase ?? "civil";
  const player: PlayerState = {
    year,
    age: input.age,
    phase,
    originId: input.originId,
    civil: {
      prestige: input.prestige ?? 0,
      network: input.network ?? 0,
      entryDoorsOpen: [],
      turns: 0,
      joinedPartyYear: phase === "politica" ? year - 1 : null,
      entryDoor: null,
      plannedOffice: null,
      windowYear: null,
      lastChance: false,
    },
    office: input.office ?? null,
    career: {
      termStartYear: input.office ? (input.year ?? config.startYear) : null,
      consecutiveTerms: input.office ? 1 : 0,
      highestRank: input.office ? (config.offices[input.office]?.rank ?? 0) : 0,
      parallel: [],
    },
    party: input.party,
    attributes,
    resources,
    hidden: { scandalRisk: 0, synergies: [] },
    tags: {},
    scheduled: [],
    history: [],
  };
  return {
    player,
    world: { ...config.initialWorld },
    rng: createRngState(input.seed),
    pending: [],
    turnOpen: false,
    ended: null,
  };
}
