import { buildFacts } from "@/lib/engine/facts";
import { ruleNumber } from "@/lib/gate/context";
import { runGate } from "@/lib/gate/runGate";
import { utf8Bytes } from "@/lib/gate/util";
import type {
  AuditGap,
  AuditGapSeverity,
  Failure,
  KnowledgePack,
  ListingSnapshot,
  OptimizedListing,
} from "@/lib/types";

function truncate(value: string, max = 160): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

function snapshotAsListing(snapshot: ListingSnapshot): OptimizedListing {
  const paddedBullets = [...snapshot.bullets];
  while (paddedBullets.length < 5) paddedBullets.push("");
  return {
    title: snapshot.title,
    title75: snapshot.title.slice(0, 75),
    itemHighlights: "",
    bullets: paddedBullets.slice(0, 5) as OptimizedListing["bullets"],
    description: snapshot.description,
    backendSearchTerms:
      snapshot.attributes.generic_keyword?.trim() ||
      snapshot.attributes.subject_keyword?.trim() ||
      "",
    attributes: snapshot.attributes,
    facts: buildFacts(snapshot),
    fdaDisclaimer: snapshot.attributes.legal_disclaimer_description ?? "",
    aplusContent: {
      fdaDisclaimer: "",
      modules: [],
      comparison: { rows: [] },
      faq: [],
    },
    imagePlan: [],
    qa: [],
  };
}

function currentLimitFailures(
  snapshot: ListingSnapshot,
  pack: KnowledgePack,
): Failure[] {
  const failures: Failure[] = [];
  const titleMax = ruleNumber(pack.rules, "titleMaxLegacy") || 200;
  const bulletMax = ruleNumber(pack.rules, "bulletMax") || 255;
  const descriptionMax = ruleNumber(pack.rules, "descriptionMax") || 2000;
  const backendMax = ruleNumber(pack.rules, "backendMaxBytes") || 249;

  if (snapshot.title.length > titleMax) {
    failures.push({
      checkId: "C1",
      field: "title",
      context: "Title over limit",
      fix: "Shorten title",
    });
  }
  if (snapshot.bullets.length !== 5) {
    failures.push({
      checkId: "C2",
      field: "bullets",
      context: "Bullet count wrong",
      fix: "Use exactly 5 bullets",
    });
  }
  snapshot.bullets.forEach((bullet, index) => {
    if (bullet.length > bulletMax) {
      failures.push({
        checkId: "C2",
        field: `bullet${index}`,
        context: "Bullet over limit",
        fix: "Shorten bullet",
      });
    }
  });
  if (snapshot.description.length > descriptionMax) {
    failures.push({
      checkId: "C4",
      field: "description",
      context: "Description over limit",
      fix: "Shorten description",
    });
  }

  const backend =
    snapshot.attributes.generic_keyword?.trim() ||
    snapshot.attributes.subject_keyword?.trim() ||
    "";
  if (backend && utf8Bytes(backend) > backendMax) {
    failures.push({
      checkId: "C3",
      field: "backendSearchTerms",
      context: "Backend over byte cap",
      fix: "Trim backend terms",
    });
  }

  const disclaimer = pack.compliancePack.canonicalDisclaimer;
  if (disclaimer && snapshot.description && !snapshot.description.includes(disclaimer)) {
    failures.push({
      checkId: "C5",
      field: "description",
      context: "Missing FDA disclaimer",
      fix: "Add disclaimer",
    });
  }

  return failures;
}

function failuresForField(field: string, failures: Failure[]): Failure[] {
  return failures.filter((failure) => {
    if (failure.field === field) return true;
    if (field.startsWith(`${failure.field}.`)) return true;
    if (failure.field.startsWith(`${field}.`)) return true;
    if (failure.field === "bullets" && field.startsWith("bullet")) return true;
    if (failure.field === "attributes" && field.startsWith("attributes.")) return true;
    return false;
  });
}

function classifySeverity(
  field: string,
  snapshot: ListingSnapshot,
  pack: KnowledgePack,
  currentFailures: Failure[],
): AuditGapSeverity {
  if (failuresForField(field, currentFailures).length > 0) return "P0";

  if (field.startsWith("attributes.")) {
    const attrField = field.replace("attributes.", "");
    const schema = pack.attributeSchema.find((entry) => entry.field === attrField);
    if (schema?.filterFacet && !snapshot.attributes[attrField]?.trim()) {
      return "P1";
    }
    if (schema?.required && !snapshot.attributes[attrField]?.trim()) {
      return "P1";
    }
  }

  if (field === "backendSearchTerms" && !snapshot.attributes.generic_keyword?.trim()) {
    return "P1";
  }
  if (field === "title75" || field === "itemHighlights") {
    return "P1";
  }
  if (field.startsWith("aplus") || field === "qa") {
    return "P1";
  }

  return "P2";
}

