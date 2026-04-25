import type {
  CauseCandidate,
  EvidenceType,
  EventTag,
  MoveAlignment,
  NewsRelevance,
  TaggedNewsItem,
  WhyMovingInputs,
} from "@/lib/ai/types";

const BASE_TAG_LABELS: Record<EventTag, string> = {
  EARNINGS: "Earnings or guidance news",
  ANALYST_ACTION: "Analyst action",
  AI_DEMAND: "AI infrastructure demand",
  SECTOR_MOVE: "Semiconductor sector context",
  MACRO_RATE: "Rate or macro pressure",
  PRODUCT_NEWS: "Company/product news",
  LEGAL_RISK: "Legal or regulatory risk",
  MANAGEMENT_CHANGE: "Management change",
  SUPPLY_CHAIN: "Supply chain pressure",
  PRICE_ACTION: "Intraday price action",
  UNKNOWN: "General market context",
};

const TAG_THEMES: Record<EventTag, string[]> = {
  EARNINGS: ["earnings", "revenue", "guidance"],
  ANALYST_ACTION: ["analyst ratings", "estimate changes"],
  AI_DEMAND: ["AI infrastructure", "data-center demand", "GPU demand"],
  SECTOR_MOVE: ["semiconductors", "chip stocks", "peer pressure"],
  MACRO_RATE: ["rates", "yields", "macro conditions"],
  PRODUCT_NEWS: ["products", "platforms", "customers"],
  LEGAL_RISK: ["regulation", "legal risk"],
  MANAGEMENT_CHANGE: ["leadership changes"],
  SUPPLY_CHAIN: ["supply chain", "capacity"],
  PRICE_ACTION: ["quote move", "chart-window move"],
  UNKNOWN: ["general market context"],
};

const TICKER_TAG_THEMES: Partial<Record<string, Partial<Record<EventTag, string[]>>>> = {
  TSLA: {
    EARNINGS: ["earnings", "margins", "guidance"],
    AI_DEMAND: ["autonomy", "robotaxi", "AI roadmap"],
    SECTOR_MOVE: ["EV demand", "auto pricing", "delivery expectations"],
    PRODUCT_NEWS: ["robotaxi", "vehicle platform", "product roadmap"],
  },
  NVDA: {
    AI_DEMAND: ["AI infrastructure", "data-center spending", "accelerator demand"],
    SECTOR_MOVE: ["semiconductor peers", "chip stocks", "AI compute breadth"],
    PRODUCT_NEWS: ["data-center spending", "GPU platforms", "customer demand"],
  },
  AAPL: {
    EARNINGS: ["earnings", "guidance", "services growth"],
    SECTOR_MOVE: ["broad tech pressure", "mega-cap peers", "platform sentiment"],
    PRODUCT_NEWS: ["product cycles", "platform updates", "device demand"],
    AI_DEMAND: ["AI features", "platform AI", "services integration"],
  },
  AMD: {
    EARNINGS: ["earnings", "guidance", "data-center revenue"],
    AI_DEMAND: ["AI accelerator demand", "data-center GPU demand", "MI300 demand"],
    SECTOR_MOVE: ["semiconductor peers", "chip stocks", "AI compute breadth"],
    PRODUCT_NEWS: ["data-center products", "GPU roadmap", "customer demand"],
  },
  MSFT: {
    EARNINGS: ["cloud revenue", "Azure growth", "guidance"],
    AI_DEMAND: ["AI infrastructure", "Copilot demand", "data-center buildout"],
    SECTOR_MOVE: ["mega-cap tech peers", "cloud platform breadth", "software sentiment"],
    PRODUCT_NEWS: ["Copilot", "Azure platform", "enterprise software"],
  },
};

const DIRECT_CATALYST_TAGS = new Set<EventTag>([
  "EARNINGS",
  "ANALYST_ACTION",
  "PRODUCT_NEWS",
  "LEGAL_RISK",
  "MANAGEMENT_CHANGE",
  "SUPPLY_CHAIN",
]);

const NEGATIVE_TERMS = [
  "weak",
  "weakness",
  "weakens",
  "weakened",
  "demand weakened",
  "weigh",
  "weighs",
  "weighed",
  "pressure",
  "pressured",
  "slows",
  "slowed",
  "demand slowed",
  "slowdown",
  "disappoint",
  "disappointing",
  "disappointed",
  "concern",
  "concerns",
  "raised concern",
  "raises concern",
  "risk",
  "risks",
  "falls",
  "fell",
  "drop",
  "drops",
  "decline",
  "declines",
  "lower",
  "cut",
  "cuts",
  "delay",
  "delayed",
  "restriction",
  "curb",
  "curbs",
  "miss",
  "warning",
  "selloff",
];

