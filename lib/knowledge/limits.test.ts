import { describe, expect, it } from "vitest";
import { getRules } from "@/lib/knowledge/loadPack";

type RuleValue = { value: number; timeSensitive: boolean };

function ruleNumber(rules: Record<string, unknown>, key: string): RuleValue {
  return rules[key] as RuleValue;
}

describe("knowledge rules limits", () => {
  const rules = getRules();

  it("matches brain/01 backend byte cap", () => {
    expect(ruleNumber(rules, "backendMaxBytes").value).toBe(249);
  });

  it("matches brain/01 title75 max", () => {
    expect(ruleNumber(rules, "title75Max").value).toBe(75);
    expect(ruleNumber(rules, "title75Max").timeSensitive).toBe(true);
  });

  it("matches brain/01 item highlights max", () => {
    expect(ruleNumber(rules, "itemHighlightsMax").value).toBe(125);
    expect(ruleNumber(rules, "itemHighlightsMax").timeSensitive).toBe(true);
  });

  it("matches brain/01 legacy title max", () => {
    expect(ruleNumber(rules, "titleMaxLegacy").value).toBe(200);
  });

  it("matches brain/01 bullet limits", () => {
    expect(ruleNumber(rules, "bulletCount3P").value).toBe(5);
    expect(ruleNumber(rules, "bulletCount").value).toBe(5);
    expect(ruleNumber(rules, "bulletMax").value).toBe(255);
  });

  it("matches brain/01 description max", () => {
    expect(ruleNumber(rules, "descriptionMax").value).toBe(2000);
  });
});
