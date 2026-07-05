# MASTER BUILD PROMPT — paste this into Cursor FIRST

You are building a production web app from a self-contained build kit that is already in this workspace. Read this whole prompt, then read `ARCHITECTURE.md` and every file in `brain/`, before writing any code.

## What you are building
A **Next.js 14 (App Router) + TypeScript + Tailwind** web app, deployable to **Vercel**, that:
1. Accepts an **Amazon product listing URL** (any ASIN).
2. Ingests the current listing via a **scraping/data API** (Rainforest or Firecrawl, selected by env), with a **paste-HTML fallback**.
3. Generates an **optimized, compliance-verified set of listing inputs** (the Output Contract in `brain/05-output-contract.md`) using an LLM (Anthropic Claude, server-side) grounded in the rules/compliance/schema in `brain/`.
4. Runs every generated element through a **verify gate** (`brain/04-verify-gate-spec.md`) inside a bounded auto-repair loop.
5. Produces an **audit** diffing the current listing against the proposed one, scored against `brain/00-optimization-principles.md`.
6. Presents results in a dashboard with **per-field copy buttons** and **JSON/Markdown export**.

Ship supplements first, but the **core must be category-agnostic**: all category-specific data lives in a `KnowledgePack`; the engine and gate never hard-code a category.

## How to work
- Build in the **phases** given by `prompts/phase-0…phase-7`. I will paste them one at a time. Do not skip ahead; each ends with an acceptance checklist you must satisfy.
- Treat `brain/` as the **source of truth** for all rules, limits, compliance logic, the verify checks, and the output schema. Compile the markdown packs into machine-readable `knowledge/*.json` where a phase says so.
- Keep the shared types in `lib/types.ts` and import them everywhere (engine, gate, audit, UI must agree).

## Non-negotiable guardrails
- **Never mutate or weaken generated content just to make the gate pass.** The repair loop may regenerate up to `MAX_REPAIR_ITERATIONS`; if a real failure persists, surface it in the UI as a blocking issue. The gate reports; it never launders.
- **All API keys are server-side only** (route handlers / server actions). Never expose a key to the client bundle.
- **Compliance is load-bearing.** The FDA disclaimer must be verbatim; banned disease terms must be blocked; allergen declarations enforced. A listing that fails the gate must not be marked `verified` or exportable as final.
- **Ingestion is via a third-party provider or the paste fallback — the app never operates its own Amazon scraper.** Rainforest (licensed product API) is the recommended default; Firecrawl is a scraping vendor that carries the same ToS exposure as scraping when pointed at Amazon; paste-HTML has zero automated fetch. Document this ToS/legal note (from `ARCHITECTURE.md`) plainly in the app's README — do not imply Firecrawl removes the exposure.
- **Worker ≠ checker:** the generation step and the gate/audit step are separate modules; the audit reports independently of the generator.
- **Determinism where it matters:** all field limits (char/byte counts), the disclaimer match, and banned-term scans are **deterministic code**, not left to the LLM. The LLM writes copy; the gate judges it.

## Definition of done
The app satisfies `ACCEPTANCE-CRITERIA.md`, including the golden-ASIN end-to-end test, `npm run build` clean, `npm test` green (gate unit tests), and a successful Vercel deploy.

Acknowledge you've read this and `brain/`, summarize the architecture back in 5 bullets, then tell me you're ready for `phase-0`.
