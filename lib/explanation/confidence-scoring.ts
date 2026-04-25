import type {
  CauseScore,
  ConfidenceBand,
  ConfidenceScore,
  ExplanationInputBundle,
} from "@/lib/explanation/types";

function getBand(score: number): ConfidenceBand {
  if (score >= 78) {
    return "high";
  }

  if (score >= 52) {
    return "medium";
  }

  return "low";
}

export function scoreConfidence(
  input: ExplanationInputBundle,
  causes: CauseScore[]
): ConfidenceScore {
  const hasQuote = Boolean(input.quote);
  const hasChart =
    input.chart?.status === "ok" &&
    input.chart.fallback === null &&
    Boolean(input.chart.points.length);
  const hasNews = Boolean(input.news?.items.length);
  const causeAverage =
    causes.reduce((total, cause) => total + cause.score, 0) /
    Math.max(causes.length, 1);
  const dataQualityBonus = (hasQuote ? 12 : 0) + (hasChart ? 12 : 0) + (hasNews ? 8 : 0);
  const score = Math.max(0, Math.min(100, Math.round(causeAverage * 0.72 + dataQualityBonus)));
  const band = getBand(score);

  return {
    score,
    band,
    rationale:
      band === "high"
        ? "Quote, chart, and news inputs are strong enough for a high-confidence first read."
        : band === "medium"
          ? "The read is supported, but at least one input needs more confirmation."
          : "The explanation should be treated as provisional because key inputs are missing or weak.",
    dataQuality: {
      quote: hasQuote,
      chart: hasChart,
      news: hasNews,
    },
  };
}