const POSITIVE_TERMS = [
  "strong",
  "strength",
  "growth",
  "demand",
  "accelerates",
  "accelerating",
  "investment",
  "invest",
  "expands",
  "expansion",
  "raises",
  "raised",
  "beat",
  "beats",
  "surge",
  "surges",
  "rally",
  "rallies",
  "gain",
  "gains",
  "higher",
  "upgrade",
  "optimism",
  "buildout",
  "spending",
];

const MACRO_RELIEF_TERMS = [
  "rate cut",
  "rate cuts",
  "rates eased",
  "rates ease",
  "lower rates",
  "lower yields",
  "yields fell",
  "yield fell",
  "yields drop",
  "dovish",
  "cooling inflation",
  "inflation cooled",
  "soft landing",
  "macro improved",
];

const MACRO_PRESSURE_TERMS = [
  "higher rates",
  "rates rose",
  "rates rise",
  "yields rose",
  "yield rose",
  "higher yields",
  "inflation pressure",
  "inflation worries",
  "hawkish",
  "rate fears",
  "macro pressure",
  "treasury yields climbed",
];

const SECTOR_STRENGTH_TERMS = [
  "sector strength",
  "peer strength",
  "chip stocks rose",
  "semiconductor strength",
  "tech rally",
  "ev stocks rose",
  "auto stocks gained",
];

const SECTOR_PRESSURE_TERMS = [
  "sector pressure",
  "peer weakness",
  "chip stocks fell",
  "semiconductor weakness",
  "tech pressure",
  "ev weakness",
  "auto pressure",
];

const TICKER_LABELS: Partial<Record<string, Partial<Record<EventTag, string>>>> = {
  TSLA: {
    EARNINGS: "Earnings surprise",
    PRODUCT_NEWS: "Robotaxi/product headlines",
    SECTOR_MOVE: "EV demand narrative",
    AI_DEMAND: "Autonomy/AI catalyst",
    PRICE_ACTION: "Intraday buying pressure",
  },
  NVDA: {
    AI_DEMAND: "AI infrastructure demand",
    SECTOR_MOVE: "Semiconductor peer strength",
    PRODUCT_NEWS: "Data-center spending",
    PRICE_ACTION: "Intraday price confirmation",
  },
  AAPL: {
    EARNINGS: "Earnings/guidance uncertainty",
    PRODUCT_NEWS: "Product/platform headlines",
    SECTOR_MOVE: "Broad tech pressure",
    PRICE_ACTION: "Intraday selling pressure",
  },
  AMD: {
    EARNINGS: "Earnings/guidance reaction",
    AI_DEMAND: "AI accelerator demand",
    PRODUCT_NEWS: "Data-center product headlines",
    SECTOR_MOVE: "Semiconductor peer read-through",
  },
  MSFT: {
    EARNINGS: "Cloud earnings/guidance read",
    AI_DEMAND: "AI/cloud infrastructure demand",
    PRODUCT_NEWS: "Copilot/platform headlines",
    SECTOR_MOVE: "Mega-cap tech read-through",
  },
};

const RELEVANCE_WEIGHT: Record<NewsRelevance, number> = {
  direct_company: 1,
  company_context: 0.82,
  sector_context: 0.5,
  macro_context: 0.38,
  low_relevance: 0.08,
};

function getBestRelevance(items: TaggedNewsItem[]): NewsRelevance {
  const order: NewsRelevance[] = [
    "direct_company",
    "company_context",
    "sector_context",
    "macro_context",
    "low_relevance",
  ];

  return (
    order.find((relevance) => items.some((item) => item.relevance === relevance)) ??
    "low_relevance"
  );
}

function relevanceScore(items: TaggedNewsItem[]) {
  if (!items.length) {
    return 0;
  }

  return (
    items.reduce((total, item) => total + RELEVANCE_WEIGHT[item.relevance], 0) /
    items.length
  );
}

