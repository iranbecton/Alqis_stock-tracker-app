import type { AIWordingProvider } from "@/lib/ai/providers/types";
import { openAIWordingProvider } from "@/lib/ai/providers/openai";
import { structuredWordingProvider } from "@/lib/ai/providers/structured";

export function getAIWordingProvider(): AIWordingProvider {
  if (process.env.USE_AI_WORDING === "false") {
    return structuredWordingProvider;
  }

  const provider = (process.env.AI_WORDING_PROVIDER ?? "structured").toLowerCase();

  if (provider === "structured") {
    return structuredWordingProvider;
  }

  if (provider === "openai") {
    return openAIWordingProvider;
  }

  if (provider === "anthropic") {
    throw new Error(
      "AI_WORDING_PROVIDER=anthropic is reserved for future Claude support."
    );
  }

  throw new Error(
    `Unknown AI_WORDING_PROVIDER "${provider}". Supported providers: structured, openai.`
  );
}

export function getStructuredWordingProvider(): AIWordingProvider {
  return structuredWordingProvider;
}
