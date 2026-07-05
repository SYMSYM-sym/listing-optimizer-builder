import { IngestError, type ListingProvider, type RawListing } from "@/lib/ingest/types";
import { asinToUrl } from "@/lib/ingest/parseAsin";

type RainforestProduct = {
  asin?: string;
  title?: string;
  link?: string;
  feature_bullets?: string[];
  description?: string;
  rating?: number;
  main_image?: { link?: string };
  images?: { link?: string }[];
  buybox_winner?: { price?: { raw?: string; value?: number; currency?: string } };
  categories?: { name?: string }[];
  specifications?: { name?: string; value?: string }[];
  attributes?: { name?: string; value?: string }[];
};

type RainforestResponse = {
  product?: RainforestProduct;
  request_info?: { success?: boolean; message?: string };
};

function mapRainforestProduct(asin: string, product: RainforestProduct): RawListing {
  const attributes: Record<string, string> = {};
  for (const spec of product.specifications ?? product.attributes ?? []) {
    if (spec.name && spec.value) {
      attributes[spec.name.replace(/\s+/g, "_").toLowerCase()] = spec.value;
    }
  }

  const categories = (product.categories ?? [])
    .map((c) => c.name)
    .filter(Boolean) as string[];

  const images = [
    product.main_image?.link,
    ...(product.images ?? []).map((img) => img.link),
  ].filter(Boolean) as string[];

  return {
    asin,
    url: product.link ?? asinToUrl(asin),
    title: product.title,
    bullets: product.feature_bullets,
    description: product.description,
    images,
    attributes,
    price: product.buybox_winner?.price?.raw,
    rating: product.rating,
    category: categories[0] ?? "Unknown",
    subcategory: categories.at(-1) ?? categories[0] ?? "general",
    raw: product,
  };
}

export function createRainforestProvider(apiKey: string): ListingProvider {
  return {
    async fetch(asin: string): Promise<RawListing> {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25_000);

      try {
        const params = new URLSearchParams({
          api_key: apiKey,
          type: "product",
          amazon_domain: "amazon.com",
          asin: asin.toUpperCase(),
        });

        const response = await fetch(
          `https://api.rainforestapi.com/request?${params.toString()}`,
          { signal: controller.signal },
        );

        if (response.status === 404) {
          throw new IngestError("NOT_FOUND", `Product not found for ASIN ${asin}.`);
        }

        if (response.status === 429) {
          throw new IngestError("BLOCKED", "Rainforest API rate limit reached.");
        }

        if (!response.ok) {
          throw new IngestError(
            "PROVIDER_ERROR",
            `Rainforest API returned ${response.status}.`,
          );
        }

        const data = (await response.json()) as RainforestResponse;
        if (!data.product) {
          const message = data.request_info?.message ?? "No product data returned.";
          if (/not found/i.test(message)) {
            throw new IngestError("NOT_FOUND", message);
          }
          throw new IngestError("PROVIDER_ERROR", message);
        }

        return mapRainforestProduct(asin.toUpperCase(), data.product);
      } catch (error) {
        if (error instanceof IngestError) throw error;
        if (error instanceof Error && error.name === "AbortError") {
          throw new IngestError("TIMEOUT", "Rainforest API request timed out.");
        }
        throw new IngestError(
          "PROVIDER_ERROR",
          error instanceof Error ? error.message : "Rainforest request failed.",
        );
      } finally {
        clearTimeout(timeout);
      }
    },
  };
}
