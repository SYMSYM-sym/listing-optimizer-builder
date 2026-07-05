import {
  getDiseaseNouns,
  subtractDisclaimer,
  type GateContext,
} from "@/lib/gate/context";
import {
  checkPackFailClosed,
  scanBannedTerms,
} from "@/lib/gate/checks/listing-checks";
import { equalsNormalized, hasNegationContext, normalize } from "@/lib/gate/util";
import type { AplusContent, Failure, OptimizedListing } from "@/lib/types";

function fail(
  checkId: string,
  field: string,
  context: string,
  fix: string,
): Failure {
  return { checkId, field, context, fix };
}

export function getAplusSurfaces(
  aplus: AplusContent,
): Array<{ field: string; text: string }> {
  const surfaces: Array<{ field: string; text: string }> = [];

  for (const aplusModule of aplus.modules) {
    surfaces.push({ field: `aplus.modules.${aplusModule.id}.headline`, text: aplusModule.headline });
    surfaces.push({ field: `aplus.modules.${aplusModule.id}.body`, text: aplusModule.body });
    if (aplusModule.subcopy) {
      surfaces.push({ field: `aplus.modules.${aplusModule.id}.subcopy`, text: aplusModule.subcopy });
    }
  }

  for (const row of aplus.comparison.rows) {
    surfaces.push({ field: `aplus.comparison.${row.label}.ours`, text: row.ours });
    surfaces.push({ field: `aplus.comparison.${row.label}.typical`, text: row.typical });
  }

  aplus.faq.forEach((item, index) => {
    surfaces.push({ field: `aplus.faq.${index}.q`, text: item.q });
    surfaces.push({ field: `aplus.faq.${index}.a`, text: item.a });
  });

  return surfaces;
}

export function checkA1(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const disclaimer = ctx.pack.compliancePack.canonicalDisclaimer;
  if (!disclaimer) return [];
  const aplus = listing.aplusContent;
  const failures: Failure[] = [];

  if (!equalsNormalized(aplus.fdaDisclaimer, disclaimer)) {
    failures.push(
      fail("A1", "aplus.fdaDisclaimer", "A+ disclaimer mismatch", "Set aplus fdaDisclaimer to canonical constant"),
    );
  }

  for (const aplusModule of aplus.modules) {
    if (!aplusModule.claimBearing) continue;
    if (!aplusModule.body.includes(disclaimer)) {
      failures.push(
        fail(
          "A1",
          `aplus.modules.${aplusModule.id}.body`,
          "Disclaimer missing from claim-bearing module body",
          "Append verbatim disclaimer to module body",
        ),
      );
    }
    if (aplusModule.subcopy && !aplusModule.subcopy.includes(disclaimer)) {
      failures.push(
        fail(
          "A1",
          `aplus.modules.${aplusModule.id}.subcopy`,
          "Disclaimer missing from claim-bearing subcopy",
          "Append verbatim disclaimer to subcopy",
        ),
      );
    }
  }

  aplus.faq.forEach((item, index) => {
    if (!item.claimBearing) return;
    if (!item.a.includes(disclaimer)) {
      failures.push(
        fail(
          "A1",
          `aplus.faq.${index}.a`,
          "Disclaimer missing from claim-bearing FAQ answer",
          "Append verbatim disclaimer to FAQ answer",
        ),
      );
    }
  });

  return failures;
}

export function checkA2(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const packFailures = checkPackFailClosed(ctx);
  if (packFailures.length > 0) return packFailures;
  if (!ctx.pack.compliancePack.canonicalDisclaimer) return [];

  const failures: Failure[] = [];
  for (const surface of getAplusSurfaces(listing.aplusContent)) {
    failures.push(...scanBannedTerms(surface.text, surface.field, ctx, "A2"));
  }
  return failures;
}

export function checkA3(listing: OptimizedListing, _ctx: GateContext): Failure[] {
  const brand = listing.attributes.brand_name?.trim();
  if (!brand) return [];

  const failures: Failure[] = [];
  for (const surface of getAplusSurfaces(listing.aplusContent)) {
    if (surface.text.toLowerCase().includes(brand.toLowerCase())) {
      failures.push(
        fail("A3", surface.field, `Brand "${brand}" in A+`, "Remove backend brand from A+ copy"),
      );
    }
  }
  return failures;
}

