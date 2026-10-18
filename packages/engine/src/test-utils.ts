import { createGameState, type NewGameInput } from "./state.js";
import type { GameEvent, GameState } from "./types.js";

export function makeState(overrides: Partial<NewGameInput> = {}): GameState {
  return createGameState({
    seed: "test",
    originId: "ori_professor",
    party: "pdp",
    age: 30,
    phase: "politica",
    ...overrides,
  });
}

export function makeEvent(id: string, overrides: Partial<GameEvent> = {}): GameEvent {
  return { id, kind: "career", title: id, text: id, ...overrides };
}
