import {
  StockDetailPage,
  type StockDetailMarketData,
} from "@/components/stock-detail/stock-detail-page";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/layout";
import type {
  ChartPoint,
  ChartRange,
  CompanyProfile,
  StockNewsItem,
  StockQuote,
} from "@/lib/market-data/types";
import type { WhyMovingResponse } from "@/lib/ai/types";
import type {
  AIWordingFailureReason,
  AIWordingOutput,
  AIWordingRouteResponse,
  AIWordingStatus,
  SupportedAIWordingProvider,
} from "@/lib/ai/providers/types";
import { isValidTicker, normalizeTicker } from "@/lib/market-data/validation";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import { evaluateStockDataHealth } from "@/lib/stocks/stock-data-health";
import {
  type StockExplanationRow,
  toExplanationHistoryItem,
} from "@/lib/explanations/types";
import {
  type DemoStock,
  demoStocks,
  getDemoStockBySymbol,
} from "@/lib/stocks/demo-stocks";
import { getStockUniverseItem } from "@/lib/stocks/stock-universe";

type StockPageProps = {
  params: Promise<{
    ticker: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function StockPage({ params }: StockPageProps) {
  const { ticker } = await params;
  const symbol = normalizeTicker(ticker);

  if (!hasSupabaseEnv()) {
    redirect(
      "/login?error=Supabase%20environment%20variables%20are%20required%20before%20opening%20stock%20intelligence."
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/stocks/${encodeURIComponent(symbol)}`);
  }

  if (!isValidTicker(symbol)) {
    return <TickerNotFound ticker={ticker} />;
  }

  const [marketData, explanation, isWatchlisted, recentReads, preferences] = await Promise.all([
    getStockMarketData(symbol),
    getWhyMovingExplanation(symbol, "1D"),
    getWatchlistStatus(supabase, user.id, symbol),
    getTickerRecentReads(supabase, user.id, symbol),
    getUserPreferences(supabase, user.id),
  ]);
  const demoStock = getDemoStockBySymbol(symbol);
  const stock =
    demoStock ??
    createStockFromLiveData(symbol, marketData) ??
    createStockFromUniverse(symbol, marketData);

  if (!stock) {
    return <TickerNotFound ticker={ticker} />;
  }

  return (
    <StockDetailPage
      stock={stock}
      marketData={marketData}
      explanation={explanation?.structuredExplanation}
      aiWording={explanation?.aiWording}
      aiWordingStatus={explanation?.aiWordingStatus}
      aiWordingProvider={explanation?.aiWordingProvider}
      aiWordingFailureReason={explanation?.aiWordingFailureReason}
      isWatchlisted={isWatchlisted}
      recentReads={recentReads}
      defaultChartRange={preferences.defaultChartRange}
    />
  );
}

type ApiResult<T> = {
  data?: T;
  error?: string;
};

type QuoteApiResponse = StockQuote & {
  companyProfile?: CompanyProfile | null;
};

type ChartApiResponse = {
  symbol: string;
  range: ChartRange;
  provider?: string;
  points: ChartPoint[];
  status:
    | "ok"
    | "empty"
    | "provider_access_error"
    | "provider_error"
    | "rate_limited";
  fallback?: "demo-chart-structure" | null;
  providerAccessError?: boolean;
  providerRateLimited?: boolean;
  providerStatus?: number;
  providerMessage?: string;
  error?: string;
};

type NewsApiResponse = {
  symbol: string;
  items: StockNewsItem[];
  status: "ok" | "empty";
  error?: string;
};

async function getStockMarketData(symbol: string): Promise<StockDetailMarketData> {
  const [quoteResult, chart1D, chart5D, chart1M, newsResult] = await Promise.all([
    fetchInternalApi<QuoteApiResponse>(`/api/stocks/${symbol}/quote`),
    fetchInternalApi<ChartApiResponse>(`/api/stocks/${symbol}/chart?range=1D`),
    fetchInternalApi<ChartApiResponse>(`/api/stocks/${symbol}/chart?range=5D`),
    fetchInternalApi<ChartApiResponse>(`/api/stocks/${symbol}/chart?range=1M`),
    fetchInternalApi<NewsApiResponse>(`/api/stocks/${symbol}/news`),
  ]);
  const charts = {
    "1D": chart1D.data?.points ?? [],
    "5D": chart5D.data?.points ?? [],
    "1M": chart1M.data?.points ?? [],
  };
  const chartProvider =
    chart1D.data?.provider ?? chart5D.data?.provider ?? chart1M.data?.provider;
  const chartAccessError = [chart1D, chart5D, chart1M].some(
    (result) => result.data?.providerAccessError
  );
  const globalErrors = [quoteResult.error, newsResult.error].filter(Boolean);
  const hasAnyLiveData =
    Boolean(quoteResult.data) ||
    Object.values(charts).some((points) => points.length > 0) ||
    Boolean(newsResult.data?.items.length);
  const providerState = !hasAnyLiveData
    ? "fallback"
    : globalErrors.length > 0
      ? "empty"
      : "live";

  const chartRanges = {
    "1D": {
      provider: chart1D.data?.provider,
      status: chart1D.data?.status,
      fallback: chart1D.data?.fallback,
      providerStatus: chart1D.data?.providerStatus,
      providerMessage: chart1D.data?.providerMessage ?? chart1D.error,
    },
    "5D": {
      provider: chart5D.data?.provider,
      status: chart5D.data?.status,
      fallback: chart5D.data?.fallback,
      providerStatus: chart5D.data?.providerStatus,
      providerMessage: chart5D.data?.providerMessage ?? chart5D.error,
    },
    "1M": {
      provider: chart1M.data?.provider,
      status: chart1M.data?.status,
      fallback: chart1M.data?.fallback,
      providerStatus: chart1M.data?.providerStatus,
      providerMessage: chart1M.data?.providerMessage ?? chart1M.error,
    },
  };
  const dataHealth = evaluateStockDataHealth({
    quote: quoteResult.data,
    profile: quoteResult.data?.companyProfile ?? null,
    chartRanges,
    news: newsResult.data?.items ?? [],
    quoteError: quoteResult.error,
    newsError: newsResult.error,
    chartError: [chart1D.error, chart5D.error, chart1M.error].find(Boolean),
  });

  if (process.env.NODE_ENV === "development" && dataHealth.overallStatus !== "complete") {
    console.error("[ALQIS stock-page] Provider health degraded", {
      ticker: symbol,
      provider: "internal stock APIs",
      failedEndpoint: getFailedEndpoint({
        quoteError: quoteResult.error,
        chartErrors: [chart1D.error, chart5D.error, chart1M.error],
        newsError: newsResult.error,
      }),
      reason: dataHealth.missingFields.join(", ") || dataHealth.userFacingLabel,
      fallbackUsed: dataHealth.chartStatus === "fallback",
    });
  }

  return {
    quote: quoteResult.data,
    profile: quoteResult.data?.companyProfile ?? null,
    charts,
    chartRanges,
    news: newsResult.data?.items ?? [],
    providerState,
    providerMessage: getProviderMessage(providerState),
    chartProviderAccessError: chartAccessError,
    chartProvider,
    dataHealth,
  };
}

function getFailedEndpoint({
  quoteError,
  chartErrors,
  newsError,
}: {
  quoteError?: string;
  chartErrors: Array<string | undefined>;
  newsError?: string;
}) {
  if (quoteError) return "/api/stocks/[ticker]/quote";
  if (chartErrors.some(Boolean)) return "/api/stocks/[ticker]/chart";
  if (newsError) return "/api/stocks/[ticker]/news";
  return "health-check";
}

async function fetchInternalApi<T>(pathname: string): Promise<ApiResult<T>> {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return { error: "Unable to resolve internal API host." };
  }

  try {
    const response = await fetch(`${protocol}://${host}${pathname}`, {
      cache: "no-store",
      headers: {
        cookie: headerList.get("cookie") ?? "",
      },
    });
    const json = (await response.json()) as T & { error?: string };

    if (!response.ok) {
      return {
        data: json,
        error: json.error ?? `Internal API failed with ${response.status}.`,
      };
    }

    return { data: json };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to fetch internal stock API data.",
    };
  }
}

