import Anthropic from "@anthropic-ai/sdk";
import { getOptimizeEnv } from "@/lib/env";

export type LlmClient = {
  completeJson<T>(system: string, user: string): Promise<T>;
};

const TEMPERATURE = 0.2;

function extractJson(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return trimmed;
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  throw new Error("LLM response did not contain JSON.");
}

export function createAnthropicClient(): LlmClient {
  const env = getOptimizeEnv();

  const client = new Anthropic({ apiKey: env.anthropicApiKey });

  return {
    async completeJson<T>(system: string, user: string): Promise<T> {
      const response = await client.messages.create({
        model: env.anthropicModel,
        max_tokens: 4096,
        temperature: TEMPERATURE,
        system,
        messages: [{ role: "user", content: user }],
      });

      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error("LLM returned no text content.");
      }

      return JSON.parse(extractJson(textBlock.text)) as T;
    },
  };
}

/** Deterministic mock for unit tests — returns responses in call order. */
export function createMockLlmClient(responses: unknown[]): LlmClient {
  let index = 0;
  return {
    async completeJson<T>(): Promise<T> {
      const response = responses[Math.min(index, responses.length - 1)];
      index += 1;
      return response as T;
    },
  };
}
