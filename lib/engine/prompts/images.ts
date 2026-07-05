import type { ImageSlot, KnowledgePack, ListingSnapshot } from "@/lib/types";
import {
  formatLimits,
  formatSnapshot,
  jsonOutputInstruction,
  ruleNumber,
} from "@/lib/engine/prompts/context";

export type ImagesGroupResult = {
  imagePlan: ImageSlot[];
};

export function buildImagesPrompt(
  snapshot: ListingSnapshot,
  pack: KnowledgePack,
): { system: string; user: string } {
  const fillMin = ruleNumber(pack.rules, "imageMainMinProductFillPercent");
  const longestMin = ruleNumber(pack.rules, "imageMainLongestSideMinPx");
  const roles = pack.compliancePack.imageRoles;

  const system = [
    "You plan Amazon image slots with creative direction.",
    `Limits: ${formatLimits(pack.rules)}`,
    `Main image: pure white background, product fills ≥${fillMin}% of frame, longest side ≥${longestMin}px.`,
    "No price, ratings, guarantees, or promotional CTAs on images.",
    jsonOutputInstruction(
      '{ "imagePlan": [{ "slot": number, "role": string, "description": string, "specs": string }] }',
    ),
  ].join("\n");

  const user = [
    `Required roles in order: ${roles.join(", ")}`,
    `Current listing snapshot:\n${formatSnapshot(snapshot)}`,
    "Plan ~7 image slots with descriptions and spec notes.",
  ].join("\n\n");

  return { system, user: `${user}\n\n[IMAGES_GROUP]` };
}
