import { describe, expect, it } from "vitest";
import { checkCandidacy, stand } from "./career.js";
import {
  availableDoors,
  checkDoor,
  closeCivilYear,
  conversionGains,
  declineLastChance,
  firstWindow,
  joinParty,
  openDoor,
  refreshDoors,
} from "./civil.js";
import { defaultConfig } from "./config.js";
import { createCharacter } from "./origins.js";
import { endTurn, startTurn } from "./turn.js";
import type { GameState } from "./types.js";

const emptyCatalog = { events: [] };

function civil(over: { originId?: string; age?: number; year?: number } = {}): GameState {
  return createCharacter("s", {
    originId: over.originId ?? "ori_sindicalista",
    party: "pdp",
    age: over.age ?? 30,
    year: over.year ?? 1988,
  });
}

function withPlayer(s: GameState, patch: Partial<GameState["player"]>): GameState {
  return { ...s, player: { ...s.player, ...patch } };
}

function withCivil(s: GameState, patch: Partial<GameState["player"]["civil"]>): GameState {
  return withPlayer(s, { civil: { ...s.player.civil, ...patch } });
}

function withTags(s: GameState, tags: Record<string, number>): GameState {
  return withPlayer(s, { tags: { ...s.player.tags, ...tags } });
}

/** A civil character ready to walk through doors: affiliated, past the minimum turns. */
function ready(over: Parameters<typeof civil>[0] = {}): GameState {
  return withCivil(civil(over), { turns: 3, joinedPartyYear: (over.year ?? 1988) - 1 });
}

describe("civil turns in the pipeline", () => {
  it("counts civil years and keeps the phase civil", () => {
    let s = civil();
    for (let i = 1; i <= 3; i++) {
      s = endTurn(startTurn(s, emptyCatalog));
      expect(s.player.civil.turns).toBe(i);
    }
    expect(s.player.phase).toBe("civil");
    expect(s.player.year).toBe(1991);
  });

  it("offers a last chance in the 8th year, and ends the run if ignored", () => {
    let s = civil();
    for (let i = 0; i < 7; i++) s = endTurn(startTurn(s, emptyCatalog));
    expect(s.player.civil.lastChance).toBe(true);
    expect(s.ended).toBeNull();
    s = endTurn(startTurn(s, emptyCatalog));
    expect(s.ended).toBe("vida_civil");
    expect(() => startTurn(s, emptyCatalog)).toThrow(/over/);
  });

  it("declining the last chance ends the run in civil life", () => {
    let s = civil();
    expect(() => declineLastChance(s)).toThrow(/no last chance/);
    for (let i = 0; i < 7; i++) s = endTurn(startTurn(s, emptyCatalog));
    expect(declineLastChance(s).ended).toBe("vida_civil");
  });

  it("the last chance waives the requirements of the direct candidacy only", () => {
    let s = withCivil(civil({ year: 1988 }), { joinedPartyYear: 1988, prestige: 0, network: 0 });
    for (let i = 0; i < 7; i++) s = endTurn(startTurn(s, emptyCatalog));
    expect(checkDoor(s, "candidatura_direta").ok).toBe(true);
    expect(checkDoor(s, "lideranca_entidade").ok).toBe(false);
  });

  it("refreshes the open doors as the character grows", () => {
    let s = withCivil(civil(), { turns: 3, joinedPartyYear: 1987, prestige: 20 });
    expect(refreshDoors(s).player.civil.entryDoorsOpen).toEqual([]);
    s = withCivil(s, { prestige: 60 });
    expect(refreshDoors(s).player.civil.entryDoorsOpen).toEqual(["candidatura_direta"]);
    expect(closeCivilYear(s).player.civil.entryDoorsOpen).toEqual(["candidatura_direta"]);
  });
});

