import { describe, expect, it, vi, afterEach } from "vitest";
import { POST } from "@/app/api/optimize/route";
import * as repairModule from "@/lib/engine/repair";

describe("POST /api/optimize", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 400 for missing snapshot", async () => {
    const response = await POST(
      new Request("http://localhost/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns optimized listing and audit together", async () => {
    vi.spyOn(repairModule, "optimizeWithRepair").mockResolvedValue({
      listing: {
        title: "Daily Probiotic Capsules",
        title75: "Daily Probiotic Capsules",
        itemHighlights: "Probiotic",
        bullets: ["A *", "B", "C", "D", "E"],
        description: "Desc with disclaimer",
        backendSearchTerms: "synonyms",
        attributes: { brand_name: "Acme Labs", primary_supplement_type: "Probiotic" },
        facts: { unitCount: 60 },
        fdaDisclaimer:
          "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.",
        aplusContent: {
          fdaDisclaimer:
            "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.",
          modules: [
            {
              id: "brand-story",
              headline: "Daily Probiotic",
              body: "Daily Probiotic story",
              claimBearing: true,
            },
            {
              id: "hero",
              headline: "Daily Probiotic hero",
              body: "Daily Probiotic hero body",
              claimBearing: true,
            },
            {
              id: "ingredients",
              headline: "Ingredients",
              body: "Ingredients list",
              claimBearing: false,
            },
          ],
          comparison: { rows: [{ label: "Quality", ours: "High", typical: "Low" }] },
          faq: [{ q: "Use?", a: "Daily", claimBearing: true }],
        },
        imagePlan: [],
        qa: [{ question: "What?", answer: "Probiotic", claimBearing: false }],
        state: "draft",
      },
      gateResult: { pass: true, failures: [] },
      verified: true,
      repairIterations: 0,
      regeneratedGroups: [],
    });

    const response = await POST(
      new Request("http://localhost/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshot: {
            asin: "B0TEST1234",
            url: "https://www.amazon.com/dp/B0TEST1234",
            title: "Daily Probiotic",
            bullets: ["Supports digestion"],
            description: "Short description",
            images: [],
            attributes: { brand_name: "Acme Labs", primary_supplement_type: "Probiotic" },
            category: "Health",
            subcategory: "probiotic",
            raw: {},
          },
          packId: "supplements",
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.optimized.title).toContain("Daily Probiotic");
    expect(body.audit.scorecard.total).toBeGreaterThan(0);
    expect(body.audit.gaps.length).toBeGreaterThanOrEqual(3);
    expect(body.audit.verified).toBe(body.audit.gateResult.pass);
  });
});
