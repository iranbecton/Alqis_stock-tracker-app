import type { ReactNode } from "react";
import { AlertTriangle, Newspaper, Radar, Scale, TrendingUp } from "lucide-react";
import { SparklineChart } from "@/components/alqis/price-line-chart";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import { ExplainThis } from "@/components/education/explain-this";
import { RecentReadsSection } from "@/components/explanations/recent-reads-section";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Delta } from "@/components/ui/delta";
import { Disclaimer } from "@/components/ui/disclaimer";
import { PageContainer, PageSection, PageShell } from "@/components/ui/layout";
import { SectionHeader } from "@/components/ui/section-header";
import { stockDetailDemoData } from "@/lib/stock-detail-demo-data";
import type {
  ChartPoint as MarketChartPoint,
  ChartRange as MarketChartRange,
  CompanyProfile,
  StockNewsItem,
  StockQuote,
} from "@/lib/market-data/types";
import type { WhyMovingResponse } from "@/lib/ai/types";
import type {
  AIWordingFailureReason,
  AIWordingOutput,
  AIWordingStatus,
  SupportedAIWordingProvider,
} from "@/lib/ai/providers/types";
import type { DemoStock } from "@/lib/stocks/demo-stocks";
import { getDemoStockBySymbol } from "@/lib/stocks/demo-stocks";
import type { ExplanationHistoryItem } from "@/lib/explanations/types";
import type { StockDataHealth } from "@/lib/stocks/stock-data-health";
import { StockChartCard } from "./stock-chart-card";
import { StockHeroHeader } from "./stock-hero-header";
import { StockWhyCard } from "./stock-why-card";

type StockDetailCompanyData = typeof stockDetailDemoData.company & {
  quoteStats?: Array<{
    label: string;
    value: string;
  }>;
  quoteSourceLabel?: string;
  priceReadLabel?: string;
  quoteStatusDetail?: string;
};

type StockDetailExplanationData = typeof stockDetailDemoData.explanation & {
  wordingNote?: string;
  wordingDetail?: string;
  plainEnglishRead?: string;
  aiWhyItMatters?: string[];
};

type StockDetailData = Omit<typeof stockDetailDemoData, "company" | "explanation"> & {
  company: StockDetailCompanyData;
  explanation: StockDetailExplanationData;
};
type StockDetailChartRange = keyof StockDetailData["chartRanges"];

export type StockDetailMarketData = {
  quote?: StockQuote;
  profile?: CompanyProfile | null;
  charts?: Partial<Record<MarketChartRange, MarketChartPoint[]>>;
  chartRanges?: Partial<
    Record<
      MarketChartRange,
      {
        provider?: string;
        status?:
          | "ok"
          | "empty"
          | "provider_access_error"
          | "provider_error"
          | "rate_limited";
        fallback?: "demo-chart-structure" | null;
        providerStatus?: number;
        providerMessage?: string;
      }
    >
  >;
  news?: StockNewsItem[];
  providerState?: "live" | "fallback" | "empty";
  providerMessage?: string;
  chartProviderAccessError?: boolean;
  chartProvider?: string;
  dataHealth?: StockDataHealth;
};

type StockDetailPageProps = {
  stock?: DemoStock;
  marketData?: StockDetailMarketData;
  explanation?: WhyMovingResponse;
  aiWording?: AIWordingOutput;
  aiWordingStatus?: AIWordingStatus;
  aiWordingProvider?: SupportedAIWordingProvider;
  aiWordingFailureReason?: AIWordingFailureReason;
  isWatchlisted?: boolean;
  recentReads?: ExplanationHistoryItem[];
};

export function StockDetailPage({
  stock,
  marketData,
  explanation,
  aiWording,
  aiWordingStatus,
  aiWordingProvider,
  aiWordingFailureReason,
  isWatchlisted = false,
  recentReads = [],
}: StockDetailPageProps) {
  const data = stock
    ? createStockDetailData(
        stock,
        marketData,
        explanation,
        aiWording,
        aiWordingStatus,
        aiWordingProvider,
        aiWordingFailureReason
      )
    : stockDetailDemoData;
  const shouldShowProviderNotice =
    marketData?.providerState === "fallback" || marketData?.providerState === "empty";

  return (
    <main className="min-h-dvh">
      <TopBar />

      <PageContainer>
        <PageShell className="gap-5 pt-2 pb-7 lg:gap-7">
          <PageSection className="gap-4 rounded-[var(--radius-2xl)] border border-border/60 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_84%,var(--surface-alt)_16%)_0%,color-mix(in_srgb,var(--background)_90%,var(--surface)_10%)_100%)] p-4 shadow-elevation-2 sm:p-5 lg:gap-4 lg:p-5">
            <StockHeroHeader
              company={data.company}
              asOf={data.asOf}
              watchlist={{
                initialSaved: isWatchlisted,
                ticker: data.company.symbol,
                companyName: data.company.name,
              }}
            />

            <div className="space-y-1">
              <p className="section-kicker">Primary read</p>
              <p className="max-w-[52rem] text-body-sm text-ink-muted">
                ALQIS leads with an explanation, then shows the price evidence directly beside it so the narrative and proof can be scanned in one pass.
              </p>
            </div>

            {marketData?.dataHealth ? (
              <DataHealthStrip health={marketData.dataHealth} />
            ) : null}

            {shouldShowProviderNotice ? (
              <div className="flex gap-3 rounded-[var(--radius-lg)] border border-warn/18 bg-warn-bg/28 px-4 py-3 text-body-sm text-ink-muted">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
                <p>
                  {marketData?.providerMessage ??
                    "Market data is partially available. ALQIS is labeling missing provider context instead of filling the page with unsupported evidence."}
                </p>
              </div>
            ) : null}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] xl:gap-6">
              <StockWhyCard data={data} />
              <div className="space-y-5">
                <StockChartCard data={data} />
              </div>
            </div>

            <Disclaimer
              variant="banner"
              className="rounded-[var(--radius-lg)] border-accent-ai/8 bg-[color-mix(in_srgb,var(--surface-elevated)_80%,var(--accent-ai)_5%)]"
            />
          </PageSection>

          <PageSection className="rounded-[var(--radius-2xl)] border border-border/50 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_72%,var(--surface-elevated)_28%)_0%,color-mix(in_srgb,var(--background)_86%,var(--surface)_14%)_100%)] p-4 pt-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_18px_48px_rgba(2,6,10,0.14)] sm:p-5">
            <SectionHeader
              eyebrow="Supporting intelligence"
              title="Everything else the explanation needs to hold up."
              description="Metrics, news, scenario balance, and peer read-through stay evidence-led so the lower half feels like one ALQIS surface rather than a stack of widgets."
              className="gap-3"
            />

            {recentReads.length ? (
              <RecentReadsSection
                items={recentReads}
                title={`Recent reads for ${data.company.symbol}`}
                description="Past ALQIS reads are saved history, not the current live market read."
                compact
              />
            ) : null}

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <KeyMetricsCard data={data} />
              <SignalBalanceCard data={data} />
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
              <TopNewsCard data={data} />
              <PeerComparisonCard data={data} />
            </div>
          </PageSection>
        </PageShell>
      </PageContainer>
    </main>
  );
}

