import { describe, expect, it } from "vitest";
import { defaultConfig } from "./config.js";
import {
  ARCHETYPES,
  chooseArchetype,
  computeDimensions,
  evaluate,
  legacyTierIndex,
  type ArchetypeId,
} from "./evaluation.js";
import { makeState } from "./test-utils.js";
import type { NewGameInput } from "./state.js";
import type { GameState, HistoryEntry } from "./types.js";

type Input = Partial<NewGameInput>;

function race(office: string, won: boolean, year = 1992): HistoryEntry {
  return { year, kind: "election", office, won, votePct: 40 };
}

function build(
  input: Input,
  opts: {
    tags?: Record<string, number>;
    races?: HistoryEntry[];
    rank?: number;
    scandal?: number;
  } = {},
): GameState {
  const s = makeState(input);
  return {
    ...s,
    player: {
      ...s.player,
      tags: opts.tags ?? {},
      history: opts.races ?? [],
      career: { ...s.player.career, highestRank: opts.rank ?? 0 },
      hidden: { ...s.player.hidden, scandalRisk: opts.scandal ?? 0 },
    },
  };
}

const sample: Record<ArchetypeId, GameState> = {
  caido_desgraca: build({}, { tags: { cassado: 1 }, rank: 3 }),
  estadista: build(
    { attributes: { integrity: 90 }, resources: { base: 90, media: 80 } },
    {
      rank: 5,
      races: [race("prefeito", true), race("governador", true), race("presidente", true)],
      tags: { origin_loyal: 1, legacy_law: 3, style_reformer: 2 },
    },
  ),
  traiu_base: build({}, { tags: { origin_betrayal: 3 } }),
  fiel_origens: build({}, { tags: { origin_loyal: 3 } }),
  promessa_nao_cumprida: build(
    { attributes: { ambition: 90 } },
    { races: [race("vereador", false), race("deputado", false)], rank: 1 },
  ),
  reformador: build({}, { tags: { style_reformer: 4, style_populist: 1 } }),
  articulador: build({}, { tags: { style_pragmatic: 3 } }),
  populista: build({}, { tags: { style_populist: 3 } }),
  tecnocrata: build({}, { tags: { style_technocrat: 3 } }),
  sobrevivente: build({}, { tags: { style_reformer: 1, style_populist: 1, style_technocrat: 1 } }),
};

describe("archetypes", () => {
  it("defines the 10 archetypes of doc 09, each with texts", () => {
    expect(ARCHETYPES).toHaveLength(10);
    for (const a of ARCHETYPES) expect(defaultConfig.texts.archetypes[a]?.label).toBeTruthy();
  });

  it.each(ARCHETYPES)("%s is reachable by its dominant dimension", (archetype) => {
    expect(evaluate(sample[archetype]).archetype).toBe(archetype);
  });

  it("a collapsed reputation at a real office also means disgrace", () => {
    const s = build(
      { attributes: { integrity: 0 }, resources: { base: 0, media: 0 } },
      { scandal: 100, rank: 2 },
    );
    expect(evaluate(s).archetype).toBe("caido_desgraca");
  });

  it("is a pure function of the state", () => {
    expect(evaluate(sample.estadista)).toEqual(evaluate(sample.estadista));
  });
});

describe("dimensions", () => {
  it("scores position by the highest rank reached", () => {
    const at = (rank: number) => computeDimensions(build({}, { rank })).position;
    expect(at(0)).toBe(0);
    expect(at(5)).toBe(100);
    expect(at(3)).toBeGreaterThan(at(2));
  });

  it("scores performance from election results and terms", () => {
    const none = computeDimensions(build({})).performance;
    const lost = computeDimensions(build({}, { races: [race("vereador", false)] })).performance;
    const won = computeDimensions(build({}, { races: [race("vereador", true)] })).performance;
    expect(none).toBe(0);
    expect(lost).toBe(0);
    expect(won).toBe(68);
  });

  it("keeps every dimension within 0..100", () => {
    const extreme = build(
      { attributes: { integrity: 100 }, resources: { base: 100, media: 100 } },
      { tags: { legacy_law: 50, origin_loyal: 50, style_reformer: 5 }, rank: 5 },
    );
    for (const v of Object.values(computeDimensions(extreme))) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    }
    const awful = build(
      {},
      { tags: { legacy_scandal: 50, origin_betrayal: 50, cassado: 1 }, scandal: 100 },
    );
    for (const v of Object.values(computeDimensions(awful))) {
      expect(v).toBeGreaterThanOrEqual(0);
    }
  });

  it("weights add up to 100%", () => {
    const sum = Object.values(defaultConfig.evaluation.weights).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });
});

describe("legacy tiers", () => {
  it("has five tiers from Anônimo to Histórico", () => {
    expect(defaultConfig.texts.tiers).toEqual([
      "Anônimo",
      "Local",
      "Regional",
      "Nacional",
      "Histórico",
    ]);
    expect([0, 24, 25, 45, 65, 82, 100].map((t) => legacyTierIndex(t))).toEqual([
      0, 0, 1, 2, 3, 4, 4,
    ]);
  });

  it("a longer, more successful career reaches a higher tier", () => {
    const small = evaluate(sample.sobrevivente);
    const big = evaluate(sample.estadista);
    expect(big.legacyTier).toBeGreaterThan(small.legacyTier);
    expect(big.legacyLabel).toBe(defaultConfig.texts.tiers[big.legacyTier - 1]);
  });
});

describe("special endings", () => {
  it("stayed in civil life", () => {
    const v = evaluate(build({ phase: "civil" }));
    expect(v.ending).toBe("vida_civil");
    expect(v.endingLabel).toBe("Permaneceu na vida civil");
  });

  it("removed from office", () => {
    expect(evaluate(sample.caido_desgraca).ending).toBe("cassado");
  });

  it("retired at the peak only with a high enough total", () => {
    const peak = {
      ...sample.estadista,
      player: {
        ...sample.estadista.player,
        tags: { ...sample.estadista.player.tags, aposentado: 1 },
      },
    };
    expect(evaluate(peak).ending).toBe("aposentado_no_auge");
    const low = build({}, { tags: { aposentado: 1 } });
    expect(evaluate(low).ending).toBeNull();
  });
});

describe("verdict", () => {
  it("summarises the career and keeps the timeline without raw choices", () => {
    const s = build(
      {},
      {
        races: [
          race("prefeito", true),
          { year: 1993, kind: "choice", eventId: "x", choiceId: "y" },
        ],
        rank: 2,
      },
    );
    const v = evaluate(s);
    expect(v.bestOffice).toBe("prefeito");
    expect(v.summary).toContain("Prefeito");
    expect(v.summary).toContain(v.archetypeLabel);
    expect(v.timeline.every((h) => h.kind !== "choice")).toBe(true);
  });

  it("chooseArchetype honours custom thresholds from the config", () => {
    const s = build({}, { tags: { origin_loyal: 1 } });
    const dims = computeDimensions(s);
    expect(chooseArchetype(s, dims, 0)).not.toBe("fiel_origens");
    const cfg = {
      ...defaultConfig,
      evaluation: {
        ...defaultConfig.evaluation,
        archetype: { ...defaultConfig.evaluation.archetype, loyalFidelity: 60 },
      },
    };
    expect(chooseArchetype(s, dims, 0, cfg)).toBe("fiel_origens");
  });
});
