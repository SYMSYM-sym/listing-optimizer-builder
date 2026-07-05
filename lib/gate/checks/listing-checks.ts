import {
  getCustomerSurfaces,
  getDiseaseNouns,
  ruleNumber,
  subtractDisclaimer,
  type GateContext,
} from "@/lib/gate/context";
import {
  equalsNormalized,
  hasNegationContext,
  normalize,
  utf8Bytes,
} from "@/lib/gate/util";
import type { Failure, OptimizedListing } from "@/lib/types";

function fail(
  checkId: string,
  field: string,
  context: string,
  fix: string,
): Failure {
  return { checkId, field, context, fix };
}

export function checkPackFailClosed(ctx: GateContext): Failure[] {
  const nouns = getDiseaseNouns(ctx);
  if (nouns.length > 0) return [];
  return [
    fail(
      "PACK",
      "compliance",
      `No disease nouns configured for subcategory "${ctx.subcategory}"`,
      "compliance pack incomplete for this category — populate disease nouns before trusting a pass",
    ),
  ];
}

export function checkC1(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const max = ruleNumber(ctx.pack.rules, "titleMaxLegacy") || 200;
  if (listing.title.length <= max) return [];
  return [
    fail("C1", "title", `Title length ${listing.title.length}`, `Reduce title to ≤${max} characters`),
  ];
}

export function checkC2(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const max = ruleNumber(ctx.pack.rules, "bulletMax") || 255;
  const failures: Failure[] = [];
  if (listing.bullets.length !== 5) {
    failures.push(
      fail("C2", "bullets", `Bullet count ${listing.bullets.length}`, "Provide exactly 5 bullets"),
    );
  }
  listing.bullets.forEach((bullet, index) => {
    if (bullet.length > max) {
      failures.push(
        fail(
          "C2",
          `bullet${index}`,
          `Bullet ${index} length ${bullet.length}`,
          `Reduce bullet to ≤${max} characters`,
        ),
      );
    }
  });
  return failures;
}

export function checkC3(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const max = ruleNumber(ctx.pack.rules, "backendMaxBytes") || 249;
  const bytes = utf8Bytes(listing.backendSearchTerms);
  if (bytes <= max) return [];
  return [
    fail(
      "C3",
      "backendSearchTerms",
      `Backend bytes ${bytes}`,
      `Reduce backend search terms to ≤${max} UTF-8 bytes`,
    ),
  ];
}

export function checkC4(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const max = ruleNumber(ctx.pack.rules, "descriptionMax") || 2000;
  if (listing.description.length <= max) return [];
  return [
    fail(
      "C4",
      "description",
      `Description length ${listing.description.length}`,
      `Reduce description to ≤${max} characters`,
    ),
  ];
}

export function checkC5(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const disclaimer = ctx.pack.compliancePack.canonicalDisclaimer;
  if (!disclaimer) return [];
  const failures: Failure[] = [];
  if (!equalsNormalized(listing.fdaDisclaimer, disclaimer)) {
    failures.push(
      fail("C5", "fdaDisclaimer", "fdaDisclaimer mismatch", "Set fdaDisclaimer to the canonical constant"),
    );
  }
  if (!listing.description.includes(disclaimer)) {
    failures.push(
      fail("C5", "description", "Disclaimer missing from description", "Append verbatim disclaimer to description"),
    );
  }
  return failures;
}

export function scanBannedTerms(
  text: string,
  field: string,
  ctx: GateContext,
  checkId: string,
): Failure[] {
  const disclaimer = ctx.pack.compliancePack.canonicalDisclaimer;
  const scrubbed = subtractDisclaimer(text, disclaimer);
  const normalized = normalize(scrubbed).toLowerCase();
  const failures: Failure[] = [];
  const nouns = getDiseaseNouns(ctx);
  const verbs = ctx.pack.compliancePack.diseaseVerbs;

  for (const noun of nouns) {
    const term = noun.toLowerCase();
    let index = normalized.indexOf(term);
    while (index !== -1) {
      if (!hasNegationContext(normalized, index)) {
        failures.push(
          fail(checkId, field, `Banned term "${noun}"`, "Remove disease term or rephrase as structure/function"),
        );
        break;
      }
      index = normalized.indexOf(term, index + 1);
    }
  }

  for (const verb of verbs) {
    const pattern = new RegExp(`\\b${verb}\\b`, "gi");
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(normalized)) !== null) {
      if (hasNegationContext(normalized, match.index)) continue;
      const window = normalized.slice(match.index, match.index + 40);
      const hasNounNearby = nouns.some((noun) => window.includes(noun.toLowerCase()));
      if (hasNounNearby || verb === "diagnose" || verb === "mitigate") {
        failures.push(
          fail(checkId, field, `Banned verb "${verb}"`, "Remove drug-claim verb"),
        );
        break;
      }
    }
  }

  return failures;
}

