import {
  ATTR_IDS,
  CIVIL_STAT_IDS,
  RESOURCE_IDS,
  STAT_IDS,
  type AttrId,
  type Op,
  type PlayerState,
  type ResourceId,
  type StatId,
} from "./types.js";

export function isStatId(id: string): id is StatId {
  return (STAT_IDS as readonly string[]).includes(id);
}

export function getStat(player: PlayerState, id: StatId): number {
  if ((ATTR_IDS as readonly string[]).includes(id)) return player.attributes[id as AttrId];
  if ((RESOURCE_IDS as readonly string[]).includes(id)) return player.resources[id as ResourceId];
  if ((CIVIL_STAT_IDS as readonly string[]).includes(id)) {
    return player.civil[id as "prestige" | "network"];
  }
  if (id === "scandalRisk") return player.hidden.scandalRisk;
  throw new Error(`unknown stat id: ${String(id)}`);
}

/** Returns a new player with the stat replaced (no clamping). */
export function withStat(player: PlayerState, id: StatId, value: number): PlayerState {
  if ((ATTR_IDS as readonly string[]).includes(id)) {
    return { ...player, attributes: { ...player.attributes, [id]: value } };
  }
  if ((RESOURCE_IDS as readonly string[]).includes(id)) {
    return { ...player, resources: { ...player.resources, [id]: value } };
  }
  if ((CIVIL_STAT_IDS as readonly string[]).includes(id)) {
    return { ...player, civil: { ...player.civil, [id]: value } };
  }
  if (id === "scandalRisk") return { ...player, hidden: { ...player.hidden, scandalRisk: value } };
  throw new Error(`unknown stat id: ${String(id)}`);
}

export function compare(actual: number, op: Op, expected: number): boolean {
  switch (op) {
    case ">=":
      return actual >= expected;
    case "<=":
      return actual <= expected;
    case "==":
      return actual === expected;
    default:
      throw new Error(`unknown operator: ${String(op)}`);
  }
}
