import { describe, expect, it } from "vitest";
import { FIELD_LIMITS } from "@/lib/knowledge/fieldLimits";
import { getRules } from "@/lib/knowledge/loadPack";

describe("FIELD_LIMITS", () => {
  const rules = getRules();

  it("matches knowledge/rules.json values used by the gate", () => {
    expect(FIELD_LIMITS.title).toBe((rules.titleMaxLegacy as { value: number }).value);
    expect(FIELD_LIMITS.title75).toBe((rules.title75Max as { value: number }).value);
    expect(FIELD_LIMITS.itemHighlights).toBe((rules.itemHighlightsMax as { value: number }).value);
    expect(FIELD_LIMITS.bulletMax).toBe((rules.bulletMax as { value: number }).value);
    expect(FIELD_LIMITS.bulletCount).toBe((rules.bulletCount as { value: number }).value);
    expect(FIELD_LIMITS.description).toBe((rules.descriptionMax as { value: number }).value);
    expect(FIELD_LIMITS.backendMaxBytes).toBe((rules.backendMaxBytes as { value: number }).value);
  });
});
