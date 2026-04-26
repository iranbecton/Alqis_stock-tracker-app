import { chartAlignsWithQuote } from "@/lib/ai/cause-scoring";
import type {
  CauseCandidate,
  Confidence,
  ConfidenceBand,
  ConfidenceLabel,
  WhyMovingInputs,
} from "@/lib/ai/types";
import { evaluateStockDataHealth } from "@/lib/stocks/stock-data-health";

function getBand(score: number): ConfidenceBand {
  if (score >= 0.85) return "A";
  if (score >= 0.7) return "B";
  if (score >= 0.55) return "C";
  return "D";
}

function getLabel(band: ConfidenceBand): ConfidenceLabel {
  if (band === "A") return "High confidence";
  if (band === "B") return "Good confidence";
  if (band === "C") return "Moderate confidence";
  return "Low confidence";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function hasStrongTickerCatalyst(cause?: CauseCandidate) {
  return Boolean(
    cause &&
      cause.score >= 0.85 &&
      cause.evidenceCount >= 2 &&
      cause.tickerRelevance >= 0.75 &&
      cause.isSpecific &&
      cause.isDirectCatalyst &&
      cause.evidenceType === "direct" &&
      cause.newsRelevance === "direct_company" &&
      cause.moveAlignment === "supports_move"
  );
}

function hasCleanDirectCatalystSet(causes: CauseCandidate[]) {
  const topThree = causes.slice(0, 3);

  return (
    topThree.length > 0 &&
    topThree.every(
      (cause) =>
        cause.evidenceType === "direct" &&
        cause.moveAlignment === "supports_move" &&
        cause.newsRelevance === "direct_company"
    )
  );
}

function hasAlignedDirectEvidence(causes: CauseCandidate[]) {
  return causes.some(
    (cause) =>
      cause.evidenceType === "direct" &&
      cause.moveAlignment === "supports_move" &&
      cause.tag !== "PRICE_ACTION"
  );
}

function hasMostlyContextualTopFactors(causes: CauseCandidate[]) {
  const topFactors = causes.slice(0, 2);

  if (!topFactors.length) {
    return true;
  }

  return topFactors.every(
    (cause) =>
      cause.evidenceType === "contextual" ||
      cause.moveAlignment !== "supports_move" ||
      cause.tag === "UNKNOWN"
  );
}

export function scoreConfidence(
  inputs: WhyMovingInputs,
  causes: CauseCandidate[]
): Confidence {
  const topCause = causes[0];
  const dataHealth = evaluateStockDataHealth({
    quote: inputs.quote,
    profile: inputs.companyName
      ? {
          companyName: inputs.companyName,
          sector: inputs.sector,
        }
      : null,
    chartPoints: inputs.chartPoints,
    news: inputs.newsItems,
    chartRanges: {
      [inputs.timeframe]: {
        status: inputs.chartStatus,
        fallback: inputs.chartFallback,
      },
    },
  });
  const relevantNewsCount = inputs.newsItems.filter(
    (item) => !item.tags.includes("UNKNOWN")
  ).length;
  const quoteMoveSize = Math.min(Math.abs(inputs.quote?.changePercent ?? 0) / 4, 1);
  const chartAvailable =
    inputs.chartStatus === "ok" &&
    inputs.chartFallback === null &&
    inputs.chartPoints.length > 0;
  const chartAligned = chartAvailable ? chartAlignsWithQuote(inputs) : false;
  const alignedDirectEvidence = hasAlignedDirectEvidence(causes);
  const contradictionCount = causes.filter(
    (cause) => cause.moveAlignment === "contradicts_move"
  ).length;
  const supportingCount = causes.filter(
    (cause) => cause.moveAlignment === "supports_move"
  ).length;
  const contextualOrSectorTop =
    topCause?.evidenceType === "contextual" || topCause?.evidenceType === "sector";
  const broadCategoryTop =
    topCause?.tag === "EARNINGS" ||
    topCause?.tag === "PRODUCT_NEWS" ||
    topCause?.tag === "AI_DEMAND";
  const mostlyContextualEvidence = causes
    .slice(0, 3)
    .filter(
      (cause) =>
        cause.evidenceType === "contextual" ||
        cause.newsRelevance === "sector_context" ||
        cause.newsRelevance === "macro_context" ||
        cause.newsRelevance === "low_relevance"
    )
    .length >= 2;
  const evidenceThin = relevantNewsCount === 0 || !inputs.quote;
  const chartWeak = !chartAvailable || !chartAligned;
  const directCatalystWeak = !alignedDirectEvidence;
  const liveAlignedEvidence =
    Boolean(inputs.quote) &&
    chartAvailable &&
    chartAligned &&
    alignedDirectEvidence &&
    !mostlyContextualEvidence;
  let score =
    (topCause?.score ?? 0) * 0.36 +
    Math.min(relevantNewsCount / 4, 1) * 0.12 +
    quoteMoveSize * 0.12 +
    (chartAvailable ? 0.1 : 0.03) +
    (chartAligned ? 0.1 : 0) +
    (alignedDirectEvidence ? 0.1 : 0) +
    Math.min(supportingCount / 3, 1) * 0.08 +
    (evidenceThin ? 0 : 0.02);

  if (!chartAligned) {
    score -= chartAvailable ? 0.08 : 0.04;
  }

  if (contradictionCount > 0) {
    score -= contradictionCount * 0.06;
  }

  if (hasMostlyContextualTopFactors(causes)) {
    score = Math.min(score, 0.69);
  }

  if (contextualOrSectorTop) {
    score = Math.min(score, 0.78);
  }

  if (!hasCleanDirectCatalystSet(causes)) {
    score = Math.min(score, 0.84);
  }

  if (broadCategoryTop && !hasStrongTickerCatalyst(topCause)) {
    score = Math.min(score, 0.84);
  }

  if (mostlyContextualEvidence) {
    score = Math.min(score, 0.69);
  }

  if (chartWeak) {
    score = Math.min(score, 0.69);
  }

  if (!liveAlignedEvidence) {
    score = Math.min(score, 0.69);
  }

  if (!chartAvailable && directCatalystWeak) {
    score = Math.min(score, 0.54);
  }

  if (mostlyContextualEvidence && directCatalystWeak) {
    score = Math.min(score, chartAvailable ? 0.62 : 0.54);
  }

  if (!inputs.quote) {
    score = Math.min(score, 0.54);
  }

  if (dataHealth.quoteStatus === "missing" || dataHealth.quoteStatus === "error") {
    score = Math.min(score, 0.39);
  }

  if (dataHealth.quoteStatus === "partial") {
    score = Math.min(score, 0.62);
  }

  if (
    dataHealth.chartStatus !== "ok" &&
    (dataHealth.newsStatus === "missing" ||
      dataHealth.newsStatus === "limited" ||
      dataHealth.newsStatus === "error")
  ) {
    score = Math.min(score, dataHealth.quoteStatus === "ok" ? 0.54 : 0.39);
  }

  if (
    dataHealth.quoteStatus === "ok" &&
    dataHealth.chartStatus !== "ok" &&
    dataHealth.newsStatus === "ok"
  ) {
    score = Math.min(score, 0.69);
  }

  if (contradictionCount > 0 && !hasStrongTickerCatalyst(topCause)) {
    score = Math.min(score, chartAligned && supportingCount > 0 ? 0.69 : 0.62);
  }

  if (!alignedDirectEvidence && !hasStrongTickerCatalyst(topCause)) {
    score = Math.min(score, chartAligned ? 0.69 : 0.62);
  }

  const canReachHighConfidence =
    hasStrongTickerCatalyst(topCause) &&
    liveAlignedEvidence &&
    contradictionCount === 0;

  if (!canReachHighConfidence) {
    score = Math.min(score, 0.84);
  } else {
    score = Math.min(score, 0.92);
  }

  score = clamp(score, 0.1, 0.92);

  const band = getBand(score);

  return {
    score: Number(score.toFixed(2)),
    band,
    label: getLabel(band),
  };
}
