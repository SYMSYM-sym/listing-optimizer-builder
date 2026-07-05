import { describe, expect, it } from "vitest";
import { loadPack } from "@/lib/knowledge/loadPack";

describe("loadPack", () => {
  it("returns a fully populated supplements pack", () => {
    const pack = loadPack("supplements");

    expect(pack.id).toBe("supplements");
    expect(pack.principles).toHaveLength(16);
    expect(pack.attributeSchema.length).toBeGreaterThan(30);
    expect(pack.compliancePack.diseaseVerbs).toContain("treat");
    expect(pack.compliancePack.superlativeBans).toContain("#1");
    expect(pack.compliancePack.canonicalDisclaimer).toContain(
      "Food and Drug Administration",
    );

    for (const [subcategory, nouns] of Object.entries(
      pack.compliancePack.diseaseNounsBySubcategory,
    )) {
      expect(nouns.length, `${subcategory} must have disease nouns`).toBeGreaterThan(0);
    }
  });

  it("returns generic fallback with rules and principles only", () => {
    const pack = loadPack("generic");

    expect(pack.id).toBe("generic");
    expect(pack.principles).toHaveLength(16);
    expect(Object.keys(pack.rules).length).toBeGreaterThan(0);
    expect(pack.attributeSchema).toEqual([]);
    expect(pack.compliancePack.diseaseVerbs).toEqual([]);
    expect(pack.compliancePack.diseaseNounsBySubcategory).toEqual({});
  });
});
