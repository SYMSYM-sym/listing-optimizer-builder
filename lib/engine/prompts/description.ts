import type { KnowledgePack, ListingSnapshot } from "@/lib/types";
import {
  formatCompliance,
  formatLimits,
  formatSnapshot,
  jsonOutputInstruction,
  ruleNumber,
} from "@/lib/engine/prompts/context";

export type DescriptionGroupResult = {
  description: string;
};

export function buildDescriptionPrompt(
  snapshot: ListingSnapshot,
  pack: KnowledgePack,
  subcategory: string,
  productName: string,
): { system: string; user: string } {
  const disclaimer = pack.compliancePack.canonicalDisclaimer;

  const system = [
    "You write an Amazon product description in plain text with blank-line paragraphs.",
    `Limits: ${formatLimits(pack.rules)}`,
    `Description ≤${ruleNumber(pack.rules, "descriptionMax")} characters including disclaimer.`,
    disclaimer
      ? `Include the product name and append this verbatim disclaimer at the end:\n${disclaimer}`
      : "Include the product name.",
    "Include allergen and safety statements when applicable.",
    formatCompliance(pack, subcategory),
    jsonOutputInstruction('{ "description": string }'),
  ].join("\n");

  const user = [
    `Product name: ${productName}`,
    `Current listing snapshot:\n${formatSnapshot(snapshot)}`,
    "Write the optimized description.",
  ].join("\n\n");

  return { system, user: `${user}\n\n[DESCRIPTION_GROUP]` };
}
