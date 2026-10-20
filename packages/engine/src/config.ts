import { defaultTexts, type GameTexts } from "./texts.js";
import type {
  AttrId,
  Condition,
  EntryDoorId,
  OfficeId,
  OriginId,
  ResourceId,
  WorldState,
} from "./types.js";

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
  /** Hidden scandal risk above this counts as one more active scandal (doc 09: opens the scandal). */
  scandalRiskThreshold: number;
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

export interface OriginConfig {
  label: string;
  availableFrom?: number;
  availableUntil?: number;
  ageRange: [number, number];
  /** Added to the attribute after the free points; within +-10 (doc 09). */
  attributeMods: Partial<Record<AttrId, number>>;
  startingResources: Partial<Record<ResourceId, number>>;
  civilPrestige: number;
  civilNetwork: number;
  /** Civil-to-political conversion multipliers (between 0.6 and 1.2, doc 09). */
  conversion: { toBase: number; toCapital: number; toMoney: number };
  naturalDoors: EntryDoorId[];
}

export interface DoorConfig {
  label: string;
  leadsTo: OfficeId;
  requires: Condition;
  /** Replaces `leadsTo` when it holds. */
  upgrade?: { office: OfficeId; when: Condition };
  minTurns: number;
  /** Multipliers on top of the origin conversion. */
  conversion: { base: number; capital: number; money: number };
  /** Tags added when the door opens (commitments that are charged later). */
  tags?: string[];
}

export interface CivilConfig {
  maxTurns: number;
  creation: { freePoints: number; maxAttribute: number; maxOriginMod: number };
  naturalDoorBonus: number;
  /** Share of the network that becomes money on entry. */
  moneyFromNetwork: number;
  /** Door offered as the last chance, with its requirements waived. */
  lastChanceDoor: EntryDoorId;
  /** Door used by the quick start (skips the civil phase). */
  quickStartDoor: EntryDoorId;
  doors: Record<EntryDoorId, DoorConfig>;
}

