import { defaultConfig, type EngineConfig, type OriginConfig } from "./config.js";
import { createGameState, type NewGameInput } from "./state.js";
import { ATTR_IDS, type AttrId, type GameState, type OriginId } from "./types.js";

export function originConfig(id: OriginId, config: EngineConfig = defaultConfig): OriginConfig {
  const origin = config.origins[id];
  if (!origin) throw new Error(`unknown origin: ${id}`);
  return origin;
}

export function isOriginAvailable(
  id: OriginId,
  year: number,
  config: EngineConfig = defaultConfig,
): boolean {
  const origin = config.origins[id];
  if (!origin) return false;
  return year >= (origin.availableFrom ?? -Infinity) && year <= (origin.availableUntil ?? Infinity);
}

export function availableOrigins(year: number, config: EngineConfig = defaultConfig): OriginId[] {
  return Object.keys(config.origins).filter((id) => isOriginAvailable(id, year, config));
}

export interface CharacterCreation extends Omit<NewGameInput, "seed"> {
  /** Free points per attribute, on top of the base (doc 09: 40 in total, at most 80 per attribute). */
  points?: Partial<Record<AttrId, number>>;
}

const clamp = (v: number, config: EngineConfig) =>
  Math.min(config.statMax, Math.max(config.statMin, v));

/** Validates the creation rules of doc 09 and builds the civil-life starting state. */
export function createCharacter(
  seed: string,
  input: CharacterCreation,
  config: EngineConfig = defaultConfig,
): GameState {
  const year = input.year ?? config.startYear;
  const origin = originConfig(input.originId, config);
  if (!isOriginAvailable(input.originId, year, config)) {
    throw new Error(`origin ${input.originId} is not available in ${year}`);
  }
  const [minAge, maxAge] = origin.ageRange;
  if (input.age < minAge || input.age > maxAge) {
    throw new Error(`age ${input.age} outside ${minAge}-${maxAge} for ${input.originId}`);
  }

  const { freePoints, maxAttribute, maxOriginMod } = config.civil.creation;
  const points = input.points ?? {};
  const spent = ATTR_IDS.reduce((acc, id) => acc + (points[id] ?? 0), 0);
  if (spent > freePoints) throw new Error(`too many free points: ${spent} > ${freePoints}`);

  const attributes = {} as Record<AttrId, number>;
  for (const id of ATTR_IDS) {
    const extra = points[id] ?? 0;
    if (extra < 0) throw new Error(`negative points for ${id}`);
    const raw = config.defaultAttribute + extra;
    if (raw > maxAttribute) throw new Error(`${id} above ${maxAttribute} at creation`);
    const mod = origin.attributeMods[id] ?? 0;
    if (Math.abs(mod) > maxOriginMod)
      throw new Error(`origin modifier for ${id} above ${maxOriginMod}`);
    attributes[id] = clamp(raw + mod, config);
  }

  return createGameState(
    {
      ...input,
      seed,
      phase: "civil",
      year,
      attributes: { ...attributes, ...input.attributes },
      resources: { ...origin.startingResources, ...input.resources },
      prestige: input.prestige ?? origin.civilPrestige,
      network: input.network ?? origin.civilNetwork,
    },
    config,
  );
}
