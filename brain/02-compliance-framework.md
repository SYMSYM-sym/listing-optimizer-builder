# Compliance Framework (supplements-first, extensible)

Reusable rules for any dietary-supplement listing. A supplement is **not** a drug — **structure/function claims only**. This is the first "compliance pack"; other categories plug in their own pack later (see ARCHITECTURE.md).

## Structure/function vs. disease-claim rule
- **Permitted:** statements that describe support for the normal structure or function of the body — e.g., "supports healthy [system] function," "helps maintain [normal parameter]."
- **Prohibited:** any claim to **diagnose, treat, cure, prevent, or mitigate** a disease or its symptoms.

## Verbatim FDA disclaimer (21 CFR 101.93)
Include this exact text wherever any benefit / structure-function claim appears (bullets, description, A+ modules, claim-bearing Q&A):

> These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.

## Banned disease-term list (generic pattern)
Never use in any surface — title, highlights, bullets, description, backend, images, A+, Q&A, ad creative:
- **Drug/action verbs as product claims (always active):** `treat`, `cure`, `prevent`, `mitigate`, `diagnose`.
- **Category disease nouns (populated per detected subcategory):** e.g. a joint product bans "arthritis"; a heart product bans "hypertension."
- **Combination pattern:** any `treat/cure/prevent` within ~25 chars of a disease/infection noun.

**How the disease-noun list is populated (required — no hand-waving):** `detectCategory` returns a pack id AND a `subcategory` label (from the snapshot's browse node + title keywords). The supplements pack ships a `diseaseNounsBySubcategory` map keyed by common supplement subcategories (probiotic, joint, heart, sleep, immunity, etc.), each with its category disease/infection nouns. The gate loads the nouns for the detected subcategory. **If the map has no non-empty entry for the detected subcategory, the gate fails closed** (see `04-verify-gate-spec.md` "Fail-closed rule") rather than scanning against verbs only — an empty disease list must never launder a pass. As a backstop, the engine may also propose candidate disease nouns for the product, which are added to the scan (deterministic code still makes the pass/fail call).

## Allowed compliant edges
- Reframe a banned condition as a **structure/function state** (e.g., "[parameter] balance" instead of the disease name).
- Use only regulator-safe phrasing for adjacent systems ("supports normal [system] function").
- Factual, documentable claims are allowed: longevity ("trusted for over [N] years") and volume ("[N] units sold") — **only if substantiated** by the seller's records.

## Regulatory / social-proof bans
- No "FDA approved," no FDA logo (supplements are not FDA-approved).
- No `#1`, "the only," "clinically proven" (unless genuinely substantiated), "maximum strength."
- No star-rating or review-count claims (compensate with the compliant trust signals above).

## Allergen declaration rule
- If the product contains a major allergen, declare it exactly and consistently in `allergen_information`, in ≥1 bullet, and in the description — e.g., `Contains: [ALLERGEN]`.
- **Never** use "No Known Allergens" when a declarable allergen is present. Include a canonical safety warning (allergen + pregnancy/nursing + physician-consult + keep from children) where required.
- The pack encodes each allergen as `{ class, source, canonicalString }` (e.g. `{ class:'Tree Nuts', source:'[nut]', canonicalString:'Contains: Tree Nuts ([nut])' }`). The gate's C9/A7 build an **order-independent** matcher from `class`+`source`, and require `allergen_information` to equal `canonicalString` exactly.

## Extending to other categories (future)
A compliance pack = { permitted-claim templates, banned-term generator for the category, required disclaimers, required warnings/allergen rules }. Cosmetics, electronics, food, etc. each get their own pack. The **engine and verify gate stay identical**; only the pack's data changes.
