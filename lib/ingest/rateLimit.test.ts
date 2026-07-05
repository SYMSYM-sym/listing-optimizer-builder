import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimits } from "@/lib/ingest/rateLimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows requests under the limit", () => {
    for (let i = 0; i < 20; i += 1) {
      expect(checkRateLimit("test-client")).toBe(true);
    }
  });

  it("blocks requests over the limit", () => {
    for (let i = 0; i < 20; i += 1) {
      checkRateLimit("test-client");
    }
    expect(checkRateLimit("test-client")).toBe(false);
  });
});
