import { describe, expect, it } from "vitest";
import { createGameState } from "./state.js";
import { ATTR_IDS, RESOURCE_IDS, STAT_IDS, WORLD_KEYS } from "./types.js";

const input = { seed: "s", originId: "ori_professor", party: "pdp", age: 30 };

describe("createGameState", () => {
  it("starts in civil life in the first year of the era with default stats", () => {
    const { player, world } = createGameState(input);
    expect(player.year).toBe(1988);
    expect(player.phase).toBe("civil");
    expect(player.office).toBeNull();
    for (const a of ATTR_IDS) expect(player.attributes[a]).toBe(30);
    for (const r of RESOURCE_IDS) expect(player.resources[r]).toBe(10);
    for (const k of WORLD_KEYS) expect(world[k]).toBe(50);
  });

  it("applies overrides without mutating shared config", () => {
    const a = createGameState({ ...input, attributes: { oratory: 70 }, resources: { money: 40 } });
    const b = createGameState(input);
    expect(a.player.attributes.oratory).toBe(70);
    expect(a.player.resources.money).toBe(40);
    expect(b.player.attributes.oratory).toBe(30);
    a.world.economy = 99;
    expect(createGameState(input).world.economy).toBe(50);
  });

  it("derives rng state from the seed", () => {
    expect(createGameState(input).rng).toBe(createGameState(input).rng);
    expect(createGameState({ ...input, seed: "t" }).rng).not.toBe(createGameState(input).rng);
  });

  it("exposes every stat id once", () => {
    expect(new Set(STAT_IDS).size).toBe(STAT_IDS.length);
    expect(STAT_IDS).toHaveLength(8 + 4 + 2 + 1);
  });
});
