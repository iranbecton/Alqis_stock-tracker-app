import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { scoreCauses } from "@/lib/ai/cause-scoring";
import { scoreConfidence } from "@/lib/ai/confidence";
import { buildWhyMovingResponse } from "@/lib/ai/explanation-builder";
import { tagNewsItems } from "@/lib/ai/event-tagging";
import {
  getAIWordingProvider,
  getStructuredWordingProvider,
} from "@/lib/ai/providers";
import type {
  AIWordingFailureReason,
  AIWordingInput,
  AIWordingProvider,
  AIWordingRouteResponse,
  AIWordingStatus,
} from "@/lib/ai/providers/types";
import type {
  ChartApiPayload,
  NewsApiPayload,
  QuoteApiPayload,
  WhyMovingInputs,
  WhyMovingRequest,
  WhyMovingResponse,
} from "@/lib/ai/types";
import { validateWhyMovingResponse } from "@/lib/ai/validate";
import {
  createAIWordingCacheKey,
  getCachedAIWording,
  setCachedAIWording,
} from "@/lib/ai/wording/cache";
import { AI_WORDING_FORBIDDEN_TERMS } from "@/lib/ai/wording/prompt";
import { validateAIWordingOutput } from "@/lib/ai/wording/validate";
import { getCache, setCache, withCache } from "@/lib/cache";
import { explanationCacheKey, stableHash } from "@/lib/cache/keys";
import { CACHE_TTL } from "@/lib/cache/ttl";
import { saveExplanationHistory } from "@/lib/explanations/save-explanation";
import {
  isValidTicker,
  normalizeTicker,
  parseChartRange,
} from "@/lib/market-data/validation";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function parseRequestBody(request: Request): Promise<WhyMovingRequest | null> {
  try {
    const body = (await request.json()) as Partial<WhyMovingRequest>;
    const ticker = typeof body.ticker === "string" ? normalizeTicker(body.ticker) : "";
    const timeframe =
      typeof body.timeframe === "string" ? parseChartRange(body.timeframe) : null;

    if (!ticker || !timeframe) {
      return null;
    }

    return {
      ticker,
      timeframe,
      useAIWording: body.useAIWording === true,
      forceRefresh: body.forceRefresh === true,
    };
  } catch {
    return null;
  }
}

async function fetchInternalJson<T>(pathname: string): Promise<T | undefined> {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return undefined;
  }

  try {
    const response = await fetch(`${protocol}://${host}${pathname}`, {
      cache: "no-store",
      headers: {
        cookie: headerList.get("cookie") ?? "",
      },
    });
    const json = (await response.json()) as T;

    if (!response.ok && process.env.NODE_ENV === "development") {
      console.error("[ALQIS explain] Internal data endpoint returned fallback", {
        pathname,
        status: response.status,
        json,
      });
    }

    return json;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS explain] Internal data fetch failed", {
        pathname,
        error,
      });
    }

    return undefined;
  }
}

async function getWhyMovingInputs(
  request: WhyMovingRequest
): Promise<WhyMovingInputs> {
  const refreshParam = request.forceRefresh ? "?refresh=true" : "";
  const chartRefreshParam = request.forceRefresh ? "&refresh=true" : "";
  const [quote, chart, news] = await Promise.all([
    fetchInternalJson<QuoteApiPayload>(
      `/api/stocks/${request.ticker}/quote${refreshParam}`
    ),
    fetchInternalJson<ChartApiPayload>(
      `/api/stocks/${request.ticker}/chart?range=${request.timeframe}${chartRefreshParam}`
    ),
    fetchInternalJson<NewsApiPayload>(
      `/api/stocks/${request.ticker}/news${refreshParam}`
    ),
  ]);

  return {
    ticker: request.ticker,
    timeframe: request.timeframe,
    companyName: quote?.companyProfile?.companyName,
    sector: quote?.companyProfile?.sector,
    quote: quote && "price" in quote ? quote : undefined,
    chartPoints:
      chart?.status === "ok" && chart.fallback === null ? chart.points : [],
    chartStatus: chart?.status,
    chartFallback: chart?.fallback,
    newsItems: tagNewsItems(news?.items ?? [], {
      ticker: request.ticker,
      companyName: quote?.companyProfile?.companyName,
    }),
  };
}

function getDirection(movePct: number): AIWordingInput["direction"] {
  if (movePct > 0.05) return "higher";
  if (movePct < -0.05) return "lower";
  return "flat";
}

function getAIChartStatus(inputs: WhyMovingInputs): AIWordingInput["chartStatus"] {
  if (inputs.chartStatus === "ok" && inputs.chartFallback === null && inputs.chartPoints.length) {
    return "ok";
  }

  if (inputs.chartFallback) {
    return "fallback";
  }

  return "unavailable";
}

function summarizeNewsRelevance(response: WhyMovingResponse) {
  const counts = response.keyFactors.reduce<Record<string, number>>((total, factor) => {
    const key = factor.newsRelevance ?? "unknown";
    total[key] = (total[key] ?? 0) + 1;
    return total;
  }, {});

  return Object.entries(counts)
    .map(([key, count]) => `${key}: ${count}`)
    .join(", ");
}

