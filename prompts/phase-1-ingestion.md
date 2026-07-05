# PHASE 1 — Ingestion layer

Turn a URL into a normalized `ListingSnapshot`. Do only this phase.

## Build
1. `lib/ingest/parseAsin.ts` — extract the ASIN from many URL shapes (`/dp/ASIN`, `/gp/product/ASIN`, `/dp/ASIN/ref=…`, `?…&asin=`, bare 10-char ASIN). Unit-test with ≥8 URL variants.
2. `lib/ingest/providers/` — a `ListingProvider` interface `{ fetch(asin): Promise<RawListing> }` with two adapters:
   - `rainforest.ts` — calls the Rainforest Product API with `RAINFOREST_API_KEY`.
   - `firecrawl.ts` — scrapes the PDP via Firecrawl with `FIRECRAWL_API_KEY`.
   Select the adapter from `INGEST_PROVIDER`.
3. `lib/ingest/paste.ts` — a fallback that accepts pasted PDP HTML (or raw fields) and yields a `RawListing`, for when scraping is blocked or no key is set (`INGEST_PROVIDER=paste`).
4. `lib/ingest/toSnapshot.ts` — normalize any `RawListing` into `ListingSnapshot` (title, bullets[], description, images[], attributes{}, price, rating?, category, raw).
5. `app/api/ingest/route.ts` — server route: `{ url }` → `ListingSnapshot`. Add in-memory (or Vercel KV) caching keyed by ASIN + a short TTL, and a simple rate-limit. Return typed errors for block/timeout/not-found.

## Constraints
- Keys used **only** server-side.
- The app never operates its own Amazon scraper; go through the provider API or the paste fallback.
- Put the precise ToS/legal note from `ARCHITECTURE.md` in the app README: **Rainforest** = licensed product API (recommended default, lowest risk); **Firecrawl** pointed at Amazon PDPs carries the **same ToS/rate-limit exposure as scraping** (higher risk); **paste** = zero automated fetch. Do not imply Firecrawl removes the exposure. Default `INGEST_PROVIDER=rainforest`.

## Acceptance
- `parseAsin` tests pass for all URL variants.
- With a provider key set, `POST /api/ingest` returns a populated snapshot for a real ASIN; with `INGEST_PROVIDER=paste`, pasted HTML yields a snapshot.
- Errors are structured, not thrown to the client as 500s.