export function checkA4(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const name = ctx.productName.trim();
  if (!name) return [];

  const failures: Failure[] = [];
  const brandStory = listing.aplusContent.modules.find((module) =>
    /brand/i.test(module.id),
  );
  const hero = listing.aplusContent.modules.find((module) => /hero/i.test(module.id));

  const brandText = brandStory ? `${brandStory.headline} ${brandStory.body}` : "";
  const heroText = hero ? `${hero.headline} ${hero.body}` : "";

  if (brandStory && !brandText.toLowerCase().includes(name.toLowerCase())) {
    failures.push(
      fail("A4", `aplus.modules.${brandStory.id}.body`, "Product name missing from brand story", "Include product name in brand story"),
    );
  }
  if (hero && !heroText.toLowerCase().includes(name.toLowerCase())) {
    failures.push(
      fail("A4", `aplus.modules.${hero.id}.body`, "Product name missing from hero", "Include product name in hero module"),
    );
  }

  return failures;
}

export function checkA5(listing: OptimizedListing, _ctx: GateContext): Failure[] {
  const pattern =
    /(\d[\d,.]*\s*[a-zA-Z%]+)[\s\S]{0,40}(per serving)|(?:delivers|provides|contains)[\s\S]{0,40}(\d[\d,.]*\s*[a-zA-Z%]+)[\s\S]{0,40}(per serving)/gi;
  const failures: Failure[] = [];

  for (const surface of getAplusSurfaces(listing.aplusContent)) {
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(surface.text)) !== null) {
      if (hasNegationContext(surface.text, match.index)) continue;
      failures.push(
        fail(
          "A5",
          surface.field,
          "Potency phrased per serving in A+",
          "Attach headline potency to the blend, not per serving",
        ),
      );
      break;
    }
  }
  return failures;
}

export function checkA6(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const phrases = ctx.pack.compliancePack.fictionPhrases;
  if (phrases.length === 0) return [];

  const failures: Failure[] = [];
  for (const surface of getAplusSurfaces(listing.aplusContent)) {
    for (const phrase of phrases) {
      const index = surface.text.toLowerCase().indexOf(phrase.toLowerCase());
      if (index !== -1 && !hasNegationContext(surface.text, index)) {
        failures.push(
          fail("A6", surface.field, `Fiction phrase "${phrase}" in A+`, "Remove known-false descriptor"),
        );
      }
    }
  }
  return failures;
}

function allergenPattern(rule: { class: string; source: string }): RegExp {
  const classEsc = rule.class.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const sourceEsc = rule.source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(${classEsc}[\\s\\S]{0,40}${sourceEsc}|${sourceEsc}[\\s\\S]{0,40}${classEsc})`, "i");
}

export function checkA7(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const info = listing.attributes.allergen_information?.trim();
  if (!info) return [];

  const rule = ctx.pack.compliancePack.allergenRules.find(
    (entry) => entry.canonicalString === info,
  );
  if (!rule) return [];

  const ingredientsModule = listing.aplusContent.modules.find((module) =>
    /ingredient/i.test(module.id),
  );
  if (!ingredientsModule) {
    return [
      fail("A7", "aplus.modules", "No ingredients module for allergen", "Add allergen to ingredients module"),
    ];
  }

  const text = `${ingredientsModule.headline} ${ingredientsModule.body} ${ingredientsModule.subcopy ?? ""}`;
  if (!allergenPattern(rule).test(text)) {
    return [
      fail(
        "A7",
        `aplus.modules.${ingredientsModule.id}.body`,
        "Allergen missing from ingredients module",
        "Declare allergen in ingredients module",
      ),
    ];
  }
  return [];
}

const PROHIBITED_MARKETING = [
  /\$/,
  /\bper day\b/i,
  /\bbuy now\b/i,
  /subscribe\s*&\s*save/i,
  /\blimited time\b/i,
  /\bact now\b/i,
  /\bguarantee\b/i,
  /#\s*1\b/,
  /\bbest seller\b/i,
  /\b\d(\.\d)?\s*stars?\b/i,
  /\b\d+\s*reviews?\b/i,
];

export function checkA8(listing: OptimizedListing, ctx: GateContext): Failure[] {
  const failures: Failure[] = [];
  const banned = [
    ...PROHIBITED_MARKETING,
    ...ctx.pack.compliancePack.superlativeBans.map(
      (term) => new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"),
    ),
  ];

  for (const surface of getAplusSurfaces(listing.aplusContent)) {
    const scrubbed = subtractDisclaimer(surface.text, ctx.pack.compliancePack.canonicalDisclaimer);
    const normalized = normalize(scrubbed);
    for (const pattern of banned) {
      const match = pattern.exec(normalized);
      if (match && !hasNegationContext(normalized, match.index)) {
        failures.push(
          fail("A8", surface.field, "Prohibited marketing language in A+", "Remove price, promo, or superlative claims"),
        );
        break;
      }
    }
  }
  return failures;
}

export const aplusChecks = [
  checkA1,
  checkA2,
  checkA3,
  checkA4,
  checkA5,
  checkA6,
  checkA7,
  checkA8,
];
