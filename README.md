# Listing Optimizer

A **Next.js 14** web app that takes an **Amazon listing URL** and returns an **optimized, compliance-verified set of listing inputs plus a gap audit** — built from the methodology in `brain/`.

**Live app:** https://listing-optimizer-builder.vercel.app

## What the app does

**Input:** an Amazon product URL (or ASIN), via Rainforest, Firecrawl, or pasted PDP HTML.

**Output:**

- Optimized `title` (legacy + 75-char), `itemHighlights`, 5 bullets, description, backend search terms
- Full structured attributes, A+ content (modules + comparison + FAQ), image slot plan, ~15 Q&A
- Compliance **verify gate** on the proposed listing (C1–C12 + C15 + A1–A8)
- **Audit** scorecard + field-by-field gaps comparing current vs proposed

The dashboard shows progress, tabbed results, per-field copy buttons, char/byte counters aligned with gate limits, and JSON/Markdown export. **Export final is blocked** when the gate fails (`audit.verified === false`).

## Stack

- **Next.js 14** (App Router) on **Vercel**
- **Anthropic Claude** optimization engine (server-side only)
- **Knowledge packs** — category rules/compliance from `knowledge/*.json`
- Ingestion via **Rainforest** or **Firecrawl** API, or **paste-HTML** fallback

## Quick start

```bash
cp .env.example .env.local   # fill in keys
npm install
npm run dev                  # http://localhost:3000
```

## Environment variables

Copy `.env.example` → `.env.local` (local) or set in the Vercel project dashboard (production):

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (optimize) | Claude API key for the optimization engine |
| `ANTHROPIC_MODEL` | No | Default: `claude-sonnet-4-6` |
| `INGEST_PROVIDER` | No | `rainforest` (default), `firecrawl`, or `paste` |
| `RAINFOREST_API_KEY` | If rainforest | Rainforest API key |
| `FIRECRAWL_API_KEY` | If firecrawl | Firecrawl API key |
| `MAX_REPAIR_ITERATIONS` | No | Gate repair loop cap (default `3`) |

Paste mode works without Rainforest/Firecrawl keys — the operator supplies PDP HTML in the dashboard.

## Ingestion providers & legal note

The app **never operates its own Amazon scraper**. It ingests listing data through a third-party provider or a manual fallback:

| Provider | `INGEST_PROVIDER` | Risk / notes |
|----------|-------------------|--------------|
| **Rainforest** *(recommended default)* | `rainforest` | Licensed Amazon product-data API — **lowest ToS risk**. |
| **Firecrawl** | `firecrawl` | General scraping vendor; pointing it at Amazon PDPs carries the **same ToS/rate-limit exposure as scraping** — **higher risk**. Firecrawl does **not** remove that exposure. |
| **Paste HTML** | `paste` | Operator supplies the PDP HTML — **zero automated fetch**. |

The dashboard provider toggle sends `provider` in the ingest request body; server-side keys stay on the server.

## API routes

### `POST /api/ingest`

```json
{ "url": "https://www.amazon.com/dp/B0XXXXXXXXX", "provider": "rainforest" }
```

Paste mode:

```json
{
  "url": "B0XXXXXXXXX",
  "provider": "paste",
  "html": "<paste Amazon PDP HTML>"
}
```

Returns a normalized `ListingSnapshot`. Errors are structured JSON (`{ "error": "NOT_FOUND", "message": "..." }`).

### `POST /api/optimize`

```json
{ "snapshot": { "...": "ListingSnapshot" } }
```

Returns `{ "optimized": OptimizedListing, "audit": Audit }`.

SSE: send `Accept: text/event-stream` for live optimization progress; final event includes `optimized` + `audit`.

## Test

```bash
npm test                    # unit + golden E2E (mocked LLM/provider)
npm run build
npm run check:client-secrets  # grep client bundle for secret patterns (run after build)
npm run ci                    # build + secret check + test
```

Golden E2E test: `tests/e2e.golden.test.ts` uses recorded fixtures in `tests/fixtures/golden/` — deterministic, no live LLM cost.

## Deploy (Vercel)

1. Push to GitHub.
2. Import the repo in [Vercel](https://vercel.com).
3. Set environment variables (see table above).
4. Deploy — `vercel.json` pins the `iad1` region; optimize route allows up to 300s on Pro plans.

```bash
npx vercel --prod
```

CI (`.github/workflows/ci.yml`) runs build, client-bundle secret check, and tests on push/PR.

## Adding a new category pack

The engine and gate are **pack-driven** — no engine/gate code changes needed for a new category:

1. Add compiled JSON under `knowledge/`:
   - `compliance.{category}.json`
   - `attribute-schema.{category}.json` (optional)
2. Extend `loadPack()` in `lib/knowledge/loadPack.ts` with a new `KnowledgePackId` branch.
3. Extend `detectCategory()` in `lib/knowledge/detectCategory.ts` to return the new pack for matching listings.

The existing **`generic`** pack demonstrates the seam: empty compliance schema, shared rules/principles, no gate edits required. See `loadPack.test.ts` and `tests/e2e.golden.test.ts`.

## Project layout

| Path | Purpose |
|------|---------|
| `app/` | Next.js UI + API routes |
| `lib/engine/` | LLM optimization + repair loop |
| `lib/gate/` | Compliance verify gate (pure functions) |
| `lib/audit/` | Scorecard + diff + audit assembly |
| `lib/knowledge/` | Pack loader, category detection, field limits |
| `lib/ingest/` | ASIN parse, providers, paste fallback |
| `knowledge/` | Compiled rules, compliance, principles (source of truth for packs) |
| `brain/` | Human-readable specs (ported into `knowledge/`) |
| `tests/` | Golden E2E + fixtures |

## Builder kit docs

- `00-MASTER-BUILD-PROMPT.md` — orientation + rules
- `ARCHITECTURE.md` — stack, data flow, modules
- `ACCEPTANCE-CRITERIA.md` — final acceptance rubric (≥9.5/10)
- `prompts/` — phased build prompts (`phase-0` … `phase-7`)

## License

Private / internal use — see repository owner.
