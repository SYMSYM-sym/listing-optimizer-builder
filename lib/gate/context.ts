import { inferProductName } from "@/lib/engine/facts";
import type { KnowledgePack, OptimizedListing } from "@/lib/types";

export type GateContext = {
  pack: KnowledgePack;
  subcategory: string;
  productName: string;
};

export function inferGateProductName(
  listing: OptimizedListing,
  subcategory: string,
): string {
  if (listing.title75.trim()) {
    const lead = listing.title75.trim().split(/\s+/).slice(0, 2).join(" ");
    if (lead) return lead;
  }

  return inferProductName({
    asin: "",
    url: "",
    title: listing.title,
    bullets: [...listing.bullets],
    description: listing.description,
    images: [],
    attributes: listing.attributes,
    category: "",
    subcategory,
    raw: {},
  });
}

export function buildGateContext(
  pack: KnowledgePack,
  listing: OptimizedListing,
  subcategory: string,
  productName?: string,
): GateContext {
  return {
    pack,
    subcategory,
    productName: productName ?? inferGateProductName(listing, subcategory),
  };
}

export function getCustomerSurfaces(
  listing: OptimizedListing,
): Array<{ field: string; text: string }> {
  return [
    { field: "title", text: listing.title },
    { field: "title75", text: listing.title75 },
    { field: "itemHighlights", text: listing.itemHighlights },
    { field: "description", text: listing.description },
    { field: "backendSearchTerms", text: listing.backendSearchTerms },
    ...listing.bullets.map((bullet, index) => ({
      field: `bullet${index}`,
      text: bullet,
    })),
  ];
}

export function subtractDisclaimer(text: string, disclaimer: string): string {
  if (!disclaimer) return text;
  return text.split(disclaimer).join(" ");
}

export function getDiseaseNouns(ctx: GateContext): string[] {
  const map = ctx.pack.compliancePack.diseaseNounsBySubcategory;
  return map[ctx.subcategory] ?? map.general ?? [];
}

export function ruleNumber(rules: Record<string, unknown>, key: string): number {
  const entry = rules[key] as { value: number } | undefined;
  return typeof entry?.value === "number" ? entry.value : 0;
}
