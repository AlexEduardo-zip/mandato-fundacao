import { describe, expect, it } from "vitest";
import { expireMandate, stand } from "./career.js";
import { defaultConfig } from "./config.js";
import type { ElectionResult } from "./election.js";
import { electionHeadline, mandateEndHeadline, renderTemplate, yearSummary } from "./headlines.js";
import { makeEvent, makeState } from "./test-utils.js";
import type { Catalog } from "./types.js";

const result = (over: Partial<ElectionResult>): ElectionResult => ({
  year: 1992,
  office: "prefeito",
  won: true,
  score: 50,
  votePct: 30,
  adversaries: [],
  ...over,
});

describe("renderTemplate", () => {
  it("fills placeholders and blanks unknown ones", () => {
    expect(renderTemplate("{a} e {b} e {c}", { a: 1, b: "x" })).toBe("1 e x e ");
  });
});

describe("headline templates", () => {
  it("every situation has at least one template, with no real names", () => {
    for (const kind of ["election_win_big", "election_win", "election_loss", "mandate_end"]) {
      expect(defaultConfig.texts.headlines[kind]?.length, kind).toBeGreaterThan(0);
    }
  });

  it("picks the template by outcome and margin and fills the data", () => {
    const loss = electionHeadline(result({ won: false, votePct: 12.5 }), 1).text;
    expect(defaultConfig.texts.headlines.election_loss!.some((t) => t.includes("{pct}"))).toBe(
      true,
    );
    expect(loss).toContain("12.5");
    expect(loss).toContain("Prefeito");
    expect(electionHeadline(result({ votePct: 55 }), 1).text).toContain("55");
    expect(loss).not.toContain("{");
  });

  it("is deterministic and advances the rng", () => {
    const a = electionHeadline(result({}), 7);
    expect(electionHeadline(result({}), 7)).toEqual(a);
    expect(a.rng).not.toBe(7);
  });

  it("varies the wording across seeds", () => {
    const texts = new Set(
      Array.from({ length: 30 }, (_, i) => electionHeadline(result({ votePct: 60 }), i).text),
    );
    expect(texts.size).toBeGreaterThan(1);
  });

  it("writes the mandate end headline", () => {
    expect(mandateEndHeadline("senador", 1998, 3).text).toBe(
      "Mandato de Senador chega ao fim em 1998",
    );
  });

  it("falls back loudly when templates are missing", () => {
    const cfg = { ...defaultConfig, texts: { ...defaultConfig.texts, headlines: {} } };
    expect(() => electionHeadline(result({}), 1, cfg)).toThrow(/no headline/);
  });
});

describe("headlines in the career flow", () => {
  it("standing for office and losing a mandate leave headlines in the history", () => {
    const s = makeState({
      year: 1992,
      age: 40,
      resources: { base: 100, media: 100, money: 100, capital: 100 },
    });
    const won = stand(s, "prefeito").state;
    const heads = won.player.history.filter((h) => h.kind === "headline");
    expect(heads).toHaveLength(1);
    expect(heads[0]?.text).toContain("Prefeito");
    const lapsed = expireMandate({ ...won, player: { ...won.player, year: 1996 } });
    expect(lapsed.player.history.filter((h) => h.kind === "headline")).toHaveLength(2);
  });
});

describe("yearSummary", () => {
  const catalog: Catalog = {
    events: [
      makeEvent("ev_greve", { title: "Greve geral" }),
      makeEvent("ev_plano", { title: "Plano econômico", kind: "anchor" }),
    ],
  };

  it("summarises the year from history and templates", () => {
    const s = makeState({ year: 1992 });
    s.player.history = [
      { year: 1992, kind: "anchor", eventId: "ev_plano" },
      { year: 1992, kind: "event", eventId: "ev_greve" },
      { year: 1992, kind: "choice", eventId: "ev_greve", choiceId: "x", text: "Você negociou." },
      { year: 1992, kind: "election", office: "prefeito", won: true, votePct: 41.2 },
      { year: 1992, kind: "headline", text: "Manchete" },
      { year: 1991, kind: "event", eventId: "ev_greve" },
    ];
    const sum = yearSummary(s, catalog);
    expect(sum.lines).toEqual([
      "No país: Plano econômico.",
      "Aconteceu: Greve geral.",
      "Decisão: Você negociou.",
      "Eleição para Prefeito: vitória (41.2%).",
    ]);
    expect(sum.headlines).toEqual(["Manchete"]);
    expect(sum.text).toContain("Greve geral");
  });

  it("has a text for quiet years", () => {
    expect(yearSummary(makeState({ year: 1993 }), catalog).text).toBe(
      defaultConfig.texts.summary.empty,
    );
  });
});
