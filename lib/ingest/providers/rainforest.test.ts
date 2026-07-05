import { describe, expect, it, vi, afterEach } from "vitest";
import { createRainforestProvider } from "@/lib/ingest/providers/rainforest";
import { IngestError } from "@/lib/ingest/types";

describe("createRainforestProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps Rainforest product JSON to RawListing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          product: {
            asin: "B0TEST1234",
            title: "Rainforest Title",
            feature_bullets: ["Bullet A"],
            description: "Rainforest description",
            rating: 4.8,
            main_image: { link: "https://img.example/main.jpg" },
            buybox_winner: { price: { raw: "$24.99" } },
            categories: [{ name: "Health" }, { name: "Probiotics" }],
          },
        }),
      }),
    );

    const provider = createRainforestProvider("test-key");
    const raw = await provider.fetch("B0TEST1234");

    expect(raw.title).toBe("Rainforest Title");
    expect(raw.bullets).toEqual(["Bullet A"]);
    expect(raw.category).toBe("Health");
    expect(raw.subcategory).toBe("Probiotics");
  });

  it("throws NOT_FOUND when product is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          request_info: { success: false, message: "Product not found" },
        }),
      }),
    );

    const provider = createRainforestProvider("test-key");
    await expect(provider.fetch("B0TEST1234")).rejects.toMatchObject({
      code: "NOT_FOUND",
    } satisfies Partial<IngestError>);
  });
});
