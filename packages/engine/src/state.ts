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
  const player: PlayerState = {
    year: input.year ?? config.startYear,
    age: input.age,
    phase: input.phase ?? "civil",
    originId: input.originId,
    civil: { prestige: input.prestige ?? 0, network: input.network ?? 0, entryDoorsOpen: [] },
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
  };
}