export interface LifeEndConfig {
  retireMinAge: number;
  retireForcedAge: number;
  /** scandalRisk above this can lead to removal from office. */
  removalScandal: number;
  /** Out of office and with every political resource at or below this, the year counts as broke. */
  brokeResource: number;
  /** Broke years in a row (two election cycles) that end the run in defeat. */
  brokeYearsToEnd: number;
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
  fidelity: {
    loyalTag: string;
    betrayalTag: string;
    promiseTag: string;
    keptTag: string;
    step: number;
  };
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
  civil: CivilConfig;
  origins: Record<OriginId, OriginConfig>;
  lifeEnd: LifeEndConfig;
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
    scandalRiskThreshold: 60,
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
    fidelity: {
      loyalTag: "origin_loyal",
      betrayalTag: "origin_betrayal",
      promiseTag: "promessa_categoria",
      keptTag: "promessa_cumprida",
      step: 10,
    },
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
  lifeEnd: {
    retireMinAge: 60,
    retireForcedAge: 80,
    removalScandal: 85,
    brokeResource: 10,
    brokeYearsToEnd: 4,
  },
  civil: {
    maxTurns: 8,
    creation: { freePoints: 40, maxAttribute: 80, maxOriginMod: 10 },
    naturalDoorBonus: 1.15,
    moneyFromNetwork: 0.3,
    lastChanceDoor: "candidatura_direta",
    quickStartDoor: "candidatura_direta",
    doors: {
      candidatura_direta: {
        label: "Candidatura direta",
        leadsTo: "vereador",
        requires: { attr: "prestige", op: ">=", value: 50 },
        upgrade: { office: "deputado", when: { attr: "prestige", op: ">=", value: 85 } },
        minTurns: 3,
        conversion: { base: 1, capital: 1, money: 1 },
      },
      lideranca_entidade: {
        label: "Liderança de entidade",
        leadsTo: "vereador",
        requires: {
          all: [{ attr: "network", op: ">=", value: 40 }, { hasTag: "entity_leader" }],
        },
        minTurns: 3,
        conversion: { base: 1.1, capital: 1, money: 0.9 },
        tags: ["promessa_categoria"],
      },
      cargo_confianca: {
        label: "Cargo de confiança",
        leadsTo: "vereador",
        requires: { any: [{ hasTag: "invite_post" }, { attr: "capital", op: ">=", value: 30 }] },
        minTurns: 3,
        conversion: { base: 0.9, capital: 1.2, money: 1 },
        tags: ["assessor"],
      },
      sucessao: {
        label: "Sucessão ou apadrinhamento",
        leadsTo: "deputado",
        requires: {
          all: [{ hasTag: "strong_ally" }, { attr: "integrity", op: ">=", value: 40 }],
        },
        minTurns: 3,
        conversion: { base: 0.9, capital: 1.1, money: 1 },
      },
      chamado_crise: {
        label: "Chamado em crise",
        leadsTo: "vereador",
        requires: { hasTag: "crisis_call" },
        minTurns: 2,
        conversion: { base: 1.1, capital: 0.9, money: 0.8 },
      },
    },
  },
  origins: {
    ori_sindicalista: {
      label: "Sindicalista",
      availableFrom: 1988,
      ageRange: [25, 40],
      attributeMods: { articulation: 8, oratory: 2, electoralStrategy: -4 },
      startingResources: { base: 25, money: 5, media: 5 },
      civilPrestige: 30,
      civilNetwork: 35,
      conversion: { toBase: 1.2, toCapital: 0.9, toMoney: 0.6 },
      naturalDoors: ["lideranca_entidade", "candidatura_direta"],
    },
    ori_professor: {
      label: "Professor",
      availableFrom: 1988,
      ageRange: [25, 40],
      attributeMods: { oratory: 6, integrity: 4, electoralStrategy: -6 },
      startingResources: { base: 15, money: 5, media: 8 },
      civilPrestige: 35,
      civilNetwork: 25,
      conversion: { toBase: 1, toCapital: 0.9, toMoney: 0.6 },
      naturalDoors: ["lideranca_entidade", "chamado_crise"],
    },
    ori_trabalhador_rural: {
      label: "Trabalhador rural",
      availableFrom: 1988,
      ageRange: [20, 40],
      attributeMods: { resilience: 6, articulation: 4, pragmatism: -2 },
      startingResources: { base: 20, money: 3, media: 3 },
      civilPrestige: 25,
      civilNetwork: 30,
      conversion: { toBase: 1.1, toCapital: 0.8, toMoney: 0.6 },
      naturalDoors: ["lideranca_entidade", "sucessao"],
    },
    ori_empresario: {
      label: "Empresário",
      availableFrom: 1988,
      ageRange: [28, 45],
      attributeMods: { management: 6, pragmatism: 6, integrity: -4 },
      startingResources: { money: 40, capital: 15, base: 5, media: 10 },
      civilPrestige: 30,
      civilNetwork: 35,
      conversion: { toBase: 0.6, toCapital: 1, toMoney: 1.2 },
      naturalDoors: ["candidatura_direta", "cargo_confianca"],
    },
    ori_estudante: {
      label: "Estudante em movimento estudantil",
      availableFrom: 1988,
      ageRange: [18, 24],
      attributeMods: { oratory: 8, ambition: 4, management: -6 },
      startingResources: { base: 8, money: 3, media: 8 },
      civilPrestige: 20,
      civilNetwork: 30,
      conversion: { toBase: 1, toCapital: 0.7, toMoney: 0.6 },
      naturalDoors: ["cargo_confianca", "chamado_crise"],
    },
    ori_lider_comunitario: {
      label: "Líder comunitário",
      availableFrom: 1988,
      ageRange: [22, 45],
      attributeMods: { resilience: 4, articulation: 4, management: -2 },
      startingResources: { base: 22, money: 4, media: 4 },
      civilPrestige: 30,
      civilNetwork: 30,
      conversion: { toBase: 1.2, toCapital: 0.8, toMoney: 0.6 },
      naturalDoors: ["candidatura_direta", "chamado_crise"],
    },
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
