import { IngestError, type ListingProvider, type RawListing } from "@/lib/ingest/types";
import { asinToUrl } from "@/lib/ingest/parseAsin";
import { parseAmazonHtml } from "@/lib/ingest/parseHtml";

type FirecrawlResponse = {
  success?: boolean;
  data?: {
    html?: string;
    markdown?: string;
    metadata?: { statusCode?: number; title?: string };
  };
  error?: string;
};

export function createFirecrawlProvider(apiKey: string): ListingProvider {
  return {
    async fetch(asin: string): Promise<RawListing> {
      const url = asinToUrl(asin);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      try {
        const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url, formats: ["html"] }),
          signal: controller.signal,
        });

        if (response.status === 429) {
          throw new IngestError("BLOCKED", "Firecrawl rate limit reached.");
        }

        if (!response.ok) {
          throw new IngestError(
            "PROVIDER_ERROR",
            `Firecrawl API returned ${response.status}.`,
          );
        }

        const payload = (await response.json()) as FirecrawlResponse;
        const html = payload.data?.html;
        const statusCode = payload.data?.metadata?.statusCode;

        if (statusCode === 404) {
          throw new IngestError("NOT_FOUND", `Product page not found for ASIN ${asin}.`);
        }

        if (statusCode === 503 || /captcha|robot/i.test(payload.error ?? "")) {
          throw new IngestError("BLOCKED", "Amazon blocked automated access to this PDP.");
        }

        if (!payload.success || !html) {
          throw new IngestError(
            "PROVIDER_ERROR",
            payload.error ?? "Firecrawl returned no HTML content.",
          );
        }

        const parsed = parseAmazonHtml(html);
        if (!parsed.title && (!parsed.bullets || parsed.bullets.length === 0)) {
          throw new IngestError(
            "PARSE_ERROR",
            "Firecrawl HTML could not be parsed into listing fields.",
          );
        }

        const listing: RawListing = {
          asin: asin.toUpperCase(),
          url,
          title: parsed.title,
          bullets: parsed.bullets,
          description: parsed.description,
          images: parsed.images,
          attributes: parsed.attributes,
          price: parsed.price,
          rating: parsed.rating,
          category: parsed.category ?? "Unknown",
          subcategory: parsed.subcategory ?? parsed.category ?? "general",
          raw: { source: "firecrawl", htmlLength: html.length },
        };

        return listing;
      } catch (error) {
        if (error instanceof IngestError) throw error;
        if (error instanceof Error && error.name === "AbortError") {
          throw new IngestError("TIMEOUT", "Firecrawl scrape timed out.");
        }
        throw new IngestError(
          "PROVIDER_ERROR",
          error instanceof Error ? error.message : "Firecrawl request failed.",
        );
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
