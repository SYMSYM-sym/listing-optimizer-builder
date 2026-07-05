import type { KnowledgePack, ListingSnapshot, Principle } from "@/lib/types";

type RuleEntry = { value: number | string | boolean | string[] | number[]; timeSensitive?: boolean };

export function ruleNumber(rules: Record<string, unknown>, key: string): number {
  const entry = rules[key] as RuleEntry | undefined;
  return typeof entry?.value === "number" ? entry.value : 0;
}

export function formatLimits(rules: Record<string, unknown>): string {
  return [
    `titleMaxLegacy=${ruleNumber(rules, "titleMaxLegacy")}`,
    `title75Max=${ruleNumber(rules, "title75Max")}`,
    `itemHighlightsMax=${ruleNumber(rules, "itemHighlightsMax")}`,
    `bulletCount=${ruleNumber(rules, "bulletCount")}`,
    `bulletMax=${ruleNumber(rules, "bulletMax")}`,
    `descriptionMax=${ruleNumber(rules, "descriptionMax")}`,
    `backendMaxBytes=${ruleNumber(rules, "backendMaxBytes")}`,
    `aplusPremiumMaxModules=${ruleNumber(rules, "aplusPremiumMaxModules")}`,
  ].join(", ");
}

export function formatSnapshot(snapshot: ListingSnapshot): string {
  return JSON.stringify(
    {
      asin: snapshot.asin,
      title: snapshot.title,
      bullets: snapshot.bullets,
      description: snapshot.description,
      category: snapshot.category,
      subcategory: snapshot.subcategory,
      price: snapshot.price,
      attributes: snapshot.attributes,
    },
    null,
    2,
  );
}

export function formatCompliance(pack: KnowledgePack, subcategory: string): string {
  const compliance = pack.compliancePack;
  if (!compliance.canonicalDisclaimer) {
    return "No category-specific compliance pack. Avoid unsubstantiated claims.";
  }

  const diseaseNouns =
    compliance.diseaseNounsBySubcategory[subcategory] ??
    compliance.diseaseNounsBySubcategory.general ??
    [];

  return [
    `Disclaimer (verbatim when required): ${compliance.canonicalDisclaimer}`,
    `Banned disease verbs: ${compliance.diseaseVerbs.join(", ")}`,
    `Banned disease nouns for subcategory "${subcategory}": ${diseaseNouns.join(", ")}`,
    `Banned superlatives: ${compliance.superlativeBans.join(", ")}`,
    "Use structure/function language only. Never diagnose, treat, cure, prevent, or mitigate disease.",
  ].join("\n");
}

export function formatPrinciples(pack: KnowledgePack, ids: string[]): string {
  const selected = pack.principles.filter((p: Principle) => ids.includes(p.id));
  if (selected.length === 0) return "";
  return selected.map((p) => `${p.id}: ${p.text}`).join("\n");
}

export function jsonOutputInstruction(schemaDescription: string): string {
  return `Respond with valid JSON only (no markdown fences). Schema: ${schemaDescription}`;
}
