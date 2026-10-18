import type { WorldState } from "./types.js";

// Balance numbers live here (defaults from docs/09-parametros-v0.md); content can override them.
export interface EngineConfig {
  startYear: number;
  eraEndYear: number;
  statMin: number;
  statMax: number;
  defaultAttribute: number;
  defaultResource: number;
  initialWorld: WorldState;
  defaultEventWeight: number;
  eventCooldownTurns: number;
  careerEventsPerTurn: number;
}

export const defaultConfig: EngineConfig = {
  startYear: 1988,
  eraEndYear: 2026,
  statMin: 0,
  statMax: 100,
  defaultAttribute: 30,
  defaultResource: 10,
  initialWorld: {
    economy: 50,
    mood: 50,
    congressFragmentation: 50,
    mediaPressure: 50,
    oversight: 50,
    polarization: 50,
  },
  defaultEventWeight: 1,
  eventCooldownTurns: 3,
  careerEventsPerTurn: 2,
};
