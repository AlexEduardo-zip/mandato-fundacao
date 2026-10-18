import { describe, expect, it } from "vitest";
import { CONTENT_ENGINE_VERSION } from "./index.js";

describe("content", () => {
  it("exports its scaffold", () => {
    expect(CONTENT_ENGINE_VERSION).toBe("0.0.0");
  });
});
