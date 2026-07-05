/**
 * Extract ASIN from common Amazon product URL patterns.
 */
export function parseAsin(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Bare 10-char ASIN
  if (/^[A-Z0-9]{10}$/i.test(trimmed)) {
    return trimmed.toUpperCase();
  }

  try {
    const url = trimmed.startsWith("http")
      ? new URL(trimmed)
      : new URL(`https://${trimmed}`);
    const pathMatch = url.pathname.match(
      /\/(?:dp|gp\/product|gp\/aw\/d|product)\/([A-Z0-9]{10})/i,
    );
    if (pathMatch?.[1]) return pathMatch[1].toUpperCase();

    const asinParam = url.searchParams.get("asin");
    if (asinParam && /^[A-Z0-9]{10}$/i.test(asinParam)) {
      return asinParam.toUpperCase();
    }
  } catch {
    return null;
  }

  return null;
}