function createStockDetailData(
  stock: DemoStock,
  marketData?: StockDetailMarketData,
  explanationResponse?: WhyMovingResponse,
  aiWording?: AIWordingOutput,
  aiWordingStatus?: AIWordingStatus,
  aiWordingProvider?: SupportedAIWordingProvider,
  aiWordingFailureReason?: AIWordingFailureReason
): StockDetailData {
  const quote = marketData?.quote;
  const profile = marketData?.profile;
  const signedChange = quote?.change ?? (stock.dailyChange >= 0 ? stock.dailyChange : -Math.abs(stock.dailyChange));
  const price = quote?.price ?? stock.price;
  const dailyChangePercent = quote?.changePercent ?? stock.dailyChangePercent;
  const afterHoursChange = signedChange * 0.08;
  const liveNews = marketData?.news?.length ? marketData.news : undefined;
  const hasLiveChart = hasAnyLiveChartRange(marketData);
  const chartProviderName = formatProviderName(marketData?.chartProvider);
  const hasStructuredExplanation = Boolean(explanationResponse);
  const explanationSummary =
    hasLiveChart
      ? "Real quote, chart, and news data are connected, but the structured explanation is temporarily unavailable."
      : "Structured explanation unavailable. Real quote and news are connected; chart provider access needs resolution.";

  return {
    ...stockDetailDemoData,
    asOf: quote?.timestamp
      ? `Updated ${formatDateTime(quote.timestamp)}`
      : stockDetailDemoData.asOf,
    company: {
      ...stockDetailDemoData.company,
      name: profile?.companyName || stock.companyName,
      symbol: stock.symbol,
      exchange: profile?.exchange || stockDetailDemoData.company.exchange,
      sector: profile?.sector || stock.sector,
      marketStatus: quote?.marketStatus
        ? `Market ${quote.marketStatus}`
        : stock.marketStatus,
      statusDetail: quote ? "Finnhub quote data" : stock.statusDetail,
      price: formatCurrency(price),
      dailyChange: signedChange,
      dailyChangePct: dailyChangePercent,
      afterHoursPrice: formatCurrency(price + afterHoursChange),
      afterHoursChange,
      afterHoursChangePct: dailyChangePercent * 0.08,
      oneLineSummary: hasStructuredExplanation
        ? `${profile?.companyName || stock.companyName} is showing live market data with a structured ALQIS explanation for ${stock.symbol}.`
        : marketData?.dataHealth
          ? marketData.dataHealth.userFacingSummary
          : hasLiveChart
          ? `${profile?.companyName || stock.companyName} is showing real Finnhub quote/news data and ${chartProviderName} chart data while the explanation fallback stays cautious.`
          : `${profile?.companyName || stock.companyName} is showing real quote/news data where available, with ticker-aware chart fallback until provider data is complete.`,
      quoteStats: createQuoteStats(quote),
      quoteSourceLabel: quote ? "Finnhub quote" : "Market data unavailable",
      priceReadLabel: quote?.marketStatus === "open" ? "Market open" : "Market delayed",
      quoteStatusDetail: quote
        ? `Open ${formatCurrency(quote.open)} - Prev close ${formatCurrency(quote.previousClose)}`
        : "Market data partially available.",
      quickFacts: [
        {
          label: "Narrative",
          value: dailyChangePercent >= 0 ? "Constructive read" : "Pressure read",
        },
        {
          label: "Source",
          value: quote ? "Finnhub live quote" : "Demo fallback",
        },
        {
          label: "Provider",
          value: profile?.currency ? `Finnhub ${profile.currency}` : "Finnhub-ready",
        },
      ],
    },
    chartRanges: createChartRanges(stock, marketData, explanationResponse),
    explanation: explanationResponse
      ? createStructuredExplanation(
          explanationResponse,
          aiWording,
          aiWordingStatus,
          aiWordingProvider,
          aiWordingFailureReason
        )
      : {
          ...stockDetailDemoData.explanation,
          headline: "AI explanation pending.",
          summary: explanationSummary,
          confidenceSummary:
            hasLiveChart
              ? "Real quote, chart, and news data are connected, but the structured explanation service did not return a usable read."
              : "ALQIS is not presenting a structured explanation while chart confirmation is unavailable or provider data is incomplete.",
          reasons: [
            {
              label: "Real quote connected",
              score: 84,
              detail: quote
                ? `${stock.symbol} quote data is connected at ${formatCurrency(price)} with a ${dailyChangePercent >= 0 ? "positive" : "negative"} daily move.`
                : `${stock.symbol} quote data is unavailable, so ALQIS is preserving a ticker-aware demo fallback.`,
            },
            {
              label: "News feed connected",
              score: 72,
              detail: liveNews?.length
                ? `${liveNews.length} ${stock.symbol}-filtered Finnhub news item${liveNews.length === 1 ? "" : "s"} loaded.`
                : `No clean ${stock.symbol}-specific Finnhub news items passed the relevance filter, so ALQIS is using ticker-aware placeholder copy.`,
            },
            {
              label: hasLiveChart ? "Chart feed connected" : "Chart access pending",
              score: 63,
              detail: hasLiveChart
                ? `${chartProviderName} chart data is connected and powering the proof-of-move card.`
                : marketData?.chartProviderAccessError
                  ? `${chartProviderName} chart access is blocked for the active key, so the proof chart is labeled as demo structure.`
                  : "Chart data is connected when the provider returns time-series points; otherwise ALQIS keeps the module stable with ticker-aware demo structure.",
            },
          ],
          counterEvidence: [
            {
              label: "Explanation fallback active",
              detail:
                "This card is intentionally not presenting a causal read because the structured explanation service did not return a valid response.",
            },
            {
              label: hasLiveChart ? "Explanation not available" : "Chart provider gap",
              detail:
                hasLiveChart
                  ? `${stock.symbol} chart data is connected through ${chartProviderName}, but the explanation service could not complete this read.`
                  : `${stock.symbol} chart data may still be unavailable from the active chart provider depending on API access.`,
            },
          ],
          changeTriggers: [
            hasLiveChart
              ? `${stock.symbol} chart trend diverges materially from the live quote move.`
              : `Chart provider access becomes available for ${stock.symbol}.`,
            "The structured explanation service returns a fresh validated read.",
            `${stock.symbol}-specific news relevance improves enough to support a sourced explanation.`,
          ],
    },
    metrics: createTickerMetrics(stock, quote),
    news: liveNews?.length
      ? liveNews
          .slice(0, 5)
          .map((item) => normalizeNewsItem(item, stock, explanationResponse))
      : createTickerFallbackNews(stock),
    signals: createTickerSignals(stock, quote, marketData, explanationResponse),
    peers: createTickerPeers(stock),
  };
}