export function checkC6(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const packFailures = checkPackFailClosed(ctx);
  if (packFailures.length > 0) return packFailures;
  if (!ctx.pack.compliancePack.canonicalDisclaimer) return [];

  const failures: Failure[] = [];
  for (const surface of getCustomerSurfaces(listing)) {
    failures.push(...scanBannedTerms(surface.text, surface.field, ctx, "C6"));
  }
  return failures;
}

export function checkC7(listing: OptimizedListing, _ctx: GateContext): Failure[] {
  const brand = listing.attributes.brand_name?.trim();
  const manufacturer = listing.attributes.manufacturer?.trim();
  const backendOnly = [brand, manufacturer].filter(Boolean) as string[];
  if (backendOnly.length === 0) return [];

  const failures: Failure[] = [];
  for (const surface of getCustomerSurfaces(listing)) {
    for (const term of backendOnly) {
      if (surface.text.toLowerCase().includes(term.toLowerCase())) {
        failures.push(
          fail("C7", surface.field, `Backend brand "${term}" leaked`, "Remove brand from customer-facing copy"),
        );
      }
    }
  }

  for (const [field, value] of Object.entries(listing.attributes)) {
    if (field === "brand_name" || field === "manufacturer") continue;
    for (const term of backendOnly) {
      if (value.toLowerCase().includes(term.toLowerCase())) {
        failures.push(
          fail(
            "C7",
            `attributes.${field}`,
            `Backend brand "${term}" leaked into attribute`,
            "Keep brand/manufacturer backend-only",
          ),
        );
      }
    }
  }

  return failures;
}

export function checkC8(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const name = ctx.productName.trim();
  if (!name) return [];
  const failures: Failure[] = [];
  if (!listing.title.toLowerCase().startsWith(name.toLowerCase())) {
    failures.push(
      fail("C8", "title", "Title does not start with product name", "Lead title with the product name"),
    );
  }
  if (!listing.description.toLowerCase().includes(name.toLowerCase())) {
    failures.push(
      fail("C8", "description", "Product name missing from description", "Include product name in description"),
    );
  }
  return failures;
}

