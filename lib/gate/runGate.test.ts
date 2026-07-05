import { describe, expect, it } from "vitest";
import {
  buildCleanListing,
  buildEmptyDiseaseNounPack,
  buildNegativeListing,
  DISCLAIMER,
  PRODUCT_NAME,
} from "@/lib/gate/fixtures";
import { runGate } from "@/lib/gate/runGate";
import { loadPack } from "@/lib/knowledge/loadPack";

describe("runGate integration", () => {
  it("passes a clean supplements listing", () => {
    const pack = loadPack("supplements");
    const listing = buildCleanListing(pack);
    const result = runGate(listing, pack, { subcategory: "probiotic" });
    expect(result.failures).toEqual([]);
    expect(result.pass).toBe(true);
  });

  it("returns expected failures on negative fixture including PACK when nouns empty", () => {
    const pack = buildEmptyDiseaseNounPack();
    const listing = buildNegativeListing(pack);
    const result = runGate(listing, pack, { subcategory: "probiotic" });

    expect(result.pass).toBe(false);
    const ids = result.failures.map((failure) => `${failure.checkId}:${failure.field}`);
    expect(ids).toContain("PACK:compliance");
    expect(ids).toContain("C2:bullets");
    expect(ids).toContain("C3:backendSearchTerms");
    expect(ids).toContain("C5:description");
    expect(ids).toContain("C5:fdaDisclaimer");
    expect(ids).toContain("C15:title75");
    expect(ids).toContain("C15:itemHighlights");
  });

  it("detects missing disclaimer in description", () => {
    const pack = loadPack("supplements");
    const listing = buildCleanListing(pack);
    listing.description = listing.description.replace(DISCLAIMER, "").trim();
    const result = runGate(listing, pack, {
      subcategory: "probiotic",
      productName: PRODUCT_NAME,
    });
    expect(result.failures.some((f) => f.checkId === "C5" && f.field === "description")).toBe(
      true,
    );
  });
});