function pushGap(
  gaps: AuditGap[],
  field: string,
  current: string,
  proposed: string,
  why: string,
  snapshot: ListingSnapshot,
  pack: KnowledgePack,
  currentFailures: Failure[],
) {
  if (current.trim() === proposed.trim()) return;
  gaps.push({
    field,
    current: truncate(current),
    proposed: truncate(proposed),
    why,
    severity: classifySeverity(field, snapshot, pack, currentFailures),
  });
}

/** Build field-by-field gaps comparing current snapshot to proposed listing. */
export function buildDiffGaps(
  current: ListingSnapshot,
  proposed: OptimizedListing,
  pack: KnowledgePack,
  subcategory: string,
): AuditGap[] {
  const currentListing = snapshotAsListing(current);
  const gateFailures = runGate(currentListing, pack, { subcategory }).failures;
  const limitFailures = currentLimitFailures(current, pack);
  const currentFailures = [...gateFailures, ...limitFailures];

  const gaps: AuditGap[] = [];

  pushGap(
    gaps,
    "title",
    current.title,
    proposed.title,
    "Title rewritten to front-load keywords and product name while staying within limits.",
    current,
    pack,
    currentFailures,
  );
  pushGap(
    gaps,
    "title75",
    current.title.slice(0, 75),
    proposed.title75,
    "New 75-character title field captures the highest-value keyword cluster.",
    current,
    pack,
    currentFailures,
  );
  pushGap(
    gaps,
    "itemHighlights",
    "",
    proposed.itemHighlights,
    "Searchable highlights carry terms that no longer fit the short title.",
    current,
    pack,
    currentFailures,
  );
  pushGap(
    gaps,
    "description",
    current.description,
    proposed.description,
    "Description expanded with compliant buyer-facing copy and required disclaimer placement.",
    current,
    pack,
    currentFailures,
  );

  const currentBackend =
    current.attributes.generic_keyword?.trim() ||
    current.attributes.subject_keyword?.trim() ||
    "";
  pushGap(
    gaps,
    "backendSearchTerms",
    currentBackend,
    proposed.backendSearchTerms,
    "Backend reserve adds discovery synonyms without repeating visible copy.",
    current,
    pack,
    currentFailures,
  );

  for (let index = 0; index < 5; index += 1) {
    pushGap(
      gaps,
      `bullet${index}`,
      current.bullets[index] ?? "",
      proposed.bullets[index] ?? "",
      "Bullet rewritten for situational anchors, compliance markers, and keyword coverage.",
      current,
      pack,
      currentFailures,
    );
  }

  const schemaFields = pack.attributeSchema.length
    ? pack.attributeSchema.map((entry) => entry.field)
    : Object.keys({ ...current.attributes, ...proposed.attributes });

  for (const field of schemaFields) {
    const currentValue = current.attributes[field] ?? "";
    const proposedValue = proposed.attributes[field] ?? "";
    if (currentValue.trim() === proposedValue.trim()) continue;

    const label =
      pack.attributeSchema.find((entry) => entry.field === field)?.label ?? field;
    pushGap(
      gaps,
      `attributes.${field}`,
      currentValue,
      proposedValue,
      `Structured attribute "${label}" filled to improve filters and retrieval.`,
      current,
      pack,
      currentFailures,
    );
  }

  const currentAplus = "No A+ content in current snapshot";
  const proposedAplus = `${proposed.aplusContent.modules.length} modules, ${proposed.aplusContent.faq.length} FAQ items`;
  pushGap(
    gaps,
    "aplusContent",
    currentAplus,
    proposedAplus,
    "Premium A+ modules add extractable comparison, FAQ, and claim-bearing text for AI discovery.",
    current,
    pack,
    currentFailures,
  );

  pushGap(
    gaps,
    "qa",
    "No structured Q&A in current snapshot",
    `${proposed.qa.length} Q&A pairs`,
    "Structured Q&A seeds the AI-answer layer with facts mirrored from bullets and A+.",
    current,
    pack,
    currentFailures,
  );

  const severityRank: Record<AuditGapSeverity, number> = { P0: 0, P1: 1, P2: 2 };
  return gaps.sort((a, b) => severityRank[a.severity] - severityRank[b.severity]);
}