describe("entry rules", () => {
  it("needs the minimum civil turns (3, or 2 for the crisis call)", () => {
    const early = withTags(withCivil(ready(), { turns: 2, prestige: 90 }), { crisis_call: 1 });
    expect(checkDoor(early, "candidatura_direta")).toEqual({ ok: false, reason: "too soon" });
    expect(checkDoor(early, "chamado_crise").ok).toBe(true);
    expect(checkDoor(withCivil(early, { turns: 1 }), "chamado_crise")).toEqual({
      ok: false,
      reason: "too soon",
    });
  });

  it("needs affiliation", () => {
    const s = withCivil(ready(), { joinedPartyYear: null, prestige: 90 });
    expect(checkDoor(s, "candidatura_direta")).toEqual({ ok: false, reason: "not affiliated" });
    const joined = joinParty(s);
    expect(joined.player.civil.joinedPartyYear).toBe(1988);
    expect(joinParty(joined).player.civil.joinedPartyYear).toBe(1988);
  });

  it("applies the electoral deadline: affiliation must precede the election year", () => {
    expect(firstWindow("vereador", 1992, 1991)).toBe(1992);
    expect(firstWindow("vereador", 1992, 1992)).toBe(1996);
    expect(firstWindow("deputado", 1991, 1990)).toBe(1994);
    const s = withCivil(ready({ year: 1992 }), { joinedPartyYear: 1992, prestige: 60 });
    const opened = openDoor(s, "candidatura_direta");
    expect(opened.player.civil.windowYear).toBe(1996);
  });

  it("applies the minimum age of the target office at the window", () => {
    const young = withCivil(ready({ originId: "ori_estudante", age: 18, year: 1988 }), {
      prestige: 60,
    });
    expect(checkDoor(young, "candidatura_direta")).toMatchObject({ ok: true, office: "vereador" });
    const rich = withCivil(young, { prestige: 90 });
    // deputado window is 1990, age 20 < 21
    expect(checkDoor(rich, "candidatura_direta")).toEqual({ ok: false, reason: "too young" });
  });
});

describe("the five doors", () => {
  it("candidatura direta: prestige >= 50, deputado from 85", () => {
    const base = ready();
    expect(checkDoor(withCivil(base, { prestige: 49 }), "candidatura_direta").ok).toBe(false);
    expect(checkDoor(withCivil(base, { prestige: 50 }), "candidatura_direta")).toMatchObject({
      ok: true,
      office: "vereador",
    });
    expect(checkDoor(withCivil(base, { prestige: 85 }), "candidatura_direta")).toMatchObject({
      ok: true,
      office: "deputado",
    });
  });

  it("lideranca de entidade: network and an entity post", () => {
    const base = withCivil(ready(), { network: 50 });
    expect(checkDoor(base, "lideranca_entidade").ok).toBe(false);
    expect(checkDoor(withTags(base, { entity_leader: 1 }), "lideranca_entidade").ok).toBe(true);
    const lowNetwork = withTags(withCivil(base, { network: 30 }), { entity_leader: 1 });
    expect(checkDoor(lowNetwork, "lideranca_entidade").ok).toBe(false);
  });

  it("cargo de confianca: an invitation or capital", () => {
    const base = ready();
    expect(checkDoor(base, "cargo_confianca").ok).toBe(false);
    expect(checkDoor(withTags(base, { invite_post: 1 }), "cargo_confianca").ok).toBe(true);
    const capital = withPlayer(base, { resources: { ...base.player.resources, capital: 30 } });
    expect(checkDoor(capital, "cargo_confianca").ok).toBe(true);
  });

  it("sucessao: a strong ally and good reputation", () => {
    const trusted = withTags(ready(), { strong_ally: 1 });
    const base = withPlayer(trusted, {
      attributes: { ...trusted.player.attributes, integrity: 50 },
    });
    expect(checkDoor(base, "sucessao")).toMatchObject({ ok: true, office: "deputado" });
    const bad = withPlayer(base, { attributes: { ...base.player.attributes, integrity: 20 } });
    expect(checkDoor(bad, "sucessao").ok).toBe(false);
    expect(checkDoor(ready(), "sucessao").ok).toBe(false);
  });

  it("chamado em crise: needs the crisis event", () => {
    expect(checkDoor(ready(), "chamado_crise").ok).toBe(false);
    expect(checkDoor(withTags(ready(), { crisis_call: 1 }), "chamado_crise").ok).toBe(true);
  });

  it("lists exactly the doors that are open", () => {
    const s = withTags(withCivil(ready(), { prestige: 60, network: 50 }), {
      entity_leader: 1,
      crisis_call: 1,
    });
    expect(availableDoors(s).sort()).toEqual([
      "candidatura_direta",
      "chamado_crise",
      "lideranca_entidade",
    ]);
  });

  it("rejects unknown doors and doors taken twice", () => {
    expect(() => checkDoor(ready(), "janela")).toThrow(/unknown door/);
    const inside = openDoor(withCivil(ready(), { prestige: 60 }), "candidatura_direta");
    expect(checkDoor(inside, "candidatura_direta")).toEqual({
      ok: false,
      reason: "not in civil life",
    });
    expect(() => openDoor(ready(), "chamado_crise")).toThrow(/cannot open/);
  });
});

