import { ATTR_IDS, RESOURCE_IDS, STAT_IDS, WORLD_KEYS, type Condition } from "@mandato/engine";
import { z } from "zod";

const id = (prefix: string) =>
  z.string().regex(new RegExp(`^${prefix}_[a-z0-9_]+$`), `id must look like ${prefix}_snake_case`);

const op = z.enum([">=", "<=", "=="]);
const statId = z.enum(STAT_IDS);
const worldKey = z.enum(WORLD_KEYS);
const attrId = z.enum(ATTR_IDS);
const resourceId = z.enum(RESOURCE_IDS);
const strings = z.string().min(1);

export const conditionSchema: z.ZodType<Condition> = z.lazy(() =>
  z.union([
    z.strictObject({ all: z.array(conditionSchema).min(1) }),
    z.strictObject({ any: z.array(conditionSchema).min(1) }),
    z.strictObject({ not: conditionSchema }),
    z.strictObject({ attr: statId, op, value: z.number() }),
    z.strictObject({ hasTag: strings, min: z.number().optional() }),
    z.strictObject({ office: z.union([strings, z.array(strings).min(1)]) }),
    z.strictObject({ phase: z.enum(["civil", "politica"]) }),
    z.strictObject({ origin: z.union([strings, z.array(strings).min(1)]) }),
    z.strictObject({ age: z.strictObject({ op, value: z.number() }) }),
    z.strictObject({ yearBetween: z.tuple([z.number().int(), z.number().int()]) }),
    z.strictObject({ world: worldKey, op, value: z.number() }),
  ]),
) as unknown as z.ZodType<Condition>;

export const effectSchema = z.union([
  z.strictObject({ add: statId, value: z.number() }),
  z.strictObject({ set: statId, value: z.number() }),
  z.strictObject({ addWorld: worldKey, value: z.number() }),
  z.strictObject({ addTag: strings, value: z.number().optional() }),
  z.strictObject({ removeTag: strings }),
  z.strictObject({
    schedule: z.strictObject({
      eventId: strings,
      delayYears: z.number().int().min(0),
      chance: z.number().min(0).max(1).optional(),
    }),
  }),
  z.strictObject({ setOffice: strings }),
  z.strictObject({ headline: strings }),
]);

export const formulaSchema = z.strictObject({
  base: z.number(),
  terms: z.array(z.strictObject({ stat: statId, coef: z.number() })).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
});

export const outcomeSchema = z.strictObject({
  chance: z.union([z.number().min(0), formulaSchema]),
  text: strings,
  effects: z.array(effectSchema),
});

export const choiceSchema = z.strictObject({
  id: strings,
  label: strings,
  requires: conditionSchema.optional(),
  outcomes: z.array(outcomeSchema).min(1),
});

export const statusSchema = z.enum(["rascunho", "revisado", "aprovado"]);

export const sourceSchema = z.strictObject({
  label: strings,
  url: z.url().optional(),
});

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD");

export const eventSchema = z.strictObject({
  id: id("ev"),
  kind: z.enum(["anchor", "career"]),
  title: strings,
  text: strings,
  status: statusSchema,
  tags: z.array(strings).min(1),
  when: conditionSchema.optional(),
  weight: z
    .union([
      z.number().min(0),
      z.array(z.strictObject({ when: conditionSchema.optional(), mult: z.number().min(0) })),
    ])
    .optional(),
  anchorYear: z.number().int().optional(),
  /** Date of the real fact an anchor refers to. */
  date: isoDate.optional(),
  sources: z.array(sourceSchema).optional(),
  worldEffects: z.array(effectSchema).optional(),
  effects: z.array(effectSchema).optional(),
  choices: z.array(choiceSchema).optional(),
  scheduledOnly: z.boolean().optional(),
  cooldownTurns: z.number().int().min(1).optional(),
});
export type ContentEvent = z.infer<typeof eventSchema>;

export const anchorSchema = eventSchema.refine((e) => e.kind === "anchor", "must be an anchor");

export const originSchema = z.strictObject({
  id: id("ori"),
  label: strings,
  status: statusSchema,
  availableFrom: z.number().int().optional(),
  availableUntil: z.number().int().optional(),
  ageRange: z.tuple([z.number().int(), z.number().int()]),
  attributeMods: z.partialRecord(attrId, z.number().min(-10).max(10)),
  startingResources: z.partialRecord(resourceId, z.number().min(0).max(100)),
  civilPrestige: z.number().min(0).max(100),
  civilNetwork: z.number().min(0).max(100),
  conversion: z.strictObject({
    toBase: z.number().min(0.6).max(1.2),
    toCapital: z.number().min(0.6).max(1.2),
    toMoney: z.number().min(0.6).max(1.2),
  }),
  naturalDoors: z.array(strings).min(1),
  strengths: z.array(strings).min(1),
  weaknesses: z.array(strings).min(1),
  eventTags: z.array(strings),
});
export type ContentOrigin = z.infer<typeof originSchema>;

export const partySchema = z.strictObject({
  id: id("par"),
  acronym: z.string().regex(/^[A-Z]{2,4}$/),
  name: strings,
  status: statusSchema,
  blocId: id("blk"),
  /** Direction on the economic and social axes, -2..2; no label of real parties. */
  leaning: z.strictObject({
    economic: z.number().int().min(-2).max(2),
    social: z.number().int().min(-2).max(2),
  }),
  description: strings,
});
export type ContentParty = z.infer<typeof partySchema>;

export const blocSchema = z.strictObject({
  id: id("blk"),
  name: strings,
  status: statusSchema,
  description: strings,
});

export const partiesFileSchema = z.strictObject({
  blocs: z.array(blocSchema).min(1),
  parties: z.array(partySchema).min(1),
});

export const anchorsFileSchema = z.array(anchorSchema);
export const originsFileSchema = z.array(originSchema);
