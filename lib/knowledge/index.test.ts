import { describe, expect, it } from "vitest";
import { detectCategory, loadPack } from "@/lib/knowledge";
import type { ListingSnapshot } from "@/lib/types";

describe("knowledge stubs", () => {
  it("loadPack('supplements') returns a typed supplements pack", () => {
    const pack = loadPack("supplements");
    expect(pack.id).toBe("supplements");
    expect(pack.compliancePack.canonicalDisclaimer).toContain(
      "Food and Drug Administration",
    );
  });

  it("detectCategory returns supplements", () => {
    const snapshot = { subcategory: "probiotic" } as ListingSnapshot;
    expect(detectCategory(snapshot)).toBe("supplements");
  });
});
