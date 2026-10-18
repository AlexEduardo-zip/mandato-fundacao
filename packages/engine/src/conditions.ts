import { compare, getStat, isStatId } from "./stats.js";
import { WORLD_KEYS, type Condition, type PlayerState, type WorldState } from "./types.js";

export interface ConditionContext {
  player: PlayerState;
  world: WorldState;
}

const oneOf = <T>(expected: T | T[], actual: T | null): boolean =>
  actual !== null && (Array.isArray(expected) ? expected.includes(actual) : expected === actual);

export function evaluateCondition(condition: Condition, ctx: ConditionContext): boolean {
  const { player, world } = ctx;

  if ("all" in condition) return condition.all.every((sub) => evaluateCondition(sub, ctx));
  if ("any" in condition) return condition.any.some((sub) => evaluateCondition(sub, ctx));
  if ("not" in condition) return !evaluateCondition(condition.not, ctx);
  if ("attr" in condition) {
    if (!isStatId(condition.attr))
      throw new Error(`unknown stat id in condition: ${condition.attr}`);
    return compare(getStat(player, condition.attr), condition.op, condition.value);
  }
  if ("hasTag" in condition) {
    return (player.tags[condition.hasTag] ?? 0) >= (condition.min ?? 1);
  }
  if ("office" in condition) return oneOf(condition.office, player.office);
  if ("phase" in condition) return player.phase === condition.phase;
  if ("origin" in condition) return oneOf(condition.origin, player.originId);
  if ("age" in condition) return compare(player.age, condition.age.op, condition.age.value);
  if ("yearBetween" in condition) {
    const [from, to] = condition.yearBetween;
    return player.year >= from && player.year <= to;
  }
  if ("world" in condition) {
    if (!(WORLD_KEYS as readonly string[]).includes(condition.world)) {
      throw new Error(`unknown world key in condition: ${condition.world}`);
    }
    return compare(world[condition.world], condition.op, condition.value);
  }
  throw new Error(`unknown condition: ${JSON.stringify(condition)}`);
}
