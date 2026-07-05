# Architecture — Listing Optimizer App

A web app: **paste an Amazon listing URL → get an optimized, compliance-verified set of listing inputs + a gap audit.** Built from the reusable brain in `brain/`. Supplements ship first; the core is category-agnostic.

## Stack
- **Next.js 14 (App Router) + TypeScript + Tailwind CSS.** Deploy to **Vercel.**
- Server-side route handlers for ingestion + LLM orchestration (keys never reach the client).
- **LLM:** Anthropic Claude (server-side) via `ANTHROPIC_API_KEY`. Model configurable.
- **Ingestion:** pluggable provider interface; first adapter = a scraping/data API (Rainforest **or** Firecrawl — pick one at build via env), with a **paste-HTML fallback** when scraping is blocked.
- No database required for v1 (stateless per run). Optional: persist runs to Vercel KV / a JSON store later.

## Data flow
```
URL ──▶ [ingest] ──▶ ListingSnapshot ──▶ [detect category → select KnowledgePack]
     ──▶ [optimize: LLM + rules] ──▶ OptimizedListing (draft)
     ──▶ [verify gate] ──◀ repair loop (max N) ─┐
                │pass                            │fail→regenerate
     ──▶ [audit: current vs proposed] ──▶ Result ──▶ UI (tabs + copy buttons + export)
```

## Core types (shared across engine, gate, UI) — `lib/types.ts`
- `ListingSnapshot` — normalized current listing: `{ asin, url, title, bullets[], description, images[], attributes{}, price, rating?, category, subcategory, raw }`.
- `KnowledgePack` — `{ id, rules, compliancePack, attributeSchema, principles }` loaded from `brain/`+`knowledge/`.
- `OptimizedListing` — the Output Contract (see `brain/05-output-contract.md`), including `facts: Facts` and `aplusContent: AplusContent` (both typed in `brain/05`).
- `Facts` / `AplusContent` — defined in `brain/05-output-contract.md`; import the same types in engine, gate, and UI.
- `Failure` — `{ checkId, field, context, fix }`.
- `Audit` — `{ scorecard, gaps[], gateResult, verified }` where `verified === gateResult.pass`, computed by the audit module.

## Modules
- `lib/ingest/` — `parseAsin(url)`, provider adapters (`rainforest.ts` / `firecrawl.ts`), `toSnapshot()`, cache + rate-limit.
- `lib/knowledge/` — loads the packs; supplements pack first; `detectCategory(snapshot)` → pack id; generic fallback pack.
- `lib/engine/` — prompt templates per field; `optimize(snapshot, pack)`; the repair loop calling the gate.
- `lib/gate/` — pure-function checks C1–C15 + A1–A8 (from `brain/04`), `runGate()`, unit tests.
- `lib/audit/` — `scoreAgainstPrinciples()`, `diff(current, proposed)`.
- `app/` — the UI (URL input, run progress, result tabs, audit view, export).

## Category-agnostic design (the generalization lever)
The **engine and gate never hard-code a category.** Everything category-specific lives in a `KnowledgePack`:
- supplements pack (v1) = `brain/` files → compiled into `knowledge/*.supplements.json`.
- Adding a category later = drop in a new pack (its rules, compliance terms, attribute schema); no engine/gate changes.

## Guardrails baked into the build
- **Never mutate content to force a gate pass** — the repair loop regenerates; a persistent real failure surfaces to the user.
- **Keys server-side only.** `.env.example` documents `ANTHROPIC_API_KEY`, `INGEST_PROVIDER`, `RAINFOREST_API_KEY` **or** `FIRECRAWL_API_KEY`.
- **Legal/ToS note (be precise):** the app never operates its own Amazon scraper. It ingests through a **third-party provider** — **Rainforest** (a licensed Amazon product-data API, lowest ToS risk) or **Firecrawl** (a general scraping vendor; pointing it at Amazon PDPs carries the **same ToS/rate-limit exposure as scraping** and is the higher-risk option) — or the **paste-HTML fallback** (operator supplies the page, zero automated fetch). The README states this plainly; do not imply Firecrawl removes the legal exposure. Rainforest is the recommended default.
- **Model id is a placeholder.** `ANTHROPIC_MODEL` in `.env.example` is a default; confirm the current Anthropic model id at build time rather than trusting the literal.
- **No private data from the source project** — this repo contains only the generic methodology.

## Env (`.env.example`)
```
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6
INGEST_PROVIDER=rainforest   # or: firecrawl | paste
RAINFOREST_API_KEY=
FIRECRAWL_API_KEY=
MAX_REPAIR_ITERATIONS=3
```
