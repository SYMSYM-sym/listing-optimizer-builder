import { describe, expect, it } from "vitest";
import { buildMarkdownExport } from "@/lib/export/markdown";
import { buildCleanListing } from "@/lib/gate/fixtures";
import { loadPack } from "@/lib/knowledge/loadPack";
import { buildAudit } from "@/lib/audit/buildAudit";

describe("buildMarkdownExport", () => {
  it("includes listing fields and audit sections", () => {
    const pack = loadPack("supplements");
    const optimized = buildCleanListing(pack);
    const audit = buildAudit({
      current: {
        asin: "B0TEST",
        url: "",
        title: "Old title",
        bullets: ["a"],
        description: "old",
        images: [],
        attributes: {},
        category: "",
        subcategory: "probiotic",
        raw: {},
      },
      proposed: optimized,
      pack,
      subcategory: "probiotic",
    });

    const markdown = buildMarkdownExport(optimized, audit);
    expect(markdown).toContain("# Optimized Listing Export");
    expect(markdown).toContain("## Title");
    expect(markdown).toContain("## Audit Scorecard");
    expect(markdown).toContain("## Gaps");
  });
});
