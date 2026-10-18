import { defaultConfig, type EngineConfig, type OfficeConfig } from "./config.js";
import { Rng } from "./rng.js";
import type { GameState, HistoryEntry, OfficeId } from "./types.js";

export interface Adversary {
  strength: number;
  score: number;
  votePct: number;
}

export interface ElectionResult {
  year: number;
  office: OfficeId;
  won: boolean;
  score: number;
  /** Share of the vote of the player, in percent with one decimal. */
  votePct: number;
  adversaries: Adversary[];
}

export function officeConfig(office: OfficeId, config: EngineConfig = defaultConfig): OfficeConfig {
  const cfg = config.offices[office];
  if (!cfg) throw new Error(`unknown office: ${office}`);
  return cfg;
}

/** Rival strengths: the office mean plus a uniform variation. */
export function generateAdversaries(
  rng: Rng,
  office: OfficeId,
  config: EngineConfig = defaultConfig,
): number[] {
  const cfg = officeConfig(office, config);
  const spread = config.election.adversaryVariation;
  return Array.from(
    { length: cfg.adversaries },
    () => cfg.adversaryStrength + rng.int(-spread, spread),
  );
}

/** Deterministic part of the score (doc 09), before the noise. */
export function baseScore(state: GameState, config: EngineConfig = defaultConfig): number {
  const { weights, scandalPenalty, scandalTag, polarizationRejection } = config.election;
  const { resources, attributes, tags } = state.player;
  const rejection =
    Math.max(0, state.world.polarization - polarizationRejection.threshold) *
    polarizationRejection.coef;
  return (
    weights.base * resources.base +
    weights.media * resources.media +
    weights.money * resources.money +
    weights.electoralStrategy * attributes.electoralStrategy +
    weights.mood * state.world.mood +
    weights.capital * resources.capital -
    scandalPenalty * (tags[scandalTag] ?? 0) -
    rejection
  );
}

function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil(q * sorted.length) - 1));
  return sorted[idx] as number;
}

/**
 * Simulates one race. Majoritarian offices go to the top score; proportional ones to whoever
 * finishes above a quantile of the rivals. Does not change the player's office.
 */
export function runElection(
  state: GameState,
  office: OfficeId,
  config: EngineConfig = defaultConfig,
): { state: GameState; result: ElectionResult } {
  const cfg = officeConfig(office, config);
  const rng = new Rng(state.rng);
  const sigma = config.election.noiseSigma;
  const strengths = generateAdversaries(rng, office, config);
  const rivalScores = strengths.map((s) => s + rng.gaussian(0, sigma));
  const score = baseScore(state, config) + rng.gaussian(0, sigma);

  const won =
    cfg.percentile === undefined
      ? score > Math.max(...rivalScores)
      : score > quantile(rivalScores, cfg.percentile);

  const weightOf = (s: number) => Math.max(s, 1);
  const total = rivalScores.reduce((acc, s) => acc + weightOf(s), weightOf(score));
  const pct = (s: number) => Math.round((weightOf(s) / total) * 1000) / 10;

  const result: ElectionResult = {
    year: state.player.year,
    office,
    won,
    score: Math.round(score * 10) / 10,
    votePct: pct(score),
    adversaries: strengths.map((strength, i) => ({
      strength,
      score: Math.round((rivalScores[i] as number) * 10) / 10,
      votePct: pct(rivalScores[i] as number),
    })),
  };
  const entry: HistoryEntry = {
    year: result.year,
    kind: "election",
    office,
    won,
    votePct: result.votePct,
  };
  return {
    state: {
      ...state,
      rng: rng.state,
      player: { ...state.player, history: [...state.player.history, entry] },
    },
    result,
  };
}
