import { defaultConfig, type EngineConfig } from "./config.js";
import { Rng } from "./rng.js";
import type { ElectionResult } from "./election.js";
import type { Catalog, GameState, OfficeId } from "./types.js";

export function renderTemplate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? ""));
}

const BIG_WIN_PCT = 40;

function variants(kind: string, config: EngineConfig): string[] {
  const list = config.texts.headlines[kind];
  if (!list || list.length === 0) throw new Error(`no headline templates for ${kind}`);
  return list;
}

function officeLabel(office: OfficeId, config: EngineConfig): string {
  return config.offices[office]?.label ?? office;
}

/** Picks a template with the rng; returns the headline and the advanced rng state. */
export function electionHeadline(
  result: ElectionResult,
  rngState: number,
  config: EngineConfig = defaultConfig,
): { text: string; rng: number } {
  const kind = !result.won
    ? "election_loss"
    : result.votePct >= BIG_WIN_PCT
      ? "election_win_big"
      : "election_win";
  const rng = new Rng(rngState);
  const text = renderTemplate(rng.pick(variants(kind, config)), {
    office: officeLabel(result.office, config),
    pct: result.votePct,
    year: result.year,
  });
  return { text, rng: rng.state };
}

export function mandateEndHeadline(
  office: OfficeId,
  year: number,
  rngState: number,
  config: EngineConfig = defaultConfig,
): { text: string; rng: number } {
  const rng = new Rng(rngState);
  const text = renderTemplate(rng.pick(variants("mandate_end", config)), {
    office: officeLabel(office, config),
    year,
  });
  return { text, rng: rng.state };
}

export interface YearSummary {
  year: number;
  headlines: string[];
  lines: string[];
  text: string;
}

/** Plain-language recap of one year, built only from the history and the templates. */
export function yearSummary(
  state: GameState,
  catalog: Catalog,
  year: number = state.player.year,
  config: EngineConfig = defaultConfig,
): YearSummary {
  const tpl = config.texts.summary;
  const titleOf = (id?: string) => catalog.events.find((e) => e.id === id)?.title ?? id ?? "";
  const entries = state.player.history.filter((h) => h.year === year);
  const lines: string[] = [];
  for (const h of entries) {
    if (h.kind === "anchor") lines.push(renderTemplate(tpl.anchor, { title: titleOf(h.eventId) }));
    else if (h.kind === "event")
      lines.push(renderTemplate(tpl.event, { title: titleOf(h.eventId) }));
    else if (h.kind === "choice" && h.text)
      lines.push(renderTemplate(tpl.decision, { text: h.text }));
    else if (h.kind === "election") {
      lines.push(
        renderTemplate(tpl.election, {
          office: officeLabel(h.office ?? "", config),
          result: h.won ? "vitória" : "derrota",
          pct: h.votePct ?? 0,
        }),
      );
    }
  }
  const headlines = entries
    .filter((h) => h.kind === "headline" && h.text)
    .map((h) => h.text as string);
  return {
    year,
    headlines,
    lines,
    text: lines.length > 0 ? lines.join(" ") : tpl.empty,
  };
}
