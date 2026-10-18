import { describe, expect, it } from "vitest";
import { defaultConfig } from "./config.js";
import { availableOrigins, createCharacter, isOriginAvailable } from "./origins.js";

const base = { originId: "ori_professor", party: "pdp", age: 30 };

describe("origin availability by era", () => {
  it("honours availableFrom and availableUntil", () => {
    const cfg = {
      ...defaultConfig,
      origins: {
        ...defaultConfig.origins,
        ori_criador: {
          ...defaultConfig.origins.ori_professor!,
          availableFrom: 2010,
        },
        ori_extinta: {
          ...defaultConfig.origins.ori_professor!,
          availableUntil: 1995,
        },
      },
    };
    expect(isOriginAvailable("ori_criador", 2009, cfg)).toBe(false);
    expect(isOriginAvailable("ori_criador", 2010, cfg)).toBe(true);
    expect(isOriginAvailable("ori_extinta", 1995, cfg)).toBe(true);
    expect(isOriginAvailable("ori_extinta", 1996, cfg)).toBe(false);
    expect(isOriginAvailable("ori_nao_existe", 1990, cfg)).toBe(false);
    expect(availableOrigins(1988, cfg)).not.toContain("ori_criador");
    expect(availableOrigins(2012, cfg)).toContain("ori_criador");
    expect(availableOrigins(1988)).toHaveLength(6);
  });

  it("refuses to create a character from an unavailable origin", () => {
    const cfg = {
      ...defaultConfig,
      origins: {
        ori_professor: { ...defaultConfig.origins.ori_professor!, availableFrom: 2000 },
      },
    };
    expect(() => createCharacter("s", { ...base, year: 1990 }, cfg)).toThrow(/not available/);
    expect(createCharacter("s", { ...base, year: 2000 }, cfg).player.year).toBe(2000);
  });
});

describe("defaults follow doc 09", () => {
  it("origin conversion multipliers stay in 0.6-1.2 and mods within 10", () => {
    for (const o of Object.values(defaultConfig.origins)) {
      for (const m of Object.values(o.conversion)) {
        expect(m).toBeGreaterThanOrEqual(0.6);
        expect(m).toBeLessThanOrEqual(1.2);
      }
      for (const m of Object.values(o.attributeMods)) expect(Math.abs(m)).toBeLessThanOrEqual(10);
    }
  });

  it("age ranges match the table", () => {
    const r = (id: string) => defaultConfig.origins[id]!.ageRange;
    expect(r("ori_sindicalista")).toEqual([25, 40]);
    expect(r("ori_professor")).toEqual([25, 40]);
    expect(r("ori_trabalhador_rural")).toEqual([20, 40]);
    expect(r("ori_empresario")).toEqual([28, 45]);
    expect(r("ori_estudante")).toEqual([18, 24]);
    expect(r("ori_lider_comunitario")).toEqual([22, 45]);
  });
});

describe("createCharacter", () => {
  it("starts in civil life from base 30 plus origin modifiers and free points", () => {
    const s = createCharacter("s", { ...base, points: { management: 20, ambition: 20 } });
    expect(s.player.phase).toBe("civil");
    expect(s.player.attributes.management).toBe(50);
    expect(s.player.attributes.ambition).toBe(50);
    expect(s.player.attributes.oratory).toBe(36); // professor +6
    expect(s.player.attributes.electoralStrategy).toBe(24); // professor -6
    expect(s.player.civil.prestige).toBe(35);
    expect(s.player.resources.base).toBe(15);
  });

  it("enforces the free point budget, the cap of 80 and the age range", () => {
    expect(() =>
      createCharacter("s", { ...base, points: { management: 25, ambition: 20 } }),
    ).toThrow(/too many/);
    const loose = {
      ...defaultConfig,
      civil: {
        ...defaultConfig.civil,
        creation: { ...defaultConfig.civil.creation, freePoints: 100 },
      },
    };
    expect(() => createCharacter("s", { ...base, points: { management: 51 } }, loose)).toThrow(
      /above 80/,
    );
    expect(
      createCharacter("s", { ...base, points: { management: 40 } }).player.attributes.management,
    ).toBe(70);
    expect(() => createCharacter("s", { ...base, age: 24 })).toThrow(/age/);
    expect(() => createCharacter("s", { ...base, originId: "ori_x" })).toThrow(/unknown origin/);
  });

  it("is deterministic per seed", () => {
    expect(createCharacter("a", base)).toEqual(createCharacter("a", base));
    expect(createCharacter("a", base).rng).not.toBe(createCharacter("b", base).rng);
  });
});