function buildAIWordingInput(
  inputs: WhyMovingInputs,
  response: WhyMovingResponse
): AIWordingInput {
  return {
    ticker: response.ticker,
    companyName: inputs.companyName,
    direction: getDirection(response.movePct),
    movePct: response.movePct,
    chartMovePct: response.chartMovePct,
    timeframe: response.timeframe,
    confidence: response.confidence,
    topDrivers: response.keyFactors.slice(0, 3),
    counterevidence: response.counterEvidence,
    sourceCount: response.sourceCount,
    chartStatus: getAIChartStatus(inputs),
    newsRelevanceSummary: summarizeNewsRelevance(response),
    forbiddenTerms: AI_WORDING_FORBIDDEN_TERMS,
  };
}

async function getAIWordingResponse({
  inputs,
  structuredExplanation,
}: {
  inputs: WhyMovingInputs;
  structuredExplanation: WhyMovingResponse;
}): Promise<
  Pick<
    AIWordingRouteResponse,
    | "aiWording"
    | "aiWordingStatus"
    | "aiWordingFailureReason"
    | "aiWordingProvider"
  >
> {
  const wordingInput = buildAIWordingInput(inputs, structuredExplanation);
  const provider = getAIWordingProvider();
  const cacheKey = `${provider.name}:${createAIWordingCacheKey(
    wordingInput,
    structuredExplanation
  )}`;
  const cached = getCachedAIWording(cacheKey);

  if (cached) {
    return {
      aiWording: cached,
      aiWordingStatus: "ok",
      aiWordingProvider: provider.name,
    };
  }

  logAIWordingFailure("cache_miss", {
    ticker: wordingInput.ticker,
    timeframe: wordingInput.timeframe,
    cacheKey,
  });

  if (provider.name === "structured") {
    return generateStructuredWording({
      wordingInput,
      cacheKey,
    });
  }

  try {
    const aiWording = await provider.generateWording(wordingInput);
    const validation = validateAIWordingOutput(aiWording, wordingInput);

    if (!validation.isValid) {
      logAIWordingFailure("validation_failed", {
        warnings: validation.warnings,
        aiWording,
      });

      return generateStructuredWording({
        wordingInput,
        cacheKey: `structured:${createAIWordingCacheKey(
          wordingInput,
          structuredExplanation
        )}`,
        fallbackReason: "validation_failed",
      });
    }

    setCachedAIWording(cacheKey, aiWording);

    return {
      aiWording,
      aiWordingStatus: "ok",
      aiWordingProvider: provider.name,
    };
  } catch (error) {
    const reason = getAIWordingFailureReason(error);

    logAIWordingFailure(reason, {
      error,
    });

    return generateStructuredWording({
      wordingInput,
      cacheKey: `structured:${createAIWordingCacheKey(
        wordingInput,
        structuredExplanation
      )}`,
      fallbackReason: reason,
    });
  }
}

async function generateStructuredWording({
  wordingInput,
  cacheKey,
  fallbackReason,
}: {
  wordingInput: AIWordingInput;
  cacheKey: string;
  fallbackReason?: AIWordingFailureReason;
}): Promise<
  Pick<
    AIWordingRouteResponse,
    | "aiWording"
    | "aiWordingStatus"
    | "aiWordingFailureReason"
    | "aiWordingProvider"
  >
> {
  const cached = getCachedAIWording(cacheKey);

  if (cached) {
    return {
      aiWording: cached,
      aiWordingStatus: "ok",
      aiWordingProvider: "structured",
      aiWordingFailureReason: fallbackReason,
    };
  }

  const provider = getStructuredWordingProvider() as AIWordingProvider;
  const structuredWording = await provider.generateWording(wordingInput);
  const validation = validateAIWordingOutput(structuredWording, wordingInput);

  if (!validation.isValid) {
    logAIWordingFailure("validation_failed", {
      provider: provider.name,
      warnings: validation.warnings,
      aiWording: structuredWording,
    });

    return {
      aiWordingStatus: "validation_failed",
      aiWordingProvider: provider.name,
      aiWordingFailureReason: "validation_failed",
    };
  }

  setCachedAIWording(cacheKey, structuredWording);

  return {
    aiWording: structuredWording,
    aiWordingStatus: "ok",
    aiWordingProvider: provider.name,
    aiWordingFailureReason: fallbackReason,
  };
}

function getAIWordingFailureReason(error: unknown): AIWordingFailureReason {
  if (error instanceof SyntaxError) {
    return "schema_error";
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("missing openai_api_key")) {
      return "missing OPENAI_API_KEY";
    }

    if (
      message.includes("insufficient_quota") ||
      message.includes("insufficient quota") ||
      message.includes("quota")
    ) {
      return "insufficient_quota";
    }
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    (error as { status?: unknown }).status === 429
  ) {
    return "insufficient_quota";
  }

  return "provider_error";
}

