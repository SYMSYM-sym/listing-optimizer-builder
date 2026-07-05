# Output Contract — what the app generates for any URL

The engine produces one `OptimizedListing` object per ASIN, each field constrained. This is the deliverable schema (also the TypeScript type the app shares between engine, gate, and UI).

| Field | Constraint / spec |
|---|---|
| `title` (legacy) | ≤200 chars; product name first; primary keyword front-loaded; word ≤2×; banned chars excluded; no price/promo. |
| `title75` (⏳ Jul 27 2026) | ≤75 chars; product name first; the single highest-value keyword cluster. |
| `itemHighlights` (⏳ new, searchable) | ≤125 chars; every important term that no longer fits the 75-char title; no title-word duplication. |
| `bullets[5]` | Exactly 5; ≤255 chars each; one situational anchor per major use-case; a claim-bearing bullet ends with a short `*` marker (the verbatim disclaimer lives in `description` and claim-bearing A+/Q&A, NOT inside a 255-char bullet); allergen declared in ≥1 bullet. |
| `description` | ≤2,000 chars; product name present; verbatim disclaimer appended; allergen + safety statement; blank-line paragraphs. |
| `backendSearchTerms` | <250 bytes (≤249 saved, UTF-8); synonyms/misspellings/other-language only; zero title repeats; no brands/ASINs/disease terms. |
| `attributes{}` | Full structured attribute set (see attribute-schema pack); fill every applicable field; ⭐ filter-fields prioritized; `active_ingredients` ⊆ `ingredients`. |
| `facts{}` | Canonical numeric facts used by the consistency check C12. **Schema below.** |
| `fdaDisclaimer` | Verbatim category disclaimer constant. |
| `aplusContent` | Up to 7 (Premium) modules, each with **real text** (headline, body, optional subcopy), plus a comparison table and an FAQ list — see the `AplusContent` type below. Comparison/who-for/FAQ must be readable text (never image-only). Carries its own `fdaDisclaimer` and repeats it in each claim-bearing module. |
| `imagePlan[~7]` | (1) main on pure-white ≥85% fill; (2) value-prop infographic; (3) real photo of any regulated panel; (4) ingredient/feature story; (5) how-to-use routine; (6) trust/heritage; (7) lifestyle/outcome. Specs per amazon-rules. No price/ratings/CTAs. |
| `qa[~15]` | Accurate Q&A pairs seeding the AI-answer layer; mirror the same facts as bullets + A+ FAQ; compliant; disclaimer on claim-bearing answers. |

## `Facts` schema (backbone of C12 consistency check)
`facts` is a flat object of the canonical numeric truths every surface must agree with. Deterministically produced (see phase-3), never LLM-guessed:
```ts
type Facts = {
  potency?: string;      // e.g. "[N] [unit]" — the headline strength, attached to the blend, never "per serving"
  unitCount?: number;    // pieces per container
  servings?: number;     // servings per container
  servingSize?: string;  // e.g. "[N] Capsules"
  daySupply?: number;    // days per container
  weight?: string;       // e.g. "[N] Ounces"
  price?: string;        // standard price
  formulaCount?: number; // e.g. "N-in-1" count, if applicable
};
```
Producer rule: fill from the ingested snapshot's structured attributes first; for any value the engine generates (e.g. a computed day-supply), write it here once and reuse it. C12 flags any surface whose numbers disagree with `facts`.

## `AplusContent` type (what the A-series gate scans)
```ts
type AplusModule = { id: string; headline: string; body: string; subcopy?: string; claimBearing: boolean };
type AplusContent = {
  fdaDisclaimer: string;               // verbatim constant
  modules: AplusModule[];              // <=7; includes brand-story + hero
  comparison: { rows: { label: string; ours: string; typical: string }[] };
  faq: { q: string; a: string; claimBearing: boolean }[];
};
```
The A-series checks scan every `headline`/`body`/`subcopy`, every comparison cell, and every FAQ `q`/`a`. Each `claimBearing` module and FAQ answer must contain the verbatim disclaimer.

## Audit output (mode: paste-ready + audit)
Alongside the generated listing, produce an `Audit`:
- `scorecard` — the current listing scored against the optimization principles (0–100 + per-criterion).
- `gaps[]` — concrete diffs: `{ field, current, proposed, why, severity }`.
- `gateResult` — the verify-gate result on the **proposed** listing (must be PASS to export).
- `verified: boolean` — set by the **audit module** (which is not the generator, so worker ≠ checker holds structurally) as exactly `gateResult.pass`. There is no separate human sign-off flag in v1; "verified" means the deterministic gate passed. Export-final is unlocked only when `verified === true`.

## Element state
Every generated element carries a state (`draft` → `verified` → `published`) and advances to `verified` only when the gate is green (`verified === gateResult.pass`; no separate human sign-off in v1).
