import { describe, expect, it } from "vitest";
import { parseAsin } from "@/lib/ingest/parseAsin";

describe("parseAsin", () => {
  it("parses a /dp/ URL", () => {
    expect(parseAsin("https://www.amazon.com/dp/B0TEST1234")).toBe("B0TEST1234");
  });

  it("parses a bare ASIN", () => {
    expect(parseAsin("b0test1234")).toBe("B0TEST1234");
  });

  it("returns null for empty input", () => {
    expect(parseAsin("")).toBeNull();
  });
});
