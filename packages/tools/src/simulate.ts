import {
  ATTR_IDS,
  Rng,
  availableChoices,
  availableDoors,
  candidacyOptions,
  createSession,
  defaultConfig,
  act,
  evaluate,
  getEvent,
  hashSeed,
  startTurn,
  type AttrId,
  type Catalog,
  type CharacterInput,
  type Decision,
  type EngineConfig,
  type Session,
  type Verdict,
} from "@mandato/engine";

export interface RunSummary {
  seed: string;
  originId: string;
  ended: string | null;
  enteredPolitics: boolean;
  bestRank: number;
  bestOffice: string | null;
  removed: boolean;
  verdict: Verdict;
  firedEvents: string[];
  years: number;
}

export interface SimulationOptions {
  config?: EngineConfig;
  contentVersion?: string;
  /** Probability of opening an available door in a given civil year. */
  doorChance?: number;
  /** Safety bound on simulated years. */
  maxYears?: number;
}

function randomCharacter(rng: Rng, config: EngineConfig): CharacterInput {
  const originId = rng.pick(Object.keys(config.origins));
  const origin = config.origins[originId];
  if (!origin) throw new Error(`unknown origin ${originId}`);
  const points: Partial<Record<AttrId, number>> = {};
  for (let left = config.civil.creation.freePoints; left > 0;) {
    const id = rng.pick(ATTR_IDS);
    const room = config.civil.creation.maxAttribute - config.defaultAttribute - (points[id] ?? 0);
    const add = Math.min(left, room, rng.int(1, 10));
    if (add <= 0) continue;
    points[id] = (points[id] ?? 0) + add;
    left -= add;
  }
  const [minAge, maxAge] = origin.ageRange;
  return {
    originId,
    party: "par_pdp",
    age: rng.int(minAge, maxAge),
    year: config.startYear,
    points,
  };
}

/** One full run with a random player: random character, random choices, random career moves. */
export function simulateRun(
  seed: string,
  catalog: Catalog,
  options: SimulationOptions = {},
): RunSummary {
  const config = options.config ?? defaultConfig;
  const doorChance = options.doorChance ?? 0.5;
  const maxYears = options.maxYears ?? 60;
  const rng = new Rng(hashSeed(`policy:${seed}`));

  let session: Session = createSession(
    seed,
    randomCharacter(rng, config),
    options.contentVersion ?? "sim",
    config,
  );
  const record = (d: Decision) => {
    session = act(session, catalog, d, config);
  };
  const fired = new Set<string>();

  for (let year = 0; year < maxYears && !session.state.ended; year++) {
    let opened = startTurn(session.state, catalog, config);
    session = { ...session, state: opened };
    while (opened.pending.length > 0) {
      const event = getEvent(catalog, opened.pending[0] as string);
      const choices = availableChoices(event, opened);
      record({ t: "choice", id: rng.pick(choices).id });
      opened = session.state;
    }
    for (const h of opened.player.history) {
      if (h.year === opened.player.year && h.eventId && h.kind !== "choice") fired.add(h.eventId);
    }

    const { player } = session.state;
    if (player.phase === "civil") {
      if (player.civil.joinedPartyYear === null && rng.chance(0.5)) record({ t: "join" });
      const doors = availableDoors(session.state, config);
      if (doors.length > 0 && rng.chance(doorChance)) {
        record({ t: "door", id: rng.pick(doors) });
      } else if (player.civil.lastChance) {
        record({ t: "decline" });
      }
    } else {
      const options_ = candidacyOptions(session.state, config);
      if (options_.length > 0 && rng.chance(0.8)) {
        record({ t: "stand", office: rng.pick(options_) });
      }
      if (player.age >= config.lifeEnd.retireMinAge && rng.chance(0.15)) {
        record({ t: "retire" });
        continue;
      }
    }
    if (!session.state.ended) record({ t: "end" });
  }

  const state = session.state;
  const verdict = evaluate(state, config);
  return {
    seed,
    originId: state.player.originId,
    ended: state.ended,
    enteredPolitics: state.player.phase === "politica",
    bestRank: state.player.career.highestRank,
    bestOffice: verdict.bestOffice,
    removed: state.ended === "cassado",
    verdict,
    firedEvents: [...fired],
    years: state.player.year - config.startYear,
  };
}

