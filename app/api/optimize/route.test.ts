import { describe, expect, it, vi, afterEach } from "vitest";
import { POST } from "@/app/api/optimize/route";
import * as optimizeModule from "@/lib/engine/optimize";

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

  it("returns OptimizedListing JSON", async () => {
    vi.spyOn(optimizeModule, "optimize").mockResolvedValue({
      title: "Daily Probiotic Capsules",
      title75: "Daily Probiotic Capsules",
      itemHighlights: "Probiotic",
      bullets: ["A *", "B", "C", "D", "E"],
      description: "Desc with disclaimer",
      backendSearchTerms: "synonyms",
      attributes: {},
      facts: { unitCount: 60 },
      fdaDisclaimer: "FDA text",
      aplusContent: {
        fdaDisclaimer: "FDA text",
        modules: [],
        comparison: { rows: [] },
        faq: [],
      },
      imagePlan: [],
      qa: [],
      state: "draft",
    } as never);

    const response = await POST(
      new Request("http://localhost/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          snapshot: {
            asin: "B0TEST1234",
            url: "https://www.amazon.com/dp/B0TEST1234",
            title: "Daily Probiotic",
            bullets: [],
            description: "",
            images: [],
            attributes: {},
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
    expect(body.title).toContain("Daily Probiotic");
    expect(body.facts.unitCount).toBe(60);
  });
});
