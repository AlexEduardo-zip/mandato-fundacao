import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("engine purity", () => {
  const dir = new URL(".", import.meta.url);
  const sources = readdirSync(dir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));

  it("finds the engine sources", () => {
    expect(sources.length).toBeGreaterThan(5);
  });

  it.each(["Math.random", "Date.now", "new Date", "performance.now", "node:"])(
    "no engine source uses %s",
    (token) => {
      for (const file of sources) {
        const code = readFileSync(new URL(file, dir), "utf8");
        expect(code.includes(token), `${file} uses ${token}`).toBe(false);
      }
    },
  );
});
