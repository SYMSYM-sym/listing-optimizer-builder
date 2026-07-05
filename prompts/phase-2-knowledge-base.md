# PHASE 2 — Knowledge base (compile the brain)

Turn `brain/` into loadable, machine-usable knowledge. Do only this phase.

## Build
1. Create `knowledge/` with compiled JSON derived from `brain/`:
   - `rules.json` — every hard limit from `brain/01-amazon-rules.md` as structured values (titleMaxLegacy=200, title75Max=75, itemHighlightsMax=125, bulletCount=5, bulletMax=255, descriptionMax=2000, backendMaxBytes=249, imageMain/gallery specs, aplus module caps). Include a `timeSensitive` flag per rule where marked ⏳.
   - `compliance.supplements.json` — `{ disclaimer, diseaseVerbs[], diseaseNounsBySubcategory{}, allergenRules[], superlativeBans[], fictionPhrases[] }` from `brain/02`. **`diseaseNounsBySubcategory`** is a map (e.g. `probiotic`, `joint`, `heart`, `sleep`, `immunity`, `digestive`, `womens`, `mens`) → a **non-empty** array of that subcategory's disease/infection nouns. **`allergenRules`** is an array of `{ class, source, canonicalString }`. `fictionPhrases[]` defaults to empty (operator-supplied). Ship real, populated disease-noun lists for at least the common subcategories — an empty list must never ship as the "supported" state.
   - `attribute-schema.supplements.json` — the array of `{ field, label, filterFacet, required, valueType, example }` from `brain/03`.
   - `principles.json` — the 16 principles from `brain/00` as `{ id, text, weight }` for the audit scorer.
2. `lib/knowledge/loadPack.ts` — assemble a `KnowledgePack` from these files: `{ id:'supplements', rules, compliancePack, attributeSchema, principles }`.
3. `lib/knowledge/detectCategory.ts` — map a `ListingSnapshot` (its Amazon category/browse node + title keywords) to **both** a pack id AND a `subcategory` label (e.g. `probiotic`, `joint`). Default pack `'supplements'`; provide a `'generic'` fallback pack (rules + principles only, no supplement compliance) so non-supplement URLs still produce a limited result. The detected `subcategory` selects the disease-noun list the gate uses; if no non-empty list exists for it, the gate fails closed (per `brain/04`).

## Constraints
- The **numbers must exactly match `brain/`**. Add a unit test asserting a few key limits (backend 249 bytes, title75 75, highlights 125).
- Keep category-specific data **only** in packs; nothing category-specific leaks into engine/gate code.

## Acceptance
- `loadPack('supplements')` returns a fully-populated pack; `loadPack('generic')` returns the fallback.
- Limit-assertion tests pass.
- `detectCategory` returns `'supplements'` for a supplement ASIN and `'generic'` otherwise.