function allergenPattern(rule: { class: string; source: string }): RegExp {
  const classEsc = rule.class.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sourceEsc = rule.source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(${classEsc}[\\s\\S]{0,40}${sourceEsc}|${sourceEsc}[\\s\\S]{0,40}${classEsc})`, "i");
}

function detectAllergenRule(listing: OptimizedListing, ctx: GateContext) {
  const info = listing.attributes.allergen_information?.trim();
  if (!info) return null;
  return ctx.pack.compliancePack.allergenRules.find(
    (rule) => info === rule.canonicalString,
  );
}

export function checkC9(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const rule = detectAllergenRule(listing, ctx);
  if (!rule) return [];

  const failures: Failure[] = [];
  const pattern = allergenPattern(rule);

  if (listing.attributes.allergen_information !== rule.canonicalString) {
    failures.push(
      fail(
        "C9",
        "attributes.allergen_information",
        "allergen_information mismatch",
        `Set allergen_information to "${rule.canonicalString}"`,
      ),
    );
  }

  const hasBullet = listing.bullets.some((bullet) => pattern.test(bullet));
  if (!hasBullet) {
    failures.push(
      fail("C9", "bullets", "Allergen not declared in bullets", "Declare allergen in at least one bullet"),
    );
  }

  if (!pattern.test(listing.description)) {
    failures.push(
      fail("C9", "description", "Allergen not declared in description", "Declare allergen in description"),
    );
  }

  if (/no known allergens/i.test(listing.description)) {
    failures.push(
      fail("C9", "description", '"No Known Allergens" present', "Remove incorrect allergen-free claim"),
    );
  }

  return failures;
}

export function checkC10(listing: OptimizedListing, _ctx: GateContext): Failure[] {
  const pattern =
    /(\d[\d,.]*\s*[a-zA-Z%]+)[\s\S]{0,40}(per serving)|(?:delivers|provides|contains)[\s\S]{0,40}(\d[\d,.]*\s*[a-zA-Z%]+)[\s\S]{0,40}(per serving)/gi;
  const failures: Failure[] = [];

  for (const surface of getCustomerSurfaces(listing)) {
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(surface.text)) !== null) {
      if (hasNegationContext(surface.text, match.index)) continue;
      failures.push(
        fail(
          "C10",
          surface.field,
          "Potency phrased per serving",
          "Attach headline potency to the blend, not per serving",
        ),
      );
      break;
    }
  }
  return failures;
}

export function checkC11(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const phrases = ctx.pack.compliancePack.fictionPhrases;
  if (phrases.length === 0) return [];

  const failures: Failure[] = [];
  for (const surface of getCustomerSurfaces(listing)) {
    for (const phrase of phrases) {
      const index = surface.text.toLowerCase().indexOf(phrase.toLowerCase());
      if (index !== -1 && !hasNegationContext(surface.text, index)) {
        failures.push(
          fail("C11", surface.field, `Fiction phrase "${phrase}"`, "Remove known-false descriptor"),
        );
      }
    }
  }
  return failures;
}

function extractPotencyNumbers(text: string): string[] {
  return text.match(/\d[\d,.]*\s*(?:mg|mcg|g|iu|billion cfu)/gi) ?? [];
}

export function checkC12(listing: OptimizedListing, _ctx: GateContext): Failure[] {
  const { facts } = listing;
  const failures: Failure[] = [];

  for (const surface of getCustomerSurfaces(listing)) {
    const potencies = extractPotencyNumbers(surface.text);
    if (potencies.length > 1) {
      const unique = new Set(potencies.map((value) => value.replace(/\s+/g, "").toLowerCase()));
      if (unique.size > 1) {
        failures.push(
          fail("C12", surface.field, "Conflicting potency values", "Use one consistent potency from facts"),
        );
      }
    }

    if (facts.potency && potencies.length > 0) {
      const factNum = facts.potency.match(/\d[\d,.]*/)?.[0];
      if (factNum) {
        const mismatch = potencies.some((value) => {
          const num = value.match(/\d[\d,.]*/)?.[0];
          return num && num !== factNum && !facts.potency!.includes(num);
        });
        if (mismatch) {
          failures.push(
            fail(
              "C12",
              surface.field,
              `Potency disagrees with facts (${facts.potency})`,
              "Align potency with canonical facts",
            ),
          );
        }
      }
    }

    if (facts.unitCount !== undefined) {
      const countMatches = surface.text.match(/\b\d+\b/g) ?? [];
      const mentionsCount = countMatches.some((value) => value === String(facts.unitCount));
      const mentionsOtherCount = countMatches.some(
        (value) => value !== String(facts.unitCount) && Number.parseInt(value, 10) > 1,
      );
      if (mentionsOtherCount && !mentionsCount && /count|capsule|tablet|softgel|gummy/i.test(surface.text)) {
        failures.push(
          fail(
            "C12",
            surface.field,
            `Unit count disagrees with facts (${facts.unitCount})`,
            "Use the canonical unit count from facts",
          ),
        );
      }
    }
  }

  return failures;
}

export function checkC15(listing: OptimizedListing, ctx: GateContext): Failure[] {
  if (!listing.title75 && !listing.itemHighlights) return [];
  const failures: Failure[] = [];
  const title75Max = ruleNumber(ctx.pack.rules, "title75Max") || 75;
  const highlightsMax = ruleNumber(ctx.pack.rules, "itemHighlightsMax") || 125;

  if (listing.title75.length > title75Max) {
    failures.push(
      fail("C15", "title75", `title75 length ${listing.title75.length}`, `Reduce title75 to ≤${title75Max}`),
    );
  }
  if (
    ctx.productName &&
    !listing.title75.toLowerCase().startsWith(ctx.productName.toLowerCase())
  ) {
    failures.push(
      fail("C15", "title75", "title75 missing product name lead", "Start title75 with product name"),
    );
  }
  if (listing.itemHighlights.length > highlightsMax) {
    failures.push(
      fail(
        "C15",
        "itemHighlights",
        `itemHighlights length ${listing.itemHighlights.length}`,
        `Reduce itemHighlights to ≤${highlightsMax}`,
      ),
    );
  }
  return failures;
}

export const listingChecks = [
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
];
