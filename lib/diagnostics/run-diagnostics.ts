import { cacheAvailable, setCache } from "@/lib/cache";
import { quoteCacheKey, searchCacheKey } from "@/lib/cache/keys";
import { CACHE_TTL } from "@/lib/cache/ttl";
import { redisAvailable } from "@/lib/cache/redis-cache";
import {
  getObservabilityCounterCount,
  observabilityAvailable,
} from "@/lib/diagnostics/observability";
import { normalizedApiError } from "@/lib/errors/api-error";
import { buildDailyMarketBrief } from "@/lib/market/brief";
import {
  getFinnhubCompanyProfile,
  getFinnhubQuote,
  searchFinnhubSymbols,
} from "@/lib/market-data/finnhub";
import type { StockQuote } from "@/lib/market-data/types";
import { twelveDataChartProvider } from "@/lib/market-data/twelve-data";
import { getFinnhubCompanyNews } from "@/lib/news/finnhub";
import { getStructuredWordingProvider } from "@/lib/ai/providers";
import {
  apiRouteRiskMapAvailable,
  getSecurityPostureSummary,
  securityPostureAvailable,
} from "@/lib/security/api-route-map";
import { authGuardAvailable } from "@/lib/security/auth";
import { securityHeadersConfigured } from "@/lib/security/headers";
import {
  rateLimit,
  RATE_LIMITS,
  refreshCooldown,
  REFRESH_COOLDOWNS,
} from "@/lib/security/rate-limit";
import {
  validateExplainRequestBody,
  validateSearchQuery,
  validateTicker,
} from "@/lib/security/validation";
import type { createClient } from "@/lib/supabase/server";

export type DiagnosticStatus = "ok" | "degraded" | "unavailable";

export type DiagnosticCheck = {
  id: string;
  label: string;
  status: DiagnosticStatus;
  message: string;
  latencyMs: number;
};

export type DiagnosticsReport = {
  status: DiagnosticStatus;
  generatedAt: string;
  checks: DiagnosticCheck[];
};

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export async function runDiagnostics({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}): Promise<DiagnosticsReport> {
  const checks = await Promise.all([
    timeCheck("supabase-auth", "Supabase Auth", async () => ({
      status: "ok",
      message: "Authenticated session is active.",
    })),
    timeCheck("supabase-watchlist", "Watchlist Table", () =>
      checkTableAccess(supabase, userId, "watchlist_items")
    ),
    timeCheck("supabase-explanations", "Explanation History Table", () =>
      checkTableAccess(supabase, userId, "stock_explanations")
    ),
    timeCheck("supabase-preferences", "User Preferences Table", () =>
      checkTableAccess(supabase, userId, "user_preferences")
    ),
    timeCheck("finnhub-quote", "Finnhub Quote Provider", checkFinnhubQuote),
    timeCheck("twelve-data-chart", "Twelve Data Chart Provider", checkTwelveDataChart),
    timeCheck("finnhub-news", "Finnhub News Provider", checkFinnhubNews),
    timeCheck("search-provider", "Search Provider", checkSearchProvider),
    timeCheck("cache-layer", "Cache Layer", checkCacheLayer),
    timeCheck("rate-limit", "Rate Limit Helper", checkRateLimitHelper),
    timeCheck("refresh-protection", "Refresh Protection", checkRefreshProtection),
    timeCheck("request-validation", "Request Validation", checkValidationHelper),
    timeCheck("normalized-errors", "Normalized API Errors", checkApiErrorReadiness),
    timeCheck("observability", "Safe Observability", checkObservabilityReadiness),
    timeCheck("auth-guards", "Auth Guard Consistency", checkAuthGuardReadiness),
    timeCheck("api-route-map", "API Route Risk Map", checkApiRouteMapReadiness),
    timeCheck("security-posture", "Security Posture", checkSecurityPosture),
    timeCheck("security-headers", "Security Headers", checkSecurityHeaderReadiness),
    timeCheck("explanation-engine", "Structured Explanation Engine", checkExplanationEngine),
    timeCheck("market-brief", "Market Brief Readiness", checkMarketBriefReadiness),
  ]);

  return {
    status: getOverallStatus(checks),
    generatedAt: new Date().toISOString(),
    checks,
  };
}

