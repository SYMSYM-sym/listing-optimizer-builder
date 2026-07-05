import type {
  AttributeField,
  CompliancePack,
  KnowledgePack,
  KnowledgePackId,
  Principle,
} from "@/lib/types";
import rulesJson from "@/knowledge/rules.json";
import complianceSupplementsJson from "@/knowledge/compliance.supplements.json";
import attributeSchemaSupplementsJson from "@/knowledge/attribute-schema.supplements.json";
import principlesJson from "@/knowledge/principles.json";

type ComplianceSource = {
  disclaimer: string;
  diseaseVerbs: string[];
  diseaseNounsBySubcategory: Record<string, string[]>;
  allergenRules: CompliancePack["allergenRules"];
  superlativeBans: string[];
  fictionPhrases: string[];
};

const rules = rulesJson as Record<string, unknown>;
const principles = principlesJson as Principle[];
const attributeSchema = attributeSchemaSupplementsJson as AttributeField[];
const complianceSource = complianceSupplementsJson as ComplianceSource;

function buildSupplementsCompliance(): CompliancePack {
  return {
    canonicalDisclaimer: complianceSource.disclaimer,
    diseaseVerbs: complianceSource.diseaseVerbs,
    diseaseNounsBySubcategory: complianceSource.diseaseNounsBySubcategory,
    allergenRules: complianceSource.allergenRules,
    superlativeBans: complianceSource.superlativeBans,
    fictionPhrases: complianceSource.fictionPhrases,
  };
}

const EMPTY_GENERIC_COMPLIANCE: CompliancePack = {
  canonicalDisclaimer: "",
  diseaseVerbs: [],
  diseaseNounsBySubcategory: {},
  allergenRules: [],
  superlativeBans: [],
  fictionPhrases: [],
};

/** Assemble a KnowledgePack from compiled JSON in knowledge/. */
export function loadPack(id: KnowledgePackId): KnowledgePack {
  if (id === "supplements") {
    return {
      id: "supplements",
      rules,
      compliancePack: buildSupplementsCompliance(),
      attributeSchema,
      principles,
    };
  }

  if (id === "generic") {
    return {
      id: "generic",
      rules,
      compliancePack: EMPTY_GENERIC_COMPLIANCE,
      attributeSchema: [],
      principles,
    };
  }

  throw new Error(`Unknown knowledge pack: ${id}`);
}

/** Expose raw rules for limit-assertion tests and gate helpers. */
export function getRules(): Record<string, unknown> {
  return rules;
}
