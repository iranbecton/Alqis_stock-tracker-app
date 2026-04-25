import type {
  CauseScore,
  ConfidenceScore,
  ExplanationInputBundle,
} from "@/lib/explanation/types";

export function buildWhyMovingPrompt({
  input,
  causes,
  confidence,
}: {
  input: ExplanationInputBundle;
  causes: CauseScore[];
  confidence: ConfidenceScore;
}) {
  const quote = input.quote;
  const news = input.news?.items.slice(0, 5) ?? [];

  return [
    "You are ALQIS, a premium market-intelligence assistant.",
    "Explain why a stock is moving using only the provided quote, chart, and news data.",
    "Do not provide investment advice. Do not recommend buy, sell, or hold.",
    "Return concise JSON only with headline, summary, causes, counterEvidence, and whatWouldChangeThisRead.",
    "",
    `Ticker: ${input.ticker}`,
    `Timeframe: ${input.timeframe}`,
    `Quote: ${quote ? JSON.stringify(quote) : "missing"}`,
    `Chart status: ${input.chart?.status ?? "missing"}`,
    `Chart points: ${input.chart?.points.length ?? 0}`,
    `News: ${JSON.stringify(news)}`,
    `Cause scores: ${JSON.stringify(causes)}`,
    `Confidence: ${JSON.stringify(confidence)}`,
  ].join("\n");
}
