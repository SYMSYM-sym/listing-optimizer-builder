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

    const pathPatterns = [
      /\/dp\/([A-Z0-9]{10})(?:[/?]|$)/i,
      /\/gp\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
      /\/gp\/aw\/d\/([A-Z0-9]{10})(?:[/?]|$)/i,
      /\/product\/([A-Z0-9]{10})(?:[/?]|$)/i,
      /\/ASIN\/([A-Z0-9]{10})(?:[/?]|$)/i,
    ];

    for (const pattern of pathPatterns) {
      const match = url.pathname.match(pattern);
      if (match?.[1]) return match[1].toUpperCase();
    }

    const asinParam = url.searchParams.get("asin");
    if (asinParam && /^[A-Z0-9]{10}$/i.test(asinParam)) {
      return asinParam.toUpperCase();
    }
  } catch {
    return null;
  }

  return null;
}

/** Build a canonical Amazon PDP URL from an ASIN. */
export function asinToUrl(asin: string, domain = "www.amazon.com"): string {
  return `https://${domain}/dp/${asin.toUpperCase()}`;
}
