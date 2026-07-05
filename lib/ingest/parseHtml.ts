import type { RawListing } from "@/lib/ingest/types";

function decodeHtml(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function firstMatch(html: string, pattern: RegExp): string | undefined {
  const match = html.match(pattern);
  return match?.[1] ? decodeHtml(match[1]) : undefined;
}

function allMatches(html: string, pattern: RegExp): string[] {
  const results: string[] = [];
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const regex = new RegExp(pattern.source, flags);
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) results.push(decodeHtml(match[1]));
  }
  return results;
}

/** Best-effort extraction of listing fields from pasted Amazon PDP HTML. */
export function parseAmazonHtml(html: string): Partial<RawListing> {
  const title =
    firstMatch(html, /id=["']productTitle["'][^>]*>([\s\S]*?)<\/span>/i) ??
    firstMatch(html, /<h1[^>]*id=["']title["'][^>]*>([\s\S]*?)<\/h1>/i);

  const bullets = allMatches(
    html,
    /<span[^>]*class=["'][^"']*a-list-item[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi,
  ).filter((text) => text.length > 0 && text.length < 500);

  const description =
    firstMatch(
      html,
      /id=["']productDescription["'][^>]*>([\s\S]*?)<\/div>/i,
    ) ??
    firstMatch(
      html,
      /id=["']aplus[^"']*["'][^>]*>([\s\S]{0,4000}?)<\/div>/i,
    );

  const images = Array.from(
    new Set(
      allMatches(html, /data-old-hires=["']([^"']+)["']/gi).concat(
        allMatches(html, /"hiRes"\s*:\s*"([^"]+)"/gi),
      ),
    ),
  ).slice(0, 10);

  const price =
    firstMatch(html, /class=["'][^"']*a-price-whole[^"']*["'][^>]*>([^<]+)</i) ??
    firstMatch(html, /"priceAmount"\s*:\s*([0-9.]+)/i);

  const ratingRaw = firstMatch(html, /"ratingValue"\s*:\s*([0-9.]+)/i);
  const rating = ratingRaw ? Number.parseFloat(ratingRaw) : undefined;

  const category =
    firstMatch(html, /"category"\s*:\s*"([^"]+)"/i) ??
    firstMatch(html, /BrowseNode[^>]*>([^<]+)</i);

  return {
    title,
    bullets: bullets.length > 0 ? bullets : undefined,
    description: description?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    images: images.length > 0 ? images : undefined,
    price: price ? (price.startsWith("$") ? price : `$${price}`) : undefined,
    rating: Number.isFinite(rating) ? rating : undefined,
    category,
    subcategory: category,
  };
}
