import { chartAlignsWithQuote, getChartMovePct } from "@/lib/ai/cause-scoring";
import type {
  CauseCandidate,
  CounterEvidence,
  WhyMovingInputs,
  WhyMovingKeyFactor,
  WhyMovingResponse,
} from "@/lib/ai/types";
import type { Confidence } from "@/lib/ai/types";

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function trimToWords(value: string, maxWords: number) {
  const words = value.trim().split(/\s+/);
  return words.length <= maxWords ? value : `${words.slice(0, maxWords).join(" ")}.`;
}

function lowerFirst(value: string) {
  if (/^[A-Z]{2,}\b/.test(value)) {
    return value;
  }

  return value.charAt(0).toLowerCase() + value.slice(1);
}

function getFallbackSummary(ticker: string, movePct: number) {
  const direction = movePct >= 0 ? "higher" : "lower";
  return `${ticker} moved ${direction} today, but current evidence is not strong enough to identify one clear driver.`;
}

function joinDrivers(labels: string[]) {
  if (labels.length > 1) {
    return `${labels[0]} and ${labels[1]}`;
  }

  return labels[0] ?? "available market evidence";
}

function readableContradiction(cause: CauseCandidate) {
  if (cause.tag === "MACRO_RATE") {
    return "rate or macro pressure";
  }

  if (cause.tag === "AI_DEMAND") {
    return "supportive AI-infrastructure headlines";
  }

  if (cause.tag === "EARNINGS") {
    return "mixed earnings and guidance-related headlines";
  }

  if (cause.tag === "PRODUCT_NEWS") {
    return "product/platform headlines";
  }

  if (cause.tag === "SECTOR_MOVE") {
    return "broad sector headlines";
  }

  return `${lowerFirst(cause.label)} evidence`;
}

function phraseForDriver(cause: CauseCandidate) {
  if (cause.tag === "EARNINGS") return "earnings-related headlines";
  if (cause.tag === "PRODUCT_NEWS") return "product-related headlines";
  if (cause.tag === "AI_DEMAND") return lowerFirst(cause.label);
  if (cause.tag === "SECTOR_MOVE") return lowerFirst(cause.label);
  if (cause.tag === "PRICE_ACTION") return lowerFirst(cause.label);
  return lowerFirst(cause.label);
}

function supportPhrase(movePct: number) {
  return movePct >= 0 ? "supported the move" : "weighed on the stock";
}

function counterweightPhrase(cause: CauseCandidate) {
  if (cause.tag === "MACRO_RATE") {
    return "rate or macro pressure remained a counterweight";
  }

  if (cause.tag === "AI_DEMAND") {
    return "supportive AI-infrastructure headlines remained counterevidence";
  }

  return `${readableContradiction(cause)} remained counterevidence`;
}

function hasLiveChartConfirmation(inputs: WhyMovingInputs) {
  return (
    inputs.chartStatus === "ok" &&
    inputs.chartFallback === null &&
    inputs.chartPoints.length > 0
  );
}

function buildSummary(inputs: WhyMovingInputs, causes: CauseCandidate[]) {
  if (!inputs.quote) {
    return `${inputs.ticker} has limited market data available, so ALQIS cannot identify a reliable price-move driver yet.`;
  }

  const movePct = inputs.quote?.changePercent ?? 0;
  const direction = movePct >= 0 ? "higher" : "lower";
  const chartAvailable = hasLiveChartConfirmation(inputs);
  const supportingCauses = causes.filter(
    (cause) => cause.moveAlignment === "supports_move" && cause.tag !== "UNKNOWN"
  );
  const contradictoryCause = causes.find(
    (cause) => cause.moveAlignment === "contradicts_move"
  );
  const primaryDrivers = supportingCauses
    .filter((cause) => cause.tag !== "PRICE_ACTION")
    .slice(0, 2);
  const priceAction = supportingCauses.find((cause) => cause.tag === "PRICE_ACTION");
  const driverLabels = [
    ...primaryDrivers.map(phraseForDriver),
    ...(priceAction ? [lowerFirst(priceAction.label)] : []),
  ].slice(0, 2);

  if (!supportingCauses.length && contradictoryCause) {
    return chartAvailable
      ? `${inputs.ticker} moved ${direction} despite ${readableContradiction(contradictoryCause)}; the selected chart window suggests the move may be broader than one direct catalyst.`
      : `${inputs.ticker} moved ${direction} despite ${readableContradiction(contradictoryCause)}, but chart confirmation is unavailable for this range.`;
  }

  if (!driverLabels.length) {
    return getFallbackSummary(inputs.ticker, movePct);
  }

  if (contradictoryCause) {
    return `${inputs.ticker} moved ${direction} as ${joinDrivers(driverLabels)} ${supportPhrase(movePct)}, while ${counterweightPhrase(contradictoryCause)}.`;
  }

  if (priceAction && primaryDrivers.length) {
    return chartAvailable
      ? `${inputs.ticker} moved ${direction} after ${joinDrivers(
          primaryDrivers.map(phraseForDriver)
        )} ${supportPhrase(movePct)}, while intraday price action confirmed ${movePct >= 0 ? "buying pressure" : "selling pressure"}.`
      : `${inputs.ticker} moved ${direction} as ${joinDrivers(
          primaryDrivers.map(phraseForDriver)
        )} ${supportPhrase(movePct)}, but chart confirmation is unavailable for this range.`;
  }

  if (!chartAvailable) {
    return `${inputs.ticker} moved ${direction} as ${joinDrivers(driverLabels)} ${supportPhrase(movePct)}, but chart confirmation is unavailable for this range.`;
  }

  const chartPhrase = chartAlignsWithQuote(inputs)
    ? `while intraday price action confirmed ${movePct >= 0 ? "buying pressure" : "selling pressure"}`
    : "while the selected chart window was mixed";

  return `${inputs.ticker} moved ${direction} as ${joinDrivers(driverLabels)} ${supportPhrase(movePct)}, ${chartPhrase}.`;
}

