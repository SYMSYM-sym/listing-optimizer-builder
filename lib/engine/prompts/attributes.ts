import type { Facts, KnowledgePack, ListingSnapshot } from "@/lib/types";
import {
  formatCompliance,
  formatSnapshot,
  jsonOutputInstruction,
} from "@/lib/engine/prompts/context";

export type AttributesGroupResult = {
  attributes: Record<string, string>;
};

export function buildAttributesPrompt(
  snapshot: ListingSnapshot,
  pack: KnowledgePack,
  subcategory: string,
  facts: Facts,
): { system: string; user: string } {
  const schemaLines =
    pack.attributeSchema.length > 0
      ? pack.attributeSchema
          .map(
            (field) =>
              `- ${field.field} (${field.label})${field.filterFacet ? " [filter]" : ""}${field.required ? " [required]" : ""}`,
          )
          .join("\n")
      : "No attribute schema for this pack — return an empty object.";

  const system = [
    "You fill Amazon structured attribute fields from the listing snapshot.",
    "active_ingredients must be a subset of ingredients.",
    "Use canonical facts for numeric values — do not invent counts.",
    formatCompliance(pack, subcategory),
    jsonOutputInstruction('{ "attributes": Record<string, string> }'),
  ].join("\n");

  const user = [
    `Canonical facts (use exactly): ${JSON.stringify(facts)}`,
    `Attribute schema:\n${schemaLines}`,
    `Current listing snapshot:\n${formatSnapshot(snapshot)}`,
    "Fill every applicable attribute field.",
  ].join("\n\n");

  return { system, user: `${user}\n\n[ATTRIBUTES_GROUP]` };
}
