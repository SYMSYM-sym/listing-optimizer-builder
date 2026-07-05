import { describe, expect, it } from "vitest";
import { buildFacts } from "@/lib/engine/facts";
import type { ListingSnapshot } from "@/lib/types";

describe("buildFacts", () => {
  it("reads numeric truths from snapshot attributes", () => {
    const snapshot: ListingSnapshot = {
      asin: "B0TEST1234",
      url: "https://www.amazon.com/dp/B0TEST1234",
      title: "Brand 5-in-1 Daily Supplement",
      bullets: [],
      description: "",
      images: [],
      attributes: {
        unit_count: "60",
        servings_per_container: "30",
        serving_size: "2 Capsules",
        maximum_dosage: "500 mg blend",
        item_weight: "4 Ounces",
        standard_price: "$29.99",
      },
      price: "$29.99",
      category: "Health",
      subcategory: "general",
      raw: {},
    };

    const facts = buildFacts(snapshot);
    expect(facts.unitCount).toBe(60);
    expect(facts.servings).toBe(30);
    expect(facts.servingSize).toBe("2 Capsules");
    expect(facts.potency).toBe("500 mg blend");
    expect(facts.weight).toBe("4 Ounces");
    expect(facts.price).toBe("$29.99");
    expect(facts.daySupply).toBe(30);
    expect(facts.formulaCount).toBe(5);
  });

  it("derives daySupply from unit count and serving size when servings missing", () => {
    const facts = buildFacts({
      asin: "B0TEST1234",
      url: "https://www.amazon.com/dp/B0TEST1234",
      title: "Capsules",
      bullets: [],
      description: "",
      images: [],
      attributes: {
        unit_count: "60",
        serving_size: "2 Capsules",
      },
      category: "Health",
      subcategory: "general",
      raw: {},
    });

    expect(facts.daySupply).toBe(30);
    expect(facts.unitCount).toBe(60);
  });
});
