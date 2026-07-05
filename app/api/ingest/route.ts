import { NextResponse } from "next/server";
import type { IngestProvider } from "@/lib/env";
import { getIngestEnv } from "@/lib/env";
import { getCachedSnapshot, setCachedSnapshot } from "@/lib/ingest/cache";
import { rawListingFromPaste } from "@/lib/ingest/paste";
import { parseAsin } from "@/lib/ingest/parseAsin";
import { createListingProvider } from "@/lib/ingest/providers";
import { checkRateLimit } from "@/lib/ingest/rateLimit";
import { toSnapshot } from "@/lib/ingest/toSnapshot";
import {
  IngestError,
  type IngestErrorResponse,
  type PasteInput,
} from "@/lib/ingest/types";

export const runtime = "nodejs";

type IngestRequestBody = {
  url?: string;
  html?: string;
  fields?: PasteInput["fields"];
  provider?: IngestProvider;
};

function resolveProvider(requested: IngestProvider | undefined, fallback: IngestProvider): IngestProvider {
  if (requested && ["rainforest", "firecrawl", "paste"].includes(requested)) {
    return requested;
  }
  return fallback;
}

function errorStatus(code: IngestErrorResponse["error"]): number {
  switch (code) {
    case "INVALID_URL":
    case "INVALID_INPUT":
    case "PARSE_ERROR":
      return 400;
    case "NOT_FOUND":
      return 404;
    case "BLOCKED":
      return 403;
    case "TIMEOUT":
      return 408;
    case "RATE_LIMITED":
      return 429;
    default:
      return 502;
  }
}

function jsonError(code: IngestErrorResponse["error"], message: string) {
  return NextResponse.json({ error: code, message } satisfies IngestErrorResponse, {
    status: errorStatus(code),
  });
}

function clientKey(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "anonymous"
  );
}

export async function POST(request: Request) {
  if (!checkRateLimit(clientKey(request))) {
    return jsonError("RATE_LIMITED", "Too many ingest requests. Try again shortly.");
  }

  let body: IngestRequestBody;
  try {
    body = (await request.json()) as IngestRequestBody;
  } catch {
    return jsonError("INVALID_INPUT", "Request body must be valid JSON.");
  }

  const urlOrAsin = body.url?.trim();
  if (!urlOrAsin) {
    return jsonError("INVALID_URL", "A url field is required.");
  }

  const asin = parseAsin(urlOrAsin);
  if (!asin) {
    return jsonError("INVALID_URL", "Could not parse ASIN from the provided URL.");
  }

  try {
    const env = getIngestEnv();
    const provider = resolveProvider(body.provider, env.ingestProvider);

    const cached = getCachedSnapshot(asin, provider);
    if (cached) {
      return NextResponse.json(cached);
    }

    let raw;
    if (provider === "paste") {
      raw = rawListingFromPaste(asin, {
        html: body.html,
        fields: body.fields,
      });
    } else {
      const listingProvider = createListingProvider(provider, env);
      if (!listingProvider) {
        return jsonError(
          "PROVIDER_ERROR",
          `No provider configured for ${provider}.`,
        );
      }
      raw = await listingProvider.fetch(asin);
    }

    const snapshot = toSnapshot(raw);
    setCachedSnapshot(asin, snapshot, provider);
    return NextResponse.json(snapshot);
  } catch (error) {
    if (error instanceof IngestError) {
      return jsonError(error.code, error.message);
    }
    if (error instanceof Error && /Missing required environment variable/.test(error.message)) {
      return jsonError("PROVIDER_ERROR", error.message);
    }
    return jsonError(
      "PROVIDER_ERROR",
      error instanceof Error ? error.message : "Unexpected ingest failure.",
    );
  }
}
