import { detectCategory } from "@/lib/knowledge/detectCategory";
import { loadPack } from "@/lib/knowledge/loadPack";
import type { KnowledgePackId, ListingSnapshot, OptimizedListing } from "@/lib/types";
import { assembleOptimizedListing } from "@/lib/engine/assemble";
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

export type OptimizeOptions = {
  snapshot: ListingSnapshot;
  packId?: KnowledgePackId;
  llm?: LlmClient;
  onProgress?: (event: OptimizeProgress) => void;
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

/** Generate an OptimizedListing draft from a snapshot and knowledge pack. */
export async function optimize(options: OptimizeOptions): Promise<OptimizedListing> {
  const { snapshot, onProgress } = options;
  const detection = detectCategory(snapshot);
  const packId = options.packId ?? detection.packId;
  const pack = loadPack(packId);
  const subcategory = detection.subcategory;
  const facts = buildFacts(snapshot);
  const llm = options.llm ?? createAnthropicClient();

  const titlePrompt = buildTitlePrompt(snapshot, pack, subcategory);
  const title = await runGroup<TitleGroupResult>(
    "title",
    llm,
    titlePrompt.system,
    titlePrompt.user,
    onProgress,
  );

  const productName = title.productName;

  const bulletsPrompt = buildBulletsPrompt(snapshot, pack, subcategory, productName);
  const bullets = await runGroup<BulletsGroupResult>(
    "bullets",
    llm,
    bulletsPrompt.system,
    bulletsPrompt.user,
    onProgress,
  );

  const descriptionPrompt = buildDescriptionPrompt(
    snapshot,
    pack,
    subcategory,
    productName,
  );
  const description = await runGroup<DescriptionGroupResult>(
    "description",
    llm,
    descriptionPrompt.system,
    descriptionPrompt.user,
    onProgress,
  );

  const backendPrompt = buildBackendPrompt(snapshot, pack, subcategory, title.title);
  const backend = await runGroup<BackendGroupResult>(
    "backend",
    llm,
    backendPrompt.system,
    backendPrompt.user,
    onProgress,
  );

  const attributesPrompt = buildAttributesPrompt(snapshot, pack, subcategory, facts);
  const attributes = await runGroup<AttributesGroupResult>(
    "attributes",
    llm,
    attributesPrompt.system,
    attributesPrompt.user,
    onProgress,
  );

  const aplusPrompt = buildAplusPrompt(snapshot, pack, subcategory, productName);
  const aplus = await runGroup<AplusGroupResult>(
    "aplus",
    llm,
    aplusPrompt.system,
    aplusPrompt.user,
    onProgress,
  );

  const imagesPrompt = buildImagesPrompt(snapshot, pack);
  const images = await runGroup<ImagesGroupResult>(
    "images",
    llm,
    imagesPrompt.system,
    imagesPrompt.user,
    onProgress,
  );

  const qaPrompt = buildQaPrompt(snapshot, pack, subcategory, productName);
  const qa = await runGroup<QaGroupResult>(
    "qa",
    llm,
    qaPrompt.system,
    qaPrompt.user,
    onProgress,
  );

  onProgress?.({ step: "assemble", status: "started" });
  const listing = assembleOptimizedListing(pack, facts, {
    title,
    bullets,
    description,
    backend,
    attributes,
    aplus,
    images,
    qa,
  });
  onProgress?.({ step: "assemble", status: "completed" });

  return listing;
}
