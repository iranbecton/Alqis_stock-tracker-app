import Link from "next/link";
import { AlertTriangle, MoreVertical } from "lucide-react";
import { AlertsNavLink } from "@/components/alerts/alerts-nav-link";
import { StockAlertEntryButton } from "@/components/alerts/stock-alert-entry-button";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import { TickerSearch } from "@/components/stocks/ticker-search";
import { Badge } from "@/components/ui/badge";
import { Delta } from "@/components/ui/delta";
import { Disclaimer } from "@/components/ui/disclaimer";
import { PageContainer, PageShell } from "@/components/ui/layout";
import { WatchlistToggle } from "@/components/watchlist/watchlist-toggle";
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
import type { UserChartRange } from "@/lib/preferences/types";
import type { StockDataHealth } from "@/lib/stocks/stock-data-health";
import { StockIntelligenceNavigator } from "./stock-intelligence-navigator";

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
  movePct?: number;
  confidenceScore?: number;
  confidenceBand?: string;
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
  defaultChartRange?: UserChartRange;
};

export function StockDetailPage({
  stock,
  marketData,
  explanation,
  aiWording,
  aiWordingStatus,
  isWatchlisted = false,
  recentReads = [],
  defaultChartRange = "1D",
}: StockDetailPageProps) {
  const data = stock
    ? createStockDetailData(
        stock,
        marketData,
        explanation,
        aiWording,
        aiWordingStatus
      )
    : stockDetailDemoData;
  const shouldShowProviderNotice =
    marketData?.providerState === "fallback" || marketData?.providerState === "empty";

  return (
    <main className="alqis-stock-shell">
      <TopBar />

      <PageContainer className="max-w-[116rem]">
        <PageShell className="gap-2 pt-1 pb-8 lg:gap-2">
          <ReferenceStockCommandHeader
            data={data}
            asOf={data.asOf}
            isWatchlisted={isWatchlisted}
            recentReads={recentReads}
            dataHealth={marketData?.dataHealth}
          />

          {shouldShowProviderNotice ? (
            <div className="relative flex gap-3 border border-warn/22 bg-warn-bg/24 px-4 py-3 text-body-sm text-ink-muted">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warn" />
              <p>
                {marketData?.providerMessage ??
                  "Market data is partially available. ALQIS is labeling missing provider context instead of filling the page with unsupported evidence."}
              </p>
            </div>
          ) : null}

          <StockIntelligenceNavigator
            data={data}
            dataHealth={marketData?.dataHealth}
            recentReads={recentReads}
            defaultChartRange={toStockDetailChartRange(defaultChartRange)}
          />

          <Disclaimer
            variant="banner"
            className="relative rounded-[0.9rem] border-accent-ai/12 bg-[#07111f]/62 px-3 py-2"
          />
        </PageShell>
      </PageContainer>
    </main>
  );
}

