import { describe, expect, it } from "vitest";
import { assembleOptimizedListing } from "@/lib/engine/assemble";
import { loadPack } from "@/lib/knowledge/loadPack";

const DISCLAIMER =
  "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.";

describe("assembleOptimizedListing", () => {
  it("injects disclaimer in description and claim-bearing A+ content", () => {
    const pack = loadPack("supplements");
    const listing = assembleOptimizedListing(
      pack,
      { unitCount: 60, servings: 30 },
      {
        title: {
          productName: "Daily Probiotic",
          title: "Daily Probiotic Capsules",
          title75: "Daily Probiotic Capsules",
          itemHighlights: "Gut health support",
        },
        bullets: {
          bullets: [
            "Supports healthy digestion *",
            "B",
            "C",
            "D",
            "E",
          ],
        },
        description: { description: "Daily Probiotic supports normal gut function." },
        backend: { backendSearchTerms: "probiotics gut microflora" },
        attributes: { attributes: { brand_name: "Brand" } },
        aplus: {
          modules: [
            {
              id: "hero",
              headline: "Hero",
              body: "Supports digestive balance.",
              claimBearing: true,
            },
          ],
          comparison: { rows: [{ label: "Quality", ours: "High", typical: "Mixed" }] },
          faq: [{ q: "How to use?", a: "Take daily for digestive support.", claimBearing: true }],
        },
        images: {
          imagePlan: [{ slot: 1, role: "main", description: "White bg", specs: "1000px" }],
        },
        qa: {
          qa: [
            {
              question: "What is it?",
              answer: "A daily probiotic for digestive support.",
              claimBearing: true,
            },
          ],
        },
      },
    );

    expect(listing.title.startsWith("Daily Probiotic")).toBe(true);
    expect(listing.description).toContain(DISCLAIMER);
    expect(listing.fdaDisclaimer).toBe(DISCLAIMER);
    expect(listing.aplusContent.fdaDisclaimer).toBe(DISCLAIMER);
    expect(listing.aplusContent.modules[0].body).toContain(DISCLAIMER);
    expect(listing.aplusContent.faq[0].a).toContain(DISCLAIMER);
    expect(listing.qa[0].answer).toContain(DISCLAIMER);
    expect(listing.bullets[0].endsWith("*")).toBe(true);
    expect(listing.facts.unitCount).toBe(60);
    expect(listing.state).toBe("draft");
  });
});
