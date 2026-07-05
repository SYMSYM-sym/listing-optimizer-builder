import { describe, expect, it } from "vitest";
import { buildCleanListing, PRODUCT_NAME } from "@/lib/gate/fixtures";
import { buildGateContext } from "@/lib/gate/context";
import {
  checkA1,
  checkA2,
  checkA3,
  checkA4,
  checkA5,
  checkA6,
  checkA7,
  checkA8,
} from "@/lib/gate/checks/aplus-checks";
import { loadPack } from "@/lib/knowledge/loadPack";

function ctx() {
  const pack = loadPack("supplements");
  const listing = buildCleanListing(pack);
  return { listing, ctx: buildGateContext(pack, listing, "probiotic", PRODUCT_NAME), pack };
}

describe("aplus gate checks", () => {
  it("A1 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkA1(listing, gateCtx)).toEqual([]);
    listing.aplusContent.fdaDisclaimer = "wrong";
    expect(checkA1(listing, gateCtx)[0]).toMatchObject({ checkId: "A1", field: "aplus.fdaDisclaimer" });
  });

  it("A2 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkA2(listing, gateCtx)).toEqual([]);
    listing.aplusContent.modules[0].body = "Treats ibs";
    expect(checkA2(listing, gateCtx).some((f) => f.checkId === "A2")).toBe(true);
  });

  it("A3 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkA3(listing, gateCtx)).toEqual([]);
    listing.aplusContent.modules[0].headline = "Acme Labs story";
    expect(checkA3(listing, gateCtx)[0]).toMatchObject({ checkId: "A3" });
  });

  it("A4 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkA4(listing, gateCtx)).toEqual([]);
    listing.aplusContent.modules[0].headline = "Generic story";
    listing.aplusContent.modules[0].body = "Generic story without name";
    expect(checkA4(listing, gateCtx)[0]).toMatchObject({ checkId: "A4" });
  });

  it("A5 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkA5(listing, gateCtx)).toEqual([]);
    listing.aplusContent.modules[1].body = "Provides 50 billion CFU per serving";
    expect(checkA5(listing, gateCtx)[0]).toMatchObject({ checkId: "A5" });
  });

  it("A6 no-op when fictionPhrases empty", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkA6(listing, gateCtx)).toEqual([]);
  });

  it("A6 fail when fiction phrase present in A+", () => {
    const { listing, ctx: gateCtx, pack } = ctx();
    pack.compliancePack.fictionPhrases = ["clinically proven miracle"];
    listing.aplusContent.modules[0].body = "clinically proven miracle results";
    expect(checkA6(listing, gateCtx)[0]).toMatchObject({
      checkId: "A6",
      field: "aplus.modules.brand-story.body",
    });
  });

  it("A7 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkA7(listing, gateCtx)).toEqual([]);
    listing.aplusContent.modules[2].body = "No allergen listed here";
    expect(checkA7(listing, gateCtx)[0]).toMatchObject({ checkId: "A7" });
  });

  it("A8 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkA8(listing, gateCtx)).toEqual([]);
    listing.aplusContent.modules[0].headline = "Buy now for $9.99";
    expect(checkA8(listing, gateCtx)[0]).toMatchObject({ checkId: "A8" });
  });
});
