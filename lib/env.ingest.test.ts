import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { getIngestEnv } from "@/lib/env";

describe("getIngestEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("defaults to rainforest and requires RAINFOREST_API_KEY", () => {
    delete process.env.INGEST_PROVIDER;
    delete process.env.RAINFOREST_API_KEY;
    expect(() => getIngestEnv()).toThrow("RAINFOREST_API_KEY");
  });

  it("loads paste provider without ingest API keys", () => {
    process.env.INGEST_PROVIDER = "paste";
    const env = getIngestEnv();
    expect(env.ingestProvider).toBe("paste");
  });
});