function DataHealthStrip({ health }: { health: StockDataHealth }) {
  const isComplete = health.overallStatus === "complete";

  return (
    <section
      aria-label="Market data health"
      className="rounded-[var(--radius-lg)] border border-border/60 bg-[color-mix(in_srgb,var(--surface-elevated)_78%,var(--surface)_22%)] px-4 py-3"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <AlertTriangle
            className={`mt-0.5 h-4 w-4 shrink-0 ${isComplete ? "text-accent-secondary" : "text-warn"}`}
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink">{health.userFacingLabel}</p>
            <p className="mt-1 text-body-sm text-ink-muted">
              {health.userFacingSummary}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <HealthBadge
            label={formatHealthStatus("Quote", health.quoteStatus)}
            ok={health.quoteStatus === "ok"}
            termId={getHealthTermId(health.quoteStatus)}
          />
          <HealthBadge
            label={formatHealthStatus("Chart", health.chartStatus)}
            ok={health.chartStatus === "ok"}
            termId={getHealthTermId(health.chartStatus)}
          />
          <HealthBadge
            label={formatHealthStatus("News", health.newsStatus)}
            ok={health.newsStatus === "ok"}
            termId={getHealthTermId(health.newsStatus)}
          />
        </div>
      </div>
    </section>
  );
}

function HealthBadge({
  label,
  ok,
  termId,
}: {
  label: string;
  ok: boolean;
  termId?: string | null;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Badge
        variant={ok ? "outline" : "ai"}
        size="sm"
        className="normal-case tracking-normal"
      >
        {label}
      </Badge>
      {termId ? <ExplainThis termId={termId} compact /> : null}
    </span>
  );
}

function getHealthTermId(status: string) {
  if (status === "fallback" || status === "partial") {
    return "partial-data";
  }

  if (status === "limited" || status === "missing" || status === "error") {
    return "data-limited";
  }

  return null;
}

function formatHealthStatus(label: string, status: string) {
  if (label === "Quote" && status === "ok") return "Live quote connected";
  if (label === "Quote" && status === "missing") return "Quote unavailable";
  if (label === "Chart" && status === "ok") return "Live chart connected";
  if (label === "Chart" && status === "fallback") return "Fallback chart is not evidence";
  if (label === "Chart") return "Chart provider unavailable";
  if (label === "News" && status === "ok") return "News context connected";
  if (label === "News" && status === "limited") return "News context limited";
  if (label === "News") return "No recent news context found";

  return `${label} ${status}`;
}

function createStructuredExplanation(
  response: WhyMovingResponse,
  aiWording?: AIWordingOutput,
  aiWordingStatus?: AIWordingStatus,
  aiWordingProvider?: SupportedAIWordingProvider,
  aiWordingFailureReason?: AIWordingFailureReason
) {
  const chartMovePct = response.chartMovePct;
  const hasChartConfirmation = typeof chartMovePct === "number";
  const chartMove =
    hasChartConfirmation
      ? formatPercent(chartMovePct)
      : "unavailable";
  const validatedAIWording = aiWordingStatus === "ok" ? aiWording : undefined;
  const failedAIWording =
    aiWordingStatus &&
    aiWordingStatus !== "ok" &&
    aiWordingStatus !== "not_requested";

  return {
    ...stockDetailDemoData.explanation,
    headline: validatedAIWording ? validatedAIWording.headline : response.summary,
    freshness: `Generated ${formatDateTime(response.generatedAt)}`,
    summary: validatedAIWording
      ? validatedAIWording.summary
      : `${response.confidence.label}. ${response.dailyMoveLabel}: ${formatPercent(response.movePct)}. ${response.chartMoveLabel}: ${chartMove}.`,
    wordingNote: validatedAIWording
      ? aiWordingProvider === "openai"
        ? "AI-polished wording. Structured evidence remains source of truth."
        : "Structured ALQIS wording. No external AI wording provider active."
      : failedAIWording
        ? "Structured wording shown. AI polish unavailable."
        : undefined,
    wordingDetail: failedAIWording
      ? aiWordingFailureReason
        ? `AI polish status: ${aiWordingFailureReason}.`
        : `AI polish status: ${aiWordingStatus}.`
      : undefined,
    plainEnglishRead: validatedAIWording
      ? validatedAIWording.plainEnglishRead
      : undefined,
    aiWhyItMatters: validatedAIWording
      ? validatedAIWording.whyItMatters
      : undefined,
    confidence: response.confidence.band,
    sourceCount: response.sourceCount,
    confidenceSummary: `ALQIS confidence is ${response.confidence.label.toLowerCase()} (${Math.round(response.confidence.score * 100)}%). This read expires ${formatDateTime(response.expiresAt)} unless refreshed.`,
    trustNote:
      validatedAIWording
        ? validatedAIWording.trustNote
        : "This is structured reasoning from live quote, chart, and headline evidence. It separates daily quote movement from the selected chart window.",
    sourceLabels: [
      "Finnhub quote",
      hasChartConfirmation ? "Twelve Data chart" : "Chart provider unavailable",
      "Finnhub news",
      "Structured scoring",
    ],
    reasons: response.keyFactors.slice(0, 3).map((factor) => ({
      label: factor.label,
      score: Math.round(factor.score * 100),
      detail: `${factor.description} ${formatEvidenceType(factor.evidenceType)} evidence; ${formatMoveAlignment(factor.moveAlignment)}${factor.newsRelevance ? `; ${formatNewsRelevance(factor.newsRelevance)}` : ""}. Evidence count: ${factor.evidenceCount}.`,
    })),
    counterEvidence: response.counterEvidence.length
      ? response.counterEvidence.map((item) => ({
          label: item.label,
          detail: item.description,
        }))
      : [
          {
            label: "Evidence can change quickly",
            detail:
              "The read should be refreshed when price action, chart trend, or news flow changes.",
          },
        ],
    evidence: response.keyFactors.slice(0, 3).map((factor) => ({
      time: `${factor.evidenceCount} signal${factor.evidenceCount === 1 ? "" : "s"}`,
      title: factor.label,
      detail: `${factor.description} Evidence type: ${formatEvidenceType(factor.evidenceType)}. Move alignment: ${formatMoveAlignment(factor.moveAlignment)}${factor.newsRelevance ? `. Relevance: ${formatNewsRelevance(factor.newsRelevance)}` : ""}.`,
    })),
    changeTriggers: [
      "The quote move reverses or materially weakens.",
      "New ticker-specific news contradicts the current event tag.",
      "The selected chart timeframe stops confirming the move.",
    ],
  };
}

