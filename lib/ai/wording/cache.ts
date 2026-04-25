import { createHash } from "crypto";
import type {
  AIWordingInput,
  AIWordingOutput,
} from "@/lib/ai/providers/types";
import type { WhyMovingResponse } from "@/lib/ai/types";

const AI_WORDING_CACHE_TTL_MS = 12 * 60_000;

const cache = new Map<
  string,
  {
    expiresAt: number;
    output: AIWordingOutput;
  }
>();

// TODO: Replace this process-local cache with Redis when ALQIS runs across multiple instances.
export function createAIWordingCacheKey(
  input: AIWordingInput,
  structuredExplanation: WhyMovingResponse
) {
  const hash = createHash("sha256")
    .update(JSON.stringify(structuredExplanation))
    .digest("hex")
    .slice(0, 24);

  return `${input.ticker}:${input.timeframe}:${hash}`;
}

export function getCachedAIWording(key: string) {
  const cached = cache.get(key);

  if (!cached) {
    return undefined;
  }

  if (cached.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }

  return cached.output;
}

export function setCachedAIWording(key: string, output: AIWordingOutput) {
  cache.set(key, {
    output,
    expiresAt: Date.now() + AI_WORDING_CACHE_TTL_MS,
  });
}
