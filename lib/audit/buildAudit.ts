import { buildDiffGaps } from "@/lib/audit/diff";
import { scoreAgainstPrinciples } from "@/lib/audit/scoreAgainstPrinciples";
import { runGate } from "@/lib/gate/runGate";
import type { Audit, GateResult, KnowledgePack, ListingSnapshot, OptimizedListing } from "@/lib/types";

export type BuildAuditInput = {
  current: ListingSnapshot;
  proposed: OptimizedListing;
  pack: KnowledgePack;
  subcategory: string;
  productName?: string;
  gateResult?: GateResult;
};

/**
 * Assemble the audit bundle. `verified` is set here (not by the generator)
 * as exactly gateResult.pass — worker ≠ checker.
 */
export function buildAudit(input: BuildAuditInput): Audit {
  const gateResult =
    input.gateResult ??
    runGate(input.proposed, input.pack, {
      subcategory: input.subcategory,
      productName: input.productName,
    });

  return {
    scorecard: scoreAgainstPrinciples(input.current, input.pack),
    gaps: buildDiffGaps(input.current, input.proposed, input.pack, input.subcategory),
    gateResult,
    verified: gateResult.pass,
  };
}
