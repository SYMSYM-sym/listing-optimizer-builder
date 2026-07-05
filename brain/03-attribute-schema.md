# Attribute Schema (supplements pack; values neutralized)

Full Seller Central supplement attribute set (underscore_case). Values are **neutralized placeholders**. **⭐ = powers a customer-facing search filter (prioritize filling these).**

## Identity / brand
- `brand_name` — registered brand; backend attribute, may legitimately differ from the customer-facing product name. *(e.g., `[BRAND]`)*
- `manufacturer` — legal manufacturer. *(e.g., `[BRAND]`)*

## Classification
- `⭐ primary_supplement_type` — main class *(e.g., `Probiotic`)*.
- `supplement_type` — full class list *(e.g., `Probiotic; Prebiotic`)*.
- `⭐ recommended_browse_nodes` — target category node ID *(e.g., `[NODE_ID]`)*.
- `item_type_keyword` — internal type keyword.

## Form / dosage
- `⭐ item_form` — physical form *(e.g., `Capsule`)*.
- `dosage_form` — specific dosage form *(e.g., `Vegetable Capsule`)*.
- `serving_size` — *(e.g., `[N] Capsules`)*.
- `servings_per_container` — *(e.g., `[N]`)*.
- `unit_count` / `unit_count_type` — *(e.g., `[N]` / `Count`)*.
- `maximum_dosage` — headline potency, phrased safely *(e.g., `[N] [unit]`)*.
- `directions_for_use` — usage instructions.

## Audience / diet
- `⭐ target_gender` — *(e.g., `Female` / `Male` / `Unisex`)*.
- `⭐ age_range_description` — *(e.g., `Adult`)*.
- `⭐ diet_type` — filterable diet tags *(e.g., `Vegan; Gluten Free`)*.
- `⭐ material_features` — attribute tags *(e.g., `Vegan; Non-GMO; Gluten Free`)*.

## Benefit / use
- `⭐ product_benefit` — filterable benefit tags *(e.g., `[Benefit A]; [Benefit B]`)*.
- `recommended_uses_for_product` — general use cases.
- `specific_uses_for_product` — granular use cases (feeds COSMO / long-tail retrieval).

## Ingredients — the key distinction
- `active_ingredients` — the **functionally active** components the benefit claims rest on (actives only).
- `ingredients` — the **full label ingredient list**, including "Other Ingredients" (fillers, capsule material, flow agents).
- **Rule:** `active_ingredients` ⊆ `ingredients`; both must match the physical Supplement Facts panel. Never put fillers in `active_ingredients` or omit actives from `ingredients`.

## Allergen / safety / legal
- `⭐ allergen_information` — exact allergen string *(e.g., `Contains: [ALLERGEN]`)*.
- `safety_warning` — canonical safety text.
- `legal_disclaimer_description` — the verbatim FDA disclaimer.

## Physical / commerce
- `size_name` — *(e.g., `[N] Count (Pack of 1)`)*.
- `flavor_name` / `scent_name` — *(e.g., `Unflavored` / `Unscented`)*.
- `container_type` — *(e.g., `Bottle`)*.
- `item_weight` — *(e.g., `[N] Ounces`)*.
- `⭐ country_of_origin` — *(e.g., `[COUNTRY]`)*.
- `standard_price` — *(e.g., `[PRICE]`)*.
- `⭐ fulfillment_channel` — *(e.g., `FBA` / `FBM`)*.

**Legacy/low-weight:** `subject_keyword` (platinum keywords) — negligible weight today.

## Machine-readable form
The build should also emit this as `knowledge/attribute-schema.supplements.json` — an array of `{ field, label, filterFacet: boolean, required: boolean, valueType, example }` so the engine can iterate fields programmatically and the UI can render them.