function primaryEvidenceItems(items: TaggedNewsItem[]) {
  const directItems = items.filter((item) =>
    ["direct_company", "company_context"].includes(item.relevance)
  );

  return directItems.length ? directItems : items;
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function daysSince(value: string) {
  const time = new Date(value).getTime();

  if (Number.isNaN(time)) {
    return 30;
  }

  return Math.max(0, (Date.now() - time) / 86_400_000);
}

function textForItems(items: TaggedNewsItem[]) {
  return items.map((item) => `${item.headline} ${item.summary}`).join(" ").toLowerCase();
}

function countMatches(text: string, terms: string[]) {
  return terms.reduce((count, term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b${escaped}\\b`, "gi");
    return count + (text.match(pattern)?.length ?? 0);
  }, 0);
}

function countLooseMatches(text: string, terms: string[]) {
  return terms.reduce(
    (count, term) => count + (text.includes(term) ? 1 : 0),
    0
  );
}

function scoreRecency(items: TaggedNewsItem[]) {
  if (!items.length) {
    return 0.15;
  }

  const best = Math.min(...items.map((item) => daysSince(item.publishedAt)));
  return clamp01(1 - best / 14);
}

function relevanceTerms(inputs: WhyMovingInputs) {
  const companyTerms = (inputs.companyName ?? "")
    .replace(/\b(inc|inc\.|corp|corporation|ltd|plc|company)\b/gi, "")
    .split(/\s+/)
    .map((term) => term.trim().toLowerCase())
    .filter((term) => term.length > 3);

  return [inputs.ticker.toLowerCase(), ...companyTerms];
}

function scoreTickerRelevance(inputs: WhyMovingInputs, items: TaggedNewsItem[]) {
  if (!items.length) {
    return 0.1;
  }

  const terms = relevanceTerms(inputs);
  const relevant = items.filter((item) => {
    const text = `${item.headline} ${item.summary}`.toLowerCase();
    return terms.some((term) => text.includes(term));
  }).length;

  return clamp01(0.2 + relevant / Math.max(items.length, 1));
}

function getEvidenceType(tag: EventTag): EvidenceType {
  if (tag === "SECTOR_MOVE") return "sector";
  if (tag === "MACRO_RATE") return "macro";
  if (tag === "AI_DEMAND" || tag === "UNKNOWN") return "contextual";
  return "direct";
}

function getNewsTone(tag: EventTag, items: TaggedNewsItem[]) {
  const text = textForItems(items);
  const macroReliefCount = countLooseMatches(text, MACRO_RELIEF_TERMS);
  const macroPressureCount = countLooseMatches(text, MACRO_PRESSURE_TERMS);
  const sectorStrengthCount = countLooseMatches(text, SECTOR_STRENGTH_TERMS);
  const sectorPressureCount = countLooseMatches(text, SECTOR_PRESSURE_TERMS);

  if (tag === "MACRO_RATE") {
    if (macroReliefCount > macroPressureCount) return "positive" as const;
    if (macroPressureCount > macroReliefCount) return "negative" as const;
    return "neutral" as const;
  }

  if (tag === "SECTOR_MOVE") {
    if (sectorStrengthCount > sectorPressureCount) return "positive" as const;
    if (sectorPressureCount > sectorStrengthCount) return "negative" as const;
  }

  const negativeCount = countMatches(text, NEGATIVE_TERMS);
  const positiveCount = countMatches(text, POSITIVE_TERMS);

  if (tag === "AI_DEMAND" && negativeCount === 0 && positiveCount > 0) {
    return "positive" as const;
  }

  if (negativeCount > positiveCount) {
    return "negative" as const;
  }

  if (positiveCount > negativeCount) {
    return "positive" as const;
  }

  if (negativeCount > 0 && positiveCount > 0) {
    return "mixed" as const;
  }

  return "neutral" as const;
}

function getNewsMoveAlignment(
  tag: EventTag,
  items: TaggedNewsItem[],
  inputs: WhyMovingInputs
): MoveAlignment {
  const quoteMove = inputs.quote?.changePercent ?? 0;
  const tone = getNewsTone(tag, items);

  if (tag === "UNKNOWN" || Math.abs(quoteMove) < 0.05) {
    return "neutral";
  }

  if (tone === "mixed" || tone === "neutral") {
    return "neutral";
  }

  if (quoteMove < 0) {
    return tone === "negative" ? "supports_move" : "contradicts_move";
  }

  return tone === "positive" ? "supports_move" : "contradicts_move";
}

export function getChartMovePct(inputs: WhyMovingInputs) {
  const first = inputs.chartPoints[0]?.close;
  const last = inputs.chartPoints[inputs.chartPoints.length - 1]?.close;

  if (!first || !last) {
    return null;
  }

  return ((last - first) / first) * 100;
}

export function chartAlignsWithQuote(inputs: WhyMovingInputs) {
  const quoteMove = inputs.quote?.changePercent ?? 0;
  const chartMove = getChartMovePct(inputs);

  if (chartMove === null) {
    return false;
  }

  if (Math.abs(quoteMove) < 0.05 || Math.abs(chartMove) < 0.05) {
    return true;
  }

  return Math.sign(quoteMove) === Math.sign(chartMove);
}

function scoreChartConfirmation(inputs: WhyMovingInputs) {
  if (!inputs.chartPoints.length) {
    return 0.1;
  }

  return chartAlignsWithQuote(inputs) ? 0.9 : 0.35;
}

function alignmentScore(alignment: MoveAlignment) {
  if (alignment === "supports_move") return 1;
  if (alignment === "neutral") return 0.45;
  return 0.12;
}

function normalizeCauseScore(score: number) {
  return Number(Math.min(clamp01(score), 0.92).toFixed(2));
}

function labelForNewsCause(tag: EventTag, alignment: MoveAlignment, inputs: WhyMovingInputs) {
  const tickerLabel = TICKER_LABELS[inputs.ticker]?.[tag];

  if (tickerLabel) {
    if (inputs.ticker === "NVDA" && tag === "SECTOR_MOVE" && inputs.quote?.changePercent && inputs.quote.changePercent < 0) {
      return "Semiconductor sector pressure";
    }

    if (inputs.ticker === "AAPL" && tag === "PRICE_ACTION" && inputs.quote?.changePercent && inputs.quote.changePercent > 0) {
      return "Intraday price confirmation";
    }

    if (inputs.ticker === "TSLA" && tag === "PRICE_ACTION" && inputs.quote?.changePercent && inputs.quote.changePercent < 0) {
      return "Intraday selling pressure";
    }

    return tickerLabel;
  }

  if (tag === "SECTOR_MOVE" && inputs.quote && inputs.quote.changePercent < 0) {
    return alignment === "supports_move"
      ? "Semiconductor sector pressure"
      : "Semiconductor sector context";
  }

  if (tag === "AI_DEMAND" && alignment === "contradicts_move") {
    return "Supportive AI infrastructure headlines";
  }

  return BASE_TAG_LABELS[tag];
}

function themesForCause(tag: EventTag, inputs: WhyMovingInputs) {
  return TICKER_TAG_THEMES[inputs.ticker]?.[tag] ?? TAG_THEMES[tag];
}

function describeNewsCause(
  tag: EventTag,
  inputs: WhyMovingInputs,
  items: TaggedNewsItem[],
  tickerRelevance: number,
  alignment: MoveAlignment
) {
  if (tag === "UNKNOWN") {
    return `${inputs.ticker} has recent market headlines, but they do not isolate one clear company-specific catalyst.`;
  }

  const headlineText =
    items.length === 1 ? "one recent headline" : `${items.length} recent headlines`;
  const relevanceText =
    tickerRelevance >= 0.75
      ? `mention ${inputs.companyName ?? inputs.ticker}`
      : "are mostly contextual rather than directly company-specific";
  const themes = themesForCause(tag, inputs).slice(0, 3).join(", ");

  if (alignment === "contradicts_move") {
    return `${headlineText} ${relevanceText} and reference ${themes}, but their tone conflicts with the price move.`;
  }

  if (alignment === "neutral") {
    return `${headlineText} ${relevanceText} and reference ${themes}, but directionality is not clear enough to explain the move alone.`;
  }

  return `${headlineText} ${relevanceText} and reference ${themes} in a way that aligns with the price move.`;
}

function createNewsCause(
  tag: EventTag,
  items: TaggedNewsItem[],
  inputs: WhyMovingInputs
): CauseCandidate {
  const scoredItems = primaryEvidenceItems(items);
  const evidenceCount = scoredItems.length;
  const evidenceWeight = clamp01(evidenceCount / 4);
  const recency = scoreRecency(scoredItems);
  const tickerRelevance = Math.max(
    scoreTickerRelevance(inputs, scoredItems),
    relevanceScore(scoredItems)
  );
  const moveAlignment = getNewsMoveAlignment(tag, scoredItems, inputs);
  const evidenceType = getEvidenceType(tag);
  const newsRelevance = getBestRelevance(scoredItems);
  const isDirectCatalyst = DIRECT_CATALYST_TAGS.has(tag);
  const isSpecific =
    tag !== "UNKNOWN" &&
    tickerRelevance >= 0.7 &&
    (newsRelevance === "direct_company" || newsRelevance === "company_context") &&
    (isDirectCatalyst || evidenceCount >= 2);
  const chartConfirmation = scoreChartConfirmation(inputs);
  const alignment = alignmentScore(moveAlignment);
  const evidenceTypeBoost =
    evidenceType === "direct"
      ? 0.08
      : evidenceType === "sector"
        ? 0.03
        : evidenceType === "macro"
          ? 0.02
          : 0;
  const score =
    evidenceWeight * 0.26 +
    recency * 0.16 +
    tickerRelevance * 0.2 +
    alignment * 0.22 +
    chartConfirmation * 0.08 +
    evidenceTypeBoost +
    clamp01(evidenceCount / 5) * 0.04;

  return {
    tag,
    label: labelForNewsCause(tag, moveAlignment, inputs),
    description: describeNewsCause(
      tag,
      inputs,
      items,
      tickerRelevance,
      moveAlignment
    ),
    score: normalizeCauseScore(score),
    evidenceType,
    moveAlignment,
    newsRelevance,
    evidenceWeight,
    recency,
    tickerRelevance,
    evidenceCount,
    isSpecific,
    isDirectCatalyst,
    evidence: scoredItems.slice(0, 3).map((item) => item.headline),
    summary:
      tag === "UNKNOWN"
        ? `${inputs.ticker} has no dominant tagged catalyst.`
        : `${BASE_TAG_LABELS[tag]} has ${evidenceCount} evidence item${evidenceCount === 1 ? "" : "s"}.`,
  };
}

function createPriceActionCause(inputs: WhyMovingInputs): CauseCandidate | null {
  const quoteMove = inputs.quote?.changePercent;
  const chartMove = getChartMovePct(inputs);
  const hasQuote = typeof quoteMove === "number";
  const hasChart = chartMove !== null;

  if (!hasQuote && !hasChart) {
    return null;
  }

  const evidenceCount = Number(hasQuote) + Number(hasChart);
  const chartConfirmation = scoreChartConfirmation(inputs);
  const quoteMoveSize = clamp01(Math.abs(quoteMove ?? 0) / 4);
  const chartMoveSize = clamp01(Math.abs(chartMove ?? 0) / 4);
  const moveAlignment: MoveAlignment = hasChart
    ? chartAlignsWithQuote(inputs)
      ? "supports_move"
      : "contradicts_move"
    : "neutral";
  const score =
    0.24 +
    quoteMoveSize * 0.16 +
    chartMoveSize * 0.14 +
    alignmentScore(moveAlignment) * 0.22 +
    chartConfirmation * 0.12 +
    evidenceCount * 0.04;
  const dailyMoveText = hasQuote
    ? `daily quote move from previous close is ${formatPercent(quoteMove)}`
    : "daily quote move is unavailable";
  const chartMoveText = hasChart
    ? `${inputs.timeframe} chart-window move is ${formatPercent(chartMove)}`
    : `${inputs.timeframe} chart-window move is unavailable`;
  const isNegative = (quoteMove ?? chartMove ?? 0) < 0;

  return {
    tag: "PRICE_ACTION",
    label:
      TICKER_LABELS[inputs.ticker]?.PRICE_ACTION ??
      (isNegative ? "Intraday selling pressure" : "Intraday price action"),
    description: `${dailyMoveText}, while the ${chartMoveText}.`,
    score: normalizeCauseScore(score),
    evidenceType: "direct",
    moveAlignment,
    newsRelevance: "direct_company",
    evidenceWeight: evidenceCount / 2,
    recency: 1,
    tickerRelevance: 1,
    evidenceCount,
    isSpecific: evidenceCount >= 2,
    isDirectCatalyst: false,
    evidence: [dailyMoveText, chartMoveText],
    summary: `Price action compares daily quote movement with the selected ${inputs.timeframe} chart window.`,
  };
}

export function scoreCauses(inputs: WhyMovingInputs): CauseCandidate[] {
  const grouped = new Map<EventTag, TaggedNewsItem[]>();

  inputs.newsItems.forEach((item) => {
    item.tags.forEach((tag) => {
      grouped.set(tag, [...(grouped.get(tag) ?? []), item]);
    });
  });

  if (!grouped.size) {
    grouped.set("UNKNOWN", []);
  }

  const newsCauses = [...grouped.entries()].map(([tag, items]) =>
    createNewsCause(tag, items, inputs)
  );
  const priceAction = createPriceActionCause(inputs);

  const allCauses = [...newsCauses, ...(priceAction ? [priceAction] : [])].sort(
    (a, b) => b.score - a.score
  );
  const selectedCauses = allCauses.slice(0, 4);

  if (
    priceAction?.moveAlignment === "supports_move" &&
    !selectedCauses.some((cause) => cause.tag === "PRICE_ACTION") &&
    selectedCauses.every((cause) => cause.moveAlignment !== "supports_move")
  ) {
    selectedCauses[selectedCauses.length - 1] = priceAction;
  }

  return selectedCauses
    .sort((a, b) => b.score - a.score)
}
