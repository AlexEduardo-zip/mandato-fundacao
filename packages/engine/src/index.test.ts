import { describe, expect, it } from "vitest";
import { ENGINE_VERSION } from "./index.js";

describe("engine", () => {
  it("exports its scaffold", () => {
    expect(ENGINE_VERSION).toBe("0.0.0");
  });
});
