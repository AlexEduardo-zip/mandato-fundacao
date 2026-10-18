import { defaultConfig, type EngineConfig } from "./config.js";
import { electionHeadline, mandateEndHeadline } from "./headlines.js";
import { officeConfig, runElection, type ElectionResult } from "./election.js";
import type { GameState, OfficeId } from "./types.js";

export type Candidacy = { ok: true } | { ok: false; reason: string };

export function isElectionYear(
  office: OfficeId,
  year: number,
  config: EngineConfig = defaultConfig,
): boolean {
  const cfg = officeConfig(office, config);
  if (cfg.extraYears?.includes(year)) return true;
  const first = cfg.firstYear ?? (cfg.level === "municipal" ? 1988 : 1990);
  return year >= first && (year - first) % 4 === 0;
}

export function checkCandidacy(
  state: GameState,
  office: OfficeId,
  config: EngineConfig = defaultConfig,
): Candidacy {
  const cfg = officeConfig(office, config);
  const { player } = state;
  const rules = config.career;
  if (player.phase !== "politica") return { ok: false, reason: "not in politics" };
  if (player.tags[rules.ineligibleTag]) return { ok: false, reason: "ineligible" };
  if (!isElectionYear(office, player.year, config)) return { ok: false, reason: "no election" };
  if (player.age < cfg.minAge) return { ok: false, reason: "too young" };

  if (player.career.highestRank === 0) {
    if (!rules.entryOffices.includes(office)) return { ok: false, reason: "not an entry office" };
  } else if (cfg.rank > player.career.highestRank + rules.ladderReach) {
    return { ok: false, reason: "too high on the ladder" };
  }

  if (cfg.branch === "executive" && player.office === office) {
    if (player.year < rules.reelectionFromYear)
      return { ok: false, reason: "reelection not allowed yet" };
    if (player.career.consecutiveTerms >= rules.executiveMaxConsecutiveTerms) {
      return { ok: false, reason: "term limit reached" };
    }
  }
  return { ok: true };
}

export function candidacyOptions(
  state: GameState,
  config: EngineConfig = defaultConfig,
): OfficeId[] {
  return Object.keys(config.offices).filter((o) => checkCandidacy(state, o, config).ok);
}

function withHeadline(state: GameState, text: string): GameState {
  const entry = { year: state.player.year, kind: "headline" as const, text };
  return { ...state, player: { ...state.player, history: [...state.player.history, entry] } };
}

/** Runs the race for `office`; a win takes the seat and starts a new mandate. */
export function stand(
  state: GameState,
  office: OfficeId,
  config: EngineConfig = defaultConfig,
): { state: GameState; result: ElectionResult } {
  const check = checkCandidacy(state, office, config);
  if (!check.ok) throw new Error(`cannot run for ${office}: ${check.reason}`);
  const first = runElection(state, office, config);
  const news = electionHeadline(first.result, first.state.rng, config);
  const ran = {
    result: first.result,
    state: withHeadline({ ...first.state, rng: news.rng }, news.text),
  };
  if (!ran.result.won) return ran;

  const { player } = ran.state;
  const sameOffice = player.office === office;
  const parallel = player.career.parallel.filter((p) =>
    (config.career.parallel[p] ?? []).includes(office),
  );
  return {
    result: ran.result,
    state: {
      ...ran.state,
      player: {
        ...player,
        office,
        career: {
          termStartYear: player.year,
          consecutiveTerms: sameOffice ? player.career.consecutiveTerms + 1 : 1,
          highestRank: Math.max(player.career.highestRank, officeConfig(office, config).rank),
          parallel,
        },
      },
    },
  };
}

/** Ends the mandate once its last year is over, unless a reelection renewed it. */
export function expireMandate(state: GameState, config: EngineConfig = defaultConfig): GameState {
  const { office, career, year } = state.player;
  if (office === null || career.termStartYear === null) return state;
  if (year < career.termStartYear + officeConfig(office, config).termYears) return state;
  const news = mandateEndHeadline(office, year, state.rng, config);
  const lapsed = withHeadline({ ...state, rng: news.rng }, news.text);
  return {
    ...lapsed,
    player: {
      ...lapsed.player,
      office: null,
      career: { ...career, termStartYear: null, consecutiveTerms: 0, parallel: [] },
    },
  };
}

export function addParallel(
  state: GameState,
  parallelId: string,
  config: EngineConfig = defaultConfig,
): GameState {
  const { office, career } = state.player;
  const allowed = config.career.parallel[parallelId];
  if (!allowed) throw new Error(`unknown parallel office: ${parallelId}`);
  if (office === null || !allowed.includes(office)) {
    throw new Error(`${parallelId} is not compatible with ${String(office)}`);
  }
  if (career.parallel.includes(parallelId)) return state;
  return {
    ...state,
    player: { ...state.player, career: { ...career, parallel: [...career.parallel, parallelId] } },
  };
}

export function removeParallel(state: GameState, parallelId: string): GameState {
  const { career } = state.player;
  return {
    ...state,
    player: {
      ...state.player,
      career: { ...career, parallel: career.parallel.filter((p) => p !== parallelId) },
    },
  };
}
