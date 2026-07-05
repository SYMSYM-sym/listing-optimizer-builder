import { describe, expect, it } from "vitest";
import { parseAsin } from "@/lib/ingest/parseAsin";

describe("parseAsin", () => {
  it.each([
    ["https://www.amazon.com/dp/B0TEST1234", "B0TEST1234"],
    ["https://www.amazon.com/dp/B0TEST1234/ref=cm_sw_r_cp_ap_ap", "B0TEST1234"],
    ["https://www.amazon.com/gp/product/B0TEST1234", "B0TEST1234"],
    ["https://www.amazon.com/gp/aw/d/B0TEST1234", "B0TEST1234"],
    ["https://www.amazon.com/product/B0TEST1234", "B0TEST1234"],
    ["https://www.amazon.com/s?k=test&asin=B0TEST1234", "B0TEST1234"],
    ["www.amazon.co.uk/dp/B0TEST1234", "B0TEST1234"],
    ["b0test1234", "B0TEST1234"],
    ["https://www.amazon.com/dp/B0TEST1234?th=1&psc=1", "B0TEST1234"],
  ])("parses %s", (input, expected) => {
    expect(parseAsin(input)).toBe(expected);
  });

  it("returns null for empty input", () => {
    expect(parseAsin("")).toBeNull();
  });

  it("returns null for invalid URL", () => {
    expect(parseAsin("https://example.com/no-asin-here")).toBeNull();
  });
});
