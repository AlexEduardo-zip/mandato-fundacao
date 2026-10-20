import { defaultConfig, type Catalog, type GameEvent, type OriginConfig } from "@mandato/engine";
import { z } from "zod";
import {
  anchorsFileSchema,
  eventsFileSchema,
  originsFileSchema,
  partiesFileSchema,
  type ContentOrigin,
} from "./schemas.js";

export interface RawContent {
  anchors: unknown;
  /** Career and civil events, from every data/events-*.json file. */
  events: unknown;
  origins: unknown;
  parties: unknown;
}

export interface ValidationOptions {
  /** Until the human review happens, everything must stay as a draft. */
  requireDraft?: boolean;
  expectedAnchors?: number;
  expectedOrigins?: number;
  /** Minimum number of career events; also used to catch a missing file. */
  minEvents?: number;
}

export interface ValidationResult {
  errors: string[];
  counts: { anchors: number; events: number; origins: number; parties: number; blocs: number };
}

// Real parties and public figures must never appear in the content (docs/04 and CLAUDE.md).
const FORBIDDEN_WORDS = [
  "PT",
  "PSDB",
  "MDB",
  "PMDB",
  "PL",
  "PP",
  "PSD",
  "PSOL",
  "PDT",
  "PTB",
  "PSB",
  "DEM",
  "PSL",
  "Collor",
  "Lula",
  "Bolsonaro",
  "Dilma",
  "Temer",
  "Sarney",
  "Itamar",
  "Moro",
  "Cunha",
];
const forbiddenRe = new RegExp(
  `(?<![\\p{L}\\p{N}])(${FORBIDDEN_WORDS.join("|")})(?![\\p{L}\\p{N}])`,
  "u",
);

const MIN_WORDS = 40;
const MAX_WORDS = 90;
const MAX_WORLD_EFFECT = 15;

function formatIssues(file: string, error: z.ZodError): string[] {
  return error.issues.map((i) => `${file}: ${i.path.join(".") || "(root)"}: ${i.message}`);
}

function* strings(value: unknown, path: string): Generator<[string, string]> {
  if (typeof value === "string") yield [path, value];
  else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* strings(value[i], `${path}[${i}]`);
  } else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) yield* strings(v, `${path}.${k}`);
  }
}

function duplicates(values: string[]): string[] {
  return values.filter((v, i) => values.indexOf(v) !== i);
}

