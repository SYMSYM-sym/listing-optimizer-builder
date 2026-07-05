import { describe, expect, it } from "vitest";
import { failuresToGroups, hasNonRepairableFailure } from "@/lib/engine/fieldToGroup";
import type { Failure } from "@/lib/types";

describe("fieldToGroup", () => {
  it("maps bullet fields to bullets group", () => {
    const failures: Failure[] = [{ checkId: "C2", field: "bullet2", context: "", fix: "" }];
    expect(failuresToGroups(failures)).toEqual(["bullets"]);
  });

  it("maps title fields to title group", () => {
    const failures: Failure[] = [{ checkId: "C15", field: "title75", context: "", fix: "" }];
    expect(failuresToGroups(failures)).toEqual(["title"]);
  });

  it("skips PACK failures for regeneration", () => {
    const failures: Failure[] = [{ checkId: "PACK", field: "compliance", context: "", fix: "" }];
    expect(failuresToGroups(failures)).toEqual([]);
    expect(hasNonRepairableFailure(failures)).toBe(true);
  });

  it("maps A-series failures to aplus group", () => {
    const failures: Failure[] = [{ checkId: "A8", field: "aplus.modules.hero.headline", context: "", fix: "" }];
    expect(failuresToGroups(failures)).toContain("aplus");
  });
});