function createChartRanges(
  stock: DemoStock,
  marketData?: StockDetailMarketData,
  explanationResponse?: WhyMovingResponse
): StockDetailData["chartRanges"] {
  const mappings: Array<{
    marketRange: MarketChartRange;
    detailRange: StockDetailChartRange;
  }> = [
    { marketRange: "1D", detailRange: "1d" },
    { marketRange: "5D", detailRange: "5d" },
    { marketRange: "1M", detailRange: "1m" },
  ];
  const chartRanges = { ...stockDetailDemoData.chartRanges };

  mappings.forEach(({ marketRange, detailRange }) => {
    const marketPoints = marketData?.charts?.[marketRange];
    const chartMeta = marketData?.chartRanges?.[marketRange];
    const isLiveRange = isLiveChartRange(marketData, marketRange);
    const providerName = formatProviderName(chartMeta?.provider ?? marketData?.chartProvider);
    const fallbackMessage = createChartFallbackMessage(
      stock,
      marketRange,
      providerName,
      chartMeta
    );
    const points = isLiveRange && marketPoints?.length
      ? marketPoints.map((point) => ({
          label: formatChartLabel(point.time, marketRange),
          value: point.close,
        }))
      : getFallbackChartPoints(stock, marketRange);

    chartRanges[detailRange] = {
      ...chartRanges[detailRange],
      subtitle: isLiveRange
        ? `${stock.symbol} ${marketRange} proof-of-move`
        : `${stock.symbol} ${marketRange} fallback chart structure`,
      points,
      markers: isLiveRange
        ? createChartMarkers(stock, points, explanationResponse)
        : [],
      stats: createChartStats(
        stock,
        points,
        marketRange,
        isLiveRange,
        providerName
      ),
      footer:
        isLiveRange
          ? `This proof card is using ${providerName} chart data and keeps the chart tied to the current ALQIS read.`
          : fallbackMessage,
    };
  });

  return chartRanges;
}

function createChartFallbackMessage(
  stock: DemoStock,
  range: MarketChartRange,
  providerName: string,
  chartMeta?: NonNullable<StockDetailMarketData["chartRanges"]>[MarketChartRange]
) {
  const providerDetail = chartMeta?.providerStatus
    ? ` Provider status ${chartMeta.providerStatus}.`
    : "";
  const providerMessage = chartMeta?.providerMessage
    ? " Provider returned no usable live chart points for this range."
    : "";

  return `Chart provider unavailable for this range. ALQIS is showing ticker-aware fallback structure for ${stock.symbol} ${range} and does not treat it as chart confirmation. Source: ${providerName}.${providerDetail}${providerMessage}`;
}

function getFallbackChartPoints(stock: DemoStock, range: MarketChartRange) {
  if (range === "1D") {
    return stock.chartData;
  }

  const baseLabels =
    range === "5D"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri"]
      : ["W1", "W2", "W3", "W4", "Now"];
  const totalMove = (stock.price * stock.dailyChangePercent) / 100;
  const startValue = stock.price - totalMove;

  return baseLabels.map((label, index) => {
    const progress = index / Math.max(baseLabels.length - 1, 1);

    return {
      label,
      value: Number((startValue + totalMove * progress).toFixed(2)),
    };
  });
}

function createChartMarkers(
  stock: DemoStock,
  points: Array<{ label: string; value: number }>,
  explanationResponse?: WhyMovingResponse
) {
  const evidenceFactor = explanationResponse?.keyFactors.find(
    (factor) =>
      factor.evidenceCount > 0 &&
      factor.moveAlignment === "supports_move" &&
      !factor.label.toLowerCase().includes("intraday")
  );

  if (!evidenceFactor || points.length < 3) {
    return [];
  }

  const midpoint = Math.max(1, Math.floor(points.length / 2));
  return [
    {
      index: midpoint,
      label: evidenceFactor.label,
      kind: "event" as const,
      time: points[midpoint]?.label ?? "Mid-session",
      title: `${stock.symbol}: ${evidenceFactor.label}`,
      explanation: evidenceFactor.description,
      whyItMatters: `${formatEvidenceType(evidenceFactor.evidenceType)} evidence that ${formatMoveAlignment(evidenceFactor.moveAlignment)}.`,
    },
  ];
}

function createChartStats(
  stock: DemoStock,
  points: Array<{ label: string; value: number }>,
  range: MarketChartRange,
  isLive: boolean,
  providerName: string
) {
  const values = points.map((point) => point.value);
  const first = values[0] ?? stock.price;
  const last = values[values.length - 1] ?? stock.price;
  const changePct = first ? ((last - first) / first) * 100 : 0;

  return [
    {
      label: `${range} chart-window move`,
      value: `${changePct >= 0 ? "+" : ""}${changePct.toFixed(2)}%`,
    },
    {
      label: "Range quality",
      value: `${formatCompactCurrency(Math.min(...values))} - ${formatCompactCurrency(Math.max(...values))}`,
    },
    {
      label: "Source",
      value: isLive ? `${providerName} chart` : "Chart provider unavailable",
    },
  ];
}

function isLiveChartRange(
  marketData: StockDetailMarketData | undefined,
  range: MarketChartRange
) {
  const meta = marketData?.chartRanges?.[range];
  const points = marketData?.charts?.[range];

  return meta?.status === "ok" && meta.fallback === null && Boolean(points?.length);
}

function hasAnyLiveChartRange(marketData?: StockDetailMarketData) {
  return (["1D", "5D", "1M"] as MarketChartRange[]).some((range) =>
    isLiveChartRange(marketData, range)
  );
}

function createQuoteStats(quote?: StockQuote) {
  if (!quote) {
    return [
      { label: "Open", value: "Unavailable" },
      { label: "High", value: "Unavailable" },
      { label: "Low", value: "Unavailable" },
      { label: "Prev close", value: "Unavailable" },
    ];
  }

  return [
    { label: "Open", value: formatCurrency(quote.open) },
    { label: "High", value: formatCurrency(quote.high) },
    { label: "Low", value: formatCurrency(quote.low) },
    { label: "Prev close", value: formatCurrency(quote.previousClose) },
  ];
}

function normalizeNewsItem(
  item: StockNewsItem,
  stock: DemoStock,
  explanationResponse?: WhyMovingResponse
) {
  return {
    source: item.source,
    time: formatDateTime(item.publishedAt),
    headline: item.headline,
    summary: item.summary || "Finnhub returned this headline without a longer summary.",
    whyItMatters: createNewsWhyItMatters(item, stock, explanationResponse),
  };
}