export interface BatchReport {
  runs: number;
  enteredPolitics: number;
  removed: number;
  archetypes: Record<string, number>;
  endings: Record<string, number>;
  tiers: Record<string, number>;
  reachedOffice: Record<string, number>;
  reachedCongress: Record<string, { runs: number; reached: number }>;
  eventFiredRuns: Record<string, number>;
  neverFired: string[];
  lowFired: string[];
  meanYears: number;
}

const bump = (map: Record<string, number>, key: string) => {
  map[key] = (map[key] ?? 0) + 1;
};

export function simulateBatch(
  runs: number,
  baseSeed: string,
  catalog: Catalog,
  options: SimulationOptions = {},
): BatchReport {
  const config = options.config ?? defaultConfig;
  const report: BatchReport = {
    runs,
    enteredPolitics: 0,
    removed: 0,
    archetypes: {},
    endings: {},
    tiers: {},
    reachedOffice: {},
    reachedCongress: {},
    eventFiredRuns: {},
    neverFired: [],
    lowFired: [],
    meanYears: 0,
  };
  let years = 0;
  const congressRank = config.offices.deputado?.rank ?? 3;

  for (let i = 0; i < runs; i++) {
    const run = simulateRun(`${baseSeed}:${i}`, catalog, options);
    years += run.years;
    if (run.enteredPolitics) report.enteredPolitics++;
    if (run.removed) report.removed++;
    bump(report.archetypes, run.verdict.archetype);
    bump(report.tiers, run.verdict.legacyLabel);
    if (run.verdict.ending) bump(report.endings, run.verdict.ending);
    if (run.bestOffice) bump(report.reachedOffice, run.bestOffice);
    const origin = (report.reachedCongress[run.originId] ??= { runs: 0, reached: 0 });
    origin.runs++;
    if (run.bestRank >= congressRank) origin.reached++;
    for (const id of run.firedEvents) bump(report.eventFiredRuns, id);
  }

  report.meanYears = runs === 0 ? 0 : years / runs;
  for (const e of catalog.events) {
    if (e.scheduledOnly) continue;
    const fired = report.eventFiredRuns[e.id] ?? 0;
    if (fired === 0) report.neverFired.push(e.id);
    else if (fired / runs < 0.05) report.lowFired.push(e.id);
  }
  return report;
}

const pct = (n: number, total: number) => `${total === 0 ? 0 : ((100 * n) / total).toFixed(1)}%`;

function table(title: string, map: Record<string, number>, total: number): string[] {
  const rows = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return [
    title,
    ...rows.map(([k, v]) => `  ${k.padEnd(28)} ${String(v).padStart(5)}  ${pct(v, total)}`),
  ];
}

export function formatReport(r: BatchReport): string {
  const lines = [
    `Partidas simuladas: ${r.runs} (média de ${r.meanYears.toFixed(1)} anos)`,
    `Entraram na política: ${pct(r.enteredPolitics, r.runs)}`,
    `Cassados: ${pct(r.removed, r.runs)}`,
    "",
    ...table("Arquétipos:", r.archetypes, r.runs),
    "",
    ...table("Níveis de legado:", r.tiers, r.runs),
    "",
    ...table("Finais especiais:", r.endings, r.runs),
    "",
    ...table("Cargo mais alto:", r.reachedOffice, r.runs),
    "",
    "Chegada ao Congresso por origem:",
    ...Object.entries(r.reachedCongress).map(
      ([o, v]) => `  ${o.padEnd(28)} ${pct(v.reached, v.runs)} (${v.reached}/${v.runs})`,
    ),
    "",
    `Eventos que nunca dispararam (${r.neverFired.length}): ${r.neverFired.join(", ") || "-"}`,
    `Eventos abaixo de 5% das partidas (${r.lowFired.length}): ${r.lowFired.join(", ") || "-"}`,
  ];
  return lines.join("\n");
}