function toKeyFactor(cause: CauseCandidate): WhyMovingKeyFactor {
  return {
    label: cause.label,
    description: cause.description,
    score: cause.score,
    evidenceCount: cause.evidenceCount,
    evidenceType: cause.evidenceType,
    moveAlignment: cause.moveAlignment,
    newsRelevance: cause.newsRelevance,
  };
}

function addCounterEvidence(
  items: CounterEvidence[],
  label: string,
  description: string
) {
  if (!items.some((item) => item.label === label)) {
    items.push({ label, description });
  }
}

function buildCounterEvidence(
  inputs: WhyMovingInputs,
  causes: CauseCandidate[]
) {
  const topCause = causes[0];
  const chartAvailable = hasLiveChartConfirmation(inputs);
  const aligned = chartAvailable ? chartAlignsWithQuote(inputs) : false;
  const counterEvidence: CounterEvidence[] = [];

  if (!topCause?.isSpecific) {
    addCounterEvidence(
      counterEvidence,
      "No direct catalyst identified",
      "The strongest available evidence does not isolate one clean company-specific event."
    );
  }

  if (
    inputs.quote &&
    inputs.quote.changePercent < 0 &&
    causes.some(
      (cause) => cause.tag === "AI_DEMAND" && cause.moveAlignment === "contradicts_move"
    )
  ) {
    addCounterEvidence(
      counterEvidence,
      "Positive AI headlines conflict with price weakness",
      "AI-infrastructure news appears supportive, so it should not be treated as the cause of a negative move."
    );
  }

  if (causes.some((cause) => cause.evidenceType === "contextual")) {
    addCounterEvidence(
      counterEvidence,
      "News mix is mostly contextual",
      "Some evidence explains the market backdrop better than it explains a direct company catalyst."
    );
  }

  if (causes.some((cause) => cause.evidenceType === "sector")) {
    addCounterEvidence(
      counterEvidence,
      "Move may reflect broader sector pressure",
      "Semiconductor or peer headlines can move the stock without being specific to the company."
    );
  }

  if (!chartAvailable) {
    addCounterEvidence(
      counterEvidence,
      "Chart provider unavailable",
      "The selected chart range is using fallback structure, so chart action is not treated as confirmation."
    );
  } else if (!aligned) {
    addCounterEvidence(
      counterEvidence,
      "Daily and chart moves diverge",
      "The quote change from previous close and selected chart window do not fully confirm each other."
    );
  }

  if (!causes.some((cause) => cause.isDirectCatalyst && cause.isSpecific)) {
    addCounterEvidence(
      counterEvidence,
      "Evidence is not company-specific enough",
      "The read should stay cautious until a direct, ticker-specific catalyst is visible."
    );
  }

  if (!inputs.newsItems.length) {
    addCounterEvidence(
      counterEvidence,
      "Recent news evidence is thin",
      "The news feed did not provide enough ticker-specific context for a stronger causal read."
    );
  }

  return counterEvidence.slice(0, 4);
}

export function buildWhyMovingResponse({
  inputs,
  causes,
  confidence,
}: {
  inputs: WhyMovingInputs;
  causes: CauseCandidate[];
  confidence: Confidence;
}): WhyMovingResponse {
  const movePct = inputs.quote?.changePercent ?? 0;
  const chartMovePct = getChartMovePct(inputs);
  const generatedAt = new Date();
  const expiresAt = new Date(generatedAt.getTime() + 15 * 60_000);
  const summary = buildSummary(inputs, causes);
  const keyFactors = causes.map(toKeyFactor).slice(0, 4);

  while (keyFactors.length < 2) {
    keyFactors.push({
      label: "Evidence quality",
      description:
        "Available quote, chart, or news evidence is limited, so the read is intentionally cautious.",
      score: Math.min(confidence.score, 0.5),
      evidenceCount: 0,
      evidenceType: "contextual",
      moveAlignment: "neutral",
      newsRelevance: "low_relevance",
    });
  }

  return {
    ticker: inputs.ticker,
    timeframe: inputs.timeframe,
    movePct,
    chartMovePct,
    dailyMoveLabel: "Daily move from previous close",
    chartMoveLabel: `${inputs.timeframe} chart-window move`,
    summary: wordCount(summary) <= 55 ? summary : trimToWords(summary, 55),
    keyFactors,
    counterEvidence: buildCounterEvidence(inputs, causes),
    confidence,
    sourceCount:
      Number(Boolean(inputs.quote)) +
      Number(Boolean(inputs.chartPoints.length)) +
      inputs.newsItems.length,
    generatedAt: generatedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}