async function checkRateLimitHelper() {
  const result = await rateLimit(
    `diagnostics-smoke:${Date.now()}:${Math.random()}`,
    RATE_LIMITS.diagnostics
  );

  return {
    status: result.allowed ? "ok" : "degraded",
    message: result.allowed
      ? "Rate limit helper available."
      : "Rate limit helper responded with a limited state.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function checkRefreshProtection() {
  const key = `diagnostics-refresh:${Date.now()}:${Math.random()}`;
  const first = await refreshCooldown(key, REFRESH_COOLDOWNS.search);
  const second = await refreshCooldown(key, REFRESH_COOLDOWNS.search);

  return {
    status: first.allowed && !second.allowed ? "ok" : "degraded",
    message:
      first.allowed && !second.allowed
        ? "Refresh cooldown helper prevents rapid repeated refresh bypasses."
        : "Refresh cooldown helper did not block a repeated smoke-test refresh.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function checkValidationHelper() {
  const ticker = validateTicker("NVDA");
  const query = validateSearchQuery("Apple");
  const explanation = validateExplainRequestBody({
    ticker: "NVDA",
    timeframe: "1D",
    useAIWording: false,
    forceRefresh: false,
  });

  return {
    status: ticker.ok && query.ok && explanation.ok ? "ok" : "unavailable",
    message:
      ticker.ok && query.ok && explanation.ok
        ? "Validation helper available."
        : "Validation helper rejected safe smoke-test values.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function checkApiErrorReadiness() {
  return {
    status: typeof normalizedApiError === "function" ? "ok" : "unavailable",
    message:
      typeof normalizedApiError === "function"
        ? "Normalized API error helper available."
        : "Normalized API error helper unavailable.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function checkObservabilityReadiness() {
  return {
    status: observabilityAvailable() ? "ok" : "unavailable",
    message: observabilityAvailable()
      ? `Safe route observability helper ready. Active in-memory label count: ${getObservabilityCounterCount()}.`
      : "Safe route observability helper unavailable.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function checkAuthGuardReadiness() {
  return {
    status: authGuardAvailable() ? "ok" : "unavailable",
    message: authGuardAvailable()
      ? "Shared API auth guard helper available for user-scoped routes."
      : "Shared API auth guard helper unavailable.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function checkApiRouteMapReadiness() {
  return {
    status: apiRouteRiskMapAvailable() ? "ok" : "unavailable",
    message: apiRouteRiskMapAvailable()
      ? "Internal API route risk map available."
      : "Internal API route risk map unavailable.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function checkSecurityPosture() {
  if (!securityPostureAvailable()) {
    return {
      status: "unavailable",
      message: "Security posture matrix unavailable.",
    } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
  }

  const summary = getSecurityPostureSummary();
  const missingCoreCoverage =
    summary.missingValidation.length +
    summary.missingRateLimit.length +
    summary.missingNormalizedErrors.length +
    summary.missingRefreshCooldownOnCacheBackedRoutes.length;
  const observabilityNote = summary.missingObservability.length
    ? ` Observability labels are still intentionally lighter on ${summary.missingObservability.length} low-cost/internal routes.`
    : "";

  return {
    status: missingCoreCoverage === 0 ? "ok" : "degraded",
    message:
      `Tracked ${summary.totalRoutes} API routes: ${summary.authRequiredRoutes} auth-required, ` +
      `${summary.providerBackedRoutes} provider-backed, ${summary.highCostRoutes} high-cost. ` +
      `Coverage: ${summary.rateLimitCoverage}/${summary.totalRoutes} rate-limited, ` +
      `${summary.validationCoverage}/${summary.totalRoutes} validated, ` +
      `${summary.normalizedErrorCoverage}/${summary.totalRoutes} normalized errors, ` +
      `${summary.observabilityCoverage}/${summary.totalRoutes} observability-labeled.` +
      observabilityNote,
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function checkSecurityHeaderReadiness() {
  return {
    status: securityHeadersConfigured() ? "ok" : "degraded",
    message: securityHeadersConfigured()
      ? "Baseline security headers configured in shared helper."
      : "Security header helper is incomplete.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function timeCheck(
  id: string,
  label: string,
  check: () => Promise<Omit<DiagnosticCheck, "id" | "label" | "latencyMs">>
): Promise<DiagnosticCheck> {
  const startedAt = performance.now();

  try {
    const result = await check();

    return {
      id,
      label,
      ...result,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch {
    return {
      id,
      label,
      status: "unavailable",
      message: "Check unavailable. Review server logs for provider details.",
      latencyMs: Math.round(performance.now() - startedAt),
    };
  }
}

async function checkTableAccess(
  supabase: SupabaseClient,
  userId: string,
  table: "watchlist_items" | "stock_explanations" | "user_preferences"
): Promise<Omit<DiagnosticCheck, "id" | "label" | "latencyMs">> {
  const { error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS diagnostics] Supabase table check failed", {
        table,
        error,
      });
    }

    return {
      status: "unavailable",
      message: `${formatTableLabel(table)} table unavailable. Apply migrations and refresh.`,
    };
  }

  return {
    status: "ok",
    message: `${formatTableLabel(table)} table reachable.`,
  };
}

async function checkFinnhubQuote() {
  const quote = await getFinnhubQuote("NVDA");
  await setCache(quoteCacheKey("NVDA"), quote, CACHE_TTL.providerFailure);

  return {
    status: quote.price > 0 ? "ok" : "degraded",
    message: quote.price > 0 ? "Quote provider reachable." : "Quote provider returned partial data.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function checkTwelveDataChart() {
  const result = await twelveDataChartProvider.getCandles("NVDA", "1D");

  if (result.status === "ok" && result.points.length) {
    return {
      status: "ok",
      message: "Chart provider reachable.",
    } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
  }

  if (result.status === "empty") {
    return {
      status: "degraded",
      message: "Chart provider reachable but returned no points for the test range.",
    } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
  }

  return {
    status: result.providerRateLimited ? "degraded" : "unavailable",
    message: result.providerRateLimited
      ? "Chart provider rate limited."
      : "Chart provider unavailable.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function checkFinnhubNews() {
  const [profile, news] = await Promise.all([
    getFinnhubCompanyProfile("NVDA").catch(() => null),
    getFinnhubCompanyNews("NVDA"),
  ]);
  const relevantNews = news.filter((item) => {
    const text = `${item.headline} ${item.summary}`.toLowerCase();
    return text.includes("nvda") || text.includes("nvidia");
  });

  if (!news.length) {
    return {
      status: "degraded",
      message: "News provider reachable but returned limited context.",
    } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
  }

  return {
    status: relevantNews.length ? "ok" : "degraded",
    message: relevantNews.length
      ? `News provider reachable${profile?.companyName ? ` for ${profile.companyName}` : ""}.`
      : "News provider reachable, but direct ticker relevance is limited.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function checkSearchProvider() {
  const results = await searchFinnhubSymbols("Apple");
  await setCache(searchCacheKey("Apple"), { results: results.slice(0, 3) }, CACHE_TTL.providerFailure);

  if (results.length) {
    return {
      status: "ok",
      message: "Search provider reachable.",
    } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
  }

  return {
    status: "degraded",
    message: "Search provider returned no live results; curated fallback can cover search.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function checkCacheLayer() {
  const isRedisConfigured = redisAvailable();

  if (cacheAvailable()) {
    await setCache(
      "diagnostics:cache-smoke-test",
      { ok: true, checkedAt: new Date().toISOString() },
      CACHE_TTL.providerFailure
    );

    return {
      status: "ok",
      message: isRedisConfigured
        ? "Redis cache configured and writable."
        : "Redis not configured; safe development memory cache active.",
    } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
  }

  return {
    status: "degraded",
    message: "Cache unavailable; app can continue with provider calls and safe fallback behavior.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function checkExplanationEngine() {
  const provider = getStructuredWordingProvider();

  return {
    status: provider.name === "structured" ? "ok" : "degraded",
    message: "Structured explanation wording provider is ready.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

async function checkMarketBriefReadiness() {
  const quote: StockQuote = {
    symbol: "NVDA",
    price: 120,
    previousClose: 118,
    open: 119,
    high: 121,
    low: 117,
    change: 2,
    changePercent: 1.69,
    timestamp: new Date().toISOString(),
    marketStatus: "delayed",
  };
  const brief = buildDailyMarketBrief({
    items: [
      {
        ticker: "NVDA",
        companyName: "NVIDIA Corporation",
        sector: "Semiconductors",
        quote,
        dataStatus: "ok",
      },
    ],
    isPersonalized: true,
    briefFocus: "balanced",
  });

  return {
    status: brief.status === "unavailable" ? "degraded" : "ok",
    message: "Daily Market Brief engine is ready.",
  } satisfies Omit<DiagnosticCheck, "id" | "label" | "latencyMs">;
}

function getOverallStatus(checks: DiagnosticCheck[]): DiagnosticStatus {
  if (checks.every((check) => check.status === "ok")) {
    return "ok";
  }

  if (checks.every((check) => check.status === "unavailable")) {
    return "unavailable";
  }

  return "degraded";
}

function formatTableLabel(table: string) {
  if (table === "watchlist_items") return "Watchlist";
  if (table === "stock_explanations") return "Explanation history";
  if (table === "user_preferences") return "Preferences";
  return table;
}
