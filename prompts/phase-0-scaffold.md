# PHASE 0 — Scaffold

Create the Next.js app skeleton and shared contracts. Do only this phase.

## Build
1. Scaffold **Next.js 14 (App Router) + TypeScript + Tailwind** in the repo root (`create-next-app` defaults, `src/`-less App Router or `app/` at root — your call, be consistent).
2. Add `lib/types.ts` with the shared types from `ARCHITECTURE.md` and `brain/05-output-contract.md`, copied **exactly**: `ListingSnapshot` (incl. `subcategory`), `KnowledgePack`, `OptimizedListing` (mirror the Output Contract — every field + constraint as a comment, and it MUST include `facts: Facts` and `aplusContent: AplusContent`), `Facts`, `AplusContent` (+ `AplusModule`), `Failure`, `Audit` (with `verified` documented as `=== gateResult.pass`), `ImageSlot`, `QAItem`. Do NOT invent an `AplusOutline` type — the A+ object is `AplusContent` with real per-module text, used identically by the engine, gate, and UI.
3. Add `.env.example` exactly as in `ARCHITECTURE.md`, and load env via a typed `lib/env.ts` (throws if a required key is missing at runtime, not build time).
4. Add `lib/knowledge/` with a loader stub `loadPack(id: 'supplements'): KnowledgePack` (returns a typed empty-ish pack for now) and `detectCategory(snapshot): string` stub returning `'supplements'`.
5. Set up `npm test` with Vitest (or Jest) and one trivial passing test so the harness exists.
6. Add a root page with a single URL input and a "Optimize" button that currently just echoes the parsed input (wire real logic later).

## Constraints
- Strict TypeScript (`"strict": true`). No `any` in `lib/types.ts`.
- Keep server-only code out of client components.

## Acceptance (satisfy before Phase 1)
- `npm run dev` serves the page; `npm run build` is clean; `npm test` passes.
- `lib/types.ts` compiles and its `OptimizedListing` matches `brain/05-output-contract.md` field-for-field.
- `.env.example` present; `lib/env.ts` reads it.
