import rulesJson from "@/knowledge/rules.json";

type RuleEntry = { value: number; timeSensitive?: boolean };

function ruleValue(key: string, fallback: number): number {
  const entry = (rulesJson as unknown as Record<string, RuleEntry>)[key];
  return typeof entry?.value === "number" ? entry.value : fallback;
}

/** Shared limits — same keys/values the gate reads from knowledge/rules.json. */
export const FIELD_LIMITS = {
  title: ruleValue("titleMaxLegacy", 200),
  title75: ruleValue("title75Max", 75),
  itemHighlights: ruleValue("itemHighlightsMax", 125),
  bulletMax: ruleValue("bulletMax", 255),
  bulletCount: ruleValue("bulletCount", 5),
  description: ruleValue("descriptionMax", 2000),
  backendMaxBytes: ruleValue("backendMaxBytes", 249),
} as const;

export type FieldLimitKey = keyof typeof FIELD_LIMITS;
