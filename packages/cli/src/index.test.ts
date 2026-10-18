import { describe, expect, it } from "vitest";
import { CLI_READY } from "./index.js";

describe("cli", () => {
  it("exports its scaffold", () => {
    expect(CLI_READY).toBe(true);
  });
});
