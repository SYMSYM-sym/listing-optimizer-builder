import type { AplusContent, KnowledgePack, ListingSnapshot } from "@/lib/types";
import {
  formatCompliance,
  formatLimits,
  formatPrinciples,
  formatSnapshot,
  jsonOutputInstruction,
  ruleNumber,
} from "@/lib/engine/prompts/context";

export type AplusGroupResult = Pick<
  AplusContent,
  "modules" | "comparison" | "faq"
>;

export function buildAplusPrompt(
  snapshot: ListingSnapshot,
  pack: KnowledgePack,
  subcategory: string,
  productName: string,
): { system: string; user: string } {
  const disclaimer = pack.compliancePack.canonicalDisclaimer;
  const maxModules = ruleNumber(pack.rules, "aplusPremiumMaxModules") || 7;

  const system = [
    "You write Premium A+ Content with real extractable text (not image-only).",
    `Limits: ${formatLimits(pack.rules)}`,
    `Up to ${maxModules} modules including brand-story and hero.`,
    disclaimer
      ? `Each claimBearing module and FAQ answer must include this verbatim disclaimer:\n${disclaimer}`
      : "Write compliant marketing copy.",
    "Include a comparison table and FAQ list.",
    formatPrinciples(pack, ["P09", "P10", "P12"]),
    formatCompliance(pack, subcategory),
    jsonOutputInstruction(
      '{ "modules": [{ "id", "headline", "body", "subcopy?", "claimBearing" }], "comparison": { "rows": [{ "label", "ours", "typical" }] }, "faq": [{ "q", "a", "claimBearing" }] }',
    ),
  ].join("\n");

  const user = [
    `Product name: ${productName}`,
    `Current listing snapshot:\n${formatSnapshot(snapshot)}`,
    "Write full module body text, comparison rows, and FAQ Q&A pairs.",
  ].join("\n\n");

  return { system, user: `${user}\n\n[APLUS_GROUP]` };
}
