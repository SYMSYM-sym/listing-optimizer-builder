import type { KnowledgePack, ListingSnapshot } from "@/lib/types";

const EMPTY_SUPPLEMENTS_PACK: KnowledgePack = {
  id: "supplements",
  rules: {},
  compliancePack: {
    canonicalDisclaimer:
      "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.",
    diseaseNounsBySubcategory: {},
    allergenRules: [],
    fictionPhrases: [],
  },
  attributeSchema: [],
  principles: [],
};

/** Load a category knowledge pack by id. Stub — compiled JSON packs arrive in phase-2. */
export function loadPack(id: "supplements"): KnowledgePack {
  if (id === "supplements") {
    return EMPTY_SUPPLEMENTS_PACK;
  }
  throw new Error(`Unknown knowledge pack: ${id}`);
}

/** Detect category from snapshot. Stub — real detection arrives in phase-2. */
export function detectCategory(_snapshot: ListingSnapshot): string {
  return "supplements";
}