describe("conversion of prestige and network", () => {
  it("base = prestige x toBase, capital = network x toCapital (origin and door multipliers)", () => {
    const s = withCivil(ready({ originId: "ori_empresario", age: 35 }), {
      prestige: 60,
      network: 50,
    });
    // empresario: toBase 0.6, toCapital 1.0, toMoney 1.2; direct candidacy is a natural door (1.15)
    expect(conversionGains(s, "candidatura_direta")).toEqual({
      base: Math.round(60 * 0.6 * 1.15),
      capital: Math.round(50 * 1.0 * 1.15),
      money: Math.round(50 * 1.2 * 0.3 * 1.15),
    });
  });

  it("origins convert differently: the unionist gains more base than the entrepreneur", () => {
    const stats = { prestige: 60, network: 50 };
    const union = conversionGains(withCivil(ready(), stats), "lideranca_entidade");
    const biz = conversionGains(
      withCivil(ready({ originId: "ori_empresario", age: 35 }), stats),
      "lideranca_entidade",
    );
    expect(union.base).toBeGreaterThan(biz.base);
    expect(biz.money).toBeGreaterThan(union.money);
  });

  it("natural doors convert better than the others", () => {
    const s = withCivil(ready(), { prestige: 60, network: 50 });
    expect(conversionGains(s, "candidatura_direta").base).toBeGreaterThan(
      conversionGains(s, "cargo_confianca").base,
    );
  });

  it("opening a door moves the character into politics with the converted resources", () => {
    const s = withCivil(ready(), { prestige: 60, network: 50 });
    const gains = conversionGains(s, "candidatura_direta");
    const next = openDoor(s, "candidatura_direta");
    expect(next.player.phase).toBe("politica");
    expect(next.player.resources.base).toBe(Math.min(100, s.player.resources.base + gains.base));
    expect(next.player.resources.capital).toBe(
      Math.min(100, s.player.resources.capital + gains.capital),
    );
    expect(next.player.civil).toMatchObject({
      entryDoor: "candidatura_direta",
      plannedOffice: "vereador",
      windowYear: 1988,
    });
    expect(next.player.tags.door_candidatura_direta).toBe(1);
  });

  it("the entity door records the commitment to the category", () => {
    const s = withTags(withCivil(ready(), { network: 50 }), { entity_leader: 1 });
    expect(openDoor(s, "lideranca_entidade").player.tags.promessa_categoria).toBe(1);
  });

  it("never exceeds 100", () => {
    const s = withCivil(ready(), { prestige: 100, network: 100 });
    const next = openDoor(s, "candidatura_direta");
    for (const v of Object.values(next.player.resources)) expect(v).toBeLessThanOrEqual(100);
  });
});

describe("first candidacy after the door", () => {
  const opened = () => openDoor(withCivil(ready(), { prestige: 90 }), "candidatura_direta");

  it("only converts in the election window and for the office of the door", () => {
    const s = opened();
    expect(s.player.civil.plannedOffice).toBe("deputado");
    expect(s.player.civil.windowYear).toBe(1990);
    const at = (year: number) => withPlayer(s, { year, age: 30 + year - 1988 });
    expect(checkCandidacy(at(1989), "deputado")).toMatchObject({ ok: false });
    expect(checkCandidacy(at(1990), "deputado").ok).toBe(true);
    expect(checkCandidacy(at(1990), "vereador")).toMatchObject({ ok: false });
    expect(checkCandidacy(at(1994), "deputado").ok).toBe(true);
  });

  it("requires affiliation before the election year", () => {
    const s = withCivil(opened(), { joinedPartyYear: 1990 });
    const at1990 = withPlayer(s, { year: 1990, age: 32 });
    expect(checkCandidacy(at1990, "deputado")).toEqual({
      ok: false,
      reason: "not affiliated in time",
    });
  });

  it("a win in the window starts the career", () => {
    const strong = openDoor(
      withPlayer(withCivil(ready(), { prestige: 100, network: 100 }), {
        resources: { capital: 100, money: 100, base: 100, media: 100 },
      }),
      "candidatura_direta",
    );
    const res = stand(withPlayer(strong, { year: 1990, age: 32 }), "deputado");
    expect(res.result.won).toBe(true);
    expect(res.state.player.office).toBe("deputado");
  });
});

describe("config", () => {
  it("has the five doors of doc 07", () => {
    expect(Object.keys(defaultConfig.civil.doors).sort()).toEqual([
      "candidatura_direta",
      "cargo_confianca",
      "chamado_crise",
      "lideranca_entidade",
      "sucessao",
    ]);
    expect(defaultConfig.civil.maxTurns).toBe(8);
  });
});
