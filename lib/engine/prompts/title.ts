import type { KnowledgePack, ListingSnapshot } from "@/lib/types";
import {
  formatCompliance,
  formatLimits,
  formatPrinciples,
  formatSnapshot,
  jsonOutputInstruction,
  ruleNumber,
} from "@/lib/engine/prompts/context";
import { inferProductName } from "@/lib/engine/facts";

export type TitleGroupResult = {
  productName: string;
  title: string;
  title75: string;
  itemHighlights: string;
};

export function buildTitlePrompt(
  snapshot: ListingSnapshot,
  pack: KnowledgePack,
  subcategory: string,
): { system: string; user: string } {
  const productNameHint = inferProductName(snapshot);
  const limits = formatLimits(pack.rules);

  const system = [
    "You write Amazon listing titles following strict character limits and compliance rules.",
    `Limits: ${limits}`,
    "Title precedence: product name FIRST, then front-load the primary keyword in the remainder.",
    "Division of labor: title75 = product name + highest-value keyword cluster; itemHighlights = secondary keywords not in title75.",
    formatPrinciples(pack, ["P01", "P06", "P08"]),
    formatCompliance(pack, subcategory),
    jsonOutputInstruction(
      '{ "productName": string, "title": string, "title75": string, "itemHighlights": string }',
    ),
  ].join("\n");

  const user = [
    `Product name hint: ${productNameHint}`,
    `Current listing snapshot:\n${formatSnapshot(snapshot)}`,
    `Write title (≤${ruleNumber(pack.rules, "titleMaxLegacy")}), title75 (≤${ruleNumber(pack.rules, "title75Max")}), itemHighlights (≤${ruleNumber(pack.rules, "itemHighlightsMax")}).`,
    "No promotional language or price in titles.",
  ].join("\n\n");

  return { system, user: `${user}\n\n[TITLE_GROUP]` };
}
