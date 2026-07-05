import { describe, expect, it } from "vitest";
import { detectCategory, loadPack } from "@/lib/knowledge";

describe("knowledge exports", () => {
  it("loadPack('supplements') returns compiled pack", () => {
    const pack = loadPack("supplements");
    expect(pack.id).toBe("supplements");
    expect(pack.compliancePack.canonicalDisclaimer).toContain(
      "Food and Drug Administration",
    );
  });

  it("detectCategory returns supplements for supplement snapshots", () => {
    const result = detectCategory({
      asin: "B0TEST1234",
      url: "https://www.amazon.com/dp/B0TEST1234",
      title: "Vitamin D3 Supplement",
      bullets: [],
      description: "",
      images: [],
      attributes: {},
      category: "Health & Household",
      subcategory: "",
      raw: {},
    });

    expect(result.packId).toBe("supplements");
  });
});
