import { describe, expect, it } from "vitest";
import { buildAudit } from "@/lib/audit/buildAudit";
import { buildDiffGaps } from "@/lib/audit/diff";
import { scoreAgainstPrinciples } from "@/lib/audit/scoreAgainstPrinciples";
import { buildCleanListing } from "@/lib/gate/fixtures";
import { loadPack } from "@/lib/knowledge/loadPack";
import type { ListingSnapshot } from "@/lib/types";

const weakSnapshot: ListingSnapshot = {
  asin: "B0WEAK1234",
  url: "https://www.amazon.com/dp/B0WEAK1234",
  title: "Probiotic Supplement Capsules for Digestive Health Support Daily Use Probiotic Supplement",
  bullets: ["Supports digestion", "60 count"],
  description: "A probiotic supplement.",
  images: [],
  attributes: {
    brand_name: "Acme Labs",
    primary_supplement_type: "Probiotic",
  },
  category: "Health & Household",
  subcategory: "probiotic",
  raw: {},
};

describe("scoreAgainstPrinciples", () => {
  it("returns a weighted scorecard for the current snapshot", () => {
    const pack = loadPack("supplements");
    const scorecard = scoreAgainstPrinciples(weakSnapshot, pack);

    expect(scorecard.maxTotal).toBe(100);
    expect(scorecard.total).toBeGreaterThan(0);
    expect(scorecard.total).toBeLessThanOrEqual(100);
    expect(scorecard.criteria).toHaveLength(pack.principles.length);
    expect(scorecard.criteria.every((criterion) => criterion.notes?.length)).toBe(true);
  });
});

describe("buildDiffGaps", () => {
  it("returns concrete current-vs-proposed gaps with severities", () => {
    const pack = loadPack("supplements");
    const proposed = buildCleanListing(pack);
    const gaps = buildDiffGaps(weakSnapshot, proposed, pack, "probiotic");

    expect(gaps.length).toBeGreaterThanOrEqual(3);
    expect(gaps.every((gap) => gap.current !== gap.proposed)).toBe(true);
    expect(gaps.every((gap) => ["P0", "P1", "P2"].includes(gap.severity))).toBe(true);
    expect(gaps.some((gap) => gap.field === "title")).toBe(true);
    expect(gaps.some((gap) => gap.field.startsWith("attributes."))).toBe(true);
  });

  it("marks bullet-count violations on the current listing as P0", () => {
    const pack = loadPack("supplements");
    const proposed = buildCleanListing(pack);
    const gaps = buildDiffGaps(weakSnapshot, proposed, pack, "probiotic");
    expect(gaps.filter((gap) => gap.field.startsWith("bullet")).some((gap) => gap.severity === "P0")).toBe(
      true,
    );
  });

  it("marks compliance issues in the current listing as P0", () => {
    const pack = loadPack("supplements");
    const proposed = buildCleanListing(pack);
    const snapshot: ListingSnapshot = {
      ...weakSnapshot,
      description: "Treats diabetes quickly.",
    };
    const gaps = buildDiffGaps(snapshot, proposed, pack, "probiotic");
    const descriptionGap = gaps.find((gap) => gap.field === "description");
    expect(descriptionGap?.severity).toBe("P0");
  });
});

describe("buildAudit", () => {
  it("sets verified equal to gateResult.pass", () => {
    const pack = loadPack("supplements");
    const proposed = buildCleanListing(pack);
    const passingAudit = buildAudit({
      current: weakSnapshot,
      proposed,
      pack,
      subcategory: "probiotic",
    });
    expect(passingAudit.verified).toBe(passingAudit.gateResult.pass);
    expect(passingAudit.gateResult.pass).toBe(true);

    const failing = { ...proposed, fdaDisclaimer: "wrong" };
    const failingAudit = buildAudit({
      current: weakSnapshot,
      proposed: failing,
      pack,
      subcategory: "probiotic",
    });
    expect(failingAudit.verified).toBe(false);
    expect(failingAudit.gateResult.pass).toBe(false);
  });

  it("includes scorecard, gaps, and gate result together", () => {
    const pack = loadPack("supplements");
    const proposed = buildCleanListing(pack);
    const audit = buildAudit({
      current: weakSnapshot,
      proposed,
      pack,
      subcategory: "probiotic",
    });

    expect(audit.scorecard.criteria.length).toBeGreaterThan(0);
    expect(audit.gaps.length).toBeGreaterThanOrEqual(3);
    expect(typeof audit.gateResult.pass).toBe("boolean");
  });
});
