# PHASE 3 — Optimization engine

Generate the optimized listing from a snapshot + pack. Do only this phase.

## Build
1. `lib/engine/prompts/` — a prompt template per output group, each injecting the relevant `brain/` rules + the current snapshot:
   - `title.ts` (legacy ≤200 + title75 ≤75 + itemHighlights ≤125, with the division-of-labor from `brain/00`),
   - `bullets.ts` (5 × ≤255, one situational anchor per use-case),
   - `description.ts` (≤2000 + verbatim disclaimer + allergen/safety),
   - `backend.ts` (≤249 bytes, synonyms/misspellings/other-language, no title repeats),
   - `attributes.ts` (fill the pack's attribute schema; `active_ingredients` ⊆ `ingredients`),
   - `aplus.ts` (≤7 real-text modules), `images.ts` (~7 slots), `qa.ts` (~15 pairs).
2. `lib/engine/optimize.ts` — orchestrates: call the LLM (Anthropic, server-side, `ANTHROPIC_MODEL` — treat the env value as a placeholder; confirm the current model id at build) for each group, assemble an `OptimizedListing`, and build `aplusContent` as the `AplusContent` type (real per-module text, comparison rows, FAQ — not just titles).
3. `lib/engine/facts.ts` — a **deterministic** producer of the `Facts` object (schema in `brain/05`): read numeric truths from the snapshot's structured attributes first (unit count, servings, weight, price, potency); for any value the engine derives (e.g. day-supply = unitCount / perDay), compute it once here and reuse. Facts are never LLM-guessed. C12 checks every surface against this object.
4. Ground the model: pass the compliance pack so it writes structure/function language only, keeps the disclaimer verbatim, and never emits banned terms. But **do not trust the model** — Phase 4's gate is the enforcement.
5. `app/api/optimize/route.ts` — `{ snapshot, packId }` → `OptimizedListing` (draft). Stream progress if practical.

## Disclaimer placement (avoid the 255-char bullet trap)
- The **verbatim** FDA disclaimer goes in `description` (once) and in each claim-bearing A+ module and claim-bearing Q&A answer.
- **Bullets do NOT carry the full disclaimer** — a claim-bearing bullet ends with a short `*` marker only (the full text won't fit in 255 chars). The gate checks the full disclaimer in `description`/A+, not inside bullets.

## Title precedence
- Product name **first** (gate C8), then front-load the primary keyword in the remainder (per `brain/00` title precedence rule). Never displace the leading product name to put a keyword first.

## Constraints
- The LLM writes copy; **it never decides whether a limit is met** — counts/bytes are checked in code (Phase 4).
- Deterministic assembly: same snapshot + pack + model + temperature → stable structure. Use low temperature.
- Keep each prompt template small and rule-injected from `knowledge/`, not hard-coded prose.

## Acceptance
- `POST /api/optimize` returns a complete `OptimizedListing` for a real snapshot, including a populated `facts` object and a full `aplusContent` (module text + comparison + FAQ).
- Disclaimer text is present verbatim in `description` and each claim-bearing A+ module/FAQ answer; bullets carry only the `*` marker.
- Title starts with the product name; primary keyword front-loaded after it.
- No category-specific strings hard-coded in engine files (all come from the pack).
