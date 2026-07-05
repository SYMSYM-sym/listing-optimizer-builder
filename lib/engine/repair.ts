import {
  failuresToGroups,
  hasNonRepairableFailure,
} from "@/lib/engine/fieldToGroup";
import {
  optimize,
  regenerateOptimizeGroups,
  runOptimizePipeline,
  type OptimizeOptions,
  type PromptGroup,
} from "@/lib/engine/optimize";
import { runGate } from "@/lib/gate/runGate";
import type { GateResult, OptimizedListing } from "@/lib/types";

export type RepairResult = {
  listing: OptimizedListing;
  gateResult: GateResult;
  verified: boolean;
  repairIterations: number;
  regeneratedGroups: PromptGroup[][];
};

function getMaxRepairIterations(): number {
  const raw = process.env.MAX_REPAIR_ITERATIONS?.trim() || "3";
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 3;
}

export type RepairOptions = OptimizeOptions & {
  maxIterations?: number;
};

/**
 * Optimize → gate → bounded repair loop.
 * Never mutates content to force a pass; PACK failures are not repairable.
 */
export async function optimizeWithRepair(
  options: RepairOptions,
): Promise<RepairResult> {
  const maxIterations = options.maxIterations ?? getMaxRepairIterations();
  const { listing: initialListing, state } = await runOptimizePipeline(options);
  let listing = initialListing;
  let gateResult = runGate(listing, state.pack, {
    subcategory: state.subcategory,
    productName: state.productName,
  });
  const regeneratedGroups: PromptGroup[][] = [];

  if (gateResult.pass || hasNonRepairableFailure(gateResult.failures)) {
    return {
      listing,
      gateResult,
      verified: gateResult.pass,
      repairIterations: 0,
      regeneratedGroups,
    };
  }

  let currentState = state;
  let iterations = 0;

  while (iterations < maxIterations && !gateResult.pass) {
    if (hasNonRepairableFailure(gateResult.failures)) break;

    const groups = failuresToGroups(gateResult.failures);
    if (groups.length === 0) break;

    regeneratedGroups.push(groups);
    const regen = await regenerateOptimizeGroups(options, currentState, groups);
    listing = regen.listing;
    currentState = regen.state;
    gateResult = runGate(listing, currentState.pack, {
      subcategory: currentState.subcategory,
      productName: currentState.productName,
    });
    iterations += 1;

    if (hasNonRepairableFailure(gateResult.failures)) break;
  }

  return {
    listing,
    gateResult,
    verified: gateResult.pass,
    repairIterations: iterations,
    regeneratedGroups,
  };
}

export { optimize };
