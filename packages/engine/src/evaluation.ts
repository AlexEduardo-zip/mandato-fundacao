import { defaultConfig, type EngineConfig } from "./config.js";
import type { GameState, HistoryEntry, OfficeId } from "./types.js";

export const DIMENSIONS = [
  "position",
  "performance",
  "reputation",
  "consistency",
  "legacy",
  "fidelity",
] as const;
export type Dimension = (typeof DIMENSIONS)[number];

export const ARCHETYPES = [
  "reformador",
  "articulador",
  "populista",
  "tecnocrata",
  "sobrevivente",
  "estadista",
  "promessa_nao_cumprida",
  "fiel_origens",
  "traiu_base",
  "caido_desgraca",
] as const;
export type ArchetypeId = (typeof ARCHETYPES)[number];

export type EndingId = "vida_civil" | "cassado" | "aposentado_no_auge";

export interface Verdict {
  archetype: ArchetypeId;
  archetypeLabel: string;
  /** 1..5: Anônimo, Local, Regional, Nacional, Histórico. */
  legacyTier: number;
  legacyLabel: string;
  dimensions: Record<Dimension, number>;
  total: number;
  ending: EndingId | null;
  endingLabel: string | null;
  bestOffice: OfficeId | null;
  timeline: HistoryEntry[];
  summary: string;
}

const clamp = (v: number, config: EngineConfig) =>
  Math.min(config.statMax, Math.max(config.statMin, v));

function electionStats(state: GameState) {
  const races = state.player.history.filter((h) => h.kind === "election");
  return { contested: races.length, wins: races.filter((h) => h.won).length, races };
}

function bestOffice(state: GameState, config: EngineConfig): OfficeId | null {
  const held = [
    ...electionStats(state)
      .races.filter((r) => r.won && r.office)
      .map((r) => r.office as OfficeId),
    ...(state.player.office ? [state.player.office] : []),
  ].filter((o) => config.offices[o]);
  if (held.length === 0) return null;
  return held.reduce((a, b) => (config.offices[b]!.rank > config.offices[a]!.rank ? b : a));
}

function dominantStyle(state: GameState, config: EngineConfig) {
  const entries = Object.keys(config.evaluation.styleTags)
    .map((tag) => [tag, state.player.tags[tag] ?? 0] as const)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const total = entries.reduce((acc, [, n]) => acc + n, 0);
  const top = entries[0];
  return top ? { tag: top[0], share: (top[1] / total) * 100 } : null;
}

export function computeDimensions(
  state: GameState,
  config: EngineConfig = defaultConfig,
): Record<Dimension, number> {
  const ev = config.evaluation;
  const { player } = state;
  const { contested, wins } = electionStats(state);

  const rank = Math.min(player.career.highestRank, ev.positionByRank.length - 1);
  const position = ev.positionByRank[rank] ?? 0;

  const winRate = contested === 0 ? 0 : wins / contested;
  const performance = clamp(
    winRate * ev.performance.winRate +
      Math.min(wins, ev.performance.maxTerms) * ev.performance.perTerm,
    config,
  );

  const rep = ev.reputation;
  const removed = player.tags[ev.tags.removed] ? rep.removedPenalty : 0;
  const reputation = clamp(
    rep.integrity * player.attributes.integrity +
      rep.base * player.resources.base +
      rep.media * player.resources.media +
      rep.cleanliness * (config.statMax - player.hidden.scandalRisk) -
      removed,
    config,
  );

  const style = dominantStyle(state, config);
  const consistency = style ? style.share : ev.neutralScore;

  const legacy = clamp(
    ev.neutralScore +
      Object.entries(ev.legacyTagWeights).reduce(
        (acc, [tag, w]) => acc + w * (player.tags[tag] ?? 0),
        0,
      ),
    config,
  );

  const fid = ev.fidelity;
  const fidelity = clamp(
    ev.neutralScore +
      fid.step * ((player.tags[fid.loyalTag] ?? 0) - (player.tags[fid.betrayalTag] ?? 0)),
    config,
  );

  return { position, performance, reputation, consistency, legacy, fidelity };
}

export function legacyTierIndex(total: number, config: EngineConfig = defaultConfig): number {
  let tier = 0;
  config.evaluation.tierMinimums.forEach((min, i) => {
    if (total >= min) tier = i;
  });
  return tier;
}

/** First matching rule wins; the order encodes which dimension dominates. */
export function chooseArchetype(
  state: GameState,
  dimensions: Record<Dimension, number>,
  tierIndex: number,
  config: EngineConfig = defaultConfig,
): ArchetypeId {
  const ev = config.evaluation;
  const a = ev.archetype;
  const { player } = state;

  if (
    player.tags[ev.tags.removed] ||
    (dimensions.reputation < a.fallenReputation && player.career.highestRank >= a.fallenMinRank)
  ) {
    return "caido_desgraca";
  }
  if (tierIndex >= a.statesmanTier && dimensions.reputation >= a.statesmanReputation) {
    return "estadista";
  }
  if (dimensions.fidelity <= a.betrayedFidelity) return "traiu_base";
  if (dimensions.fidelity >= a.loyalFidelity) return "fiel_origens";
  if (
    dimensions.performance < a.unfulfilledPerformance &&
    player.attributes.ambition >= a.unfulfilledAmbition
  ) {
    return "promessa_nao_cumprida";
  }
  const style = dominantStyle(state, config);
  if (style && style.share >= a.styleConsistency) {
    return ev.styleTags[style.tag] as ArchetypeId;
  }
  return "sobrevivente";
}

function chooseEnding(state: GameState, total: number, config: EngineConfig): EndingId | null {
  const { player } = state;
  if (player.tags[config.evaluation.tags.removed]) return "cassado";
  if (player.phase === "civil") return "vida_civil";
  if (player.tags[config.evaluation.tags.retired] && total >= config.evaluation.peakTotal) {
    return "aposentado_no_auge";
  }
  return null;
}

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

export function evaluate(state: GameState, config: EngineConfig = defaultConfig): Verdict {
  const dimensions = computeDimensions(state, config);
  const w = config.evaluation.weights;
  const total = Math.round(DIMENSIONS.reduce((acc, d) => acc + w[d] * dimensions[d], 0) * 10) / 10;
  const tierIndex = legacyTierIndex(total, config);
  const archetype = chooseArchetype(state, dimensions, tierIndex, config);
  const ending = chooseEnding(state, total, config);
  const office = bestOffice(state, config);

  const texts = config.texts;
  const archetypeLabel = texts.archetypes[archetype]?.label ?? archetype;
  const legacyLabel = texts.tiers[tierIndex] ?? String(tierIndex + 1);
  const endingText = ending ? texts.endings[ending] : undefined;
  const summary = [
    fill(texts.verdictSummary, {
      archetype: archetypeLabel,
      office: office ? (config.offices[office]?.label ?? office) : "nenhum",
      tier: legacyLabel,
    }),
    endingText?.summary,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    archetype,
    archetypeLabel,
    legacyTier: tierIndex + 1,
    legacyLabel,
    dimensions,
    total,
    ending,
    endingLabel: endingText?.label ?? null,
    bestOffice: office,
    timeline: state.player.history.filter((h) => h.kind !== "choice"),
    summary,
  };
}
