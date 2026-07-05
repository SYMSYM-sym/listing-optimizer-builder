import { detectCategory } from "@/lib/knowledge/detectCategory";
import { loadPack } from "@/lib/knowledge/loadPack";
import type {
  Facts,
  KnowledgePack,
  KnowledgePackId,
  ListingSnapshot,
  OptimizedListing,
} from "@/lib/types";
import {
  assembleOptimizedListing,
  type OptimizeGroups,
} from "@/lib/engine/assemble";
import { buildFacts } from "@/lib/engine/facts";
import { createAnthropicClient, type LlmClient } from "@/lib/engine/llm";
import { buildAplusPrompt, type AplusGroupResult } from "@/lib/engine/prompts/aplus";
import {
  buildAttributesPrompt,
  type AttributesGroupResult,
} from "@/lib/engine/prompts/attributes";
import { buildBackendPrompt, type BackendGroupResult } from "@/lib/engine/prompts/backend";
import { buildBulletsPrompt, type BulletsGroupResult } from "@/lib/engine/prompts/bullets";
import {
  buildDescriptionPrompt,
  type DescriptionGroupResult,
} from "@/lib/engine/prompts/description";
import { buildImagesPrompt, type ImagesGroupResult } from "@/lib/engine/prompts/images";
import { buildQaPrompt, type QaGroupResult } from "@/lib/engine/prompts/qa";
import { buildTitlePrompt, type TitleGroupResult } from "@/lib/engine/prompts/title";

export type OptimizeProgress = {
  step: string;
  status: "started" | "completed" | "error";
  message?: string;
};

export type PromptGroup =
  | "title"
  | "bullets"
  | "description"
  | "backend"
  | "attributes"
  | "aplus"
  | "images"
  | "qa";

export type OptimizeOptions = {
  snapshot: ListingSnapshot;
  packId?: KnowledgePackId;
  llm?: LlmClient;
  onProgress?: (event: OptimizeProgress) => void;
};

export type OptimizeState = {
  pack: KnowledgePack;
  subcategory: string;
  facts: Facts;
  groups: OptimizeGroups;
  productName: string;
  titleForBackend: string;
};

async function runGroup<T>(
  step: string,
  llm: LlmClient,
  system: string,
  user: string,
  onProgress?: (event: OptimizeProgress) => void,
): Promise<T> {
  onProgress?.({ step, status: "started" });
  try {
    const result = await llm.completeJson<T>(system, user);
    onProgress?.({ step, status: "completed" });
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown LLM error";
    onProgress?.({ step, status: "error", message });
    throw error;
  }
}

async function generateGroup<T>(
  group: PromptGroup,
  options: {
    snapshot: ListingSnapshot;
    pack: KnowledgePack;
    subcategory: string;
    facts: Facts;
    productName: string;
    titleForBackend: string;
    llm: LlmClient;
    onProgress?: (event: OptimizeProgress) => void;
  },
): Promise<T> {
  const { snapshot, pack, subcategory, facts, productName, titleForBackend, llm, onProgress } =
    options;

  switch (group) {
    case "title": {
      const prompt = buildTitlePrompt(snapshot, pack, subcategory);
      return runGroup<TitleGroupResult>("title", llm, prompt.system, prompt.user, onProgress) as Promise<T>;
    }
    case "bullets": {
      const prompt = buildBulletsPrompt(snapshot, pack, subcategory, productName);
      return runGroup<BulletsGroupResult>("bullets", llm, prompt.system, prompt.user, onProgress) as Promise<T>;
    }
    case "description": {
      const prompt = buildDescriptionPrompt(snapshot, pack, subcategory, productName);
      return runGroup<DescriptionGroupResult>(
        "description",
        llm,
        prompt.system,
        prompt.user,
        onProgress,
      ) as Promise<T>;
    }
    case "backend": {
      const prompt = buildBackendPrompt(snapshot, pack, subcategory, titleForBackend);
      return runGroup<BackendGroupResult>("backend", llm, prompt.system, prompt.user, onProgress) as Promise<T>;
    }
    case "attributes": {
      const prompt = buildAttributesPrompt(snapshot, pack, subcategory, facts);
      return runGroup<AttributesGroupResult>(
        "attributes",
        llm,
        prompt.system,
        prompt.user,
        onProgress,
      ) as Promise<T>;
    }
    case "aplus": {
      const prompt = buildAplusPrompt(snapshot, pack, subcategory, productName);
      return runGroup<AplusGroupResult>("aplus", llm, prompt.system, prompt.user, onProgress) as Promise<T>;
    }
    case "images": {
      const prompt = buildImagesPrompt(snapshot, pack);
      return runGroup<ImagesGroupResult>("images", llm, prompt.system, prompt.user, onProgress) as Promise<T>;
    }
    case "qa": {
      const prompt = buildQaPrompt(snapshot, pack, subcategory, productName);
      return runGroup<QaGroupResult>("qa", llm, prompt.system, prompt.user, onProgress) as Promise<T>;
    }
  }
}

const ALL_GROUPS: PromptGroup[] = [
  "title",
  "bullets",
  "description",
  "backend",
  "attributes",
  "aplus",
  "images",
  "qa",
];

