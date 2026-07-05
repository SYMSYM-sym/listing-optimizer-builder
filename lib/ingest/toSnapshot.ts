import type { ListingSnapshot } from "@/lib/types";
import type { RawListing } from "@/lib/ingest/types";
import { asinToUrl } from "@/lib/ingest/parseAsin";

export function toSnapshot(raw: RawListing): ListingSnapshot {
  const asin = raw.asin.toUpperCase();

  return {
    asin,
    url: raw.url ?? asinToUrl(asin),
    title: raw.title?.trim() ?? "",
    bullets: (raw.bullets ?? []).map((b) => b.trim()).filter(Boolean),
    description: raw.description?.trim() ?? "",
    images: raw.images ?? [],
    attributes: raw.attributes ?? {},
    price: raw.price,
    rating: raw.rating,
    category: raw.category?.trim() ?? "Unknown",
    subcategory: raw.subcategory?.trim() ?? raw.category?.trim() ?? "general",
    raw: raw.raw,
  };
}
