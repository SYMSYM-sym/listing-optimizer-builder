# PHASE 4 — Verify gate + repair loop

Implement the compliance/quality gate exactly per `brain/04-verify-gate-spec.md`. Do only this phase.

## Build
1. `lib/gate/util.ts` — `normalize(text)` (curly→straight quotes, en/em dash→hyphen, decode HTML entities, collapse whitespace), `utf8Bytes(s)`, `hasNegationContext(text, matchIndex)` (~90 preceding chars).
2. `lib/gate/checks/` — implement **C1–C12 + C15 and A1–A8** as **pure functions** `(listing|aplus, pack) => Failure[]`, matching `brain/04` precisely. **Do NOT implement C13 or C14** — they are source-project-only (no filenames / no element registry in this app); `brain/04` marks them omitted. Notably:
   - C3/backend uses **UTF-8 bytes ≤249**; C2 = exactly 5 bullets ≤255; C15 = title75≤75 starts-with product name, itemHighlights≤125.
   - C5/A1 compare the disclaimer to the canonical constant **after normalization**, and require placement (description + claim-bearing A+/FAQ; NOT bullets).
   - C6/A2 banned-term scan uses the pack's disease nouns for the detected subcategory, subtracts the disclaimer text, negation-guarded. **Fail closed:** if the subcategory's disease-noun list is empty, emit the blocking `PACK` failure (per `brain/04`) — never pass on an empty list.
   - C9/A7 build the order-independent allergen matcher from `allergenRules {class, source, canonicalString}`.
   - C10/A5 per-serving potency guard; C11 no-op when `fictionPhrases[]` empty; C12 fact-consistency against the `facts` object.
   - A-series run over the `AplusContent` fields (module headline/body/subcopy, comparison cells, FAQ q/a).
3. `lib/gate/runGate.ts` — runs all checks, returns `{ pass, failures[] }`.
4. `lib/engine/repair.ts` — bounded loop: optimize → runGate → if failures, map each failure to the prompt group that owns it via an explicit `FIELD_TO_GROUP` table (`title|title75|itemHighlights→title`, `bullet*→bullets`, `description→description`, `backendSearchTerms→backend`, `attributes.*→attributes`, `aplus*→aplus`, `qa*→qa`), regenerate **only the owning groups**, up to `MAX_REPAIR_ITERATIONS`. If still failing, return the listing with `verified:false` and the outstanding failures. **Never edit content just to pass.** (A `PACK` fail-closed failure is not repairable by regeneration — surface it directly.)
5. Unit tests: for every implemented check, a passing fixture and a failing fixture; assert exact `checkId` + `field`.

## Acceptance
- **C1–C12 + C15 + A1–A8** have green pass/fail unit tests (C13/C14 intentionally absent).
- `runGate` on a clean listing (with a populated disease-noun pack) → `pass:true`; on the negative fixture (disease term + missing disclaimer + 6 bullets + over-byte backend + empty disease-noun list) → the exact expected failures including the `PACK` fail-closed failure.
- The repair loop regenerates only the owning groups and terminates at the cap; a persistent failure is surfaced, not hidden.