/** Full optimize pipeline — returns listing plus mutable state for repair regen. */
export async function runOptimizePipeline(
  options: OptimizeOptions,
): Promise<{ listing: OptimizedListing; state: OptimizeState }> {
  const { snapshot, onProgress } = options;
  const detection = detectCategory(snapshot);
  const packId = options.packId ?? detection.packId;
  const pack = loadPack(packId);
  const subcategory = detection.subcategory;
  const facts = buildFacts(snapshot);
  const llm = options.llm ?? createAnthropicClient();

  const groups = {} as OptimizeGroups;
  let productName = "";
  let titleForBackend = snapshot.title;

  for (const group of ALL_GROUPS) {
    if (group === "title") {
      groups.title = await generateGroup<TitleGroupResult>("title", {
        snapshot,
        pack,
        subcategory,
        facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
      productName = groups.title.productName;
      titleForBackend = groups.title.title;
    } else if (group === "bullets") {
      groups.bullets = await generateGroup<BulletsGroupResult>("bullets", {
        snapshot,
        pack,
        subcategory,
        facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
    } else if (group === "description") {
      groups.description = await generateGroup<DescriptionGroupResult>("description", {
        snapshot,
        pack,
        subcategory,
        facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
    } else if (group === "backend") {
      groups.backend = await generateGroup<BackendGroupResult>("backend", {
        snapshot,
        pack,
        subcategory,
        facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
    } else if (group === "attributes") {
      groups.attributes = await generateGroup<AttributesGroupResult>("attributes", {
        snapshot,
        pack,
        subcategory,
        facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
    } else if (group === "aplus") {
      groups.aplus = await generateGroup<AplusGroupResult>("aplus", {
        snapshot,
        pack,
        subcategory,
        facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
    } else if (group === "images") {
      groups.images = await generateGroup<ImagesGroupResult>("images", {
        snapshot,
        pack,
        subcategory,
        facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
    } else if (group === "qa") {
      groups.qa = await generateGroup<QaGroupResult>("qa", {
        snapshot,
        pack,
        subcategory,
        facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
    }
  }

  onProgress?.({ step: "assemble", status: "started" });
  const listing = assembleOptimizedListing(pack, facts, groups);
  onProgress?.({ step: "assemble", status: "completed" });

  return {
    listing,
    state: {
      pack,
      subcategory,
      facts,
      groups,
      productName,
      titleForBackend,
    },
  };
}

/** Regenerate only the specified prompt groups; reuses other group outputs. */
export async function regenerateOptimizeGroups(
  options: OptimizeOptions,
  state: OptimizeState,
  groupsToRegenerate: PromptGroup[],
): Promise<{ listing: OptimizedListing; state: OptimizeState }> {
  const { snapshot, onProgress } = options;
  const llm = options.llm ?? createAnthropicClient();
  const groups: OptimizeGroups = {
    title: state.groups.title,
    bullets: state.groups.bullets,
    description: state.groups.description,
    backend: state.groups.backend,
    attributes: state.groups.attributes,
    aplus: state.groups.aplus,
    images: state.groups.images,
    qa: state.groups.qa,
  };
  let { productName, titleForBackend } = state;
  const uniqueGroups = Array.from(new Set(groupsToRegenerate));

  if (uniqueGroups.includes("title")) {
    groups.title = await generateGroup<TitleGroupResult>("title", {
      snapshot,
      pack: state.pack,
      subcategory: state.subcategory,
      facts: state.facts,
      productName,
      titleForBackend,
      llm,
      onProgress,
    });
    productName = groups.title.productName;
    titleForBackend = groups.title.title;
  }

  for (const group of uniqueGroups) {
    if (group === "title") continue;

    if (group === "bullets") {
      groups.bullets = await generateGroup<BulletsGroupResult>("bullets", {
        snapshot,
        pack: state.pack,
        subcategory: state.subcategory,
        facts: state.facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
    } else if (group === "description") {
      groups.description = await generateGroup<DescriptionGroupResult>("description", {
        snapshot,
        pack: state.pack,
        subcategory: state.subcategory,
        facts: state.facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
    } else if (group === "backend") {
      groups.backend = await generateGroup<BackendGroupResult>("backend", {
        snapshot,
        pack: state.pack,
        subcategory: state.subcategory,
        facts: state.facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
    } else if (group === "attributes") {
      groups.attributes = await generateGroup<AttributesGroupResult>("attributes", {
        snapshot,
        pack: state.pack,
        subcategory: state.subcategory,
        facts: state.facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
    } else if (group === "aplus") {
      groups.aplus = await generateGroup<AplusGroupResult>("aplus", {
        snapshot,
        pack: state.pack,
        subcategory: state.subcategory,
        facts: state.facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
    } else if (group === "images") {
      groups.images = await generateGroup<ImagesGroupResult>("images", {
        snapshot,
        pack: state.pack,
        subcategory: state.subcategory,
        facts: state.facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
    } else if (group === "qa") {
      groups.qa = await generateGroup<QaGroupResult>("qa", {
        snapshot,
        pack: state.pack,
        subcategory: state.subcategory,
        facts: state.facts,
        productName,
        titleForBackend,
        llm,
        onProgress,
      });
    }
  }

  onProgress?.({ step: "assemble", status: "started" });
  const listing = assembleOptimizedListing(state.pack, state.facts, groups);
  onProgress?.({ step: "assemble", status: "completed" });

  return {
    listing,
    state: {
      ...state,
      groups,
      productName,
      titleForBackend,
    },
  };
}

/** Generate an OptimizedListing draft from a snapshot and knowledge pack. */
export async function optimize(options: OptimizeOptions): Promise<OptimizedListing> {
  const { listing } = await runOptimizePipeline(options);
  return listing;
}