function createNewsWhyItMatters(
  item: StockNewsItem,
  stock: DemoStock,
  explanationResponse?: WhyMovingResponse
) {
  const factor = findMatchingExplanationFactor(item, explanationResponse);

  if (factor) {
    const label = formatFactorReference(factor.label);

    if (factor.moveAlignment === "supports_move") {
      return factor.evidenceType === "contextual"
        ? `This adds ${label} context and lightly supports the current read.`
        : `This supports the ${label} read.`;
    }

    if (factor.moveAlignment === "contradicts_move") {
      return `This is counterevidence against the ${label} read.`;
    }

    return `This adds ${label} context but does not directly explain the price move.`;
  }

  const relevance = inferNewsRelevance(item, stock);

  if (relevance === "direct_company") {
    return `This is direct ${stock.symbol} company context, but ALQIS is not treating it as the main driver without factor alignment.`;
  }

  if (relevance === "company_context") {
    return `This adds ${stock.symbol} company context but does not directly explain the price move.`;
  }

  if (relevance === "sector_context") {
    return `This headline is sector context for ${stock.symbol}, not a direct company catalyst.`;
  }

  if (relevance === "macro_context") {
    return `This is broad market context for ${stock.symbol}, not a direct company catalyst.`;
  }

  return `This is weak context for ${stock.symbol} and should not drive the current structured read.`;
}

function findMatchingExplanationFactor(
  item: StockNewsItem,
  explanationResponse?: WhyMovingResponse
) {
  if (!explanationResponse) {
    return undefined;
  }

  const text = getNewsSearchText(item);

  return explanationResponse.keyFactors.find((factor) =>
    factorMatchesNewsText(factor.label, text)
  );
}

function factorMatchesNewsText(label: string, text: string) {
  const normalizedLabel = label.toLowerCase();

  if (normalizedLabel.includes("intraday")) {
    return false;
  }

  const checks: Array<[boolean, string[]]> = [
    [
      normalizedLabel.includes("ai") ||
        normalizedLabel.includes("autonomy") ||
        normalizedLabel.includes("data-center"),
      [
        "ai",
        "artificial intelligence",
        "autonomy",
        "robotaxi",
        "data center",
        "data-center",
        "gpu",
        "accelerator",
      ],
    ],
    [
      normalizedLabel.includes("earning") ||
        normalizedLabel.includes("guidance") ||
        normalizedLabel.includes("surprise"),
      ["earnings", "revenue", "guidance", "margin", "eps", "profit"],
    ],
    [
      normalizedLabel.includes("product") ||
        normalizedLabel.includes("platform") ||
        normalizedLabel.includes("robotaxi"),
      ["product", "platform", "launch", "iphone", "robotaxi", "model", "device"],
    ],
    [
      normalizedLabel.includes("sector") ||
        normalizedLabel.includes("peer") ||
        normalizedLabel.includes("tech") ||
        normalizedLabel.includes("demand narrative"),
      ["sector", "semiconductor", "chip", "peer", "tech", "ev", "auto"],
    ],
    [
      normalizedLabel.includes("macro") || normalizedLabel.includes("rate"),
      ["fed", "rate", "rates", "yield", "inflation", "macro"],
    ],
  ];

  return checks.some(([isRelevantLabel, keywords]) =>
    isRelevantLabel && keywords.some((keyword) => text.includes(keyword))
  );
}

function inferNewsRelevance(item: StockNewsItem, stock: DemoStock) {
  const text = getNewsSearchText(item);
  const companyTerms = stock.companyName
    .replace(/\b(inc|inc\.|corp|corporation|ltd|plc|company)\b/gi, "")
    .split(/\s+/)
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length > 3);

  if (
    text.includes(stock.symbol.toLowerCase()) ||
    companyTerms.some((term) => text.includes(term))
  ) {
    return "direct_company";
  }

  if (text.includes(stock.sector.toLowerCase())) {
    return "company_context";
  }

  if (
    ["sector", "semiconductor", "chip", "software", "cloud", "ev", "auto", "tech"].some(
      (term) => text.includes(term)
    )
  ) {
    return "sector_context";
  }

  if (
    ["fed", "rate", "rates", "yield", "inflation", "macro", "tariff"].some((term) =>
      text.includes(term)
    )
  ) {
    return "macro_context";
  }

  return "low_relevance";
}

function getNewsSearchText(item: StockNewsItem) {
  return `${item.headline} ${item.summary}`.toLowerCase();
}

function formatFactorReference(label: string) {
  const acronymMatch = label.match(/^([A-Z]{2,})(\b.*)$/);

  if (acronymMatch) {
    return `${acronymMatch[1]}${acronymMatch[2].toLowerCase()}`;
  }

  return label.charAt(0).toLowerCase() + label.slice(1);
}

function createTickerFallbackNews(stock: DemoStock): StockDetailData["news"] {
  return [
    {
      source: "ALQIS demo fallback",
      time: "Provider pending",
      headline: `${stock.symbol} news feed is connected, but no clean company-specific headline is available.`,
      summary: `${stock.companyName} remains in a ticker-aware fallback state until Finnhub returns relevant company news.`,
      whyItMatters:
        "ALQIS avoids filling the page with unrelated headlines when provider relevance is noisy.",
    },
    {
      source: "ALQIS demo fallback",
      time: "Provider pending",
      headline: `${stock.symbol} quote data remains the primary live input.`,
      summary: `The page can still show ${stock.symbol} price movement while news relevance is filtered conservatively.`,
      whyItMatters:
        "Signal over noise means empty-but-honest beats unrelated market headlines.",
    },
  ];
}

function createTickerMetrics(
  stock: DemoStock,
  quote?: StockQuote
): StockDetailData["metrics"] {
  return [
    {
      label: "Current price",
      value: formatCurrency(quote?.price ?? stock.price),
      context: quote ? "Live Finnhub quote." : `${stock.symbol} demo fallback quote.`,
    },
    {
      label: "Daily move",
      value: `${(quote?.changePercent ?? stock.dailyChangePercent) >= 0 ? "+" : ""}${(quote?.changePercent ?? stock.dailyChangePercent).toFixed(2)}%`,
      context: "Quote change from previous close; separate from selected chart-window movement.",
    },
    {
      label: "Open",
      value: quote?.open ? formatCurrency(quote.open) : "Demo pending",
      context: "Session open from provider when available.",
    },
    {
      label: "High / Low",
      value: quote?.high && quote.low ? `${formatCurrency(quote.high)} / ${formatCurrency(quote.low)}` : "Demo pending",
      context: "Intraday range from provider quote data.",
    },
    {
      label: "Previous close",
      value: quote?.previousClose ? formatCurrency(quote.previousClose) : "Demo pending",
      context: "Reference point for the daily change calculation.",
    },
    {
      label: "Sector",
      value: stock.sector,
      context: `${stock.companyName} demo classification.`,
    },
  ];
}

