import type {
  CauseScore,
  ConfidenceScore,
  ExplanationInputBundle,
  WhyMovingExplanation,
} from "@/lib/explanation/types";

const DISCLAIMER =
  "ALQIS explanations are informational only and do not constitute investment advice.";

function formatSignedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function createFallbackExplanation({
  input,
  causes,
  confidence,
}: {
  input: ExplanationInputBundle;
  causes: CauseScore[];
  confidence: ConfidenceScore;
}): WhyMovingExplanation {
  const move = input.quote?.changePercent ?? 0;
  const direction = move >= 0 ? "higher" : "lower";
  const newsCount = input.news?.items.length ?? 0;
  const chartConnected =
    input.chart?.status === "ok" &&
    input.chart.fallback === null &&
    input.chart.points.length > 0;

  return {
    ticker: input.ticker,
    timeframe: input.timeframe,
    title: "Why Is It Moving?",
    headline: `${input.ticker} is trading ${direction} as market data updates the read.`,
    summary: `${input.ticker} is moving ${formatSignedPercent(move)} in the selected window. The first read is based on live quote data${chartConnected ? ", connected chart data" : ""}${newsCount ? `, and ${newsCount} ticker-filtered news item${newsCount === 1 ? "" : "s"}` : ""}. AI generation can refine this once the model provider is enabled.`,
    confidence,
    causes,
    counterEvidence: [
      chartConnected
        ? "Chart data is connected, but intraday moves can still reverse quickly."
        : "Chart data is unavailable or limited, reducing confidence in price-action confirmation.",
      newsCount
        ? "News can explain context, but not every headline is causal."
        : "No clean ticker-specific news item was available, so the read leans more heavily on price action.",
    ],
    whatWouldChangeThisRead: [
      "A reversal in the live quote move.",
      "A new company-specific headline that contradicts the current direction.",
      "Chart confirmation weakening across the selected timeframe.",
    ],
    sourceCount: Number(Boolean(input.quote)) + Number(chartConnected) + newsCount,
    freshness: "Generated from current ALQIS market-data endpoints.",
    generatedAt: new Date().toISOString(),
    mode: "fallback",
    disclaimer: DISCLAIMER,
  };
}
