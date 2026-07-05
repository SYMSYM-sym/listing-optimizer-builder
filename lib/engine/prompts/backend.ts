import type { KnowledgePack, ListingSnapshot } from "@/lib/types";
import {
  formatCompliance,
  formatLimits,
  formatSnapshot,
  jsonOutputInstruction,
  ruleNumber,
} from "@/lib/engine/prompts/context";

export type BackendGroupResult = {
  backendSearchTerms: string;
};

export function buildBackendPrompt(
  snapshot: ListingSnapshot,
  pack: KnowledgePack,
  subcategory: string,
  title: string,
): { system: string; user: string } {
  const system = [
    "You write Amazon backend search terms (generic_keyword).",
    `Limits: ${formatLimits(pack.rules)}`,
    `Must be ≤${ruleNumber(pack.rules, "backendMaxBytes")} UTF-8 bytes.`,
    "Synonyms, misspellings, and other-language variants only — no words from the title, no brands, no ASINs, no disease terms.",
    formatCompliance(pack, subcategory),
    jsonOutputInstruction('{ "backendSearchTerms": string }'),
  ].join("\n");

  const user = [
    `Title (do not repeat its words): ${title}`,
    `Current listing snapshot:\n${formatSnapshot(snapshot)}`,
    "Write backend search terms as a single space-separated string.",
  ].join("\n\n");

  return { system, user: `${user}\n\n[BACKEND_GROUP]` };
}