function createTickerSignals(
  stock: DemoStock,
  quote?: StockQuote,
  marketData?: StockDetailMarketData,
  explanationResponse?: WhyMovingResponse
): StockDetailData["signals"] {
  const changePercent = quote?.changePercent ?? stock.dailyChangePercent;
  const isPositive = changePercent >= 0;
  const hasLiveChart = hasAnyLiveChartRange(marketData);
  const hasStructuredExplanation = Boolean(explanationResponse);
  const hasExplanationChart = typeof explanationResponse?.chartMovePct === "number";
  const confidenceLabel = explanationResponse?.confidence.label ?? "Read pending";
  const confidenceBand = explanationResponse?.confidence.band ?? "C";
  const expiresAt = explanationResponse?.expiresAt
    ? formatDateTime(explanationResponse.expiresAt)
    : "the next refresh";

  return {
    bullish: [
      {
        title: "Quote feed connected",
        detail: quote
          ? `${stock.symbol} live quote is available from Finnhub.`
          : `${stock.symbol} is using demo quote fallback.`,
      },
      {
        title: "News relevance guarded",
        detail:
          "ALQIS filters provider headlines before they reach the stock page.",
      },
      {
        title: hasStructuredExplanation
          ? "Structured read active"
          : "Screen remains usable",
        detail: hasStructuredExplanation
          ? `ALQIS is scoring quote, chart, and news inputs for ${stock.symbol}.`
          : "The stock detail page keeps structure intact while provider access is resolved.",
      },
    ],
    bearish: [
      {
        title: hasStructuredExplanation
          ? "Read expires quickly"
          : "Explanation fallback active",
        detail: hasStructuredExplanation
          ? `This structured read expires ${expiresAt} unless refreshed.`
          : "The explanation module stays cautious when the structured service does not return a valid read.",
      },
      {
        title: hasExplanationChart ? "Chart confirmation" : "Chart provider access",
        detail: hasExplanationChart
          ? `${formatProviderName(marketData?.chartProvider)} chart data is connected and used as supporting evidence.`
          : marketData?.chartProviderAccessError
            ? `${formatProviderName(marketData.chartProvider)} chart access is currently blocked for the active key.`
            : hasLiveChart
              ? "Some chart ranges are live, but the active explanation range is not using chart confirmation."
              : "Chart time-series data depends on provider availability.",
      },
      {
        title: hasStructuredExplanation ? "Evidence can shift" : "Demo chart structure",
        detail:
          hasStructuredExplanation
            ? "New ticker-specific news or a reversal in the quote move can change the read."
            : "Fallback charts are useful for layout continuity, not market analysis.",
      },
    ],
    analystSummary:
      "Analyst and sentiment synthesis remains separate; this module summarizes ALQIS structured evidence only.",
    targetPrice: hasStructuredExplanation
      ? confidenceLabel
      : "Valuation view deferred",
    sentimentBand: hasStructuredExplanation
      ? `${isPositive ? "Positive" : "Negative"} move, ${confidenceBand}-band read`
      : isPositive
        ? "Price positive, read pending"
        : "Price negative, read pending",
    alqisRead: hasStructuredExplanation
      ? `ALQIS is combining live market inputs with a structured ${stock.symbol} explanation, then separating the causal read from analyst or valuation modules.`
      : "ALQIS is showing live market inputs where available and clearly labeling any fallback structure until the explanation layer is available.",
  };
}

function formatProviderName(provider?: string) {
  if (provider === "twelve-data") {
    return "Twelve Data";
  }

  if (provider === "finnhub") {
    return "Finnhub";
  }

  return "chart provider";
}

function formatEvidenceType(type: WhyMovingResponse["keyFactors"][number]["evidenceType"]) {
  if (type === "direct") return "Direct";
  if (type === "sector") return "Sector";
  if (type === "macro") return "Macro";
  return "Contextual";
}

function formatMoveAlignment(
  alignment: WhyMovingResponse["keyFactors"][number]["moveAlignment"]
) {
  if (alignment === "supports_move") return "supports the move";
  if (alignment === "contradicts_move") return "contradicts the move";
  return "neutral to the move";
}

function formatNewsRelevance(
  relevance: NonNullable<WhyMovingResponse["keyFactors"][number]["newsRelevance"]>
) {
  if (relevance === "direct_company") return "direct company evidence";
  if (relevance === "company_context") return "company context";
  if (relevance === "sector_context") return "sector context";
  if (relevance === "macro_context") return "macro context";
  return "low relevance";
}

const PEER_SETS: Record<
  string,
  Array<{
    symbol: string;
    name: string;
    note: string;
    readThrough: string;
    context: string;
  }>
