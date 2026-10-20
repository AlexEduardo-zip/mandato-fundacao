import { defaultConfig, startTurn, createGameState } from "@mandato/engine";
import { describe, expect, it } from "vitest";
import { loadRawContent } from "./load.js";
import { toCatalog, toOriginConfigs, validateContent, type RawContent } from "./validate.js";

const real = () => loadRawContent();
const strict = { expectedAnchors: 17, expectedOrigins: 6 };

type Json = Record<string, unknown>;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

function withAnchors(mutate: (anchors: Json[]) => void): RawContent {
  const raw = clone(real());
  mutate(raw.anchors as Json[]);
  return raw;
}

describe("real content", () => {
  it("passes validation with 17 anchors, 6 origins and the fictional parties", () => {
    const { errors, counts } = validateContent(real(), strict);
    expect(errors).toEqual([]);
    expect(counts).toEqual({ anchors: 17, events: 28, origins: 6, parties: 6, blocs: 3 });
  });

  it("keeps every item as a draft", () => {
    const raw = real();
    const statuses: string[] = [];
    const walk = (v: unknown) => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") {
        for (const [k, x] of Object.entries(v)) {
          if (k === "status") statuses.push(String(x));
          else walk(x);
        }
      }
    };
    walk(raw);
    expect(statuses.length).toBeGreaterThanOrEqual(17 + 6 + 6 + 3);
    expect(new Set(statuses)).toEqual(new Set(["rascunho"]));
  });

  it("covers the anchors of doc 04, one per year, each with date and source", () => {
    const anchors = real().anchors as { anchorYear: number; date: string; sources: unknown[] }[];
    expect(anchors.map((a) => a.anchorYear)).toEqual([
      1988, 1989, 1990, 1992, 1994, 1997, 1999, 2002, 2005, 2008, 2013, 2014, 2016, 2018, 2020,
      2022, 2023,
    ]);
    for (const a of anchors) {
      expect(a.date.startsWith(String(a.anchorYear))).toBe(true);
      expect(a.sources.length).toBeGreaterThan(0);
    }
  });

  it("uses the six fictional parties of doc 09", () => {
    const { parties } = real().parties as { parties: { acronym: string }[] };
    expect(parties.map((p) => p.acronym).sort()).toEqual(["APN", "CF", "FC", "MTT", "PDP", "POM"]);
  });

  it("origins in data match the engine defaults", () => {
    expect(toOriginConfigs(real().origins)).toEqual(defaultConfig.origins);
  });

  it("anchors become engine events that move the world in their year", () => {
    const catalog = toCatalog(real().anchors);
    expect(catalog.events).toHaveLength(17);
    expect(catalog.events[0]).not.toHaveProperty("status");
    const base = createGameState({
      seed: "s",
      originId: "ori_professor",
      party: "pdp",
      age: 30,
      year: 1990,
    });
    const after = startTurn(base, { events: catalog.events.filter((e) => e.anchorYear === 1990) });
    expect(after.world.economy).toBeLessThan(base.world.economy);
    expect(after.world.mood).toBeLessThan(base.world.mood);
  });
});

describe("civil events (E2-5)", () => {
  type Ev = { id: string; when: { all?: { origin?: string }[] }; tags: string[] };
  const events = () => real().events as Ev[];
  const originOf = (e: Ev) => e.when.all?.find((c) => c.origin)?.origin;

  it("has 10 generic events and 3 exclusive ones for each of the 6 origins", () => {
    const generic = events().filter((e) => !originOf(e));
    expect(generic).toHaveLength(10);
    const byOrigin = new Map<string, number>();
    for (const e of events()) {
      const o = originOf(e);
      if (o) byOrigin.set(o, (byOrigin.get(o) ?? 0) + 1);
    }
    expect([...byOrigin.keys()].sort()).toEqual(Object.keys(defaultConfig.origins).sort());
    for (const n of byOrigin.values()) expect(n).toBe(3);
  });

  it("every door has at least one event that can open it", () => {
    const tags = new Set(JSON.stringify(real().events).match(/"addTag": ?"[a-z_]+"/g));
    for (const t of ["entity_leader", "invite_post", "strong_ally", "crisis_call"]) {
      expect(
        [...tags].some((x) => x.includes(t)),
        t,
      ).toBe(true);
    }
  });

  it("rejects an event that schedules an unknown consequence or breaks the limits", () => {
    const raw = clone(real());
    const first = (raw.events as Json[])[0] as {
      choices: { outcomes: { effects: unknown[] }[] }[];
    };
    first.choices[0]!.outcomes[0]!.effects.push({
      schedule: { eventId: "ev_nao_existe", delayYears: 1 },
    });
    first.choices[0]!.outcomes[0]!.effects.push({ add: "money", value: 40 });
    const text = validateContent(raw, strict).errors.join();
    expect(text).toContain("schedules unknown event");
    expect(text).toContain("exceeds");
  });
});

