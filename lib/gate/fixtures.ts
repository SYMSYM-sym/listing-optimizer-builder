import { loadPack } from "@/lib/knowledge/loadPack";
import type { KnowledgePack, OptimizedListing } from "@/lib/types";

export const DISCLAIMER =
  "These statements have not been evaluated by the Food and Drug Administration. This product is not intended to diagnose, treat, cure, or prevent any disease.";

export const PRODUCT_NAME = "Daily Probiotic";

export function buildCleanListing(pack: KnowledgePack = loadPack("supplements")): OptimizedListing {
  return {
    title: `${PRODUCT_NAME} Digestive Balance Capsules`,
    title75: `${PRODUCT_NAME} Digestive Balance Capsules`,
    itemHighlights: "probiotic gut microflora daily support",
    bullets: [
      "Contains: Tree Nuts (almond) — check label if allergic",
      "Supports healthy digestion as part of a balanced diet *",
      "Shelf-stable formula for travel and daily routines",
      "60 capsules per bottle for a 60-day supply",
      "Made without artificial colors or preservatives",
    ] as OptimizedListing["bullets"],
    description: `${PRODUCT_NAME} Digestive Balance Capsules support normal gut function as part of a balanced diet. Contains: Tree Nuts (almond).

${DISCLAIMER}`,
    backendSearchTerms: "probiotics gut microflora digestive flora",
    attributes: {
      brand_name: "Acme Labs",
      manufacturer: "Acme Labs Inc",
      allergen_information: "Contains: Tree Nuts (almond)",
      unit_count: "60",
      servings_per_container: "60",
    },
    facts: {
      unitCount: 60,
      servings: 60,
      daySupply: 60,
      potency: "50 billion CFU",
    },
    fdaDisclaimer: DISCLAIMER,
    aplusContent: {
      fdaDisclaimer: DISCLAIMER,
      modules: [
        {
          id: "brand-story",
          headline: `${PRODUCT_NAME} heritage`,
          body: `${PRODUCT_NAME} supports digestive balance. ${DISCLAIMER}`,
          claimBearing: true,
        },
        {
          id: "hero",
          headline: `${PRODUCT_NAME} hero`,
          body: `${PRODUCT_NAME} delivers a 50 billion CFU blend for digestive support. ${DISCLAIMER}`,
          claimBearing: true,
        },
        {
          id: "ingredients",
          headline: "Ingredients",
          body: "Contains Tree Nuts (almond) and probiotic strains.",
          claimBearing: false,
        },
      ],
      comparison: {
        rows: [{ label: "Quality", ours: "High potency blend", typical: "Mixed quality" }],
      },
      faq: [
        {
          q: "How do I use it?",
          a: `Take one ${PRODUCT_NAME} capsule daily with food for digestive support. ${DISCLAIMER}`,
          claimBearing: true,
        },
      ],
    },
    imagePlan: [{ slot: 1, role: "main", description: "White background", specs: "1000px" }],
    qa: [
      {
        question: "What is it?",
        answer: `A daily ${PRODUCT_NAME} capsule for digestive support. ${DISCLAIMER}`,
        claimBearing: true,
      },
    ],
    state: "draft",
  };
}

export function buildNegativeListing(pack: KnowledgePack = loadPack("supplements")): OptimizedListing {
  const longBackend = "x".repeat(260);
  return {
    title: "Acme Labs diabetes relief capsules",
    title75: "Wrong title without product lead that exceeds seventy five characters easily",
    itemHighlights: "x".repeat(130),
    bullets: ["One", "Two", "Three", "Four", "Five", "Six"] as unknown as OptimizedListing["bullets"],
    description: "Supports gut health without disclaimer.",
    backendSearchTerms: longBackend,
    attributes: {
      brand_name: "Acme Labs",
      manufacturer: "Acme Labs Inc",
    },
    facts: { unitCount: 60, potency: "50 billion CFU" },
    fdaDisclaimer: "Wrong disclaimer",
    aplusContent: {
      fdaDisclaimer: "Wrong",
      modules: [
        {
          id: "brand-story",
          headline: "Story",
          body: "Missing product name",
          claimBearing: true,
        },
        {
          id: "hero",
          headline: "Hero",
          body: "Missing name",
          claimBearing: true,
        },
      ],
      comparison: { rows: [] },
      faq: [{ q: "Q?", a: "No disclaimer answer", claimBearing: true }],
    },
    imagePlan: [],
    qa: [],
    state: "draft",
  };
}

export function buildEmptyDiseaseNounPack(base: KnowledgePack = loadPack("supplements")): KnowledgePack {
  return {
    ...base,
    compliancePack: {
      ...base.compliancePack,
      diseaseNounsBySubcategory: {
        ...base.compliancePack.diseaseNounsBySubcategory,
        probiotic: [],
        general: [],
      },
    },
  };
}
