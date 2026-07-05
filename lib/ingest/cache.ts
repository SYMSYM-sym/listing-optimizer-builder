import type { ListingSnapshot } from "@/lib/types";

type CacheEntry = {
  snapshot: ListingSnapshot;
  expiresAt: number;
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

export function getCachedSnapshot(
  asin: string,
  provider: string = "default",
): ListingSnapshot | null {
  const key = `${asin.toUpperCase()}:${provider}`;
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.snapshot;
}

export function setCachedSnapshot(
  asin: string,
  snapshot: ListingSnapshot,
  provider: string = "default",
): void {
  cache.set(`${asin.toUpperCase()}:${provider}`, {
    snapshot,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });
}

export function clearIngestCache(): void {
  cache.clear();
}
