export type IngestProvider = "rainforest" | "firecrawl" | "paste";

export type AppEnv = {
  anthropicApiKey: string;
  anthropicModel: string;
  ingestProvider: IngestProvider;
  rainforestApiKey?: string;
  firecrawlApiKey?: string;
  maxRepairIterations: number;
};

function requireString(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

/**
 * Load and validate env at runtime (route handlers / server actions).
 * Intentionally not called at module scope so `next build` succeeds without secrets.
 */
export function getEnv(): AppEnv {
  const ingestProvider = (process.env.INGEST_PROVIDER?.trim() ||
    "rainforest") as IngestProvider;

  if (!["rainforest", "firecrawl", "paste"].includes(ingestProvider)) {
    throw new Error(
      `Invalid INGEST_PROVIDER "${ingestProvider}" — use rainforest, firecrawl, or paste`,
    );
  }

  const env: AppEnv = {
    anthropicApiKey: requireString(
      "ANTHROPIC_API_KEY",
      process.env.ANTHROPIC_API_KEY,
    ),
    anthropicModel:
      process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-4-6",
    ingestProvider,
    maxRepairIterations: Number.parseInt(
      process.env.MAX_REPAIR_ITERATIONS?.trim() || "3",
      10,
    ),
  };

  if (ingestProvider === "rainforest") {
    env.rainforestApiKey = requireString(
      "RAINFOREST_API_KEY",
      process.env.RAINFOREST_API_KEY,
    );
  }

  if (ingestProvider === "firecrawl") {
    env.firecrawlApiKey = requireString(
      "FIRECRAWL_API_KEY",
      process.env.FIRECRAWL_API_KEY,
    );
  }

  return env;
}
