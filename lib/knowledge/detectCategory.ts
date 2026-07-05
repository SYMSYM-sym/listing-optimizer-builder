import type { CategoryDetection, ListingSnapshot } from "@/lib/types";

type SubcategoryRule = {
  subcategory: string;
  keywords: string[];
};

const SUPPLEMENT_CATEGORY_KEYWORDS = [
  "supplement",
  "vitamin",
  "mineral",
  "herbal",
  "nutrition",
  "dietary",
  "health & personal care",
  "health and personal care",
];

const NON_SUPPLEMENT_CATEGORY_KEYWORDS = [
  "electronics",
  "clothing",
  "shoes",
  "books",
  "toys",
  "kitchen",
  "furniture",
  "software",
  "video games",
  "automotive",
  "tools",
  "grocery",
  "beauty",
  "cosmetic",
];

const SUBCATEGORY_RULES: SubcategoryRule[] = [
  { subcategory: "probiotic", keywords: ["probiotic", "prebiotic", "gut health", "microbiome"] },
  { subcategory: "joint", keywords: ["joint", "glucosamine", "chondroitin", "collagen joint", "mobility"] },
  { subcategory: "heart", keywords: ["heart", "cardio", "cholesterol", "coq10", "blood pressure"] },
  { subcategory: "sleep", keywords: ["sleep", "melatonin", "insomnia", "restful"] },
  { subcategory: "immunity", keywords: ["immune", "immunity", "elderberry", "echinacea", "zinc"] },
  { subcategory: "digestive", keywords: ["digestive", "digestion", "enzyme", "fiber", "bloat"] },
  { subcategory: "womens", keywords: ["women", "female", "menopause", "prenatal", "pregnancy"] },
  { subcategory: "mens", keywords: ["men", "male", "prostate", "testosterone", "mens health"] },
];

function haystack(snapshot: ListingSnapshot): string {
  const parts = [
    snapshot.category,
    snapshot.subcategory,
    snapshot.title,
    ...snapshot.bullets,
    snapshot.description,
    ...Object.values(snapshot.attributes),
  ];
  return parts.join(" ").toLowerCase();
}

function categoryText(snapshot: ListingSnapshot): string {
  return `${snapshot.category} ${snapshot.subcategory}`.toLowerCase();
}

/** Avoid false positives like "men" inside "supplement". */
function matchesKeyword(text: string, keyword: string): boolean {
  if (keyword.includes(" ")) {
    return text.includes(keyword);
  }
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`\\b${escaped}\\b`, "i").test(text);
}

function hasExplicitSupplementSignal(snapshot: ListingSnapshot): boolean {
  const supplementType =
    snapshot.attributes.primary_supplement_type ??
    snapshot.attributes.supplement_type ??
    snapshot.attributes.item_type_keyword;

  if (supplementType && /supplement|vitamin|probiotic|herb|mineral/i.test(supplementType)) {
    return true;
  }

  const listingText = [
    snapshot.title,
    ...snapshot.bullets,
    snapshot.description,
    ...Object.values(snapshot.attributes),
  ]
    .join(" ")
    .toLowerCase();

  return SUPPLEMENT_CATEGORY_KEYWORDS.some((term) => listingText.includes(term));
}

function isNonSupplementCategory(snapshot: ListingSnapshot): boolean {
  const text = categoryText(snapshot);
  return NON_SUPPLEMENT_CATEGORY_KEYWORDS.some((term) => text.includes(term));
}

function isSupplementListing(snapshot: ListingSnapshot): boolean {
  if (hasExplicitSupplementSignal(snapshot)) {
    return true;
  }

  if (isNonSupplementCategory(snapshot)) {
    return false;
  }

  const text = haystack(snapshot);

  if (SUPPLEMENT_CATEGORY_KEYWORDS.some((term) => text.includes(term))) {
    return true;
  }

  if (
    SUBCATEGORY_RULES.some((rule) =>
      rule.keywords.some((keyword) => matchesKeyword(text, keyword)),
    )
  ) {
    return true;
  }

  return false;
}

function detectSubcategory(snapshot: ListingSnapshot): string {
  const text = haystack(snapshot);

  for (const rule of SUBCATEGORY_RULES) {
    if (rule.keywords.some((keyword) => matchesKeyword(text, keyword))) {
      return rule.subcategory;
    }
  }

  return "general";
}

/**
 * Map a listing snapshot to a knowledge pack id and compliance subcategory.
 * The subcategory selects disease-noun lists for the verify gate.
 */
export function detectCategory(snapshot: ListingSnapshot): CategoryDetection {
  if (!isSupplementListing(snapshot)) {
    return { packId: "generic", subcategory: "general" };
  }

  return {
    packId: "supplements",
    subcategory: detectSubcategory(snapshot),
  };
}

/** Convenience accessor for pack id only (used by ingestion/engine call sites). */
export function detectPackId(snapshot: ListingSnapshot): CategoryDetection["packId"] {
  return detectCategory(snapshot).packId;
}
