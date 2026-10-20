import { loadRawContent, toCatalog } from "@mandato/content";
import { describe, expect, it } from "vitest";
import { formatReport, simulateBatch, simulateRun } from "./simulate.js";

const catalog = toCatalog(loadRawContent().anchors);

describe("simulateRun", () => {
  it("is deterministic per seed", () => {
    expect(simulateRun("a", catalog)).toEqual(simulateRun("a", catalog));
  });

  it("always reaches an ending with a verdict", () => {
    for (let i = 0; i < 30; i++) {
      const run = simulateRun(`end-${i}`, catalog);
      expect(run.ended, run.seed).not.toBeNull();
      expect(run.verdict.total).toBeGreaterThanOrEqual(0);
      expect(run.verdict.total).toBeLessThanOrEqual(100);
    }
  });
});

describe("simulateBatch", () => {
  const report = simulateBatch(60, "batch", catalog);

  it("is deterministic", () => {
    expect(simulateBatch(60, "batch", catalog)).toEqual(report);
  });

  it("accounts for every run in each distribution", () => {
    const sum = (m: Record<string, number>) => Object.values(m).reduce((a, b) => a + b, 0);
    expect(report.runs).toBe(60);
    expect(sum(report.archetypes)).toBe(60);
    expect(sum(report.tiers)).toBe(60);
    expect(Object.values(report.reachedCongress).reduce((a, v) => a + v.runs, 0)).toBe(60);
  });

  it("lists events that never fired", () => {
    const withDead = {
      events: [
        ...catalog.events,
        {
          id: "ev_dead",
          kind: "career" as const,
          title: "x",
          text: "x",
          when: { yearBetween: [3000, 3001] as [number, number] },
        },
      ],
    };
    const r = simulateBatch(20, "dead", withDead);
    expect(r.neverFired).toContain("ev_dead");
    expect(r.neverFired).not.toContain("ev_anchor_1990_plano_bloqueio");
  });

  it("formats a readable report", () => {
    const text = formatReport(report);
    expect(text).toContain("Partidas simuladas: 60");
    expect(text).toContain("Arquétipos:");
    expect(text).toContain("Chegada ao Congresso por origem:");
    expect(text).toContain("Eventos que nunca dispararam");
  });
});
