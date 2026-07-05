/**
 * Shared types — engine, gate, audit, and UI must import from here.
 * Field constraints mirror brain/05-output-contract.md and ARCHITECTURE.md.
 */

/** Normalized current listing from ingestion. */
export type ListingSnapshot = {
  asin: string;
  url: string;
  title: string;
  bullets: string[];
  description: string;
  images: string[];
  attributes: Record<string, string>;
  price?: string;
  rating?: number;
  category: string;
  /** From browse node + title keywords; drives compliance pack disease-noun lookup. */
  subcategory: string;
  raw: unknown;
};

/** Category-specific rules, compliance, attribute schema, and principles. */
export type CompliancePack = {
  canonicalDisclaimer: string;
  diseaseVerbs: string[];
  diseaseNounsBySubcategory: Record<string, string[]>;
  allergenRules: AllergenRule[];
  superlativeBans: string[];
  fictionPhrases: string[];
};

export type AllergenRule = {
  class: string;
  source: string;
  canonicalString: string;
};

export type AttributeField = {
  field: string;
  label: string;
  filterFacet: boolean;
  required: boolean;
  valueType: string;
  example: string;
};

export type Principle = {
  id: string;
  text: string;
  weight: number;
};

export type KnowledgePackId = "supplements" | "generic";

export type KnowledgePack = {
  id: KnowledgePackId;
  rules: Record<string, unknown>;
  compliancePack: CompliancePack;
  attributeSchema: AttributeField[];
  principles: Principle[];
};

export type CategoryDetection = {
  packId: KnowledgePackId;
  subcategory: string;
};

/**
 * Canonical numeric facts every surface must agree with (C12).
 * Deterministically produced — never LLM-guessed.
 */
export type Facts = {
  /** Headline strength attached to the blend, never "per serving". */
  potency?: string;
  unitCount?: number;
  servings?: number;
  servingSize?: string;
  daySupply?: number;
  weight?: string;
  price?: string;
  formulaCount?: number;
};

export type AplusModule = {
  id: string;
  headline: string;
  body: string;
  subcopy?: string;
  claimBearing: boolean;
};

export type AplusContent = {
  /** Verbatim category disclaimer constant. */
  fdaDisclaimer: string;
  /** ≤7 Premium modules; includes brand-story + hero. */
  modules: AplusModule[];
  comparison: {
    rows: { label: string; ours: string; typical: string }[];
  };
  faq: { q: string; a: string; claimBearing: boolean }[];
};

export type ImageSlot = {
  slot: number;
  /** e.g. main, value-prop, supplement-facts, ingredient-story, how-to, trust, lifestyle */
  role: string;
  description: string;
  /** Spec notes per amazon-rules (dimensions, white background, etc.). */
  specs: string;
};

export type QAItem = {
  question: string;
  answer: string;
  claimBearing: boolean;
};

export type ElementState = "draft" | "verified" | "published";

/**
 * Engine output — the Output Contract (brain/05-output-contract.md).
 */
export type OptimizedListing = {
  /** ≤200 chars; product name first; primary keyword front-loaded; word ≤2×; banned chars excluded; no price/promo. */
  title: string;
  /** ⏳ Jul 27 2026 — ≤75 chars; product name first; the single highest-value keyword cluster. */
  title75: string;
  /** ⏳ new, searchable — ≤125 chars; every important term that no longer fits the 75-char title; no title-word duplication. */
  itemHighlights: string;
  /** Exactly 5; ≤255 chars each; one situational anchor per major use-case; claim-bearing bullet ends with short `*` marker (verbatim disclaimer in description/A+, NOT inside bullet); allergen declared in ≥1 bullet. */
  bullets: [string, string, string, string, string];
  /** ≤2,000 chars; product name present; verbatim disclaimer appended; allergen + safety statement; blank-line paragraphs. */
  description: string;
  /** <250 bytes UTF-8 (≤249 saved); synonyms/misspellings/other-language only; zero title repeats; no brands/ASINs/disease terms. */
  backendSearchTerms: string;
  /** Full structured attribute set (see attribute-schema pack); fill every applicable field; ⭐ filter-fields prioritized; active_ingredients ⊆ ingredients. */
  attributes: Record<string, string>;
  /** Canonical numeric facts used by consistency check C12; deterministically produced, never LLM-guessed. */
  facts: Facts;
  /** Verbatim category disclaimer constant. */
  fdaDisclaimer: string;
  /** Up to 7 (Premium) modules with real text + comparison + FAQ; comparison/who-for/FAQ must be readable text (never image-only); carries own fdaDisclaimer in each claim-bearing module. */
  aplusContent: AplusContent;
  /** ~7 slots: (1) main white ≥85% fill; (2) value-prop infographic; (3) real regulated panel photo; (4) ingredient/feature story; (5) how-to-use; (6) trust/heritage; (7) lifestyle/outcome — no price/ratings/CTAs. */
  imagePlan: ImageSlot[];
  /** ~15 accurate Q&A pairs seeding AI-answer layer; mirror same facts as bullets + A+ FAQ; compliant; disclaimer on claim-bearing answers. */
  qa: QAItem[];
  state?: ElementState;
};

export type Failure = {
  checkId: string;
  field: string;
  context: string;
  fix: string;
};

export type GateResult = {
  pass: boolean;
  failures: Failure[];
};

export type ScorecardCriterion = {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  notes?: string;
};

export type Scorecard = {
  total: number;
  maxTotal: number;
  criteria: ScorecardCriterion[];
};

export type AuditGap = {
  field: string;
  current: string;
  proposed: string;
  why: string;
  severity: "low" | "medium" | "high";
};

/**
 * Audit output — worker ≠ checker: verified is set by the audit module,
 * not the generator, as exactly gateResult.pass.
 */
export type Audit = {
  scorecard: Scorecard;
  gaps: AuditGap[];
  gateResult: GateResult;
  /** === gateResult.pass; export-final unlocked only when true. */
  verified: boolean;
};
