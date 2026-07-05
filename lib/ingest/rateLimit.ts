type RateBucket = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
const buckets = new Map<string, RateBucket>();

export function checkRateLimit(clientKey: string): boolean {
  const now = Date.now();
  const bucket = buckets.get(clientKey);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(clientKey, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (bucket.count >= MAX_REQUESTS) {
    return false;
  }

  bucket.count += 1;
  return true;
}

export function resetRateLimits(): void {
  buckets.clear();
}
