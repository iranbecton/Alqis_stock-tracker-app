import type { AIWordingProvider } from "@/lib/ai/providers/types";
import { anthropicWordingProvider } from "@/lib/ai/providers/anthropic";
import { structuredWordingProvider } from "@/lib/ai/providers/structured";

export function getAIWordingProvider(): AIWordingProvider {
  if (process.env.USE_AI_WORDING === "false") {
    return structuredWordingProvider;
  }

  const provider = (process.env.AI_WORDING_PROVIDER ?? "structured").toLowerCase();

  if (provider === "structured") {
    return structuredWordingProvider;
  }

  if (provider === "anthropic") {
    return anthropicWordingProvider;
  }

  // Unknown provider - fall back to structured and log in development
  if (process.env.NODE_ENV === "development") {
    console.error(
      `[ALQIS] Unknown AI_WORDING_PROVIDER "${provider}". Falling back to structured.`
    );
  }

  return structuredWordingProvider;
}

export function getStructuredWordingProvider(): AIWordingProvider {
  return structuredWordingProvider;
}
