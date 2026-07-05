import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getEnv } from "@/lib/env";

describe("getEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("throws when ANTHROPIC_API_KEY is missing", () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(() => getEnv()).toThrow("ANTHROPIC_API_KEY");
  });

  it("loads paste provider without ingest API keys", () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.INGEST_PROVIDER = "paste";
    const env = getEnv();
    expect(env.ingestProvider).toBe("paste");
    expect(env.maxRepairIterations).toBe(3);
  });

  it("throws when RAINFOREST_API_KEY is missing for default provider", () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    delete process.env.INGEST_PROVIDER;
    delete process.env.RAINFOREST_API_KEY;
    expect(() => getEnv()).toThrow("RAINFOREST_API_KEY");
  });

  it("throws when FIRECRAWL_API_KEY is missing for firecrawl provider", () => {
    process.env.ANTHROPIC_API_KEY = "test-key";
    process.env.INGEST_PROVIDER = "firecrawl";
    delete process.env.FIRECRAWL_API_KEY;
    expect(() => getEnv()).toThrow("FIRECRAWL_API_KEY");
  });
});
