import { describe, expect, it } from "vitest";
import { detectCategory } from "@/lib/knowledge/detectCategory";
import type { ListingSnapshot } from "@/lib/types";

function snapshot(partial: Partial<ListingSnapshot>): ListingSnapshot {
  return {
    asin: "B0TEST1234",
    url: "https://www.amazon.com/dp/B0TEST1234",
    title: "",
    bullets: [],
    description: "",
    images: [],
    attributes: {},
    category: "",
    subcategory: "",
    raw: {},
    ...partial,
  };
}

describe("detectCategory", () => {
  it("returns supplements + probiotic subcategory for probiotic listings", () => {
    const result = detectCategory(
      snapshot({
        category: "Health & Household",
        title: "Daily Probiotic Capsules for Gut Health",
        attributes: { primary_supplement_type: "Probiotic" },
      }),
    );

    expect(result.packId).toBe("supplements");
    expect(result.subcategory).toBe("probiotic");
  });

  it("returns supplements + joint subcategory for joint listings", () => {
    const result = detectCategory(
      snapshot({
        title: "Glucosamine Chondroitin Joint Support Supplement",
        category: "Dietary Supplements",
      }),
    );

    expect(result.packId).toBe("supplements");
    expect(result.subcategory).toBe("joint");
  });

  it("returns generic for non-supplement electronics", () => {
    const result = detectCategory(
      snapshot({
        category: "Electronics",
        title: "Wireless Bluetooth Headphones",
      }),
    );

    expect(result.packId).toBe("generic");
    expect(result.subcategory).toBe("general");
  });

  it("returns generic for clothing listings", () => {
    const result = detectCategory(
      snapshot({
        category: "Clothing, Shoes & Jewelry",
        title: "Men's Running Shoes",
      }),
    );

    expect(result.packId).toBe("generic");
  });

  it("still returns supplements for beauty-aisle supplement listings", () => {
    const result = detectCategory(
      snapshot({
        category: "Beauty & Personal Care",
        title: "Collagen Beauty Supplement for Skin",
      }),
    );

    expect(result.packId).toBe("supplements");
  });

  it("falls back to general subcategory when supplement type is unclear", () => {
    const result = detectCategory(
      snapshot({
        category: "Health & Household",
        title: "Daily Multivitamin Supplement",
      }),
    );

    expect(result.packId).toBe("supplements");
    expect(result.subcategory).toBe("general");
  });

  it.each([
    ["Melatonin Sleep Support Supplement", "sleep"],
    ["Elderberry Immune Support Gummies", "immunity"],
    ["Digestive Enzyme Fiber Blend", "digestive"],
    ["Women's Prenatal Multivitamin", "womens"],
    ["Men's Prostate Health Formula", "mens"],
    ["CoQ10 Heart Health Softgels", "heart"],
  ])("detects %s as %s", (title, subcategory) => {
    const result = detectCategory(
      snapshot({
        category: "Dietary Supplements",
        title,
      }),
    );

    expect(result.packId).toBe("supplements");
    expect(result.subcategory).toBe(subcategory);
  });
});
