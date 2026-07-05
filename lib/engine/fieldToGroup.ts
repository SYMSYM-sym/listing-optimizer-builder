import type { Failure } from "@/lib/types";
import type { PromptGroup } from "@/lib/engine/optimize";

/** Maps gate failure fields to the prompt group that owns regeneration. */
export const FIELD_TO_GROUP: Record<string, PromptGroup> = {
  title: "title",
  title75: "title",
  itemHighlights: "title",
  description: "description",
  fdaDisclaimer: "description",
  backendSearchTerms: "backend",
};

const CHECK_TO_GROUP: Record<string, PromptGroup> = {
  C1: "title",
  C8: "title",
  C15: "title",
  C2: "bullets",
  C4: "description",
  C5: "description",
  C3: "backend",
  C9: "attributes",
  C12: "attributes",
};

export function failuresToGroups(failures: Failure[]): PromptGroup[] {
  const groups = new Set<PromptGroup>();

  for (const failure of failures) {
    if (failure.checkId === "PACK") continue;

    if (failure.field.startsWith("bullet")) {
      groups.add("bullets");
      continue;
    }
    if (failure.field.startsWith("attributes.")) {
      groups.add("attributes");
      continue;
    }
    if (failure.field.startsWith("aplus")) {
      groups.add("aplus");
      continue;
    }
    if (failure.field.startsWith("qa")) {
      groups.add("qa");
      continue;
    }

    const mapped = FIELD_TO_GROUP[failure.field] ?? CHECK_TO_GROUP[failure.checkId];
    if (mapped) groups.add(mapped);

    if (failure.checkId.startsWith("A")) {
      groups.add("aplus");
    }
    if (failure.checkId === "C7") {
      groups.add("title");
      groups.add("bullets");
      groups.add("description");
    }
    if (failure.checkId === "C6") {
      groups.add("title");
      groups.add("bullets");
      groups.add("description");
      groups.add("backend");
    }
    if (failure.checkId === "C9" && failure.field === "bullets") {
      groups.add("bullets");
    }
    if (failure.checkId === "C9" && failure.field === "description") {
      groups.add("description");
    }
  }

  return Array.from(groups);
}

export function hasNonRepairableFailure(failures: Failure[]): boolean {
  return failures.some((failure) => failure.checkId === "PACK");
}