export function validateContent(
  raw: RawContent,
  options: ValidationOptions = {},
): ValidationResult {
  const { requireDraft = true } = options;
  const errors: string[] = [];
  const counts = { anchors: 0, events: 0, origins: 0, parties: 0, blocs: 0 };

  const anchors = anchorsFileSchema.safeParse(raw.anchors);
  const events = eventsFileSchema.safeParse(raw.events);
  const origins = originsFileSchema.safeParse(raw.origins);
  const parties = partiesFileSchema.safeParse(raw.parties);
  if (!anchors.success) errors.push(...formatIssues("anchors.json", anchors.error));
  if (!events.success) errors.push(...formatIssues("events-*.json", events.error));
  if (!origins.success) errors.push(...formatIssues("origins.json", origins.error));
  if (!parties.success) errors.push(...formatIssues("parties.json", parties.error));

  const doorIds = Object.keys(defaultConfig.civil.doors);

  if (anchors.success) {
    counts.anchors = anchors.data.length;
    if (options.expectedAnchors !== undefined && anchors.data.length !== options.expectedAnchors) {
      errors.push(
        `anchors.json: expected ${options.expectedAnchors} anchors, found ${anchors.data.length}`,
      );
    }
    for (const dup of duplicates(anchors.data.map((a) => a.id)))
      errors.push(`anchors.json: duplicate id ${dup}`);
    for (const dup of duplicates(anchors.data.map((a) => String(a.anchorYear)))) {
      errors.push(`anchors.json: more than one anchor in ${dup}`);
    }
    for (const a of anchors.data) {
      const where = `anchors.json: ${a.id}`;
      if (a.anchorYear === undefined) errors.push(`${where}: anchorYear is required`);
      else if (a.anchorYear < defaultConfig.startYear || a.anchorYear > defaultConfig.eraEndYear) {
        errors.push(`${where}: anchorYear ${a.anchorYear} outside the era`);
      }
      if (!a.date) errors.push(`${where}: date is required`);
      else if (a.anchorYear !== undefined && Number(a.date.slice(0, 4)) !== a.anchorYear) {
        errors.push(`${where}: date ${a.date} does not match anchorYear ${a.anchorYear}`);
      } else if (Number.isNaN(Date.parse(a.date))) errors.push(`${where}: invalid date ${a.date}`);
      if (!a.sources || a.sources.length === 0)
        errors.push(`${where}: at least one source is required`);
      const words = a.text.trim().split(/\s+/).length;
      if (words < MIN_WORDS || words > MAX_WORDS) {
        errors.push(`${where}: text has ${words} words, expected ${MIN_WORDS}-${MAX_WORDS}`);
      }
      if (!a.worldEffects || a.worldEffects.length === 0)
        errors.push(`${where}: worldEffects are required`);
      for (const e of a.worldEffects ?? []) {
        if (!("addWorld" in e)) errors.push(`${where}: anchors may only use addWorld effects`);
        else if (Math.abs(e.value) > MAX_WORLD_EFFECT) {
          errors.push(
            `${where}: world effect ${e.addWorld} ${e.value} exceeds +-${MAX_WORLD_EFFECT}`,
          );
        }
      }
    }
  }

  if (events.success) {
    counts.events = events.data.length;
    if (options.minEvents !== undefined && events.data.length < options.minEvents) {
      errors.push(
        `events: expected at least ${options.minEvents} events, found ${events.data.length}`,
      );
    }
    const anchorIds = anchors.success ? anchors.data.map((a) => a.id) : [];
    const ids = events.data.map((e) => e.id);
    for (const dup of duplicates([...anchorIds, ...ids]))
      errors.push(`events: duplicate id ${dup}`);
    for (const e of events.data) {
      const where = `events: ${e.id}`;
      const words = e.text.trim().split(/\s+/).length;
      if (words < MIN_WORDS || words > MAX_WORDS) {
        errors.push(`${where}: text has ${words} words, expected ${MIN_WORDS}-${MAX_WORDS}`);
      }
      if (!e.scheduledOnly && (!e.choices || e.choices.length === 0)) {
        errors.push(`${where}: needs at least one choice`);
      }
      const choiceIds = (e.choices ?? []).map((c) => c.id);
      for (const dup of duplicates(choiceIds)) errors.push(`${where}: duplicate choice id ${dup}`);
      const effects = [
        ...(e.effects ?? []),
        ...(e.worldEffects ?? []),
        ...(e.choices ?? []).flatMap((c) => c.outcomes.flatMap((o) => o.effects)),
      ];
      for (const fx of effects) {
        if ("add" in fx && Math.abs(fx.value) > MAX_WORLD_EFFECT) {
          errors.push(`${where}: effect on ${fx.add} ${fx.value} exceeds +-${MAX_WORLD_EFFECT}`);
        }
        if ("addWorld" in fx && Math.abs(fx.value) > MAX_WORLD_EFFECT) {
          errors.push(
            `${where}: world effect ${fx.addWorld} ${fx.value} exceeds +-${MAX_WORLD_EFFECT}`,
          );
        }
        if ("schedule" in fx && ![...anchorIds, ...ids].includes(fx.schedule.eventId)) {
          errors.push(`${where}: schedules unknown event ${fx.schedule.eventId}`);
        }
      }
    }
  }

  if (origins.success) {
    counts.origins = origins.data.length;
    if (options.expectedOrigins !== undefined && origins.data.length !== options.expectedOrigins) {
      errors.push(
        `origins.json: expected ${options.expectedOrigins} origins, found ${origins.data.length}`,
      );
    }
    for (const dup of duplicates(origins.data.map((o) => o.id)))
      errors.push(`origins.json: duplicate id ${dup}`);
    for (const o of origins.data) {
      const where = `origins.json: ${o.id}`;
      if (o.ageRange[0] > o.ageRange[1]) errors.push(`${where}: ageRange is inverted`);
      if (o.ageRange[0] < 18) errors.push(`${where}: minimum age below 18`);
      if (
        o.availableFrom !== undefined &&
        o.availableUntil !== undefined &&
        o.availableFrom > o.availableUntil
      ) {
        errors.push(`${where}: availableFrom after availableUntil`);
      }
      for (const door of o.naturalDoors) {
        if (!doorIds.includes(door)) errors.push(`${where}: unknown door ${door}`);
      }
    }
  }

  if (parties.success) {
    counts.parties = parties.data.parties.length;
    counts.blocs = parties.data.blocs.length;
    const blocIds = parties.data.blocs.map((b) => b.id);
    for (const dup of duplicates([...blocIds, ...parties.data.parties.map((p) => p.id)])) {
      errors.push(`parties.json: duplicate id ${dup}`);
    }
    for (const dup of duplicates(parties.data.parties.map((p) => p.acronym))) {
      errors.push(`parties.json: duplicate acronym ${dup}`);
    }
    for (const p of parties.data.parties) {
      if (!blocIds.includes(p.blocId))
        errors.push(`parties.json: ${p.id}: unknown bloc ${p.blocId}`);
    }
  }

  for (const [file, value] of [
    ["anchors.json", raw.anchors],
    ["events", raw.events],
    ["origins.json", raw.origins],
    ["parties.json", raw.parties],
  ] as const) {
    for (const [path, text] of strings(value, "")) {
      const hit = text.match(forbiddenRe);
      if (hit)
        errors.push(
          `${file}${path}: mentions "${hit[1]}", real parties and people are not allowed`,
        );
    }
    if (requireDraft) {
      for (const [path, text] of strings(value, "")) {
        if (path.endsWith(".status") && text !== "rascunho") {
          errors.push(`${file}${path}: status must be "rascunho" until the human review`);
        }
      }
    }
  }

  return { errors, counts };
}

function omit(value: object, keys: string[]): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([k]) => !keys.includes(k)));
}

/** Anchors as engine events, without the editorial fields. */
export function toCatalog(rawAnchors: unknown, rawEvents: unknown = []): Catalog {
  const anchors = anchorsFileSchema.parse(rawAnchors);
  const career = eventsFileSchema.parse(rawEvents);
  const events = [...anchors, ...career].map(
    (a) => omit(a, ["status", "sources", "date"]) as unknown as GameEvent,
  );
  return { events };
}

/** Origins as the engine configuration expects them. */
export function toOriginConfigs(rawOrigins: unknown): Record<string, OriginConfig> {
  const origins = originsFileSchema.parse(rawOrigins);
  return Object.fromEntries(
    origins.map((o: ContentOrigin) => [
      o.id,
      omit(o, ["id", "status", "strengths", "weaknesses", "eventTags"]) as unknown as OriginConfig,
    ]),
  );
}
