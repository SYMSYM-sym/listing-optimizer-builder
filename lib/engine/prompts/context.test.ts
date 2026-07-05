import { describe, expect, it } from "vitest";
import { buildTitlePrompt } from "@/lib/engine/prompts/title";
import { loadPack } from "@/lib/knowledge/loadPack";
import type { ListingSnapshot } from "@/lib/types";

describe("prompt templates", () => {
  it("injects limits from knowledge pack not hard-coded category strings", () => {
    const pack = loadPack("supplements");
    const snapshot: ListingSnapshot = {
      asin: "B0TEST1234",
      url: "https://www.amazon.com/dp/B0TEST1234",
      title: "Test Product",
      bullets: [],
      description: "",
      images: [],
      attributes: {},
      category: "Health",
      subcategory: "probiotic",
      raw: {},
    };

    const { system, user } = buildTitlePrompt(snapshot, pack, "probiotic");

    expect(system).toContain("title75Max=75");
    expect(system).toContain("backendMaxBytes=249");
    expect(system).toContain(pack.compliancePack.canonicalDisclaimer);
    expect(system).not.toContain("hard-coded");
    expect(user).toContain("[TITLE_GROUP]");
  });
});
