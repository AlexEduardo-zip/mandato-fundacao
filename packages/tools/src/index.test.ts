import { describe, expect, it } from "vitest";
import { TOOLS_READY } from "./index.js";

describe("tools", () => {
  it("exports its scaffold", () => {
    expect(TOOLS_READY).toBe(true);
  });
});
