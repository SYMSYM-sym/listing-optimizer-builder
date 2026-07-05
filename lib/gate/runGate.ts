import { aplusChecks } from "@/lib/gate/checks/aplus-checks";
import { listingChecks } from "@/lib/gate/checks/listing-checks";
import { buildGateContext } from "@/lib/gate/context";
import type { GateResult, KnowledgePack, OptimizedListing } from "@/lib/types";

export type RunGateOptions = {
  subcategory?: string;
  productName?: string;
};

/** Run all C1–C12 + C15 + A1–A8 checks; never mutates content. */
export function runGate(
  listing: OptimizedListing,
  pack: KnowledgePack,
  options: RunGateOptions = {},
): GateResult {
  const ctx = buildGateContext(
    pack,
    listing,
    options.subcategory ?? "general",
  );
  if (options.productName) {
    ctx.productName = options.productName;
  }

  const failures = [
    ...listingChecks.flatMap((check) => check(listing, ctx)),
    ...aplusChecks.flatMap((check) => check(listing, ctx)),
  ];

  return {
    pass: failures.length === 0,
    failures,
  };
}