async function postInternalApi<T>(
  pathname: string,
  body: Record<string, string | boolean>
): Promise<ApiResult<T>> {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "http";

  if (!host) {
    return { error: "Unable to resolve internal API host." };
  }

  try {
    const response = await fetch(`${protocol}://${host}${pathname}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        cookie: headerList.get("cookie") ?? "",
      },
      body: JSON.stringify(body),
    });
    const json = (await response.json()) as T & { error?: string };

    if (!response.ok) {
      return {
        data: json,
        error: json.error ?? `Internal API failed with ${response.status}.`,
      };
    }

    return { data: json };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to fetch internal explanation API data.",
    };
  }
}

async function getWhyMovingExplanation(
  ticker: string,
  timeframe: ChartRange
) {
  type ExplainApiResponse = WhyMovingResponse | AIWordingRouteResponse;
  const result = await postInternalApi<ExplainApiResponse>(
    "/api/explain/why-moving",
    {
      ticker,
      timeframe,
      useAIWording: true,
    }
  );

  if (!result.data) {
    return undefined;
  }

  if ("structuredExplanation" in result.data) {
    return result.data;
  }

  return {
    structuredExplanation: result.data,
    aiWordingStatus: "not_requested" as AIWordingStatus,
    aiWordingProvider: undefined as SupportedAIWordingProvider | undefined,
    aiWording: undefined as AIWordingOutput | undefined,
    aiWordingFailureReason: undefined as AIWordingFailureReason | undefined,
  };
}

async function getWatchlistStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  ticker: string
) {
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("ticker")
    .eq("user_id", userId)
    .eq("ticker", ticker)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS watchlist] Status lookup failed", { error, ticker });
    }

    return false;
  }

  return Boolean(data);
}

async function getTickerRecentReads(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  ticker: string
) {
  const { data, error } = await supabase
    .from("stock_explanations")
    .select(
      "id,ticker,company_name,timeframe,summary,confidence_score,confidence_band,confidence_label,source_count,key_factors,counterevidence,generated_at,created_at"
    )
    .eq("user_id", userId)
    .eq("ticker", ticker)
    .order("created_at", { ascending: false })
    .limit(3);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS explanations] Ticker history load failed", {
        ticker,
        error,
      });
    }

    return [];
  }

  return ((data ?? []) as StockExplanationRow[]).map(toExplanationHistoryItem);
}

function getProviderMessage(providerState: StockDetailMarketData["providerState"]) {
  if (providerState === "live") {
    return undefined;
  }

  if (providerState === "fallback") {
    return "Market data partially available. Some provider inputs are unavailable.";
  }

  return "Market data partially available.";
}

function createStockFromLiveData(
  symbol: string,
  marketData: StockDetailMarketData
): DemoStock | undefined {
  const quote = marketData.quote;

  if (!quote) {
    return undefined;
  }

  return {
    symbol,
    companyName: marketData.profile?.companyName || symbol,
    sector: marketData.profile?.sector || "Market data",
    price: quote.price,
    dailyChange: quote.change,
    dailyChangePercent: quote.changePercent,
    marketStatus: quote.marketStatus ? `Market ${quote.marketStatus}` : "Market delayed",
    statusDetail: "Finnhub quote data",
    chartData:
      marketData.charts?.["1D"]?.length
        ? marketData.charts["1D"].map((point) => ({
            label: new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(point.time)),
            value: point.close,
          }))
        : [
            { label: "Previous close", value: quote.previousClose || quote.price },
            { label: "Latest", value: quote.price },
          ],
    headline: `${symbol} is moving on live market data`,
    news:
      marketData.news?.[0]?.headline ||
      "Live quote data is available, but Finnhub did not return recent company news.",
    explanation:
      "ALQIS is showing live quote and chart data while the AI explanation endpoint remains intentionally deferred.",
  };
}

function createStockFromUniverse(
  symbol: string,
  marketData: StockDetailMarketData
): DemoStock | undefined {
  const universeItem = getStockUniverseItem(symbol);

  if (!universeItem) {
    return undefined;
  }

  const quote = marketData.quote;
  const price = quote?.price ?? 0;
  const dailyChange = quote?.change ?? 0;
  const dailyChangePercent = quote?.changePercent ?? 0;

  return {
    symbol,
    companyName: marketData.profile?.companyName || universeItem.companyName,
    sector: marketData.profile?.sector || universeItem.sector,
    price,
    dailyChange,
    dailyChangePercent,
    marketStatus: quote?.marketStatus
      ? `Market ${quote.marketStatus}`
      : "Market data partially available",
    statusDetail: quote ? "Finnhub quote data" : "Quote provider unavailable",
    chartData:
      marketData.charts?.["1D"]?.length
        ? marketData.charts["1D"].map((point) => ({
            label: new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(point.time)),
            value: point.close,
          }))
        : [
            { label: "Provider pending", value: price || 100 },
            { label: "Latest", value: price || 100 },
          ],
    headline: quote
      ? `${symbol} is showing available market data`
      : `${symbol} market data is partially available`,
    news: marketData.news?.[0]?.headline || "News context limited.",
    explanation:
      "ALQIS is showing available provider data and clear fallback labels where market inputs are incomplete.",
  };
}

function TickerNotFound({ ticker }: { ticker: string }) {
  const normalizedTicker = ticker.trim().toUpperCase();

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--background)_0%,#050b0f_100%)]">
      <PageContainer className="flex min-h-dvh items-center py-6 sm:py-10">
        <EmptyState
          variant="panel"
          icon={<SearchX className="h-5 w-5" />}
          title={`${normalizedTicker || "Ticker"} could not be resolved.`}
          description="ALQIS could not load live provider data for this ticker, and there is no local demo fallback for it. Try one of the demo tickers while provider coverage is still being hardened."
          action={
            <div className="grid w-full gap-3 sm:flex sm:flex-wrap">
              <Button asChild variant="primary" size="md" className="w-full sm:w-auto">
                <Link href="/dashboard">Back to dashboard</Link>
              </Button>
              {demoStocks.map((stock) => (
                <Button key={stock.symbol} asChild variant="secondary" size="md" className="w-full sm:w-auto">
                  <Link href={`/stocks/${stock.symbol}`}>{stock.symbol}</Link>
                </Button>
              ))}
            </div>
          }
          meta={`Available: ${demoStocks.map((stock) => stock.symbol).join(", ")}`}
          className="mx-auto max-w-2xl border-accent-ai/12 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_86%,var(--accent-ai)_8%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-secondary)_4%)_100%)]"
        />
      </PageContainer>
    </main>
  );
}
