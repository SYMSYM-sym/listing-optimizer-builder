import type { KnowledgePack, ListingSnapshot, QAItem } from "@/lib/types";
import {
  formatCompliance,
  formatPrinciples,
  formatSnapshot,
  jsonOutputInstruction,
  ruleNumber,
} from "@/lib/engine/prompts/context";

export type QaGroupResult = {
  qa: QAItem[];
};

export function buildQaPrompt(
  snapshot: ListingSnapshot,
  pack: KnowledgePack,
  subcategory: string,
  productName: string,
): { system: string; user: string } {
  const disclaimer = pack.compliancePack.canonicalDisclaimer;

  const qaTarget = ruleNumber(pack.rules, "qaSeedTargetCount") || 15;

  const system = [
    "You write accurate Amazon Q&A pairs that mirror listing facts.",
    `Target ~${qaTarget} pairs.`,
    formatPrinciples(pack, ["P12", "P14"]),
    disclaimer
      ? `Claim-bearing answers must include this verbatim disclaimer:\n${disclaimer}`
      : "Keep answers factual and compliant.",
    formatCompliance(pack, subcategory),
    jsonOutputInstruction(
      '{ "qa": [{ "question": string, "answer": string, "claimBearing": boolean }] }',
    ),
  ].join("\n");

  const user = [
    `Product name: ${productName}`,
    `Current listing snapshot:\n${formatSnapshot(snapshot)}`,
    `Write ~${qaTarget} Q&A pairs seeding the AI-answer layer.`,
  ].join("\n\n");

  return { system, user: `${user}\n\n[QA_GROUP]` };
}
