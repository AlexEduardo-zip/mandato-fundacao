import { loadRawContent, toCatalog } from "@mandato/content";
import { formatReport, simulateBatch } from "./simulate.js";

const runs = Number(process.argv[2] ?? 200);
const seed = process.argv[3] ?? "batch";
const catalog = (() => {
  const raw = loadRawContent();
  return toCatalog(raw.anchors, raw.events);
})();

console.log(formatReport(simulateBatch(runs, seed, catalog)));
