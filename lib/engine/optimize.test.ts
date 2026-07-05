import { describe, expect, it } from "vitest";
import { optimize } from "@/lib/engine/optimize";
import { createMockLlmClient } from "@/lib/engine/llm";
import type { ListingSnapshot } from "@/lib/types";

const snapshot: ListingSnapshot = {
  asin: "B0TEST1234",
  url: "https://www.amazon.com/dp/B0TEST1234",
  title: "Daily Probiotic - Gut Health Supplement",
  bullets: ["Supports digestion"],
  description: "A probiotic supplement.",
  images: [],
  attributes: {
    brand_name: "Daily Probiotic",
    unit_count: "60",
    servings_per_container: "30",
    primary_supplement_type: "Probiotic",
  },
  category: "Health & Household",
  subcategory: "",
  raw: {},
};

describe("optimize", () => {
  it("returns a complete OptimizedListing using mock LLM groups", async () => {
    const llm = createMockLlmClient([
      {
        productName: "Daily Probiotic",
        title: "Daily Probiotic Gut Health Capsules",
        title75: "Daily Probiotic Gut Health Capsules",
        itemHighlights: "Probiotic supplement for adults",
      },
      {
        bullets: [
          "When your morning routine needs digestive support, take two capsules daily *",
          "B2",
          "B3",
          "B4",
          "B5",
        ],
      },
      { description: "Daily Probiotic supports normal digestive function." },
      { backendSearchTerms: "probiotics gut flora microflora" },
      { attributes: { brand_name: "Daily Probiotic", unit_count: "60" } },
      {
        modules: [
          {
            id: "hero",
            headline: "Hero",
            body: "Supports digestive balance.",
            claimBearing: true,
          },
        ],
        comparison: { rows: [{ label: "Potency", ours: "High", typical: "Low" }] },
        faq: [{ q: "Daily use?", a: "Take daily for digestive support.", claimBearing: true }],
      },
      {
        imagePlan: [
          { slot: 1, role: "main", description: "White background product", specs: "1000px min" },
        ],
      },
      {
        qa: [
          {
            question: "What is it?",
            answer: "A probiotic for digestive support.",
            claimBearing: true,
          },
        ],
      },
    ]);

    const listing = await optimize({ snapshot, packId: "supplements", llm });

    expect(listing.title.startsWith("Daily Probiotic")).toBe(true);
    expect(listing.bullets).toHaveLength(5);
    expect(listing.facts.unitCount).toBe(60);
    expect(listing.aplusContent.modules.length).toBeGreaterThan(0);
    expect(listing.aplusContent.comparison.rows.length).toBeGreaterThan(0);
    expect(listing.aplusContent.faq.length).toBeGreaterThan(0);
    expect(listing.description).toContain("Food and Drug Administration");
    expect(listing.state).toBe("draft");
  });
});
