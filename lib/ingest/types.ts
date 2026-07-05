/** Provider-native listing payload before normalization. */
export type RawListing = {
  asin: string;
  url?: string;
  title?: string;
  bullets?: string[];
  description?: string;
  images?: string[];
  attributes?: Record<string, string>;
  price?: string;
  rating?: number;
  category?: string;
  subcategory?: string;
  raw: unknown;
};

export interface ListingProvider {
  fetch(asin: string): Promise<RawListing>;
}

export type IngestErrorCode =
  | "INVALID_URL"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "BLOCKED"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "PROVIDER_ERROR"
  | "PARSE_ERROR";

export type IngestErrorResponse = {
  error: IngestErrorCode;
  message: string;
};

export class IngestError extends Error {
  constructor(
    public readonly code: IngestErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "IngestError";
  }
}

export type PasteInput = {
  html?: string;
  fields?: Partial<
    Pick<
      RawListing,
      | "title"
      | "bullets"
      | "description"
      | "images"
      | "attributes"
      | "price"
      | "rating"
      | "category"
      | "subcategory"
    >
  >;
};
