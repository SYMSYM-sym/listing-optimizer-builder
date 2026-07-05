# Amazon Listing Rules (verified, product-agnostic)

Hard field limits and formatting rules. **⏳ = time-sensitive; re-confirm against Amazon's live policy and the seller's own template/SP-API before publish.**

## Title (`item_name`)
- **⏳ ≤75 characters effective Jul 27 2026** (announced Jun 10 2026); violators subject to AI auto-rewrite by Amazon (14-day brand-review window).
- **Legacy: ≤200 characters** (in force until the Jul 27 2026 cutover; keep a `title` field for legacy/entry and a `title75` for the new policy).
- **Media exception:** some categories/programs with a media exemption may retain longer titles — verify per template.
- No promotional language, no price.
- **Word-repetition rule:** no word appears more than **2×** (brand name counts; short prepositions/articles exempt).
- **Banned characters:** `! $ ? _ { } ^ ¬ ¦`. Allowed: `&`, hyphen, comma, parentheses. **Avoid the en dash (–)** — treat as gray-zone; normalize to a hyphen or comma.

## ⏳ Item Highlights (new searchable field, effective Jul 27 2026)
- **≤125 characters**, searchable. Absorbs title overflow — carry every important term that no longer fits the 75-char title (and terms not in the title). Do not duplicate title words (respect the word-repetition rule).

## Bullets (`bullet_point`)
- **5 bullets max for 3P (third-party) sellers**; 10 only for Vendor Central (1P). Target 5.
- **≤255 characters each.**

## Description (`product_description`)
- **≤2,000 characters** (documented schema `maxLength`; confirm in the live template).
- Plain text; blank-line paragraph breaks or `<br>` where supported — never type a literal `<br>` as visible text.
- A+ Content visually replaces the description on the PDP, but the field still matters for indexing and AI retrieval.

## Backend search terms (`generic_keyword` SP-API / `generic_keywords` flat-file)
- **<250 bytes (US); first 249 bytes saved.** Exceeding the cap de-indexes the **entire** field. (200 bytes = India only.)
- Measured in **UTF-8 bytes**, not characters.
- No brand names, no ASINs, no disease terms; do not repeat title words. Reserve for synonyms, misspellings, other-language variants.
- `subject_keyword` (platinum keywords) = legacy, negligible weight today.

## Images
- **Main image:** pure white background RGB 255/255/255; product fills ≥85% of frame; longest side ≥1,000 px (500 px hard upload floor; 10,000 px max).
- **Gallery:** up to **9 uploads** = 1 main + 8 secondary (~7 display slots surface in the creative stack).
- Regulated/factual panels (e.g., a Supplement Facts panel) must be **real photographs — never AI-generated or altered.**
- No price, ratings, guarantees, or promotional CTAs on images or PDP video.

## A+ Content
- **Basic A+:** 970 px wide; up to **5 modules**.
- **Premium A+:** 1,464 px wide; up to **7 modules**; supports in-A+ 9:16 video and hover/hotspots. ⏳ Premium A+ is free for Brand-Registered sellers and the old eligibility gate has been relaxed for many accounts through 2025–26 — confirm per account.
- **Brand Story:** 1 module, up to 19 carousel cards.
- A+ banner images typically 1,464×600 (≤2 MB); mirror every banner claim in readable module text and in image alt-text.

## Catalog / taxonomy
- Set the correct `feed_product_type` token (confirm via SP-API `getDefinitionsProductType`).
- Choose the **tightest valid `recommended_browse_nodes`** ID; **⚠ confirm the node accepts the product type in Product Classifier** before finalizing. Where no niche node exists, pick the best-fit parent and carry specificity via title/bullets/attributes. **Note for the app:** with only a public URL and no Seller Central access, the app can *suggest* a browse node but cannot validate acceptance in Product Classifier — present it as a recommendation for the operator to confirm, not a verified value.
- Supplement/nutrition schemas can run large (~88 fields in the SUPPLEMENTS template) — fill every applicable field.

## Q&A
- ⏳ Legacy community Q&A is de-emphasized and moving to AI-answered; verify behavior per ASIN. Seed accurate pairs regardless.

## Copy bans (all categories)
- No price or `$` in A+ / images.
- No unsubstantiated superlatives (`#1`, `the only`, `best seller`, `maximum strength`).
- No star-rating or review-count claims anywhere in copy or creative.
- No urgency ("hurry", "today only"), no guarantees ("money-back"), no "Buy Now" / "Subscribe & Save" in A+.
