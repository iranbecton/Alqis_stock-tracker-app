import type {
  CauseScore,
  ExplanationInputBundle,
} from "@/lib/explanation/types";

function clampScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getChartMovePercent(input: ExplanationInputBundle) {
  const points = input.chart?.points ?? [];
  const first = points[0]?.close;
  const last = points[points.length - 1]?.close;

  if (!first || !last) {
    return 0;
  }

  return ((last - first) / first) * 100;
}

export function scoreCauses(input: ExplanationInputBundle): CauseScore[] {
  const quoteMove = input.quote?.changePercent ?? 0;
  const chartMove = getChartMovePercent(input);
  const newsItems = input.news?.items ?? [];
  const hasLiveChart =
    input.chart?.status === "ok" &&
    input.chart.fallback === null &&
    input.chart.points.length > 0;
  const direction = quoteMove >= 0 ? "higher" : "lower";

  return [
    {
      category: "price_action",
      label: "Price action",
      score: clampScore(55 + Math.min(Math.abs(quoteMove) * 8, 35)),
      detail: `${input.ticker} is trading ${direction} by ${quoteMove.toFixed(2)}% versus the previous close.`,
      evidence: [
        `Last price ${input.quote?.price ?? "unavailable"}`,
        `Previous close ${input.quote?.previousClose ?? "unavailable"}`,
      ],
    },
    {
      category: "news_flow",
      label: "News flow",
      score: clampScore(newsItems.length ? 58 + Math.min(newsItems.length * 6, 30) : 28),
      detail: newsItems.length
        ? `${newsItems.length} ticker-filtered news item${newsItems.length === 1 ? "" : "s"} may be contributing context.`
        : "No clean ticker-specific news item was available from the news feed.",
      evidence: newsItems.slice(0, 3).map((item) => item.headline),
    },
    {
      category: "volume_context",
      label: "Chart confirmation",
      score: clampScore(hasLiveChart ? 52 + Math.min(Math.abs(chartMove) * 10, 35) : 22),
      detail: hasLiveChart
        ? `${input.timeframe} chart data is connected and shows a ${chartMove.toFixed(2)}% move across the selected window.`
        : `${input.timeframe} chart data is unavailable or in fallback mode, so chart confirmation is limited.`,
      evidence: [
        hasLiveChart
          ? `${input.chart?.points.length ?? 0} chart points from ${input.chart?.provider ?? "provider"}`
          : "No live chart confirmation",
      ],
    },
    {
      category: "data_quality",
      label: "Data quality",
      score: clampScore(
        (input.quote ? 35 : 0) +
          (hasLiveChart ? 35 : 0) +
          (newsItems.length ? 30 : 0)
      ),
      detail: "This score reflects whether quote, chart, and news inputs are all available for the explanation.",
      evidence: [
        `Quote ${input.quote ? "connected" : "missing"}`,
        `Chart ${hasLiveChart ? "connected" : "limited"}`,
        `News ${newsItems.length ? "connected" : "limited"}`,
      ],
    },
  ];
}
