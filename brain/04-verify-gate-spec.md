# Verify-Gate Spec (port to generic pure functions)

The gate is the compliance/quality backstop. It loads the generated `OptimizedListing` (title, `title75`, `itemHighlights`, `bullets[]`, `description`, `backendSearchTerms`, `fdaDisclaimer`, `attributes{}`, `facts{}`, `aplusContent`) — see the `Facts` and `AplusContent` type definitions in `05-output-contract.md` — runs every check, and returns `{ pass: boolean, failures: Failure[] }` where `Failure = { checkId, field, context, fix }`. **PASS only if zero failures.**

**Hard rule (ported from the source project): never mutate content to force a pass. The gate reports; the engine's repair loop may regenerate, but a persistent real failure must surface to the user, never be silently edited away.**

## Supporting concepts (implement once, reuse everywhere)
- **Customer-surface set** = the fields compliance-scanned: title, title75, itemHighlights, description, backendSearchTerms, each bullet. (In the source project these were also re-extracted from the rendered HTML to prevent drift; here the JSON is the single source, so scan the JSON.)
- **Guide-file scope-out:** the app's own knowledge/rulebook files legitimately *name* banned terms. Any repo-wide scan must exclude the `brain/` and `knowledge/` docs via a skip-set.
- **Negation-context guard:** before flagging a banned pattern, inspect ~90 preceding chars for negation cues ("never", "banned", "do not", "there is no", "avoid", "not"). A term used to prohibit itself is not a violation.
- **Normalization:** normalize punctuation (curly quotes → straight, en/em dash → hyphen, collapse whitespace) and decode HTML entities before matching, so gray-zone punctuation can't smuggle a violation past a check.

## Checks on the listing (C-series)
- **C1 — Title length.** `title.length ≤ 200`.
- **C2 — Bullets.** Exactly **5** bullets, each `≤ 255` chars.
- **C3 — Backend byte cap.** `utf8Bytes(backendSearchTerms) ≤ 249`.
- **C4 — Description length.** `description.length ≤ 2000`.
- **C5 — FDA disclaimer.** `fdaDisclaimer` equals the canonical constant (after normalization) **and** the exact disclaimer appears inside `description`.
- **C6 — Banned disease terms.** Scan all customer surfaces (disclaimer text subtracted first, negation-guarded) for the active compliance pack's disease nouns, condition acronym, infection phrase, and the `treat/cure/prevent` + disease-noun combo. Fail on any non-negated match.
- **C7 — Backend brand leakage.** The backend-only `brand_name`/`manufacturer` string must not appear in any customer field (title, title75, itemHighlights, description, bullets, or any attribute except `brand_name`/`manufacturer`).
- **C8 — Product-name lead.** The customer product name **starts** the title and **appears** in the description.
- **C9 — Allergen declaration.** If an allergen is present: the allergen pattern appears in ≥1 bullet AND the description; `attributes.allergen_information` equals the exact required string; "No Known Allergens" never appears. The pack supplies `allergenRules` as `{ class, source, canonicalString }` (e.g. `{ class:'Tree Nuts', source:'[nut]', canonicalString:'Contains: Tree Nuts ([nut])' }`); the check builds an **order-independent** matcher from `class` + `source` (matches "class…source" OR "source…class") so wording order doesn't matter.
- **C10 — Potency phrasing.** The headline potency figure must attach to the blend/formula, not "per serving." Flag "[figure] … per serving" / "delivers|provides|contains [figure] … per serving." Negation-guarded.
- **C11 — Banned fiction phrase.** Scan for any operator-supplied known-false descriptor in the pack's `fictionPhrases[]` (a claim that must never resurface). Negation-guarded. **No-op when `fictionPhrases[]` is empty** (default for a fresh ASIN) — it does not fail; it simply has nothing to match.
- **C12 — Fact consistency.** Flag potency/count values that disagree with `facts{}` (schema in `05-output-contract.md`), and any internal conflict (two different potency numbers in one surface). Fail on any wrong or conflicting number.
- **C13 — (source-project only; NOT in the web-app gate).** A file-naming convention from the origin project. This app is stateless per run with no product-named output files, so **omit C13.** Listed only for provenance.
- **C14 — (source-project only; NOT in the web-app gate).** A single-WIP-element rule tied to the origin project's file-based element registry, which this app does not have. **Omit C14.** Listed only for provenance.
- **C15 — ⏳ New title policy.** When `title75`/`itemHighlights` are present: `title75 ≤ 75` and starts with the product name; `itemHighlights ≤ 125`.

> **The web-app gate implements C1–C12 + C15 + A1–A8.** C13 and C14 are documented here only so the port is traceable to the source; do not build them.

### Fail-closed rule (compliance can't be laundered by an empty pack)
If the active compliance pack's **disease-noun list is empty** for a detected supplement subcategory, the gate must **not** silently pass C6/A2. It returns a blocking failure `checkId:'PACK'`, `field:'compliance'`, `fix:'compliance pack incomplete for this category — populate disease nouns before trusting a pass'`, and the audit sets `verified:false`. (Fiction phrases are genuinely optional and do not fail-close; disease nouns do.)

## Checks on A+ (A-series) — run over every A+ text field (headlines, bodies, subcopy, comparison rows, close copy, each FAQ q/a)
- **A1 — A+ disclaimer.** `aplus.fdaDisclaimer` equals the canonical constant; disclaimer present in each claim-bearing module/FAQ answer.
- **A2 — A+ banned terms.** C6 scan over all A+ fields.
- **A3 — A+ brand leakage.** Backend-only brand name absent from all A+ fields.
- **A4 — A+ product-name presence.** Product name appears in the Brand-Story module and the hero module.
- **A5 — A+ potency phrasing.** C10 guard over A+ fields.
- **A6 — A+ fiction phrase.** C11 scan over A+ fields.
- **A7 — A+ allergen.** Allergen pattern appears in the ingredients module.
- **A8 — A+ prohibited marketing.** Flag price/`$`, "per day" price framing, "buy now," "subscribe & save," urgency, guarantees, `#1`, "best seller," and any star/review-count language. Negation-guarded.

## Implementation notes
- Each check is a **pure function** `(listing|aplus, packConfig) => Failure[]`, unit-tested with pass and fail fixtures.
- The active **compliance pack** supplies the disease-noun list, canonical disclaimer, allergen rules, and fiction phrases — so the same check code serves any category.
- Expose `runGate(listing, aplus, pack)` returning the aggregate result; the engine calls it inside the repair loop and the UI renders the failures.