> = {
  TSLA: [
    {
      symbol: "RIVN",
      name: "Rivian Automotive",
      note: "EV growth peer helps test whether the move is Tesla-specific or broader EV demand pressure.",
      readThrough: "EV demand read-through",
      context: "EV peer",
    },
    {
      symbol: "GM",
      name: "General Motors",
      note: "Legacy auto pricing and EV transition commentary provide demand and margin context.",
      readThrough: "Auto margin context",
      context: "Auto peer",
    },
    {
      symbol: "F",
      name: "Ford Motor",
      note: "Ford keeps the read grounded in broader auto demand, incentives, and financing conditions.",
      readThrough: "Auto demand context",
      context: "Auto peer",
    },
    {
      symbol: "BYD",
      name: "BYD Company",
      note: "BYD is the key global EV volume comparator for competitive demand pressure.",
      readThrough: "Global EV competition",
      context: "EV peer",
    },
    {
      symbol: "LCID",
      name: "Lucid Group",
      note: "Lucid adds high-end EV sentiment context without treating it as a direct Tesla catalyst.",
      readThrough: "Premium EV sentiment",
      context: "EV peer",
    },
  ],
  AAPL: [
    {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      note: "Microsoft helps separate Apple-specific platform headlines from broad mega-cap tech movement.",
      readThrough: "Mega-cap tech context",
      context: "Tech peer",
    },
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      note: "Alphabet provides broad platform and AI sentiment context for large-cap technology.",
      readThrough: "Platform sentiment",
      context: "Tech peer",
    },
    {
      symbol: "META",
      name: "Meta Platforms",
      note: "Meta helps test whether risk appetite is lifting or pressuring the broader platform group.",
      readThrough: "Platform risk appetite",
      context: "Tech peer",
    },
    {
      symbol: "AMZN",
      name: "Amazon.com",
      note: "Amazon adds consumer and cloud-linked context around mega-cap technology flows.",
      readThrough: "Mega-cap breadth",
      context: "Tech peer",
    },
    {
      symbol: "QQQ",
      name: "Invesco QQQ Trust",
      note: "QQQ is broad tech context only; it should not be read as a company-specific Apple catalyst.",
      readThrough: "Broad tech context",
      context: "Market context",
    },
  ],
  NVDA: [
    {
      symbol: "AMD",
      name: "Advanced Micro Devices",
      note: "AMD is the closest listed AI accelerator peer for testing whether demand is broadening.",
      readThrough: "AI accelerator peer",
      context: "Semiconductor peer",
    },
    {
      symbol: "AVGO",
      name: "Broadcom Inc.",
      note: "Broadcom adds semiconductor infrastructure context beyond GPUs.",
      readThrough: "AI infrastructure breadth",
      context: "Semiconductor peer",
    },
    {
      symbol: "TSM",
      name: "Taiwan Semiconductor",
      note: "TSM connects the read to advanced manufacturing demand and chip supply-chain strength.",
      readThrough: "Foundry demand context",
      context: "Semiconductor peer",
    },
    {
      symbol: "SMH",
      name: "VanEck Semiconductor ETF",
      note: "SMH provides sector breadth context and should not be treated as a direct NVDA catalyst.",
      readThrough: "Semiconductor breadth",
      context: "Sector context",
    },
    {
      symbol: "SOXX",
      name: "iShares Semiconductor ETF",
      note: "SOXX checks whether the semiconductor group is confirming or fading the move.",
      readThrough: "Semiconductor sector check",
      context: "Sector context",
    },
  ],
  AMD: [
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      note: "NVIDIA anchors the AI accelerator read-through and helps separate AMD-specific moves from the broader compute cycle.",
      readThrough: "AI accelerator benchmark",
      context: "Semiconductor peer",
    },
    {
      symbol: "AVGO",
      name: "Broadcom Inc.",
      note: "Broadcom adds infrastructure-chip breadth beyond GPUs and CPUs.",
      readThrough: "AI infrastructure breadth",
      context: "Semiconductor peer",
    },
    {
      symbol: "TSM",
      name: "Taiwan Semiconductor",
      note: "TSM connects AMD demand to advanced-node manufacturing and supply-chain capacity.",
      readThrough: "Foundry demand context",
      context: "Semiconductor peer",
    },
    {
      symbol: "INTC",
      name: "Intel Corporation",
      note: "Intel provides CPU and data-center competition context without treating it as a direct AMD catalyst.",
      readThrough: "Compute competition",
      context: "Semiconductor peer",
    },
    {
      symbol: "SMH",
      name: "VanEck Semiconductor ETF",
      note: "SMH checks whether AMD's move is confirmed by semiconductor breadth.",
      readThrough: "Semiconductor breadth",
      context: "Sector context",
    },
    {
      symbol: "SOXX",
      name: "iShares Semiconductor ETF",
      note: "SOXX provides a second sector-breadth check when single-name semiconductor signals are mixed.",
      readThrough: "Sector confirmation",
      context: "Sector context",
    },
  ],
  MSFT: [
    {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      note: "Alphabet helps separate Microsoft-specific platform news from broader AI and cloud platform movement.",
      readThrough: "Cloud and AI platform context",
      context: "Mega-cap tech peer",
    },
    {
      symbol: "AMZN",
      name: "Amazon.com",
      note: "Amazon adds cloud spending and enterprise demand context through AWS.",
      readThrough: "Cloud demand context",
      context: "Mega-cap tech peer",
    },
    {
      symbol: "META",
      name: "Meta Platforms",
      note: "Meta helps test whether AI infrastructure spending is lifting the broader platform group.",
      readThrough: "AI platform breadth",
      context: "Mega-cap tech peer",
    },
    {
      symbol: "AAPL",
      name: "Apple Inc.",
      note: "Apple provides mega-cap tech risk-appetite context without being a direct Microsoft catalyst.",
      readThrough: "Mega-cap risk appetite",
      context: "Mega-cap tech peer",
    },
    {
      symbol: "ORCL",
      name: "Oracle Corporation",
      note: "Oracle adds enterprise software and cloud-infrastructure context for Microsoft.",
      readThrough: "Enterprise software context",
      context: "Software peer",
    },
    {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      note: "NVIDIA is useful when the Microsoft read includes AI infrastructure demand or data-center buildout.",
      readThrough: "AI infrastructure context",
      context: "AI infrastructure peer",
    },
  ],
};

const PEER_SNAPSHOTS: Record<
  string,
  {
    price: number;
    changePct: number;
  }
> = {
  RIVN: { price: 10.84, changePct: -1.62 },
  GM: { price: 58.22, changePct: 0.48 },
  F: { price: 12.14, changePct: -0.36 },
  BYD: { price: 74.2, changePct: 1.1 },
  LCID: { price: 2.34, changePct: -2.08 },
  GOOGL: { price: 193.48, changePct: 0.82 },
  META: { price: 582.14, changePct: 1.06 },
  AMZN: { price: 229.62, changePct: 0.54 },
  INTC: { price: 31.42, changePct: -0.68 },
  ORCL: { price: 146.38, changePct: 0.74 },
  QQQ: { price: 519.88, changePct: 0.44 },
  SPY: { price: 574.41, changePct: 0.21 },
  AVGO: { price: 235.86, changePct: 1.28 },
  TSM: { price: 204.13, changePct: 0.76 },
  SMH: { price: 260.54, changePct: 1.34 },
  SOXX: { price: 231.2, changePct: 1.02 },
};

function createTickerPeers(stock: DemoStock): StockDetailData["peers"] {
  const peerSet =
    PEER_SETS[stock.symbol] ??
    [
      {
        symbol: "QQQ",
        name: "Invesco QQQ Trust",
        note: "QQQ provides broad technology context only, not a company-specific catalyst.",
        readThrough: "Market context",
        context: "Broad market",
      },
      {
        symbol: "SPY",
        name: "SPDR S&P 500 ETF",
        note: "SPY helps separate single-stock movement from broad market direction.",
        readThrough: "Market breadth",
        context: "Broad market",
      },
    ];

  return peerSet.slice(0, 6).map((peer, index) => {
    const demoPeer = getDemoStockBySymbol(peer.symbol);
    const snapshot = PEER_SNAPSHOTS[peer.symbol];
    const price = demoPeer?.price ?? snapshot?.price ?? stock.price * (0.82 + index * 0.07);
    const changePct =
      demoPeer?.dailyChangePercent ?? snapshot?.changePct ?? stock.dailyChangePercent * (0.45 + index * 0.12);

    return {
      symbol: peer.symbol,
      name: demoPeer?.companyName ?? peer.name,
      price: formatCurrency(price),
      changePct,
      note: peer.note,
      readThrough: peer.readThrough,
      timeframe: peer.context,
      points: demoPeer?.chartData ?? createSyntheticPeerPoints(price, changePct),
    };
  });
}

