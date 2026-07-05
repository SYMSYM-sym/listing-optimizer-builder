import { describe, expect, it } from "vitest";
import {
  buildCleanListing,
  buildEmptyDiseaseNounPack,
  DISCLAIMER,
  PRODUCT_NAME,
} from "@/lib/gate/fixtures";
import { buildGateContext } from "@/lib/gate/context";
import {
  checkC1,
  checkC2,
  checkC3,
  checkC4,
  checkC5,
  checkC6,
  checkC7,
  checkC8,
  checkC9,
  checkC10,
  checkC11,
  checkC12,
  checkC15,
  checkPackFailClosed,
} from "@/lib/gate/checks/listing-checks";
import { loadPack } from "@/lib/knowledge/loadPack";

function ctx(subcategory = "probiotic") {
  const pack = loadPack("supplements");
  const listing = buildCleanListing(pack);
  return {
    listing,
    ctx: buildGateContext(pack, listing, subcategory, PRODUCT_NAME),
    pack,
  };
}

describe("listing gate checks", () => {
  it("C1 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkC1(listing, gateCtx)).toEqual([]);
    listing.title = "x".repeat(201);
    expect(checkC1(listing, gateCtx)[0]).toMatchObject({ checkId: "C1", field: "title" });
  });

  it("C2 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkC2(listing, gateCtx)).toEqual([]);
    listing.bullets = ["a", "b", "c", "d"] as typeof listing.bullets;
    expect(checkC2(listing, gateCtx)[0]).toMatchObject({ checkId: "C2", field: "bullets" });
  });

  it("C3 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkC3(listing, gateCtx)).toEqual([]);
    listing.backendSearchTerms = "x".repeat(260);
    expect(checkC3(listing, gateCtx)[0]).toMatchObject({
      checkId: "C3",
      field: "backendSearchTerms",
    });
  });

  it("C4 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkC4(listing, gateCtx)).toEqual([]);
    listing.description = "x".repeat(2001);
    expect(checkC4(listing, gateCtx)[0]).toMatchObject({ checkId: "C4", field: "description" });
  });

  it("C5 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkC5(listing, gateCtx)).toEqual([]);
    listing.fdaDisclaimer = "wrong";
    expect(checkC5(listing, gateCtx)[0]).toMatchObject({ checkId: "C5", field: "fdaDisclaimer" });
  });

  it("C6 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkC6(listing, gateCtx)).toEqual([]);
    listing.title = `${listing.title} ibs relief`;
    expect(checkC6(listing, gateCtx).some((f) => f.checkId === "C6" && f.field === "title")).toBe(
      true,
    );
  });

  it("PACK fail-closed when disease nouns empty", () => {
    const pack = buildEmptyDiseaseNounPack();
    const listing = buildCleanListing(pack);
    const gateCtx = buildGateContext(pack, listing, "probiotic");
    expect(checkPackFailClosed(gateCtx)[0]).toMatchObject({ checkId: "PACK", field: "compliance" });
    expect(checkC6(listing, gateCtx)[0]).toMatchObject({ checkId: "PACK", field: "compliance" });
  });

  it("C7 pass/fail on attributes", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkC7(listing, gateCtx)).toEqual([]);
    listing.attributes.active_ingredients = "Acme Labs proprietary blend";
    expect(checkC7(listing, gateCtx)[0]).toMatchObject({
      checkId: "C7",
      field: "attributes.active_ingredients",
    });
  });

  it("C8 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkC8(listing, gateCtx)).toEqual([]);
    listing.title = "Wrong lead title";
    expect(checkC8(listing, gateCtx)[0]).toMatchObject({ checkId: "C8", field: "title" });
  });

  it("C9 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkC9(listing, gateCtx)).toEqual([]);
    listing.bullets = [
      "No allergen mention",
      "b",
      "c",
      "d",
      "e",
    ] as typeof listing.bullets;
    expect(checkC9(listing, gateCtx).some((f) => f.checkId === "C9")).toBe(true);
  });

  it("C10 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkC10(listing, gateCtx)).toEqual([]);
    listing.bullets[0] = "Delivers 50 billion CFU per serving";
    expect(checkC10(listing, gateCtx)[0]).toMatchObject({ checkId: "C10", field: "bullet0" });
  });

  it("C11 no-op when fictionPhrases empty", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkC11(listing, gateCtx)).toEqual([]);
  });

  it("C11 fail when fiction phrase present", () => {
    const { listing, ctx: gateCtx, pack } = ctx();
    pack.compliancePack.fictionPhrases = ["clinically proven miracle"];
    listing.title = `${listing.title} clinically proven miracle`;
    expect(checkC11(listing, gateCtx)[0]).toMatchObject({ checkId: "C11", field: "title" });
  });

  it("C12 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkC12(listing, gateCtx)).toEqual([]);
    listing.description = `${listing.description} Also contains 100 mg and 200 mg potency.`;
    expect(checkC12(listing, gateCtx).some((f) => f.checkId === "C12")).toBe(true);
  });

  it("C15 pass/fail", () => {
    const { listing, ctx: gateCtx } = ctx();
    expect(checkC15(listing, gateCtx)).toEqual([]);
    listing.title75 = "x".repeat(80);
    expect(checkC15(listing, gateCtx)[0]).toMatchObject({ checkId: "C15", field: "title75" });
  });
});
