import { describe, expect, it } from "vitest";
import { rawListingFromPaste } from "@/lib/ingest/paste";
import { toSnapshot } from "@/lib/ingest/toSnapshot";
import { IngestError } from "@/lib/ingest/types";

describe("toSnapshot", () => {
  it("normalizes a raw listing into ListingSnapshot", () => {
    const snapshot = toSnapshot({
      asin: "b0test1234",
      title: " Test Product ",
      bullets: [" one ", "", "two"],
      description: "Desc",
      images: ["https://img.example/a.jpg"],
      attributes: { brand_name: "Brand" },
      price: "$19.99",
      rating: 4.6,
      category: "Health",
      subcategory: "Probiotics",
      raw: { source: "test" },
    });

    expect(snapshot.asin).toBe("B0TEST1234");
    expect(snapshot.url).toContain("/dp/B0TEST1234");
    expect(snapshot.title).toBe("Test Product");
    expect(snapshot.bullets).toEqual(["one", "two"]);
    expect(snapshot.subcategory).toBe("Probiotics");
  });
});

describe("rawListingFromPaste", () => {
  it("accepts raw fields", () => {
    const raw = rawListingFromPaste("B0TEST1234", {
      fields: {
        title: "Paste Title",
        bullets: ["Bullet 1"],
        description: "Paste description",
      },
    });

    expect(raw.title).toBe("Paste Title");
    expect(raw.bullets).toEqual(["Bullet 1"]);
  });

  it("parses pasted HTML", () => {
    const html = `
      <span id="productTitle">HTML Product Title</span>
      <div id="feature-bullets">
        <span class="a-list-item">Supports daily wellness</span>
        <span class="a-list-item">Easy to take capsules</span>
      </div>
      <div id="productDescription">Long product description here.</div>
    `;

    const raw = rawListingFromPaste("B0TEST1234", { html });
    expect(raw.title).toBe("HTML Product Title");
    expect(raw.bullets?.length).toBeGreaterThan(0);
  });

  it("throws when paste input is empty", () => {
    expect(() => rawListingFromPaste("B0TEST1234", {})).toThrow(IngestError);
  });
});
