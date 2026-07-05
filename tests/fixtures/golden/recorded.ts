import type { ListingSnapshot } from "@/lib/types";

/** Recorded public supplement listing — deterministic CI fixture (not a live fetch). */
export const GOLDEN_ASIN = "B09GOLDEN01";

export const GOLDEN_SNAPSHOT: ListingSnapshot = {
  asin: GOLDEN_ASIN,
  url: `https://www.amazon.com/dp/${GOLDEN_ASIN}`,
  title: "Daily Probiotic - 50 Billion CFU Gut Health Supplement for Adults",
  bullets: [
    "Supports digestive balance as part of a daily wellness routine",
    "Shelf-stable probiotic blend with 50 billion CFU",
    "60 vegetarian capsules per bottle",
    "Contains: Tree Nuts (almond)",
    "Made without artificial colors",
  ],
  description:
    "Daily Probiotic delivers a 50 billion CFU blend to support normal digestive function. Contains: Tree Nuts (almond).",
  images: ["https://example.com/main.jpg"],
  attributes: {
    brand_name: "Acme Labs",
    manufacturer: "Acme Labs Inc",
    primary_supplement_type: "Probiotic",
    item_form: "Capsule",
    unit_count: "60",
    servings_per_container: "60",
    serving_size: "1 Capsule",
    allergen_information: "Contains: Tree Nuts (almond)",
    recommended_browse_nodes: "3764441",
  },
  category: "Health & Household › Vitamins, Minerals & Supplements",
  subcategory: "probiotic",
  raw: { fixture: true },
};

/** Recorded LLM group responses — deterministic compliant optimization output. */
export const GOLDEN_LLM_RESPONSES: unknown[] = [
  {
    productName: "Daily Probiotic",
    title: "Daily Probiotic Gut Health Capsules",
    title75: "Daily Probiotic Gut Health Capsules",
    itemHighlights: "Probiotic supplement adults gut",
  },
  {
    bullets: [
      "Contains: Tree Nuts (almond)",
      "Supports healthy digestion as part of a balanced diet *",
      "Shelf-stable 50 billion CFU blend for travel and daily use",
      "60 capsules per bottle for a 60-day supply",
      "Made without artificial colors or preservatives",
    ],
  },
  {
    description:
      "Daily Probiotic Gut Health Capsules supports normal digestive function. Contains: Tree Nuts (almond).",
  },
  { backendSearchTerms: "probiotics gut flora microflora digestive" },
  {
    attributes: {
      brand_name: "Acme Labs",
      manufacturer: "Acme Labs Inc",
      primary_supplement_type: "Probiotic",
      item_form: "Capsule",
      unit_count: "60",
      servings_per_container: "60",
      allergen_information: "Contains: Tree Nuts (almond)",
      recommended_browse_nodes: "3764441",
    },
  },
  {
    modules: [
      {
        id: "brand-story",
        headline: "Daily Probiotic brand story",
        body: "Daily Probiotic supports digestive balance.",
        claimBearing: true,
      },
      {
        id: "hero",
        headline: "Daily Probiotic hero",
        body: "Daily Probiotic delivers a 50 billion CFU blend for digestive support.",
        claimBearing: true,
      },
      {
        id: "ingredients",
        headline: "Ingredients",
        body: "Contains Tree Nuts (almond).",
        claimBearing: false,
      },
    ],
    comparison: { rows: [{ label: "Potency", ours: "High", typical: "Low" }] },
    faq: [{ q: "Daily use?", a: "Take daily for digestive support.", claimBearing: true }],
  },
  {
    imagePlan: [{ slot: 1, role: "main", description: "White background product", specs: "1000px min" }],
  },
  {
    qa: [{ question: "What is it?", answer: "A probiotic for digestive support.", claimBearing: true }],
  },
];

/** Required gate failure IDs for the negative non-compliant fixture. */
export const NEGATIVE_GATE_FAILURE_IDS = [
  "PACK:compliance",
  "C2:bullets",
  "C3:backendSearchTerms",
  "C5:description",
  "C5:fdaDisclaimer",
  "C15:title75",
  "C15:itemHighlights",
] as const;