describe("validator rejects bad content", () => {
  const errorsOf = (raw: RawContent, options = strict) => validateContent(raw, options).errors;

  it("wrong shape, with the file and the path in the message", () => {
    const errors = errorsOf(withAnchors((a) => delete a[0]!.title));
    expect(errors.some((e) => e.startsWith("anchors.json: 0.title"))).toBe(true);
    const bad = withAnchors((a) => (a[0]!.worldEffects = [{ addWorld: "weather", value: 1 }]));
    expect(errorsOf(bad).length).toBeGreaterThan(0);
  });

  it("unknown keys and invalid ids", () => {
    expect(errorsOf(withAnchors((a) => (a[0]!.extra = 1))).length).toBeGreaterThan(0);
    expect(errorsOf(withAnchors((a) => (a[0]!.id = "Anchor 1"))).length).toBeGreaterThan(0);
  });

  it("missing sources, date or year out of the era", () => {
    expect(errorsOf(withAnchors((a) => (a[1]!.sources = []))).join()).toContain("source");
    expect(errorsOf(withAnchors((a) => delete a[1]!.date)).join()).toContain("date is required");
    expect(errorsOf(withAnchors((a) => (a[1]!.date = "1990-01-01"))).join()).toContain(
      "does not match",
    );
    expect(errorsOf(withAnchors((a) => (a[1]!.anchorYear = 1970))).join()).toContain(
      "outside the era",
    );
  });

  it("duplicate ids and years", () => {
    const dup = withAnchors((a) => {
      a[1]!.id = a[0]!.id;
      a[1]!.anchorYear = a[0]!.anchorYear;
    });
    const text = errorsOf(dup).join("\n");
    expect(text).toContain("duplicate id");
    expect(text).toContain("more than one anchor");
  });

  it("text length outside 40-90 words", () => {
    expect(errorsOf(withAnchors((a) => (a[0]!.text = "Curto demais."))).join()).toContain("words");
    expect(errorsOf(withAnchors((a) => (a[0]!.text = "palavra ".repeat(120)))).join()).toContain(
      "words",
    );
  });

  it("world effects that are missing, oversized or of the wrong kind", () => {
    expect(errorsOf(withAnchors((a) => (a[0]!.worldEffects = []))).join()).toContain("required");
    expect(
      errorsOf(
        withAnchors((a) => (a[0]!.worldEffects = [{ addWorld: "economy", value: 40 }])),
      ).join(),
    ).toContain("exceeds");
    expect(
      errorsOf(withAnchors((a) => (a[0]!.worldEffects = [{ add: "money", value: 5 }]))).join(),
    ).toContain("addWorld");
  });

  it("anything beyond draft before human review", () => {
    const text = errorsOf(withAnchors((a) => (a[0]!.status = "aprovado"))).join();
    expect(text).toContain("rascunho");
    expect(
      validateContent(
        withAnchors((a) => (a[0]!.status = "aprovado")),
        { ...strict, requireDraft: false },
      ).errors,
    ).toEqual([]);
  });

  it("real parties and public figures", () => {
    const party = withAnchors((a) => (a[0]!.text = `${String(a[0]!.text)} O PSDB comemora.`));
    expect(errorsOf(party).join()).toContain("PSDB");
    const person = withAnchors((a) => (a[0]!.title = "Discurso de Lula"));
    expect(errorsOf(person).join()).toContain("Lula");
    expect(errorsOf(real())).toEqual([]);
  });

  it("wrong counts", () => {
    expect(errorsOf(withAnchors((a) => a.pop())).join()).toContain("expected 17");
  });

  it("conversion multipliers outside 0.6-1.2", () => {
    const raw = clone(real());
    (raw.origins as Json[])[2]!.conversion = { toBase: 2, toCapital: 1, toMoney: 1 };
    expect(errorsOf(raw).join()).toContain("conversion.toBase");
  });

  it("origin and party consistency", () => {
    const raw = clone(real());
    const origins = raw.origins as Json[];
    origins[0]!.ageRange = [40, 25];
    origins[1]!.naturalDoors = ["janela"];
    const parties = (raw.parties as { parties: Json[] }).parties;
    parties[0]!.blocId = "blk_inexistente";
    parties[1]!.acronym = parties[0]!.acronym;
    const text = errorsOf(raw).join("\n");
    expect(text).toContain("ageRange is inverted");
    expect(text).toContain("unknown door");
    expect(text).toContain("unknown bloc");
    expect(text).toContain("duplicate acronym");
  });
});
