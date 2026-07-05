import type {
  AplusContent,
  Facts,
  KnowledgePack,
  OptimizedListing,
  QAItem,
} from "@/lib/types";
import type { AplusGroupResult } from "@/lib/engine/prompts/aplus";
import type { AttributesGroupResult } from "@/lib/engine/prompts/attributes";
import type { BackendGroupResult } from "@/lib/engine/prompts/backend";
import type { BulletsGroupResult } from "@/lib/engine/prompts/bullets";
import type { DescriptionGroupResult } from "@/lib/engine/prompts/description";
import type { ImagesGroupResult } from "@/lib/engine/prompts/images";
import type { QaGroupResult } from "@/lib/engine/prompts/qa";
import type { TitleGroupResult } from "@/lib/engine/prompts/title";

export type OptimizeGroups = {
  title: TitleGroupResult;
  bullets: BulletsGroupResult;
  description: DescriptionGroupResult;
  backend: BackendGroupResult;
  attributes: AttributesGroupResult;
  aplus: AplusGroupResult;
  images: ImagesGroupResult;
  qa: QaGroupResult;
};

function ensureDisclaimer(text: string, disclaimer: string): string {
  if (!disclaimer || text.includes(disclaimer)) return text;
  return `${text.trim()}\n\n${disclaimer}`;
}

function ensureProductNameLead(title: string, productName: string): string {
  const trimmedName = productName.trim();
  if (!trimmedName) return title;
  if (title.toLowerCase().startsWith(trimmedName.toLowerCase())) return title;
  return `${trimmedName} ${title}`.trim();
}

function normalizeBullets(
  bullets: string[],
  disclaimer: string,
): [string, string, string, string, string] {
  const padded = [...bullets];
  while (padded.length < 5) padded.push("");
  const five = padded.slice(0, 5).map((bullet) => {
    const trimmed = bullet.trim();
    if (!trimmed) return trimmed;
    if (!disclaimer) return trimmed;
    const claimLike = /support|maintain|help|promote|healthy|function/i.test(trimmed);
    if (claimLike && !trimmed.endsWith("*")) {
      return `${trimmed} *`;
    }
    return trimmed;
  });
  return five as [string, string, string, string, string];
}

function finalizeAplusContent(
  aplus: AplusGroupResult,
  disclaimer: string,
): AplusContent {
  const modules = aplus.modules.map((module) => ({
    ...module,
    body: module.claimBearing ? ensureDisclaimer(module.body, disclaimer) : module.body,
    subcopy:
      module.subcopy && module.claimBearing
        ? ensureDisclaimer(module.subcopy, disclaimer)
        : module.subcopy,
  }));

  const faq = aplus.faq.map((item) => ({
    ...item,
    a: item.claimBearing ? ensureDisclaimer(item.a, disclaimer) : item.a,
  }));

  return {
    fdaDisclaimer: disclaimer,
    modules,
    comparison: aplus.comparison,
    faq,
  };
}

function finalizeQa(qa: QAItem[], disclaimer: string): QAItem[] {
  return qa.map((item) => ({
    ...item,
    answer: item.claimBearing
      ? ensureDisclaimer(item.answer, disclaimer)
      : item.answer,
  }));
}

/** Deterministic assembly — injects disclaimers and normalizes structure. */
export function assembleOptimizedListing(
  pack: KnowledgePack,
  facts: Facts,
  groups: OptimizeGroups,
): OptimizedListing {
  const disclaimer = pack.compliancePack.canonicalDisclaimer;
  const productName = groups.title.productName.trim() || "Product";

  const title = ensureProductNameLead(groups.title.title, productName);
  const title75 = ensureProductNameLead(groups.title.title75, productName);
  let description = groups.description.description.trim();
  if (description && !description.toLowerCase().includes(productName.toLowerCase())) {
    description = `${productName}. ${description}`;
  }
  description = ensureDisclaimer(description, disclaimer);

  return {
    title,
    title75,
    itemHighlights: groups.title.itemHighlights,
    bullets: normalizeBullets(groups.bullets.bullets, disclaimer),
    description,
    backendSearchTerms: groups.backend.backendSearchTerms.trim(),
    attributes: groups.attributes.attributes,
    facts,
    fdaDisclaimer: disclaimer,
    aplusContent: finalizeAplusContent(groups.aplus, disclaimer),
    imagePlan: groups.images.imagePlan,
    qa: finalizeQa(groups.qa.qa, disclaimer),
    state: "draft",
  };
}
