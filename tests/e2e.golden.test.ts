import { describe, expect, it } from "vitest";
import { buildAudit } from "@/lib/audit/buildAudit";
import { runOptimizePipeline } from "@/lib/engine/optimize";
import { optimizeWithRepair } from "@/lib/engine/repair";
import { createMockLlmClient } from "@/lib/engine/llm";
import { buildMarkdownExport } from "@/lib/export/markdown";
import {
  buildEmptyDiseaseNounPack,
  buildNegativeListing,
  PRODUCT_NAME,
} from "@/lib/gate/fixtures";
import { runGate } from "@/lib/gate/runGate";
import { utf8Bytes } from "@/lib/gate/util";
import { detectCategory } from "@/lib/knowledge/detectCategory";
import { FIELD_LIMITS } from "@/lib/knowledge/fieldLimits";
import { loadPack } from "@/lib/knowledge/loadPack";
import type { OptimizedListing } from "@/lib/types";
import {
  GOLDEN_LLM_RESPONSES,
  GOLDEN_SNAPSHOT,
  NEGATIVE_GATE_FAILURE_IDS,
} from "@/tests/fixtures/golden/recorded";

function assertListingLimits(listing: OptimizedListing) {
  expect(listing.title.length).toBeLessThanOrEqual(FIELD_LIMITS.title);
  expect(listing.title75.length).toBeLessThanOrEqual(FIELD_LIMITS.title75);
  expect(listing.itemHighlights.length).toBeLessThanOrEqual(FIELD_LIMITS.itemHighlights);
  expect(listing.description.length).toBeLessThanOrEqual(FIELD_LIMITS.description);
  expect(utf8Bytes(listing.backendSearchTerms)).toBeLessThanOrEqual(FIELD_LIMITS.backendMaxBytes);
  expect(listing.bullets).toHaveLength(FIELD_LIMITS.bulletCount);
  listing.bullets.forEach((bullet) => {
    expect(bullet.length).toBeLessThanOrEqual(FIELD_LIMITS.bulletMax);
  });
}

function assertFullOutputContract(listing: OptimizedListing) {
  expect(listing.title).toBeTruthy();
  expect(listing.title75).toBeTruthy();
  expect(listing.itemHighlights).toBeTruthy();
  expect(listing.description).toContain("Food and Drug Administration");
  expect(listing.fdaDisclaimer).toContain("Food and Drug Administration");
  expect(listing.facts).toBeDefined();
  expect(listing.aplusContent.modules.length).toBeGreaterThan(0);
  expect(listing.aplusContent.comparison.rows.length).toBeGreaterThan(0);
  expect(listing.aplusContent.faq.length).toBeGreaterThan(0);
  expect(listing.imagePlan.length).toBeGreaterThan(0);
  expect(listing.qa.length).toBeGreaterThan(0);
  expect(Object.keys(listing.attributes).length).toBeGreaterThan(0);
}

describe("Golden ASIN E2E (recorded fixtures)", () => {
  it("ingest fixture yields a populated snapshot", () => {
    expect(GOLDEN_SNAPSHOT.asin).toBeTruthy();
    expect(GOLDEN_SNAPSHOT.title.length).toBeGreaterThan(10);
    expect(GOLDEN_SNAPSHOT.bullets.length).toBeGreaterThanOrEqual(3);
    expect(GOLDEN_SNAPSHOT.description.length).toBeGreaterThan(20);
    expect(GOLDEN_SNAPSHOT.attributes.primary_supplement_type).toBeTruthy();
    expect(detectCategory(GOLDEN_SNAPSHOT).packId).toBe("supplements");
  });

  it("compliant pipeline: optimize → gate pass → audit → export", async () => {
    const pack = loadPack("supplements");
    const detection = detectCategory(GOLDEN_SNAPSHOT);
    const llm = createMockLlmClient(GOLDEN_LLM_RESPONSES);
    const pipeline = await runOptimizePipeline({
      snapshot: GOLDEN_SNAPSHOT,
      packId: "supplements",
      llm,
    });

    const gate = runGate(pipeline.listing, pack, {
      subcategory: detection.subcategory,
      productName: pipeline.state.productName,
    });
    expect(gate.pass).toBe(true);

    const result = await optimizeWithRepair({
      snapshot: GOLDEN_SNAPSHOT,
      packId: "supplements",
      llm: createMockLlmClient(GOLDEN_LLM_RESPONSES),
    });

    assertFullOutputContract(result.listing);
    assertListingLimits(result.listing);
    expect(result.gateResult.pass).toBe(true);
    expect(result.verified).toBe(true);

    const audit = buildAudit({
      current: GOLDEN_SNAPSHOT,
      proposed: result.listing,
      pack,
      subcategory: detection.subcategory,
      productName: PRODUCT_NAME,
      gateResult: result.gateResult,
    });

    expect(audit.verified).toBe(true);
    expect(audit.gateResult.pass).toBe(true);
    expect(audit.gaps.length).toBeGreaterThanOrEqual(3);
    expect(audit.gaps.every((gap) => ["P0", "P1", "P2"].includes(gap.severity))).toBe(true);

    const exportPayload = { optimized: result.listing, audit };
    const parsed = JSON.parse(JSON.stringify(exportPayload)) as typeof exportPayload;
    expect(parsed.optimized.title).toBeTruthy();
    expect(parsed.audit.scorecard.total).toBeGreaterThan(0);

    const markdown = buildMarkdownExport(result.listing, audit);
    expect(markdown).toContain("# Optimized Listing Export");
    expect(markdown).toContain("## Audit Scorecard");
    expect(markdown).toContain("## Gaps");
  });

  it("negative fixture returns expected gate failures and blocks export-final", () => {
    const pack = buildEmptyDiseaseNounPack();
    const listing = buildNegativeListing(pack);
    const gate = runGate(listing, pack, { subcategory: "probiotic" });

    expect(gate.pass).toBe(false);
    const ids = gate.failures.map((failure) => `${failure.checkId}:${failure.field}`);
    for (const expected of NEGATIVE_GATE_FAILURE_IDS) {
      expect(ids).toContain(expected);
    }

    const audit = buildAudit({
      current: GOLDEN_SNAPSHOT,
      proposed: listing,
      pack,
      subcategory: "probiotic",
      gateResult: gate,
    });

    expect(audit.verified).toBe(false);
    expect(audit.gateResult.pass).toBe(false);
    // Export-final is gated on audit.verified in the dashboard ExportBar.
    expect(audit.verified).toBe(audit.gateResult.pass);
  });

  it("category seam: generic pack requires no engine/gate code changes", () => {
    const pack = loadPack("generic");
    const listing = buildNegativeListing(pack);
    const gate = runGate(listing, pack, { subcategory: "general" });
    expect(gate.pass).toBe(false);
    expect(Array.isArray(gate.failures)).toBe(true);
  });
});
