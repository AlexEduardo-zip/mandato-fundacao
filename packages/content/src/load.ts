import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { RawContent } from "./validate.js";

/** Folder with the JSON content, next to `src` and `dist`. */
export const DATA_DIR = fileURLToPath(new URL("../data/", import.meta.url));

export function loadRawContent(dir: string = DATA_DIR): RawContent {
  const read = (file: string): unknown => JSON.parse(readFileSync(`${dir}${file}`, "utf8"));
  return {
    anchors: read("anchors.json"),
    origins: read("origins.json"),
    parties: read("parties.json"),
  };
}
