import { defaultTexts, type GameTexts } from "./texts.js";
import type { OfficeId, WorldState } from "./types.js";

export type OfficeLevel = "municipal" | "general";

export interface OfficeConfig {
  label: string;
  /** Position on the career ladder, 1 = lowest. */
  rank: number;
  level: OfficeLevel;
  branch: "executive" | "legislative";
  termYears: number;
  minAge: number;
  /** Mean strength of the rivals (doc 09). */
  adversaryStrength: number;
  adversaries: number;
  /** Proportional races: the player wins by beating this quantile of the rivals' scores. */
  percentile?: number;
  /** First year the office is on the ballot (the general cycle then repeats every 4 years). */
  firstYear?: number;
  /** One-off elections outside the regular cycle. */
  extraYears?: number[];
}

export interface ElectionConfig {
  weights: {
    base: number;
    media: number;
    money: number;
    electoralStrategy: number;
    mood: number;
    capital: number;
  };
  scandalPenalty: number;
  scandalTag: string;
  polarizationRejection: { threshold: number; coef: number };
  noiseSigma: number;
  adversaryVariation: number;
}

export interface CareerConfig {
  /** Executive reelection is allowed once, from this year on. */
  reelectionFromYear: number;
  executiveMaxConsecutiveTerms: number;
  /** A candidate may aim at most this many rungs above the highest office held. */
  ladderReach: number;
  entryOffices: OfficeId[];
  ineligibleTag: string;
  /** Appointments that can be held alongside a seat: parallel id -> offices it is compatible with. */
  parallel: Record<string, OfficeId[]>;
}

export interface EvaluationConfig {
  weights: {
    position: number;
    performance: number;
    reputation: number;
    consistency: number;
    legacy: number;
    fidelity: number;
  };
  /** Position score by highest ladder rank (index = rank, 0 = never held office). */
  positionByRank: number[];
  performance: { winRate: number; perTerm: number; maxTerms: number };
  reputation: {
    integrity: number;
    base: number;
    media: number;
    cleanliness: number;
    removedPenalty: number;
  };
  /** Style tag -> archetype id. The dominant style defines Reformador, Articulador, etc. */
  styleTags: Record<string, string>;
  neutralScore: number;
  legacyTagWeights: Record<string, number>;
  fidelity: { loyalTag: string; betrayalTag: string; step: number };
  /** Minimum total score for each legacy tier, ascending (Anônimo ... Histórico). */
  tierMinimums: number[];
  tags: { removed: string; retired: string };
  archetype: {
    fallenReputation: number;
    fallenMinRank: number;
    statesmanTier: number;
    statesmanReputation: number;
    betrayedFidelity: number;
    loyalFidelity: number;
    unfulfilledPerformance: number;
    unfulfilledAmbition: number;
    styleConsistency: number;
  };
  peakTotal: number;
}

// Balance numbers live here (defaults from docs/09-parametros-v0.md); content can override them.
export interface EngineConfig {
  startYear: number;
  eraEndYear: number;
  statMin: number;
  statMax: number;
  defaultAttribute: number;
  defaultResource: number;
  initialWorld: WorldState;
  defaultEventWeight: number;
  eventCooldownTurns: number;
  careerEventsPerTurn: number;
  election: ElectionConfig;
  career: CareerConfig;
  evaluation: EvaluationConfig;
  texts: GameTexts;
  offices: Record<OfficeId, OfficeConfig>;
}

export const defaultConfig: EngineConfig = {
  startYear: 1988,
  eraEndYear: 2026,
  statMin: 0,
  statMax: 100,
  defaultAttribute: 30,
  defaultResource: 10,
  initialWorld: {
    economy: 50,
    mood: 50,
    congressFragmentation: 50,
    mediaPressure: 50,
    oversight: 50,
    polarization: 50,
  },
  defaultEventWeight: 1,
  eventCooldownTurns: 3,
  careerEventsPerTurn: 2,
  election: {
    weights: {
      base: 0.3,
      media: 0.15,
      money: 0.15,
      electoralStrategy: 0.1,
      mood: 0.15,
      capital: 0.15,
    },
    scandalPenalty: 4,
    scandalTag: "scandal_active",
    polarizationRejection: { threshold: 50, coef: 0.2 },
    noiseSigma: 6,
    adversaryVariation: 10,
  },
  career: {
    reelectionFromYear: 1997,
    executiveMaxConsecutiveTerms: 2,
    ladderReach: 2,
    entryOffices: ["vereador", "prefeito", "deputado"],
    ineligibleTag: "ineligible",
    parallel: {
      secretario: ["vereador", "deputado", "senador"],
      lideranca_partidaria: ["vereador", "deputado", "senador"],
    },
  },
  evaluation: {
    weights: {
      position: 0.25,
      performance: 0.2,
      reputation: 0.15,
      consistency: 0.15,
      legacy: 0.15,
      fidelity: 0.1,
    },
    positionByRank: [0, 20, 35, 50, 75, 100],
    performance: { winRate: 60, perTerm: 8, maxTerms: 5 },
    reputation: { integrity: 0.35, base: 0.25, media: 0.2, cleanliness: 0.2, removedPenalty: 25 },
    styleTags: {
      style_reformer: "reformador",
      style_pragmatic: "articulador",
      style_populist: "populista",
      style_technocrat: "tecnocrata",
    },
    neutralScore: 50,
    legacyTagWeights: { legacy_law: 8, legacy_work: 6, legacy_scandal: -10, legacy_failure: -6 },
    fidelity: { loyalTag: "origin_loyal", betrayalTag: "origin_betrayal", step: 10 },
    tierMinimums: [0, 25, 45, 65, 82],
    tags: { removed: "cassado", retired: "aposentado" },
    archetype: {
      fallenReputation: 30,
      fallenMinRank: 2,
      statesmanTier: 3,
      statesmanReputation: 60,
      betrayedFidelity: 25,
      loyalFidelity: 75,
      unfulfilledPerformance: 40,
      unfulfilledAmbition: 60,
      styleConsistency: 60,
    },
    peakTotal: 65,
  },
  texts: defaultTexts,
  offices: {
    vereador: {
      label: "Vereador",
      rank: 1,
      level: "municipal",
      branch: "legislative",
      termYears: 4,
      minAge: 18,
      adversaryStrength: 45,
      adversaries: 9,
      percentile: 0.5,
    },
    prefeito: {
      label: "Prefeito",
      rank: 2,
      level: "municipal",
      branch: "executive",
      termYears: 4,
      minAge: 21,
      adversaryStrength: 50,
      adversaries: 3,
    },
    deputado: {
      label: "Deputado",
      rank: 3,
      level: "general",
      branch: "legislative",
      termYears: 4,
      minAge: 21,
      adversaryStrength: 55,
      adversaries: 9,
      percentile: 0.6,
    },
    senador: {
      label: "Senador",
      rank: 4,
      level: "general",
      branch: "legislative",
      termYears: 8,
      minAge: 35,
      adversaryStrength: 60,
      adversaries: 3,
    },
    governador: {
      label: "Governador",
      rank: 4,
      level: "general",
      branch: "executive",
      termYears: 4,
      minAge: 30,
      adversaryStrength: 60,
      adversaries: 3,
    },
    presidente: {
      label: "Presidente",
      rank: 5,
      level: "general",
      branch: "executive",
      termYears: 4,
      minAge: 35,
      adversaryStrength: 65,
      adversaries: 4,
      firstYear: 1994,
      extraYears: [1989],
    },
  },
};
