import { loadRawContent, toCatalog } from "@mandato/content";
import {
  ATTR_IDS,
  RESOURCE_IDS,
  WORLD_KEYS,
  defaultConfig,
  parseSave,
  replay,
  serializeSave,
  type GameState,
} from "@mandato/engine";
import { describe, expect, it } from "vitest";
import { simulateRun } from "./simulate.js";

const catalog = toCatalog(loadRawContent().anchors);
const RUNS = 120;

const inRange = (v: number) => Number.isFinite(v) && v >= 0 && v <= 100;

/** Throws a readable message when the state breaks a game invariant. */
function checkInvariants(state: GameState, startAgeGap: number): void {
  const { player, world } = state;
  for (const a of ATTR_IDS) expect(inRange(player.attributes[a]), `attribute ${a}`).toBe(true);
  for (const r of RESOURCE_IDS) expect(inRange(player.resources[r]), `resource ${r}`).toBe(true);
  for (const k of WORLD_KEYS) expect(inRange(world[k]), `world ${k}`).toBe(true);
  expect(inRange(player.civil.prestige), "prestige").toBe(true);
  expect(inRange(player.civil.network), "network").toBe(true);
  expect(inRange(player.hidden.scandalRisk), "scandalRisk").toBe(true);
  expect(Number.isInteger(player.year) && Number.isInteger(player.age)).toBe(true);
  expect(player.year - player.age, "age and year advance together").toBe(startAgeGap);
  expect(Number.isInteger(state.rng) && state.rng >= 0).toBe(true);

  if (player.office === null) {
    expect(player.career.termStartYear, "no office, no mandate").toBeNull();
    expect(player.career.parallel).toEqual([]);
  } else {
    const cfg = defaultConfig.offices[player.office];
    expect(cfg, `known office ${player.office}`).toBeDefined();
    expect(player.career.highestRank).toBeGreaterThanOrEqual(cfg?.rank ?? 0);
    expect(player.career.termStartYear).not.toBeNull();
    expect(player.phase).toBe("politica");
  }
  if (player.phase === "politica") expect(player.civil.entryDoor).not.toBeNull();
  if (player.phase === "civil") {
    expect(player.office).toBeNull();
    expect(player.career.highestRank).toBe(0);
  }
  for (const v of Object.values(player.tags)) expect(Number.isFinite(v)).toBe(true);
  for (const s of player.scheduled) expect(s.dueYear).toBeGreaterThanOrEqual(player.year);
  if (state.ended) expect(state.pending).toEqual([]);
}

describe(`property tests over ${RUNS} random runs`, () => {
  it("keeps every state valid after every decision", () => {
    for (let i = 0; i < RUNS; i++) {
      let gap: number | undefined;
      simulateRun(`prop-${i}`, catalog, {
        onState: (state) => {
          gap ??= state.player.year - state.player.age;
          checkInvariants(state, gap);
        },
      });
    }
  });

  it("is deterministic: the same seed gives the identical run", () => {
    for (let i = 0; i < 20; i++) {
      const a = simulateRun(`det-${i}`, catalog);
      const b = simulateRun(`det-${i}`, catalog);
      expect(b.state).toEqual(a.state);
      expect(b.save).toEqual(a.save);
    }
  });

  it("replays from the save to the same final state, through JSON", () => {
    for (let i = 0; i < 40; i++) {
      const run = simulateRun(`rep-${i}`, catalog);
      const loaded = parseSave(serializeSave(run.save));
      expect(replay(loaded, catalog, "sim").state, run.seed).toEqual(run.state);
    }
  });

  it("every run ends within the era limits and has a coherent verdict", () => {
    for (let i = 0; i < RUNS; i++) {
      const run = simulateRun(`end-${i}`, catalog);
      expect(run.ended, run.seed).not.toBeNull();
      expect(run.state.player.year).toBeLessThanOrEqual(defaultConfig.eraEndYear + 1);
      expect(run.state.player.age).toBeLessThanOrEqual(defaultConfig.lifeEnd.retireForcedAge);
      const v = run.verdict;
      expect(v.legacyTier).toBeGreaterThanOrEqual(1);
      expect(v.legacyTier).toBeLessThanOrEqual(5);
      for (const d of Object.values(v.dimensions)) expect(inRange(d)).toBe(true);
      if (run.state.ended === "vida_civil") expect(v.ending).toBe("vida_civil");
      if (run.state.ended === "cassado") expect(v.ending).toBe("cassado");
    }
  });

  it("different seeds explore different runs", () => {
    const rngs = new Set(
      Array.from({ length: 30 }, (_, i) => simulateRun(`div-${i}`, catalog).state.rng),
    );
    expect(rngs.size).toBeGreaterThan(20);
  });
});
