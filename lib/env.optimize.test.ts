import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getOptimizeEnv } from "@/lib/env";

describe("getOptimizeEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("loads Anthropic env without ingest provider keys", () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    delete process.env.RAINFOREST_API_KEY;
    delete process.env.INGEST_PROVIDER;

    const env = getOptimizeEnv();
    expect(env.anthropicApiKey).toBe("test-key");
  });
});
