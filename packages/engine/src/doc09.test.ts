import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { defaultConfig as c } from "./config.js";

// Keeps the default configuration in sync with the numbers written in docs/09-parametros-v0.md.
const doc = readFileSync(new URL("../../../docs/09-parametros-v0.md", import.meta.url), "utf8");

const num = (s: string) => Number(s.replace(",", "."));

describe("config matches doc 09", () => {
  it("era and cooldown", () => {
    expect(doc).toContain("Início em 1988. A era termina em 2026");
    expect(c.startYear).toBe(1988);
    expect(c.eraEndYear).toBe(2026);
    expect(doc).toContain("Cooldown de 3 turnos");
    expect(c.eventCooldownTurns).toBe(3);
    expect(doc).toContain("base 30 em cada");
    expect(c.defaultAttribute).toBe(30);
  });

  it("election formula weights, scandal penalty and noise", () => {
    const formula = doc.match(/score = ([\s\S]*?)```/)?.[1] ?? "";
    const w = (name: string) =>
      num(formula.match(new RegExp(String.raw`(\d,\d+)·` + name))?.[1] ?? "NaN");
    expect(w("base")).toBe(c.election.weights.base);
    expect(w("mídia")).toBe(c.election.weights.media);
    expect(w("dinheiro")).toBe(c.election.weights.money);
    expect(w("estratégia")).toBe(c.election.weights.electoralStrategy);
    expect(w("humor_do_mundo")).toBe(c.election.weights.mood);
    expect(w("capital")).toBe(c.election.weights.capital);
    expect(formula).toContain(`− ${c.election.scandalPenalty}·escândalos_ativos`);
    expect(formula).toContain(`σ=${c.election.noiseSigma}`);
    expect(doc).toContain("±10 de variação");
    expect(c.election.adversaryVariation).toBe(10);
  });

  it("adversary strength per office", () => {
    const line = doc.match(/força média: ([^\n]*?),/)?.[1] ?? "";
    const strength = Object.fromEntries(
      [...line.matchAll(/([\p{L} ]+?) (\d+)(?: ·|$)/gu)].map((m) => [m[1]!.trim(), Number(m[2])]),
    );
    expect(strength).toEqual({
      vereador: c.offices.vereador!.adversaryStrength,
      prefeito: c.offices.prefeito!.adversaryStrength,
      deputado: c.offices.deputado!.adversaryStrength,
      "senador e governador": c.offices.senador!.adversaryStrength,
      presidente: c.offices.presidente!.adversaryStrength,
    });
    expect(c.offices.governador!.adversaryStrength).toBe(c.offices.senador!.adversaryStrength);
  });

  it("minimum ages and mandate length", () => {
    const line = doc.match(/Idades mínimas: ([^\n]*)/)?.[1] ?? "";
    expect(line).toContain(`${c.offices.vereador!.minAge} vereador`);
    expect(line).toContain(`${c.offices.prefeito!.minAge} prefeito e deputado`);
    expect(c.offices.deputado!.minAge).toBe(c.offices.prefeito!.minAge);
    expect(line).toContain(`${c.offices.governador!.minAge} governador`);
    expect(line).toContain(`${c.offices.senador!.minAge} senador e presidente`);
    expect(c.offices.presidente!.minAge).toBe(c.offices.senador!.minAge);
    expect(doc).toContain("Mandato de 4 anos (senador: 8)");
    expect(c.offices.senador!.termYears).toBe(8);
    expect(c.offices.prefeito!.termYears).toBe(4);
    expect(doc).toContain("a partir de 1997");
    expect(c.career.reelectionFromYear).toBe(1997);
  });

  it("evaluation weights, legacy tiers and archetypes", () => {
    const line = doc.match(/Pesos: ([^\n]*)/)?.[1] ?? "";
    const pct = (name: string) =>
      num(line.match(new RegExp(name + String.raw` (\d+)%`))?.[1] ?? "NaN") / 100;
    const w = c.evaluation.weights;
    expect(pct("posição")).toBe(w.position);
    expect(pct("desempenho")).toBe(w.performance);
    expect(pct("reputação")).toBe(w.reputation);
    expect(pct("consistência")).toBe(w.consistency);
    expect(pct("legado em eventos")).toBe(w.legacy);
    expect(pct("fidelidade à origem")).toBe(w.fidelity);

    const tiers = doc.match(/5 níveis de legado: ([^\n]*)/)?.[1] ?? "";
    expect(tiers.replace(/.$/, "").split(" · ")).toEqual(c.texts.tiers);

    const archetypes = doc.match(/10 arquétipos: ([^.]*)\./)?.[1] ?? "";
    expect(archetypes.split(", ")).toEqual(Object.values(c.texts.archetypes).map((a) => a.label));
  });

  it("special endings", () => {
    const line = doc.match(/Finais especiais: ([^\n]*)/)?.[1] ?? "";
    expect(line.replace(/\.$/, "").split(", ")).toEqual(
      Object.values(c.texts.endings).map((e) => e.label),
    );
  });
});
