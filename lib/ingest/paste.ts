import { IngestError, type PasteInput, type RawListing } from "@/lib/ingest/types";
import { parseAmazonHtml } from "@/lib/ingest/parseHtml";

export function rawListingFromPaste(
  asin: string,
  input: PasteInput,
): RawListing {
  if (input.fields) {
    return {
      asin: asin.toUpperCase(),
      title: input.fields.title,
      bullets: input.fields.bullets,
      description: input.fields.description,
      images: input.fields.images,
      attributes: input.fields.attributes,
      price: input.fields.price,
      rating: input.fields.rating,
      category: input.fields.category,
      subcategory: input.fields.subcategory ?? input.fields.category,
      raw: { source: "paste-fields", fields: input.fields },
    };
  }

  if (!input.html?.trim()) {
    throw new IngestError(
      "INVALID_INPUT",
      "Paste mode requires html or fields in the request body.",
    );
  }

  const parsed = parseAmazonHtml(input.html);
  if (!parsed.title && (!parsed.bullets || parsed.bullets.length === 0)) {
    throw new IngestError(
      "PARSE_ERROR",
      "Could not extract listing fields from pasted HTML.",
    );
  }

  return {
    asin: asin.toUpperCase(),
    title: parsed.title,
    bullets: parsed.bullets,
    description: parsed.description,
    images: parsed.images,
    attributes: parsed.attributes,
    price: parsed.price,
    rating: parsed.rating,
    category: parsed.category,
    subcategory: parsed.subcategory ?? parsed.category,
    raw: { source: "paste-html", htmlLength: input.html.length },
  };
}
