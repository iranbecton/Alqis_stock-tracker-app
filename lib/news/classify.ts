import type { StockNewsItem } from "@/lib/market-data/types";
import { normalizeTicker } from "@/lib/market-data/validation";
import { getStockUniverseItem } from "@/lib/stocks/stock-universe";

export type NewsClassification =
  | "company_specific"
  | "sector_wide"
  | "market_wide";

export type ScoredNewsItem = {
  id: string;
  headline: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string;
  classification: NewsClassification;
  relevanceScore: number;
  ticker?: string;
};

type FilterOptions = {
  minRelevance?: number;
  companyName?: string | null;
};

const classificationWeights: Record<NewsClassification, number> = {
  company_specific: 1,
  sector_wide: 0.65,
  market_wide: 0.35,
};

const OPINION_SOURCES = [
  "seekingalpha",
  "seeking alpha",
  "motley fool",
  "the motley fool",
  "24/7 wall st",
  "24/7 wall street",
  "investorplace",
];

const OPINION_SIGNAL_WORDS = [
  /^sell\b/i,
  /^buy\b/i,
  /^avoid\b/i,
  /^dump\b/i,
  /^short\b/i,
  /^time to sell/i,
  /^time to buy/i,
];

const sectorKeywordGroups: Record<string, string[]> = {
  technology: [
    "technology",
    "tech",
    "software",
    "cloud",
    "ai",
    "semiconductor",
    "chip",
    "data center",
    "platform",
  ],
  semiconductor: [
    "semiconductor",
    "chip",
    "chips",
    "foundry",
    "ai accelerator",
    "data center",
    "gpu",
  ],
  financial: ["bank", "banks", "banking", "financial", "lending", "credit"],
  healthcare: ["healthcare", "health care", "pharma", "biotech", "drug", "medical"],
  energy: ["energy", "oil", "gas", "crude", "lng"],
  consumer: ["consumer", "retail", "e-commerce", "commerce", "automotive"],
  media: ["media", "streaming", "advertising", "entertainment"],
  macro: ["fed", "rates", "inflation", "jobs", "treasury", "yield", "market"],
};

export function classifyNewsItem(
  item: StockNewsItem,
  ticker: string,
  sector?: string | null,
  companyName?: string | null
): NewsClassification {
  const normalizedTicker = normalizeTicker(ticker);
  const headline = normalizeText(item.headline);
  const universeItem = getStockUniverseItem(normalizedTicker);
  const directTickerPattern = new RegExp(`\\b${escapeRegExp(normalizedTicker)}\\b`, "i");

  if (directTickerPattern.test(item.headline)) {
    return "company_specific";
  }

  const companyKeywords = getCompanyKeywords(
    companyName ?? universeItem?.companyName ?? ""
  );

  if (companyKeywords.some((keyword) => headline.includes(keyword))) {
    return "company_specific";
  }

  const sectorKeywords = getSectorKeywords(
    sector ?? universeItem?.sector ?? ""
  );

  if (sectorKeywords.some((keyword) => headline.includes(keyword))) {
    return "sector_wide";
  }

  return "market_wide";
}

export function scoreNewsItem(
  item: StockNewsItem,
  ticker: string,
  classification: NewsClassification
) {
  void ticker;

  const classificationWeight = classificationWeights[classification];
  const recencyFactor = getRecencyFactor(item.publishedAt);
  const source = item.source;

  // Finnhub normalizes most news sources to "Yahoo" at standard tier.
  // Yahoo Finance is a legitimate aggregator — score as general financial (0.7).
  // TODO post-v1: upgrade news provider for proper per-article source attribution.
  const knownFinancialSources = [
    'reuters', 'bloomberg', 'wsj', 'ft', 'financial times',
    'sec', "barron's", 'barrons', 'marketwatch'
  ];

  const generalFinancialSources = [
    'yahoo', 'yahoo finance', 'cnbc', 'forbes',
    'motley fool', 'seeking alpha', 'benzinga'
  ];

  const sourceLower = source.toLowerCase();

  let sourceQuality: number;
  if (knownFinancialSources.some(s => sourceLower.includes(s))) {
    sourceQuality = 1.0;
  } else if (generalFinancialSources.some(s => sourceLower.includes(s))) {
    sourceQuality = 0.7;
  } else {
    sourceQuality = 0.5;
  }
  const score =
    classificationWeight * 0.7 + recencyFactor * 0.2 + sourceQuality * 0.1;

  return clampScore(score);
}

export function filterAndRankNews(
  items: StockNewsItem[],
  ticker: string,
  sector: string | null | undefined,
  limit: number,
  options: FilterOptions = {}
): ScoredNewsItem[] {
  const minRelevance = options.minRelevance ?? 0.45;

  return items
    .map((item) => {
      const classification = classifyNewsItem(
        item,
        ticker,
        sector,
        options.companyName
      );

      // Opinion source + directional headline filter.
      // Floors relevance to 0 to prevent "Sell X" style headlines from surfacing.
      // Source and headline data preserved for logging; never reaches UI thresholds.
      if (isOpinionSource(item.source) && hasOpinionSignal(item.headline)) {
        return {
          ...item,
          classification,
          relevanceScore: 0,
          ticker: normalizeTicker(ticker),
        };
      }

      const relevanceScore = scoreNewsItem(item, ticker, classification);

      return {
        ...item,
        classification,
        relevanceScore,
        ticker: normalizeTicker(ticker),
      };
    })
    .filter((item) => item.relevanceScore >= minRelevance)
    .sort(
      (a, b) =>
        b.relevanceScore - a.relevanceScore ||
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    )
    .slice(0, limit);
}

function hasOpinionSignal(headline: string): boolean {
  return OPINION_SIGNAL_WORDS.some((pattern) => pattern.test(headline.trim()));
}

function isOpinionSource(source: string): boolean {
  const s = source.toLowerCase();

  return OPINION_SOURCES.some((opinionSource) => s.includes(opinionSource));
}

function getCompanyKeywords(companyName: string) {
  return companyName
    .toLowerCase()
    .replace(
      /\b(inc|incorporated|corporation|corp|company|co|ltd|plc|class|common|stock|adr|the)\b/g,
      ""
    )
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4)
    .slice(0, 5)
    .map(normalizeText);
}

function getSectorKeywords(sector: string) {
  const normalizedSector = normalizeText(sector);
  const keywords = new Set(
    normalizedSector
      .split(" ")
      .filter((token) => token.length >= 4)
  );

  Object.entries(sectorKeywordGroups).forEach(([key, values]) => {
    if (normalizedSector.includes(key)) {
      values.forEach((value) => keywords.add(normalizeText(value)));
    }
  });

  if (normalizedSector.includes("ai")) {
    sectorKeywordGroups.technology.forEach((value) => keywords.add(normalizeText(value)));
  }

  return [...keywords].filter(Boolean);
}

function getRecencyFactor(publishedAt: string) {
  const publishedTime = new Date(publishedAt).getTime();

  if (!Number.isFinite(publishedTime)) {
    return 0.4;
  }

  const ageHours = Math.max(0, (Date.now() - publishedTime) / (1000 * 60 * 60));

  if (ageHours <= 4) {
    return 1;
  }

  if (ageHours >= 24) {
    return 0.4;
  }

  const decayProgress = (ageHours - 4) / 20;
  return 1 - decayProgress * 0.6;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(3))));
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
