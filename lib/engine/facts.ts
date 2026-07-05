import type { Facts, ListingSnapshot } from "@/lib/types";

function parseInteger(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const match = value.match(/\d+/);
  if (!match) return undefined;
  const parsed = Number.parseInt(match[0], 10);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function firstNonEmpty(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    if (value?.trim()) return value.trim();
  }
  return undefined;
}

function parseServingUnits(servingSize?: string): number | undefined {
  if (!servingSize) return undefined;
  const match = servingSize.match(/(\d+)/);
  if (!match) return undefined;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

/** Deterministic Facts producer — never LLM-guessed (C12 backbone). */
export function buildFacts(snapshot: ListingSnapshot): Facts {
  const attrs = snapshot.attributes;
  const facts: Facts = {};

  const unitCount = parseInteger(attrs.unit_count ?? attrs.size_name);
  if (unitCount !== undefined) facts.unitCount = unitCount;

  const servings = parseInteger(attrs.servings_per_container);
  if (servings !== undefined) facts.servings = servings;

  const servingSize = firstNonEmpty(attrs.serving_size);
  if (servingSize) facts.servingSize = servingSize;

  const potency = firstNonEmpty(attrs.maximum_dosage);
  if (potency) facts.potency = potency;

  const weight = firstNonEmpty(attrs.item_weight);
  if (weight) facts.weight = weight;

  const price = firstNonEmpty(attrs.standard_price, snapshot.price);
  if (price) facts.price = price;

  // Day supply: servings per container at 1 serving/day, or derive from unit count ÷ units per serving.
  if (servings !== undefined && servings > 0) {
    facts.daySupply = servings;
  } else if (unitCount !== undefined) {
    const unitsPerServing = parseServingUnits(servingSize);
    if (unitsPerServing) {
      const derivedServings = Math.floor(unitCount / unitsPerServing);
      if (derivedServings > 0) facts.daySupply = derivedServings;
    }
  }

  const formulaMatch = snapshot.title.match(/\b(\d+)[-\s]?in[-\s]?1\b/i);
  if (formulaMatch?.[1]) {
    facts.formulaCount = Number.parseInt(formulaMatch[1], 10);
  }

  return facts;
}

export function inferProductName(snapshot: ListingSnapshot): string {
  const brand = snapshot.attributes.brand_name?.trim();
  if (brand) return brand;

  const title = snapshot.title.trim();
  if (!title) return "Product";

  const dashSplit = title.split(/\s[-–|]\s/)[0]?.trim();
  return dashSplit || title.split(/\s+/).slice(0, 4).join(" ");
}
