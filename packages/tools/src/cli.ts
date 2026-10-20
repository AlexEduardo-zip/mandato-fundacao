import { loadRawContent, toCatalog } from "@mandato/content";
import { formatReport, simulateBatch } from "./simulate.js";

const runs = Number(process.argv[2] ?? 200);
const seed = process.argv[3] ?? "batch";
const catalog = toCatalog(loadRawContent().anchors);

console.log(formatReport(simulateBatch(runs, seed, catalog)));
