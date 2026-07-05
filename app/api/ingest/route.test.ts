import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/ingest/route";
import { clearIngestCache } from "@/lib/ingest/cache";
import { resetRateLimits } from "@/lib/ingest/rateLimit";
import { IngestError } from "@/lib/ingest/types";
import * as providers from "@/lib/ingest/providers";

describe("POST /api/ingest", () => {
  beforeEach(() => {
    clearIngestCache();
    resetRateLimits();
    vi.stubEnv("INGEST_PROVIDER", "paste");
    delete process.env.RAINFOREST_API_KEY;
    delete process.env.FIRECRAWL_API_KEY;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("returns structured 400 for invalid URL", async () => {
    const response = await POST(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://example.com/nope" }),
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("INVALID_URL");
  });

  it("returns structured 400 for invalid JSON body", async () => {
    const response = await POST(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{not-json",
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe("INVALID_INPUT");
  });

  it("returns snapshot for paste fields", async () => {
    const response = await POST(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "B0TEST1234",
          fields: {
            title: "Route Paste Title",
            bullets: ["Benefit one"],
            description: "Route description",
            category: "Supplements",
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    const snapshot = await response.json();
    expect(snapshot.asin).toBe("B0TEST1234");
    expect(snapshot.title).toBe("Route Paste Title");
    expect(snapshot.bullets).toEqual(["Benefit one"]);
  });

  it("returns snapshot for pasted HTML", async () => {
    const response = await POST(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "B0TEST1234",
          html: '<span id="productTitle">HTML Route Title</span><span class="a-list-item">Bullet</span>',
        }),
      }),
    );

    expect(response.status).toBe(200);
    const snapshot = await response.json();
    expect(snapshot.title).toBe("HTML Route Title");
  });

  it("returns cached snapshot on repeat request", async () => {
    const request = {
      url: "B0TEST1234",
      fields: { title: "Cached Title", bullets: ["A"] },
    };

    const first = await POST(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }),
    );
    expect(first.status).toBe(200);

    const second = await POST(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      }),
    );
    expect(second.status).toBe(200);
    const snapshot = await second.json();
    expect(snapshot.title).toBe("Cached Title");
  });

  it("returns 429 when rate limit exceeded", async () => {
    const payload = {
      url: "B0TEST1234",
      fields: { title: "Rate Title", bullets: ["A"] },
    };

    for (let i = 0; i < 20; i += 1) {
      const ok = await POST(
        new Request("http://localhost/api/ingest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": "1.2.3.4",
          },
          body: JSON.stringify(payload),
        }),
      );
      expect(ok.status).toBe(200);
    }

    const limited = await POST(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "1.2.3.4",
        },
        body: JSON.stringify(payload),
      }),
    );

    expect(limited.status).toBe(429);
    const body = await limited.json();
    expect(body.error).toBe("RATE_LIMITED");
  });

  it("uses provider adapter when INGEST_PROVIDER=rainforest", async () => {
    vi.stubEnv("INGEST_PROVIDER", "rainforest");
    vi.stubEnv("RAINFOREST_API_KEY", "test-key");

    vi.spyOn(providers, "createListingProvider").mockReturnValue({
      fetch: vi.fn().mockResolvedValue({
        asin: "B0TEST1234",
        title: "Provider Title",
        bullets: ["From provider"],
        raw: {},
      }),
    });

    const response = await POST(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://www.amazon.com/dp/B0TEST1234" }),
      }),
    );

    expect(response.status).toBe(200);
    const snapshot = await response.json();
    expect(snapshot.title).toBe("Provider Title");
  });

  it("returns 404 for provider NOT_FOUND errors", async () => {
    vi.stubEnv("INGEST_PROVIDER", "rainforest");
    vi.stubEnv("RAINFOREST_API_KEY", "test-key");

    vi.spyOn(providers, "createListingProvider").mockReturnValue({
      fetch: vi.fn().mockRejectedValue(
        new IngestError("NOT_FOUND", "Product not found"),
      ),
    });

    const response = await POST(
      new Request("http://localhost/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "B0TEST1234" }),
      }),
    );

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toBe("NOT_FOUND");
  });
});
