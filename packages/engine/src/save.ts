import { stand } from "./career.js";
import { defaultConfig, type EngineConfig } from "./config.js";
import { decide } from "./resolve.js";
import { createGameState, type NewGameInput } from "./state.js";
import { endTurn, startTurn } from "./turn.js";
import type { Catalog, GameState } from "./types.js";

export const SAVE_VERSION = 1;

export type CharacterInput = Omit<NewGameInput, "seed">;

/** One player action. The turn opens by itself before the first action of a year. */
export type Decision =
  | { t: "create"; input: CharacterInput }
  | { t: "choice"; id: string }
  | { t: "stand"; office: string }
  | { t: "end" };

export interface SaveGame {
  saveVersion: typeof SAVE_VERSION;
  contentVersion: string;
  seed: string;
  decisions: Decision[];
}

export interface Session {
  save: SaveGame;
  state: GameState;
}

function openTurn(state: GameState, catalog: Catalog, config: EngineConfig): GameState {
  return state.turnOpen ? state : startTurn(state, catalog, config);
}

/** Applies one non-creation decision; shared by live play and replay. */
export function applyDecision(
  state: GameState,
  catalog: Catalog,
  decision: Decision,
  config: EngineConfig = defaultConfig,
): GameState {
  if (decision.t === "create") throw new Error("create is only valid as the first decision");
  const open = openTurn(state, catalog, config);
  if (decision.t === "choice") return decide(open, catalog, decision.id, config);
  if (decision.t === "stand") return stand(open, decision.office, config).state;
  return endTurn(open, config);
}

export function createSession(
  seed: string,
  character: CharacterInput,
  contentVersion: string,
  config: EngineConfig = defaultConfig,
): Session {
  return {
    save: {
      saveVersion: SAVE_VERSION,
      contentVersion,
      seed,
      decisions: [{ t: "create", input: character }],
    },
    state: createGameState({ ...character, seed }, config),
  };
}

/** Plays one decision and records it, so the save always reproduces the state. */
export function act(
  session: Session,
  catalog: Catalog,
  decision: Decision,
  config: EngineConfig = defaultConfig,
): Session {
  return {
    save: { ...session.save, decisions: [...session.save.decisions, decision] },
    state: applyDecision(session.state, catalog, decision, config),
  };
}

export function replay(
  save: SaveGame,
  catalog: Catalog,
  contentVersion: string,
  config: EngineConfig = defaultConfig,
): Session {
  if (save.saveVersion !== SAVE_VERSION)
    throw new Error(`unsupported save version ${save.saveVersion}`);
  if (save.contentVersion !== contentVersion) {
    throw new Error(`save made with content ${save.contentVersion}, current is ${contentVersion}`);
  }
  const [first, ...rest] = save.decisions;
  if (!first || first.t !== "create") throw new Error("save must start with a create decision");
  const initial = createSession(save.seed, first.input, save.contentVersion, config);
  return rest.reduce((session, d) => act(session, catalog, d, config), initial);
}

export function serializeSave(save: SaveGame): string {
  return JSON.stringify(save);
}

type Raw = Record<string, unknown>;

const isObject = (v: unknown): v is Raw => typeof v === "object" && v !== null && !Array.isArray(v);

/** v0 (pre-release): `{ seed, contentVersion?, character, turns: string[][] }`, choice ids per year. */
function migrateV0(raw: Raw): Raw {
  if (typeof raw.seed !== "string" || !isObject(raw.character) || !Array.isArray(raw.turns)) {
    throw new Error("invalid v0 save");
  }
  const decisions: Decision[] = [{ t: "create", input: raw.character as CharacterInput }];
  for (const turn of raw.turns as unknown[]) {
    if (!Array.isArray(turn)) throw new Error("invalid v0 save");
    for (const id of turn) decisions.push({ t: "choice", id: String(id) });
    decisions.push({ t: "end" });
  }
  return {
    saveVersion: 1,
    contentVersion: typeof raw.contentVersion === "string" ? raw.contentVersion : "0",
    seed: raw.seed,
    decisions,
  };
}

const migrations: Record<number, (raw: Raw) => Raw> = { 0: migrateV0 };

function validate(raw: Raw): SaveGame {
  const ok =
    raw.saveVersion === SAVE_VERSION &&
    typeof raw.contentVersion === "string" &&
    typeof raw.seed === "string" &&
    Array.isArray(raw.decisions) &&
    raw.decisions.every(
      (d) =>
        isObject(d) &&
        (d.t === "end" ||
          (d.t === "create" && isObject(d.input)) ||
          (d.t === "choice" && typeof d.id === "string") ||
          (d.t === "stand" && typeof d.office === "string")),
    );
  if (!ok) throw new Error("invalid save");
  return raw as unknown as SaveGame;
}

/** Brings a save of any known version up to the current one; saves without a version are v0. */
export function migrateSave(input: unknown): SaveGame {
  if (!isObject(input)) throw new Error("invalid save");
  let raw: Raw = input;
  let version = typeof raw.saveVersion === "number" ? raw.saveVersion : 0;
  if (version > SAVE_VERSION) throw new Error(`save version ${version} is newer than this engine`);
  while (version < SAVE_VERSION) {
    const step = migrations[version];
    if (!step) throw new Error(`no migration from save version ${version}`);
    raw = step(raw);
    version = typeof raw.saveVersion === "number" ? raw.saveVersion : version + 1;
  }
  return validate(raw);
}

export function parseSave(json: string): SaveGame {
  return migrateSave(JSON.parse(json) as unknown);
}
