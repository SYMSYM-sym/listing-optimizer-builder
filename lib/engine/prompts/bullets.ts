import type { KnowledgePack, ListingSnapshot } from "@/lib/types";
import {
  formatCompliance,
  formatLimits,
  formatPrinciples,
  formatSnapshot,
  jsonOutputInstruction,
  ruleNumber,
} from "@/lib/engine/prompts/context";

export type BulletsGroupResult = {
  bullets: [string, string, string, string, string];
};

export function buildBulletsPrompt(
  snapshot: ListingSnapshot,
  pack: KnowledgePack,
  subcategory: string,
  productName: string,
): { system: string; user: string } {
  const system = [
    "You write exactly 5 Amazon bullet points with situational anchors.",
    `Limits: ${formatLimits(pack.rules)}`,
    `Each bullet ≤${ruleNumber(pack.rules, "bulletMax")} characters.`,
    "One situational anchor per major use-case.",
    "Claim-bearing bullets end with a short * marker only — NOT the full FDA disclaimer.",
    formatPrinciples(pack, ["P07", "P08", "P14"]),
    formatCompliance(pack, subcategory),
    jsonOutputInstruction('{ "bullets": [string, string, string, string, string] }'),
  ].join("\n");

  const user = [
    `Product name: ${productName}`,
    `Current listing snapshot:\n${formatSnapshot(snapshot)}`,
    "Write 5 compliant bullets. Include allergen declaration in at least one bullet if applicable.",
  ].join("\n\n");

  return { system, user: `${user}\n\n[BULLETS_GROUP]` };
}
