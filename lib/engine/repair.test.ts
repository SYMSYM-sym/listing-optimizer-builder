import { describe, expect, it } from "vitest";
import { optimizeWithRepair } from "@/lib/engine/repair";
import { hasNonRepairableFailure } from "@/lib/engine/fieldToGroup";
import { runOptimizePipeline } from "@/lib/engine/optimize";
import { createMockLlmClient } from "@/lib/engine/llm";
import { runGate } from "@/lib/gate/runGate";
import { loadPack } from "@/lib/knowledge/loadPack";
import type { ListingSnapshot } from "@/lib/types";

const snapshot: ListingSnapshot = {
  asin: "B0TEST1234",
  url: "https://www.amazon.com/dp/B0TEST1234",
  title: "Daily Probiotic - Gut Health Supplement",
  bullets: ["Supports digestion"],
  description: "A probiotic supplement.",
  images: [],
  attributes: {
    brand_name: "Acme Labs",
    unit_count: "60",
    servings_per_container: "30",
    primary_supplement_type: "Probiotic",
    allergen_information: "Contains: Tree Nuts (almond)",
  },
  category: "Health & Household",
  subcategory: "probiotic",
  raw: {},
};

const goodTitle = {
  productName: "Daily Probiotic",
  title: "Daily Probiotic Gut Health Capsules",
  title75: "Daily Probiotic Gut Health Capsules",
  itemHighlights: "Probiotic supplement adults gut",
};

const goodBullets = {
  bullets: [
    "Contains: Tree Nuts (almond)",
    "Supports healthy digestion as part of a balanced diet *",
    "B3",
    "60 capsules per bottle",
    "B5",
  ],
};

const goodDescription = {
  description:
    "Daily Probiotic Gut Health Capsules supports normal digestive function. Contains: Tree Nuts (almond).",
};

const goodBackend = { backendSearchTerms: "probiotics gut flora microflora digestive" };

const goodAttributes = {
  attributes: {
    brand_name: "Acme Labs",
    manufacturer: "Acme Labs Inc",
    unit_count: "60",
    allergen_information: "Contains: Tree Nuts (almond)",
  },
};

const goodAplus = {
  modules: [
    {
      id: "brand-story",
      headline: "Daily Probiotic brand story",
      body: "Daily Probiotic supports digestive balance.",
      claimBearing: true,
    },
    {
      id: "hero",
      headline: "Daily Probiotic hero",
      body: "Daily Probiotic delivers a 50 billion CFU blend for digestive support.",
      claimBearing: true,
    },
    {
      id: "ingredients",
      headline: "Ingredients",
      body: "Contains Tree Nuts (almond).",
      claimBearing: false,
    },
  ],
  comparison: { rows: [{ label: "Potency", ours: "High", typical: "Low" }] },
  faq: [{ q: "Daily use?", a: "Take daily for digestive support.", claimBearing: true }],
};

const goodImages = {
  imagePlan: [{ slot: 1, role: "main", description: "White background product", specs: "1000px min" }],
};

const goodQa = {
  qa: [{ question: "What is it?", answer: "A probiotic for digestive support.", claimBearing: true }],
};

const badBackend = { backendSearchTerms: "x".repeat(260) };

describe("optimizeWithRepair", () => {
  it("mock pipeline output passes gate before repair", async () => {
    const llm = createMockLlmClient([
      goodTitle,
      goodBullets,
      goodDescription,
      goodBackend,
      goodAttributes,
      goodAplus,
      goodImages,
      goodQa,
    ]);
    const { listing, state } = await runOptimizePipeline({
      snapshot,
      packId: "supplements",
      llm,
    });
    const gate = runGate(listing, state.pack, {
      subcategory: state.subcategory,
      productName: state.productName,
    });
    expect(gate.failures).toEqual([]);
  });

  it("passes without repair when listing is clean", async () => {
    const llm = createMockLlmClient([
      goodTitle,
      goodBullets,
      goodDescription,
      goodBackend,
      goodAttributes,
      goodAplus,
      goodImages,
      goodQa,
    ]);

    const result = await optimizeWithRepair({
      snapshot,
      packId: "supplements",
      llm,
      maxIterations: 2,
    });

    expect(result.repairIterations).toBe(0);
    expect(result.verified).toBe(true);
    expect(result.gateResult.pass).toBe(true);
  });

  it("regenerates only failing groups and stops at cap", async () => {
    const llm = createMockLlmClient([
      goodTitle,
      goodBullets,
      goodDescription,
      badBackend,
      goodAttributes,
      goodAplus,
      goodImages,
      goodQa,
      badBackend,
      badBackend,
    ]);

    const result = await optimizeWithRepair({
      snapshot,
      packId: "supplements",
      llm,
      maxIterations: 2,
    });

    expect(result.regeneratedGroups.length).toBeGreaterThan(0);
    expect(result.regeneratedGroups.every((groups) => groups.includes("backend"))).toBe(true);
    expect(result.regeneratedGroups.every((groups) => !groups.includes("title"))).toBe(true);
    expect(result.repairIterations).toBe(2);
    expect(result.verified).toBe(false);
    expect(result.gateResult.failures.some((f) => f.checkId === "C3")).toBe(true);
  });

  it("does not repair PACK failures", async () => {
    const emptyPack = {
      ...loadPack("supplements"),
      compliancePack: {
        ...loadPack("supplements").compliancePack,
        diseaseNounsBySubcategory: { probiotic: [], general: [] },
      },
    };
    const llm = createMockLlmClient([
      goodTitle,
      goodBullets,
      goodDescription,
      goodBackend,
      goodAttributes,
      goodAplus,
      goodImages,
      goodQa,
    ]);

    const { listing, state } = await runOptimizePipeline({
      snapshot,
      packId: "supplements",
      llm,
    });
    const gate = runGate(listing, emptyPack, {
      subcategory: "probiotic",
      productName: state.productName,
    });
    expect(gate.failures.some((f) => f.checkId === "PACK")).toBe(true);
    expect(hasNonRepairableFailure(gate.failures)).toBe(true);
  });
});