function ReferenceStockCommandHeader({
  data,
  asOf,
  isWatchlisted,
  recentReads,
  dataHealth,
}: {
  data: StockDetailData;
  asOf: string;
  isWatchlisted: boolean;
  recentReads: ExplanationHistoryItem[];
  dataHealth?: StockDataHealth;
}) {
  const latestRead = recentReads.find((read) => read.ticker === data.company.symbol);
  const isPositive = data.company.dailyChangePct >= 0;
  const quoteTiles = [
    {
      label: "Latest data",
      value: asOf,
      detail: data.company.priceReadLabel ?? "Market delayed",
    },
    {
      label: "Open",
      value: getQuoteStatValue(data, "Open"),
      detail: data.company.quoteSourceLabel ?? "Quote source",
    },
    {
      label: "High",
      value: getQuoteStatValue(data, "High"),
      detail: "Session high",
    },
    {
      label: "Low",
      value: getQuoteStatValue(data, "Low"),
      detail: "Session low",
    },
    {
      label: "Previous close",
      value: getQuoteStatValue(data, "Prev close"),
      detail: "Reference close",
    },
    {
      label: "Status",
      value: dataHealth?.userFacingLabel ?? data.company.marketStatus,
      detail: data.company.quoteSourceLabel ?? "Provider status",
    },
  ];

  return (
    <section className="relative overflow-hidden border border-[#47739f]/70 bg-[radial-gradient(circle_at_14%_28%,rgba(128,217,225,0.25),transparent_17rem),radial-gradient(circle_at_34%_54%,rgba(71,209,198,0.17),transparent_18rem),radial-gradient(circle_at_87%_18%,rgba(72,144,255,0.21),transparent_22rem),linear-gradient(145deg,#132d48,#071322_48%,#050b14_100%)] p-3 shadow-[0_38px_120px_rgba(0,0,0,0.66),0_0_100px_rgba(47,128,200,0.18),inset_0_1px_0_rgba(220,244,255,0.22),inset_0_-32px_78px_rgba(3,7,13,0.46)] xl:grid xl:grid-cols-[minmax(0,1fr)_30rem]">
      <div className="pointer-events-none absolute -left-24 top-2 h-44 w-80 rounded-full bg-[#7bdcd5]/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-12 h-32 w-96 rounded-full bg-[#4d86ff]/10 blur-3xl" />
      <div className="pointer-events-none absolute -top-10 left-20 h-24 w-[54rem] rotate-[-5deg] bg-[linear-gradient(90deg,transparent,rgba(178,231,255,0.13),transparent)] blur-xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#b9e8ff]/82 to-transparent" />
      <div className="pointer-events-none absolute inset-x-6 bottom-0 h-px bg-gradient-to-r from-transparent via-[#3f75a6]/80 to-transparent" />

      <div className="relative min-w-0 xl:border-r xl:border-[#315a83]/55 xl:pr-4">
        <div className="min-w-0">
          <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start">
            <div className="flex min-w-0 items-start gap-2.5">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg border border-[#5380ad] bg-[linear-gradient(145deg,#244a74,#0b1727)] text-base font-black text-white shadow-[0_0_42px_rgba(78,147,227,0.34),inset_0_1px_0_rgba(190,233,255,0.14)]">
                {data.company.symbol.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-serif text-[3.55rem] font-semibold leading-none tracking-[-0.04em] text-[#f2f6ff] sm:text-[4.35rem]">
                    {data.company.symbol}
                  </h1>
                  <span className="border border-[#2f72d5]/24 bg-[#07111f] px-2 py-1 text-[0.64rem] font-bold uppercase tracking-[0.18em] text-[#7fa6d8]">
                    {data.company.exchange}
                  </span>
                  <Badge variant="ai" size="sm" className="border-accent-ai/20 bg-accent-ai/10 text-[#cdd8ff]">
                    ALQIS Read active
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-[#8ea3bf]">
                  {data.company.name} / {data.company.sector}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-1.5 border px-2 py-1 font-semibold ${
                      isPositive
                        ? "border-gain/24 bg-gain/8 text-gain"
                        : "border-loss/24 bg-loss/8 text-loss"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {data.company.priceReadLabel ?? "Market delayed"}
                  </span>
                  <span className="border border-[#2f72d5]/18 bg-[#07111f]/82 px-2 py-1 font-semibold text-[#9eb2cd]">
                    {data.company.quoteSourceLabel ?? "Data limited"}
                  </span>
                  <InlineDataStatus health={dataHealth} />
                </div>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-start gap-2 lg:justify-end">
              <WatchlistToggle
                ticker={data.company.symbol}
                companyName={data.company.name}
                initialSaved={isWatchlisted}
              />
              <StockAlertEntryButton
                mode="icon"
                initialTicker={data.company.symbol}
                initialCompanyName={data.company.name}
              />
              <button
                type="button"
                className="grid h-10 w-10 place-items-center border border-[#2f72d5]/20 bg-[#07111f]/72 text-[#b8c8df] transition hover:border-[#4f9bff]/42 hover:text-[#eef6ff]"
                aria-label="More stock actions"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="font-serif text-[5.1rem] font-semibold leading-none tracking-[-0.045em] text-[#f5f8ff] sm:text-[6.3rem]" data-numeric>
                {data.company.price}
              </p>
              <Delta
                value={data.company.dailyChangePct}
                absoluteChange={data.company.dailyChange}
                format="both"
                size="lg"
                className="text-2xl font-bold drop-shadow-[0_0_16px_rgba(99,207,168,0.26)]"
              />
            </div>
            <p className="max-w-3xl border-l border-[#5aa6d6] bg-[linear-gradient(90deg,rgba(13,39,64,0.92),rgba(7,20,35,0.52))] px-3 py-2 text-[0.88rem] font-medium leading-6 text-[#b7c8dc]">
              {data.company.oneLineSummary}
            </p>
          </div>

          <div className="mt-2 grid gap-px overflow-hidden border border-[#28466f]/54 bg-[#28466f]/54 sm:grid-cols-4">
            <CompactHeaderMetric
              label="Last read"
              value={latestRead ? formatDateTime(latestRead.generatedAt) : "No saved read"}
            />
            <CompactHeaderMetric
              label="Confidence"
              value={latestRead?.confidenceLabel ?? data.explanation.confidenceSummary.split(".")[0] ?? "Read pending"}
            />
            <CompactHeaderMetric
              label="Data status"
              value={dataHealth?.userFacingLabel ?? data.company.priceReadLabel ?? "Data limited"}
              tone={dataHealth?.overallStatus === "complete" ? "text-accent-secondary" : "text-[#d8e8ff]"}
            />
            <CompactHeaderMetric
              label="Watchlist"
              value={isWatchlisted ? "Saved" : "Not saved"}
              tone={isWatchlisted ? "text-accent-secondary" : "text-[#d8e8ff]"}
            />
          </div>
        </div>
      </div>

        <div className="relative mt-3 grid grid-cols-2 gap-px overflow-hidden border border-[#47739f]/48 bg-[#2d527b]/24 shadow-[0_30px_78px_rgba(0,0,0,0.46),inset_0_1px_0_rgba(180,224,255,0.14),inset_0_-26px_58px_rgba(3,7,13,0.36)] xl:mt-0 xl:border-l-0">
          <div className="col-span-2 flex items-center justify-between border-b border-[#35618d]/55 bg-[linear-gradient(180deg,#10263e,#081523)] px-3 py-1.5">
            <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-[#8eb8d8]">Quote panel</p>
            <p className="text-[0.66rem] font-bold text-[#78d9d1]">{data.company.quoteSourceLabel ?? "Data limited"}</p>
          </div>
          {quoteTiles.map((tile) => (
            <div key={tile.label} className="min-h-[4.05rem] bg-[radial-gradient(circle_at_100%_0%,rgba(128,217,225,0.07),transparent_7rem),linear-gradient(180deg,rgba(16,34,56,0.96),rgba(7,17,31,0.92))] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(128,217,225,0.08),inset_0_-14px_28px_rgba(3,7,13,0.24)]">
              <p className="section-kicker text-[#6b86a8]">{tile.label}</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-[#eef6ff]" data-numeric>
                {tile.value}
              </p>
              <p className="mt-0.5 truncate text-[0.68rem] font-medium text-[#6f87a6]">
                {tile.detail}
              </p>
            </div>
          ))}
        </div>
    </section>
  );
}

function InlineDataStatus({ health }: { health?: StockDataHealth }) {
  const isComplete = health?.overallStatus === "complete";
  const label = health?.userFacingLabel ?? "Data limited";

  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-1 font-semibold ${
        isComplete
          ? "border-gain/24 bg-gain/8 text-gain"
          : "border-warn/24 bg-warn-bg/24 text-warn"
      }`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {isComplete ? "Live data" : label}
    </span>
  );
}

function CompactHeaderMetric({
  label,
  value,
  tone = "text-[#d8e8ff]",
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="bg-[#07111f]/88 px-2.5 py-1.5">
      <p className="section-kicker text-[#647f9f]">{label}</p>
      <p className={`mt-0.5 truncate text-xs font-semibold ${tone}`} data-numeric>
        {value}
      </p>
    </div>
  );
}

function createStockDetailData(
  stock: DemoStock,
  marketData?: StockDetailMarketData,
  explanationResponse?: WhyMovingResponse,
  aiWording?: AIWordingOutput,
  aiWordingStatus?: AIWordingStatus
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
          value: dailyChangePercent >= 0 ? "Price up" : "Price down",
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
          aiWordingStatus
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
    metrics: createTickerMetrics(stock),
    news: liveNews?.length
      ? liveNews
          .slice(0, 5)
          .map((item) => normalizeNewsItem(item, stock, explanationResponse))
      : createTickerFallbackNews(stock),
    signals: createTickerSignals(stock, quote, marketData, explanationResponse),
    peers: createTickerPeers(stock),
  };
}

function toStockDetailChartRange(range: UserChartRange): StockDetailChartRange {
  if (range === "5D") return "5d";
  if (range === "1M" || range === "6M" || range === "1Y") return "1m";
  return "1d";
}

function createStructuredExplanation(
  response: WhyMovingResponse,
  aiWording?: AIWordingOutput,
  aiWordingStatus?: AIWordingStatus
) {
  const keyFactors = Array.isArray(response.keyFactors)
    ? response.keyFactors
    : [];
  const counterEvidence = Array.isArray(response.counterEvidence)
    ? response.counterEvidence
    : [];
  const confidence = createSafeConfidence(response.confidence);
  const generatedAt = response.generatedAt ?? new Date().toISOString();
  const expiresAt = response.expiresAt ?? generatedAt;
  const movePct = typeof response.movePct === "number" ? response.movePct : 0;
  const sourceCount =
    typeof response.sourceCount === "number" ? response.sourceCount : keyFactors.length;
  const chartMovePct = response.chartMovePct;
  const hasChartConfirmation = typeof chartMovePct === "number";
  const chartMove =
    hasChartConfirmation
      ? formatPercent(chartMovePct)
      : "unavailable";
  const validatedAIWording = aiWordingStatus === "ok" ? aiWording : undefined;

  return {
    ...stockDetailDemoData.explanation,
    headline: validatedAIWording ? validatedAIWording.headline : response.summary,
    freshness: `Generated ${formatDateTime(generatedAt)}`,
    summary: validatedAIWording
      ? validatedAIWording.summary
      : `${confidence.label}. ${response.dailyMoveLabel ?? "Daily move"}: ${formatPercent(movePct)}. ${response.chartMoveLabel ?? "Chart-window move"}: ${chartMove}.`,
    plainEnglishRead: validatedAIWording
      ? validatedAIWording.plainEnglishRead
      : undefined,
    aiWhyItMatters: validatedAIWording
      ? validatedAIWording.whyItMatters
      : undefined,
    confidence: confidence.band,
    movePct,
    confidenceScore: confidence.score,
    confidenceBand: confidence.band,
    sourceCount,
    confidenceSummary: `ALQIS confidence is ${confidence.label.toLowerCase()} (${Math.round(confidence.score * 100)}%). This read expires ${formatDateTime(expiresAt)} unless refreshed.`,
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
    reasons: keyFactors.length
      ? keyFactors.slice(0, 3).map((factor) => ({
      label: factor.label,
      score: Math.round(factor.score * 100),
      detail: `${factor.description} ${formatEvidenceType(factor.evidenceType)} evidence; ${formatMoveAlignment(factor.moveAlignment)}${factor.newsRelevance ? `; ${formatNewsRelevance(factor.newsRelevance)}` : ""}. Evidence count: ${factor.evidenceCount}.`,
        }))
      : [
          {
            label: "Evidence is limited",
            score: 42,
            detail:
              "ALQIS received a structured response without usable factor details, so the read is kept cautious.",
          },
        ],
    counterEvidence: counterEvidence.length
      ? counterEvidence.map((item) => ({
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
    evidence: keyFactors.length
      ? keyFactors.slice(0, 3).map((factor) => ({
          time: `${factor.evidenceCount} signal${factor.evidenceCount === 1 ? "" : "s"}`,
          title: factor.label,
          detail: `${factor.description} Evidence type: ${formatEvidenceType(factor.evidenceType)}. Move alignment: ${formatMoveAlignment(factor.moveAlignment)}${factor.newsRelevance ? `. Relevance: ${formatNewsRelevance(factor.newsRelevance)}` : ""}.`,
        }))
      : [
          {
            time: "Data limited",
            title: "Structured evidence limited",
            detail:
              "ALQIS could not attach specific factor evidence to this read, so confidence should stay cautious.",
          },
        ],
    changeTriggers: [
      "The quote move reverses or materially weakens.",
      "New ticker-specific news contradicts the current event tag.",
      "The selected chart timeframe stops confirming the move.",
    ],
  };
}

function createSafeConfidence(confidence: WhyMovingResponse["confidence"] | undefined) {
  const safeBand =
    confidence?.band === "A" ||
    confidence?.band === "B" ||
    confidence?.band === "C" ||
    confidence?.band === "D"
      ? confidence.band
      : "D";
  const safeLabel =
    typeof confidence?.label === "string" && confidence.label.length
      ? confidence.label
      : "Low confidence";
  const safeScore =
    typeof confidence?.score === "number" && Number.isFinite(confidence.score)
      ? confidence.score
      : 0;

  return {
    band: safeBand,
    label: safeLabel,
    score: safeScore,
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
  const keyFactors = Array.isArray(explanationResponse?.keyFactors)
    ? explanationResponse.keyFactors
    : [];
  const safePoints = Array.isArray(points) ? points : [];
  const evidenceFactor = keyFactors.find(
    (factor) =>
      factor.evidenceCount > 0 &&
      factor.moveAlignment === "supports_move" &&
      !factor.label?.toLowerCase().includes("intraday")
  );

  if (safePoints.length < 3) {
    return [];
  }

  const labels = ["E1", "E2", "E3", "E4", "E5"];
  const markerCount = Math.min(labels.length, Math.max(3, Math.floor(safePoints.length / 4)));
  const factorLabel = evidenceFactor?.label ?? "Sample evidence context";
  const factorDetail =
    evidenceFactor?.description ??
    "Sample evidence context. This marker position is illustrative until evidence timestamps are mapped to the chart.";

  return labels.slice(0, markerCount).map((label, index) => {
    const pointIndex = Math.min(
      safePoints.length - 2,
      Math.max(1, Math.round(((index + 1) * (safePoints.length - 1)) / (markerCount + 1)))
    );

    return {
      index: pointIndex,
      label,
      kind: "event" as const,
      time: safePoints[pointIndex]?.label ?? "Sample point",
      title: `${stock.symbol}: ${factorLabel}`,
      explanation: factorDetail,
      whyItMatters: "Sample evidence context. Pin placement is illustrative.",
    };
  });
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
  const keyFactors = Array.isArray(explanationResponse?.keyFactors)
    ? explanationResponse.keyFactors
    : [];

  if (!keyFactors.length) {
    return undefined;
  }

  const text = getNewsSearchText(item);

  return keyFactors.find((factor) =>
    factorMatchesNewsText(factor.label ?? "", text)
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

function createTickerMetrics(stock: DemoStock): StockDetailData["metrics"] {
  return [
    {
      label: "Market cap",
      value: "—",
      context: `${stock.symbol} value unavailable from the current Finnhub profile contract.`,
    },
    {
      label: "P/E",
      value: "—",
      context: "Valuation multiple provider is not connected yet.",
    },
    {
      label: "Fwd P/E",
      value: "—",
      context: "Forward valuation provider is not connected yet.",
    },
    {
      label: "EPS",
      value: "—",
      context: "Fundamental EPS provider is not connected yet.",
    },
    {
      label: "Div yield",
      value: "—",
      context: "Dividend yield provider is not connected yet.",
    },
    {
      label: "Beta",
      value: "—",
      context: "Beta provider is not connected yet.",
    },
    {
      label: "52W high",
      value: "—",
      context: "52-week range is unavailable from the current quote response.",
    },
    {
      label: "Volume",
      value: "—",
      context: "Volume is unavailable from the current quote response.",
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
  const confidenceLabel = explanationResponse?.confidence?.label ?? "Read pending";
  const confidenceBand = explanationResponse?.confidence?.band ?? "C";
  const expiresAt = explanationResponse?.expiresAt
    ? formatDateTime(explanationResponse.expiresAt)
    : "the next refresh";
  const keyFactors = Array.isArray(explanationResponse?.keyFactors)
    ? explanationResponse.keyFactors
    : [];
  const topFactor = keyFactors[0];
  const topFactorLabel = topFactor?.label ?? "Structured evidence unavailable";
  const topFactorDetail = topFactor?.description ?? "ALQIS did not receive a usable factor label for this read.";

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
          ? `ALQIS is scoring quote, chart, and news inputs for ${stock.symbol}. Primary factor: ${topFactorLabel}.`
          : "The stock detail page keeps the structure visible while provider access is resolved.",
      },
      {
        title: hasStructuredExplanation ? topFactorLabel : "Structured evidence unavailable",
        detail: hasStructuredExplanation ? topFactorDetail : "The read remains in a Data limited state until structured evidence returns.",
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
      "External opinion synthesis remains separate; this module summarizes ALQIS structured evidence only.",
    targetPrice: hasStructuredExplanation
      ? confidenceLabel
      : "Valuation view deferred",
    sentimentBand: hasStructuredExplanation
      ? `${isPositive ? "Up" : "Down"} move, ${confidenceBand}-band read`
      : isPositive
        ? "Price up, read pending"
        : "Price down, read pending",
    alqisRead: hasStructuredExplanation
      ? `ALQIS is combining live market inputs with a structured ${stock.symbol} explanation, then separating the causal read from external-opinion or valuation modules.`
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

function getQuoteStatValue(data: StockDetailData, label: string) {
  const stat = data.company.quoteStats?.find((item) => item.label === label);
  if (!stat || stat.value === "Unavailable") {
    return "—";
  }

  return stat.value;
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
  const navItems = [
    { label: "Today", href: "/dashboard" },
    { label: "Watchlist", href: "/dashboard" },
    { label: "Portfolio", href: "/dashboard" },
    { label: "Explore", href: "/dashboard" },
    { label: "Alerts", href: "/alerts" },
    { label: "Learn", href: "/learn" },
  ];

  return (
    <header className="alqis-stock-rail relative z-10 border-b">
      <PageContainer className="grid max-w-[116rem] gap-2 py-2 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-fit items-center gap-2.5">
          <AlqisLogo variant="lockup" tone="dark" size="sm" priority />
          <div>
            <p className="section-kicker text-[#5f7898]">Vol. 1 / Stock workspace</p>
            <p className="hidden text-xs text-ink-muted xl:block">
              Explanation first / proof second / data third
            </p>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-2 md:flex-row md:items-center md:justify-center">
          <nav className="scrollbar-hide flex w-full min-w-0 gap-1 overflow-x-auto whitespace-nowrap md:justify-start lg:justify-center" aria-label="Stock page navigation">
            {navItems.map((item) =>
              item.label === "Alerts" ? (
                <AlertsNavLink
                  key={item.label}
                  className="flex-shrink-0 rounded-full px-2 py-1 text-[0.72rem] font-semibold text-[#8197b4] transition hover:bg-[#12243d] hover:text-[#d8e8ff] md:px-2.5"
                />
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex-shrink-0 rounded-full px-2 py-1 text-[0.72rem] font-semibold text-[#8197b4] transition hover:bg-[#12243d] hover:text-[#d8e8ff] md:px-2.5"
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>
          <TickerSearch
            chrome="nav"
            placeholder="Search a ticker, open an ALQIS Read..."
            className="hidden lg:block lg:min-w-[18rem] xl:min-w-[25rem]"
          />
        </div>

        <div className="flex items-center gap-2 justify-self-start lg:justify-self-end">
          <div className="hidden rounded-[0.65rem] border border-[#213d63]/72 bg-[#07111f]/70 px-3 py-1.5 text-xs text-[#a9bad0] sm:block">
            <span className="section-kicker mr-2 text-[#5f7898]">Today</span>
            <span className="text-accent-secondary">Market context</span>
          </div>
          <Link
            href="/dashboard"
            className="rounded-[0.65rem] border border-accent-secondary/24 bg-accent-secondary/8 px-3 py-1.5 text-xs font-semibold text-accent-secondary"
          >
            Get ALQIS Read
          </Link>
          <Link
            href="/profile"
            aria-label="Open profile settings"
            className="grid h-8 w-8 place-items-center rounded-full border border-accent-ai/28 bg-accent-ai/18 text-xs font-semibold text-[#dfe7ff] transition hover:border-accent-secondary/45 hover:text-[#f4f8ff]"
          >
            A
          </Link>
        </div>
      </PageContainer>
    </header>
  );
}
