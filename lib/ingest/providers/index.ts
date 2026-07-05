import type { IngestProvider } from "@/lib/env";
import type { ListingProvider } from "@/lib/ingest/types";
import { createFirecrawlProvider } from "@/lib/ingest/providers/firecrawl";
import { createRainforestProvider } from "@/lib/ingest/providers/rainforest";

export function createListingProvider(
  provider: IngestProvider,
  keys: { rainforestApiKey?: string; firecrawlApiKey?: string },
): ListingProvider | null {
  if (provider === "rainforest") {
    if (!keys.rainforestApiKey) return null;
    return createRainforestProvider(keys.rainforestApiKey);
  }

  if (provider === "firecrawl") {
    if (!keys.firecrawlApiKey) return null;
    return createFirecrawlProvider(keys.firecrawlApiKey);
  }

  return null;
}

export { createFirecrawlProvider } from "@/lib/ingest/providers/firecrawl";
export { createRainforestProvider } from "@/lib/ingest/providers/rainforest";