function createSyntheticPeerPoints(price: number, changePct: number) {
  const start = price / (1 + changePct / 100);
  const steps = [0, 0.18, 0.34, 0.48, 0.62, 0.78, 0.9, 1];
  const labels = ["9:30", "10:00", "10:30", "11:00", "11:30", "12:00", "1:00", "2:00"];

  return steps.map((progress, index) => ({
    label: labels[index],
    value: Number((start + (price - start) * progress).toFixed(2)),
  }));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatCompactCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatChartLabel(value: string, range: MarketChartRange) {
  const date = new Date(value);

  if (range === "1D") {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function TopBar() {
  return (
    <header className="relative z-10 border-b border-border/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_97%,var(--surface)_3%)_0%,color-mix(in_srgb,var(--background)_88%,transparent)_100%)] shadow-[0_10px_30px_rgba(2,6,10,0.12)]">
      <PageContainer className="flex flex-wrap items-center justify-between gap-3 py-3 sm:gap-4 sm:py-4">
        <div className="flex items-center gap-3">
          <AlqisLogo variant="lockup" tone="dark" size="sm" priority />
          <div>
            <p className="text-body-sm text-ink-muted">Market intelligence screen</p>
          </div>
        </div>

        <Badge variant="ai" size="md" className="hidden sm:inline-flex">
          Why Is It Moving?
        </Badge>
      </PageContainer>
    </header>
  );
}

function KeyMetricsCard({ data }: { data: StockDetailData }) {
  return (
    <Card variant="subtle" radius="xl" className="h-full border-border/72">
      <CardHeader>
        <CardEyebrow>Key metrics</CardEyebrow>
        <CardTitle>Context around the move.</CardTitle>
        <CardDescription>
          ALQIS keeps these inputs tight so they clarify the explanation instead of diluting it.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="dense-finance-grid">
          {data.metrics.map((metric) => (
            <div key={metric.label} className="dense-finance-row">
              <div>
                <p className="text-sm font-medium text-ink">{metric.label}</p>
                <p className="mt-1 text-body-sm text-ink-muted">{metric.context}</p>
              </div>
              <span className="text-base font-medium text-ink" data-numeric>
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SignalBalanceCard({ data }: { data: StockDetailData }) {
  const { signals } = data;

  return (
    <Card variant="subtle" radius="xl" className="h-full border-border/72">
      <CardHeader>
        <CardEyebrow>ALQIS scenario balance</CardEyebrow>
        <CardTitle>What still supports the thesis, and what could break it.</CardTitle>
        <CardDescription>
          This is not a sentiment widget. It is the current weight of evidence on both sides.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <SignalColumn
            title="Bullish"
            tone="gain"
            icon={<TrendingUp className="h-4 w-4" />}
            items={signals.bullish}
          />
          <SignalColumn
            title="Bearish"
            tone="loss"
            icon={<Scale className="h-4 w-4" />}
            items={signals.bearish}
          />
        </div>

        <div className="rounded-[var(--radius-lg)] border border-accent-ai/10 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--accent-ai)_8%)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="section-kicker">ALQIS read</p>
              <p className="mt-2 text-base font-medium text-ink">{signals.sentimentBand}</p>
            </div>
            <Badge variant="ai" size="md">
              {signals.targetPrice}
            </Badge>
          </div>
          <p className="mt-3 text-body text-ink">{signals.alqisRead}</p>
          <p className="mt-2 text-body-sm text-ink-muted">{signals.analystSummary}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function SignalColumn({
  title,
  tone,
  icon,
  items,
}: {
  title: string;
  tone: "gain" | "loss";
  icon: ReactNode;
  items: StockDetailData["signals"]["bullish"];
}) {
  const badgeVariant = tone === "gain" ? "gain" : "loss";
  const iconClass = tone === "gain" ? "text-gain" : "text-loss";

  return (
    <section className="rounded-[var(--radius-lg)] border border-border/70 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--surface)_18%)] p-4">
      <div className="mb-4 flex items-center gap-2 border-b border-border/50 pb-3">
        <span className={iconClass}>{icon}</span>
        <Badge variant={badgeVariant} size="md">
          {title}
        </Badge>
      </div>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.title} className="space-y-1">
            <p className="text-sm font-medium text-ink">{item.title}</p>
            <p className="text-body-sm text-ink-muted">{item.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TopNewsCard({ data }: { data: StockDetailData }) {
  return (
    <Card variant="subtle" radius="xl" className="h-full border-border/72">
      <CardHeader>
        <CardEyebrow>ALQIS news filter</CardEyebrow>
        <CardTitle>News that changes the explanation.</CardTitle>
        <CardDescription>
          Each item is paired with why it matters to the current price narrative.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {data.news.map((item) => (
          <article
            key={`${item.source}-${item.headline}`}
            className="rounded-[var(--radius-lg)] border border-border/70 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--surface)_18%)] p-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" size="sm" className="normal-case tracking-normal">
                <Newspaper className="h-3.5 w-3.5" />
                {item.source}
              </Badge>
              <span className="text-body-sm text-ink-subtle">{item.time}</span>
            </div>

            <h3 className="mt-3 text-lg font-medium tracking-tight text-ink">
              {item.headline}
            </h3>
            <p className="mt-2 text-body text-ink-muted">{item.summary}</p>
            <div className="mt-3 rounded-[var(--radius-md)] border border-border/60 bg-surface/45 px-3 py-3">
              <p className="section-kicker">Why it matters</p>
              <p className="mt-2 text-body-sm text-ink">{item.whyItMatters}</p>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

function PeerComparisonCard({ data }: { data: StockDetailData }) {
  return (
    <Card variant="subtle" radius="xl" className="h-full border-border/72">
      <CardHeader>
        <CardEyebrow>Peer read-through</CardEyebrow>
        <CardTitle>How the rest of the stack is confirming the read.</CardTitle>
        <CardDescription>
          ALQIS uses peers to test whether today&apos;s move is isolated or supported across the stack.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {data.peers.map((peer) => (
          <article
            key={peer.symbol}
            className="rounded-[var(--radius-lg)] border border-border/70 bg-[color-mix(in_srgb,var(--surface-elevated)_80%,var(--surface)_20%)] p-4"
          >
            <div className="flex flex-col gap-3 min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-semibold tracking-tight text-ink">
                    {peer.symbol}
                  </span>
                  <span className="break-words text-body-sm text-ink-muted">{peer.name}</span>
                </div>
                <p className="mt-2 text-body-sm text-ink-muted">{peer.note}</p>
              </div>

              <div className="shrink-0 text-left min-[430px]:text-right">
                <p className="text-base font-medium text-ink" data-numeric>
                  {peer.price}
                </p>
                <Delta value={peer.changePct} size="sm" />
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,1fr)_8.25rem] sm:items-end">
              <div className="min-w-0 rounded-[var(--radius-md)] border border-border/60 bg-surface/38 px-3 py-3">
                <div className="flex items-center gap-2 text-body-sm text-ink-subtle">
                  <Radar className="h-4 w-4" />
                  {peer.readThrough}
                </div>
                <Badge
                  variant="outline"
                  size="sm"
                  className="mt-2 normal-case tracking-normal"
                >
                  {peer.timeframe}
                </Badge>
              </div>
              <div className="rounded-[var(--radius-md)] border border-border/60 bg-[color-mix(in_srgb,var(--surface)_88%,var(--accent-secondary)_12%)] px-3 py-2">
                <p className="section-kicker mb-1">Trend</p>
                <SparklineChart
                  data={peer.points}
                  trend={peer.changePct >= 0 ? "up" : "down"}
                  className="h-10 w-full"
                />
              </div>
            </div>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}
