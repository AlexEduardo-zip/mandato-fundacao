import { describe, expect, it } from "vitest";
import { evaluateCondition } from "./conditions.js";
import { makeState } from "./test-utils.js";
import type { Condition } from "./types.js";

const state = (() => {
  const s = makeState({
    age: 40,
    year: 1994,
    office: "deputado",
    attributes: { oratory: 70 },
    resources: { capital: 25 },
    prestige: 60,
  });
  s.player.tags = { aliado_centrao: 2, processado: 0 };
  s.player.hidden.scandalRisk = 40;
  s.world.economy = 30;
  return s;
})();

const check = (c: Condition) => evaluateCondition(c, state);

describe("evaluateCondition", () => {
  it("compares attributes, resources, civil and hidden stats with every operator", () => {
    expect(check({ attr: "oratory", op: ">=", value: 70 })).toBe(true);
    expect(check({ attr: "oratory", op: ">=", value: 71 })).toBe(false);
    expect(check({ attr: "oratory", op: "<=", value: 70 })).toBe(true);
    expect(check({ attr: "oratory", op: "<=", value: 69 })).toBe(false);
    expect(check({ attr: "oratory", op: "==", value: 70 })).toBe(true);
    expect(check({ attr: "oratory", op: "==", value: 69 })).toBe(false);
    expect(check({ attr: "capital", op: ">=", value: 25 })).toBe(true);
    expect(check({ attr: "prestige", op: "==", value: 60 })).toBe(true);
    expect(check({ attr: "scandalRisk", op: "<=", value: 40 })).toBe(true);
  });

  it("rejects unknown stat ids", () => {
    expect(() => check({ attr: "charisma" as never, op: ">=", value: 1 })).toThrow(/unknown stat/);
  });

  it("checks tags with a default minimum of 1", () => {
    expect(check({ hasTag: "aliado_centrao" })).toBe(true);
    expect(check({ hasTag: "aliado_centrao", min: 3 })).toBe(false);
    expect(check({ hasTag: "processado" })).toBe(false);
    expect(check({ hasTag: "inexistente" })).toBe(false);
  });

  it("matches office as a single id or a list, never when there is none", () => {
    expect(check({ office: "deputado" })).toBe(true);
    expect(check({ office: ["senador", "deputado"] })).toBe(true);
    expect(check({ office: "senador" })).toBe(false);
    const civil = makeState({ office: null });
    expect(evaluateCondition({ office: ["senador"] }, civil)).toBe(false);
  });

  it("matches phase and origin", () => {
    expect(check({ phase: "politica" })).toBe(true);
    expect(check({ phase: "civil" })).toBe(false);
    expect(check({ origin: "ori_professor" })).toBe(true);
    expect(check({ origin: ["ori_sindicalista", "ori_professor"] })).toBe(true);
    expect(check({ origin: "ori_sindicalista" })).toBe(false);
  });

  it("compares age", () => {
    expect(check({ age: { op: ">=", value: 40 } })).toBe(true);
    expect(check({ age: { op: "<=", value: 39 } })).toBe(false);
  });

  it("treats yearBetween as inclusive", () => {
    expect(check({ yearBetween: [1994, 1998] })).toBe(true);
    expect(check({ yearBetween: [1990, 1994] })).toBe(true);
    expect(check({ yearBetween: [1995, 2000] })).toBe(false);
  });

  it("compares world variables", () => {
    expect(check({ world: "economy", op: "<=", value: 30 })).toBe(true);
    expect(check({ world: "economy", op: ">=", value: 31 })).toBe(false);
    expect(() => check({ world: "weather" as never, op: ">=", value: 1 })).toThrow(/world key/);
  });

  it("combines with all / any / not, including empty lists", () => {
    const yes: Condition = { phase: "politica" };
    const no: Condition = { phase: "civil" };
    expect(check({ all: [yes, yes] })).toBe(true);
    expect(check({ all: [yes, no] })).toBe(false);
    expect(check({ all: [] })).toBe(true);
    expect(check({ any: [no, yes] })).toBe(true);
    expect(check({ any: [no, no] })).toBe(false);
    expect(check({ any: [] })).toBe(false);
    expect(check({ not: no })).toBe(true);
    expect(check({ not: { all: [yes, no] } })).toBe(true);
    expect(check({ all: [yes, { any: [no, { not: no }] }] })).toBe(true);
  });

  it("throws on a malformed condition", () => {
    expect(() => check({ bogus: 1 } as never)).toThrow(/unknown condition/);
  });
});