function logAIWordingFailure(
  reason: AIWordingFailureReason,
  details: Record<string, unknown>
) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.error("[ALQIS explain] AI wording failure", {
    reason,
    ...details,
  });
}

function createAIWordingRouteResponse(
  structuredExplanation: WhyMovingResponse,
  aiWordingStatus: AIWordingStatus,
  aiWording?: AIWordingRouteResponse["aiWording"],
  aiWordingProvider?: AIWordingRouteResponse["aiWordingProvider"],
  aiWordingFailureReason?: AIWordingFailureReason
): AIWordingRouteResponse {
  return {
    structuredExplanation,
    aiWording,
    aiWordingStatus,
    aiWordingProvider,
    aiWordingFailureReason,
  };
}

function createEvidenceHash(inputs: WhyMovingInputs) {
  return stableHash({
    ticker: inputs.ticker,
    timeframe: inputs.timeframe,
    quote: inputs.quote
      ? {
          price: inputs.quote.price,
          change: inputs.quote.change,
          changePercent: inputs.quote.changePercent,
          timestamp: inputs.quote.timestamp,
        }
      : null,
    chartStatus: inputs.chartStatus,
    chartFallback: inputs.chartFallback,
    chartPoints: inputs.chartPoints.map((point) => ({
      time: point.time,
      close: point.close,
      volume: point.volume,
    })),
    newsItems: inputs.newsItems.map((item) => ({
      id: item.id,
      headline: item.headline,
      publishedAt: item.publishedAt,
      tags: item.tags,
      relevance: item.relevance,
    })),
  });
}

async function buildValidatedExplanation(inputs: WhyMovingInputs) {
  const causes = scoreCauses(inputs);
  const confidence = scoreConfidence(inputs, causes);
  const response = buildWhyMovingResponse({ inputs, causes, confidence });
  const validation = validateWhyMovingResponse(response);

  if (!validation.isValid) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS explain] Explanation validation failed", {
        warnings: validation.warnings,
        response,
      });
    }

    throw new Error("Explanation response failed validation.");
  }

  return response;
}

export async function POST(request: Request) {
  const parsedRequest = await parseRequestBody(request);

  if (!parsedRequest) {
    return NextResponse.json(
      {
        error:
          "Request body must include ticker and timeframe. Supported timeframes: 1D, 5D, 1M.",
      },
      { status: 400 }
    );
  }

  if (!isValidTicker(parsedRequest.ticker)) {
    return NextResponse.json({ error: "Invalid ticker symbol." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const inputs = await getWhyMovingInputs(parsedRequest);
  const evidenceHash = createEvidenceHash(inputs);
  const explainKey = explanationCacheKey(
    parsedRequest.ticker,
    parsedRequest.timeframe,
    evidenceHash
  );
  let response: WhyMovingResponse;
  let explanationMeta: Awaited<
    ReturnType<typeof withCache<WhyMovingResponse>>
  >["meta"];

  try {
    const cachedExplanation = await withCache(
      explainKey,
      CACHE_TTL.explanation,
      () => buildValidatedExplanation(inputs),
      { forceRefresh: parsedRequest.forceRefresh }
    );
    response = cachedExplanation.data;
    explanationMeta = cachedExplanation.meta;
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Explanation response failed validation.",
      },
      { status: 500 }
    );
  }

  const historyResult = await saveExplanationHistory({
    supabase,
    user,
    explanation: response,
    inputs,
    explanationHash: evidenceHash,
  });

  if (!parsedRequest.useAIWording) {
    return NextResponse.json({
      ...response,
      ...explanationMeta,
      savedExplanationId: historyResult.savedExplanationId,
      explanationHistoryStatus: historyResult.status,
    });
  }

  const wordingCacheKey = `${explainKey}:wording:${
    process.env.AI_WORDING_PROVIDER ?? "structured"
  }`;

  if (!parsedRequest.forceRefresh) {
    const cachedRouteResponse =
      await getCache<AIWordingRouteResponse>(wordingCacheKey);

    if (cachedRouteResponse) {
      return NextResponse.json({
        ...cachedRouteResponse,
        cacheStatus: "hit",
        savedExplanationId: historyResult.savedExplanationId,
        explanationHistoryStatus: historyResult.status,
      });
    }
  }

  const aiWordingResult = await getAIWordingResponse({
    inputs,
    structuredExplanation: response,
  });

  const routeResponse = createAIWordingRouteResponse(
    response,
    aiWordingResult.aiWordingStatus,
    aiWordingResult.aiWording,
    aiWordingResult.aiWordingProvider,
    aiWordingResult.aiWordingFailureReason
  );

  if (routeResponse.aiWordingStatus === "ok") {
    await setCache(wordingCacheKey, routeResponse, CACHE_TTL.explanation);
  }

  return NextResponse.json({
    ...routeResponse,
    ...explanationMeta,
    savedExplanationId: historyResult.savedExplanationId,
    explanationHistoryStatus: historyResult.status,
  });
}
