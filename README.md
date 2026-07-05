# Listing Optimizer

A **Next.js** web app that takes an **Amazon listing URL** and returns an **optimized, compliance-verified set of listing inputs + a gap audit** — built from the methodology in `brain/`.

## What the app does

Input: an Amazon product URL (any ASIN).

Output: optimized `title` (legacy + 75-char), `itemHighlights`, 5 bullets, description, backend search terms, the full attribute set, A+ content (real module text + comparison + FAQ), an image/slot plan, and ~15 Q&A — every element run through a compliance/quality **verify gate** — plus an **audit** diffing the current listing against the proposed one.

Stack: **Next.js 14 + Vercel** · ingestion via a **scraping/data API** (Rainforest or Firecrawl, with a paste-HTML fallback) · **supplements category first** (category-agnostic core).

## Ingestion providers & legal note

The app **never operates its own Amazon scraper**. It ingests listing data through a third-party provider or a manual fallback:

| Provider | `INGEST_PROVIDER` | Risk / notes |
|----------|-------------------|--------------|
| **Rainforest** *(recommended default)* | `rainforest` | Licensed Amazon product-data API — **lowest ToS risk**. |
| **Firecrawl** | `firecrawl` | General scraping vendor; pointing it at Amazon PDPs carries the **same ToS/rate-limit exposure as scraping** — **higher risk**. Firecrawl does **not** remove that exposure. |
| **Paste HTML** | `paste` | Operator supplies the PDP HTML or raw fields — **zero automated fetch**. |

Default: `INGEST_PROVIDER=rainforest`.

## API — ingest

`POST /api/ingest`

```json
{ "url": "https://www.amazon.com/dp/B0XXXXXXXXX" }
```

Paste mode (`INGEST_PROVIDER=paste`):

```json
{
  "url": "B0XXXXXXXXX",
  "html": "<paste Amazon PDP HTML>",
  "fields": { "title": "...", "bullets": ["..."], "description": "..." }
}
```

Returns a normalized `ListingSnapshot`. Errors are structured JSON (`{ "error": "NOT_FOUND", "message": "..." }`), not opaque 500s.

## Local development

1. Copy `.env.example` → `.env.local` and fill in keys.
2. `npm install`
3. `npm run dev` — open http://localhost:3000
4. `npm test` · `npm run build`

## Environment variables

See `.env.example`:

- `ANTHROPIC_API_KEY` — Claude (optimization engine, later phases)
- `INGEST_PROVIDER` — `rainforest` | `firecrawl` | `paste`
- `RAINFOREST_API_KEY` or `FIRECRAWL_API_KEY` — depending on provider
- `MAX_REPAIR_ITERATIONS` — verify-gate repair loop cap

## Builder kit docs

This repo started from a self-contained build kit. Reference docs:

- `00-MASTER-BUILD-PROMPT.md` — orientation + rules
- `ARCHITECTURE.md` — stack, data flow, modules
- `ACCEPTANCE-CRITERIA.md` — final acceptance rubric
- `brain/` — rules, compliance, output contract
- `prompts/` — phased build prompts (`phase-0` … `phase-7`)

