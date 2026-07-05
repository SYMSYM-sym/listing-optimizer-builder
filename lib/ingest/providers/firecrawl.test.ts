import { describe, expect, it, vi, afterEach } from "vitest";
import { createFirecrawlProvider } from "@/lib/ingest/providers/firecrawl";
import { IngestError } from "@/lib/ingest/types";

describe("createFirecrawlProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("scrapes HTML and maps listing fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: {
            html: `
              <span id="productTitle">Firecrawl Product</span>
              <span class="a-list-item">Benefit bullet</span>
              <div id="productDescription">Description text</div>
            `,
            metadata: { statusCode: 200 },
          },
        }),
      }),
    );

    const provider = createFirecrawlProvider("test-key");
    const raw = await provider.fetch("B0TEST1234");

    expect(raw.title).toBe("Firecrawl Product");
    expect(raw.bullets?.[0]).toBe("Benefit bullet");
  });

  it("throws BLOCKED on captcha-style failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: false,
          error: "Blocked by captcha",
        }),
      }),
    );

    const provider = createFirecrawlProvider("test-key");
    await expect(provider.fetch("B0TEST1234")).rejects.toMatchObject({
      code: "BLOCKED",
    } satisfies Partial<IngestError>);
  });

  it("throws NOT_FOUND for 404 pages", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { html: "<html></html>", metadata: { statusCode: 404 } },
        }),
      }),
    );

    const provider = createFirecrawlProvider("test-key");
    await expect(provider.fetch("B0TEST1234")).rejects.toMatchObject({
      code: "NOT_FOUND",
    } satisfies Partial<IngestError>);
  });
});
