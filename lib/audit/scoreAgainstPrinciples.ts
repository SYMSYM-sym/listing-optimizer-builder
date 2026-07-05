import { buildFacts } from "@/lib/engine/facts";
import type { KnowledgePack, ListingSnapshot, OptimizedListing, Principle, Scorecard } from "@/lib/types";

export type PrincipleLevel = "none" | "partial" | "full";

export type PrincipleScore = {
  id: string;
  level: PrincipleLevel;
  rationale: string;
};

const SITUATIONAL_OPENERS = /^(when|for|ideal for|perfect for|during|after|before|while|whether)/i;
const COMPARATIVE_CUES = /\b(vs\.?|versus|compared to|alternative|best for|better than)\b/i;
const SOCIAL_PROOF = /\b(\d(\.\d)?\s*stars?|#\s*1|best seller|\d+\s*reviews?|top rated)\b/i;

function words(text: string): string[] {
  return text.toLowerCase().match(/\b[a-z0-9']+\b/g) ?? [];
}

function primaryKeyword(snapshot: ListingSnapshot): string {
  return (
    snapshot.attributes.primary_supplement_type?.trim() ||
    snapshot.subcategory?.trim() ||
    snapshot.category.split(/[>/]/).pop()?.trim() ||
    words(snapshot.title)[0] ||
    "product"
  ).toLowerCase();
}

function scoreP01(snapshot: ListingSnapshot): PrincipleScore {
  const keyword = primaryKeyword(snapshot);
  const title = snapshot.title.toLowerCase();
  const first75 = title.slice(0, 75);
  if (first75.includes(keyword) && title.indexOf(keyword) <= 40) {
    return { id: "P01", level: "full", rationale: "Primary keyword appears early in the title." };
  }
  if (first75.includes(keyword)) {
    return { id: "P01", level: "partial", rationale: "Primary keyword is in the title but not front-loaded." };
  }
  return { id: "P01", level: "none", rationale: "Primary keyword is missing from the title lead." };
}

function scoreP02(snapshot: ListingSnapshot): PrincipleScore {
  const counts = new Map<string, number>();
  for (const word of words(snapshot.title)) {
    if (word.length < 3) continue;
    counts.set(word, (counts.get(word) ?? 0) + 1);
  }
  const maxRepeat = Math.max(0, ...Array.from(counts.values()));
  if (maxRepeat <= 2) {
    return { id: "P02", level: "full", rationale: "Title avoids excessive word repetition." };
  }
  if (maxRepeat === 3) {
    return { id: "P02", level: "partial", rationale: "Title repeats a term more than twice." };
  }
  return { id: "P02", level: "none", rationale: "Title over-repeats indexed terms." };
}

function scoreP03(snapshot: ListingSnapshot): PrincipleScore {
  const backend =
    snapshot.attributes.generic_keyword?.trim() ||
    snapshot.attributes.subject_keyword?.trim() ||
    "";
  if (!backend) {
    return { id: "P03", level: "partial", rationale: "No backend keyword reserve is populated yet." };
  }
  const visible = `${snapshot.title} ${snapshot.bullets.join(" ")} ${snapshot.description}`.toLowerCase();
  const duplicates = words(backend).filter((term) => term.length > 3 && visible.includes(term));
  if (duplicates.length === 0) {
    return { id: "P03", level: "full", rationale: "Backend reserve appears distinct from visible copy." };
  }
  return { id: "P03", level: "none", rationale: "Backend terms duplicate visible copy." };
}

function scoreP04(snapshot: ListingSnapshot, schemaFields: KnowledgePack["attributeSchema"]): PrincipleScore {
  if (schemaFields.length === 0) {
    return { id: "P04", level: "partial", rationale: "No attribute schema available for this pack." };
  }
  const required = schemaFields.filter((field) => field.required);
  const optional = schemaFields.filter((field) => !field.required);
  const filled = (field: string) => Boolean(snapshot.attributes[field]?.trim());
  const requiredFilled = required.filter((field) => filled(field.field)).length;
  const optionalFilled = optional.filter((field) => filled(field.field)).length;

  if (requiredFilled === required.length && optionalFilled >= optional.length * 0.5) {
    return { id: "P04", level: "full", rationale: "Required attributes are filled and most optional fields are present." };
  }
  if (requiredFilled >= required.length * 0.7) {
    return { id: "P04", level: "partial", rationale: "Several structured attribute fields are still blank." };
  }
  return { id: "P04", level: "none", rationale: "Many required attribute fields are empty." };
}

function scoreP05(snapshot: ListingSnapshot): PrincipleScore {
  if (snapshot.attributes.recommended_browse_nodes?.trim()) {
    return { id: "P05", level: "full", rationale: "Browse node guidance is present." };
  }
  return { id: "P05", level: "none", rationale: "Recommended browse node is missing." };
}

function scoreP06(snapshot: ListingSnapshot): PrincipleScore {
  const filledBullets = snapshot.bullets.filter((bullet) => bullet.trim()).length;
  const descriptionLen = snapshot.description.trim().length;
  if (filledBullets >= 4 && descriptionLen >= 400) {
    return { id: "P06", level: "full", rationale: "Title, bullets, and description cover broad query surface." };
  }
  if (filledBullets >= 2 && descriptionLen >= 120) {
    return { id: "P06", level: "partial", rationale: "Copy exists but long-tail/use-case coverage is thin." };
  }
  return { id: "P06", level: "none", rationale: "Visible copy is too sparse to cover query variants." };
}

function scoreP07(snapshot: ListingSnapshot): PrincipleScore {
  const situational = snapshot.bullets.filter((bullet) => SITUATIONAL_OPENERS.test(bullet.trim())).length;
  if (situational >= 2) {
    return { id: "P07", level: "full", rationale: "Bullets lead with buyer situations." };
  }
  if (situational === 1) {
    return { id: "P07", level: "partial", rationale: "Only one bullet uses situational framing." };
  }
  return { id: "P07", level: "none", rationale: "Bullets read as feature lists, not situations." };
}

function scoreP08(snapshot: ListingSnapshot): PrincipleScore {
  const anchors = snapshot.bullets.filter((bullet) => bullet.trim().length >= 40).length;
  if (anchors >= 3) {
    return { id: "P08", level: "full", rationale: "Multiple distinct situational anchors are present." };
  }
  if (anchors >= 2) {
    return { id: "P08", level: "partial", rationale: "Some use-case anchors exist but coverage is uneven." };
  }
  return { id: "P08", level: "none", rationale: "Bullets lack distinct situational anchors." };
}

function scoreP09(snapshot: ListingSnapshot): PrincipleScore {
  const text = `${snapshot.description} ${snapshot.bullets.join(" ")}`;
  if (COMPARATIVE_CUES.test(text)) {
    return { id: "P09", level: "full", rationale: "Copy uses comparative framing for AI retrieval." };
  }
  return { id: "P09", level: "none", rationale: "No comparative framing for alternatives or best-fit buyers." };
}

function scoreP10(): PrincipleScore {
  return {
    id: "P10",
    level: "none",
    rationale: "Current snapshot has no A+ modules to evaluate.",
  };
}

function scoreP11(snapshot: ListingSnapshot): PrincipleScore {
  const text = `${snapshot.description} ${snapshot.bullets.join(" ")}`.toLowerCase();
  const buyerPhrases = ["daily", "routine", "support", "help", "feel", "use"];
  const hits = buyerPhrases.filter((phrase) => text.includes(phrase)).length;
  if (hits >= 3) {
    return { id: "P11", level: "full", rationale: "Copy mirrors natural buyer language." };
  }
  if (hits >= 1) {
    return { id: "P11", level: "partial", rationale: "Some buyer-language cues appear but phrasing is thin." };
  }
  return { id: "P11", level: "none", rationale: "Copy sounds catalog-like rather than buyer-aligned." };
}

function scoreP12(): PrincipleScore {
  return { id: "P12", level: "none", rationale: "Current snapshot has no structured Q&A seed content." };
}

function scoreP13(snapshot: ListingSnapshot): PrincipleScore {
  const text = `${snapshot.title} ${snapshot.bullets.join(" ")} ${snapshot.description}`;
  if (SOCIAL_PROOF.test(text)) {
    return { id: "P13", level: "none", rationale: "Forbidden social-proof language appears in current copy." };
  }
  return { id: "P13", level: "full", rationale: "Current copy avoids star/review superlatives." };
}

function scoreP14(snapshot: ListingSnapshot): PrincipleScore {
  const facts = buildFacts(snapshot);
  const surfaces = [snapshot.title, ...snapshot.bullets, snapshot.description].join(" ");
  const numbers = surfaces.match(/\b\d+\b/g) ?? [];
  if (facts.unitCount !== undefined) {
    const conflicts = numbers.filter(
      (value) => value !== String(facts.unitCount) && Number.parseInt(value, 10) > 1,
    );
    if (conflicts.length > 0) {
      return { id: "P14", level: "none", rationale: "Current copy mentions conflicting unit counts." };
    }
  }
  return { id: "P14", level: "full", rationale: "Recurring numeric facts appear consistent." };
}

function scoreP15(): PrincipleScore {
  return {
    id: "P15",
    level: "partial",
    rationale: "Timing cadence cannot be assessed from a static snapshot alone.",
  };
}

function scoreP16(): PrincipleScore {
  return {
    id: "P16",
    level: "partial",
    rationale: "Worker≠checker is enforced by the audit pipeline, not visible in a static snapshot.",
  };
}

function levelToScore(level: PrincipleLevel, maxScore: number): number {
  if (level === "full") return maxScore;
  if (level === "partial") return Math.round(maxScore * 0.5);
  return 0;
}

function scorePrinciple(principle: Principle, snapshot: ListingSnapshot, pack: KnowledgePack): PrincipleScore {
  switch (principle.id) {
    case "P01":
      return scoreP01(snapshot);
    case "P02":
      return scoreP02(snapshot);
    case "P03":
      return scoreP03(snapshot);
    case "P04":
      return scoreP04(snapshot, pack.attributeSchema);
    case "P05":
      return scoreP05(snapshot);
    case "P06":
      return scoreP06(snapshot);
    case "P07":
      return scoreP07(snapshot);
    case "P08":
      return scoreP08(snapshot);
    case "P09":
      return scoreP09(snapshot);
    case "P10":
      return scoreP10();
    case "P11":
      return scoreP11(snapshot);
    case "P12":
      return scoreP12();
    case "P13":
      return scoreP13(snapshot);
    case "P14":
      return scoreP14(snapshot);
    case "P15":
      return scoreP15();
    case "P16":
      return scoreP16();
    default:
      return { id: principle.id, level: "partial", rationale: "Principle not yet scored." };
  }
}

/** Score the current listing snapshot against optimization principles (0–100). */
export function scoreAgainstPrinciples(
  snapshot: ListingSnapshot,
  pack: KnowledgePack,
): Scorecard {
  const principles = pack.principles;
  const totalWeight = principles.reduce((sum, principle) => sum + principle.weight, 0);

  const criteria = principles.map((principle, index) => {
    let maxScore = Math.round((principle.weight / totalWeight) * 100);
    if (index === principles.length - 1) {
      const assigned = principles
        .slice(0, -1)
        .reduce((sum, entry) => sum + Math.round((entry.weight / totalWeight) * 100), 0);
      maxScore = 100 - assigned;
    }
    const scored = scorePrinciple(principle, snapshot, pack);
    return {
      id: scored.id,
      label: principle.text,
      score: levelToScore(scored.level, maxScore),
      maxScore,
      notes: scored.rationale,
    };
  });

  const maxTotal = criteria.reduce((sum, criterion) => sum + criterion.maxScore, 0);
  const total = criteria.reduce((sum, criterion) => sum + criterion.score, 0);

  return { total, maxTotal, criteria };
}

export { scorePrinciple };
