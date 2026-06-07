import type {
  ChartPoint,
  ChartRange,
  CompanyProfile,
  StockNewsItem,
  StockQuote,
} from "@/lib/market-data/types";

export type ConfidenceBand = "A" | "B" | "C" | "D";

export type ConfidenceLabel =
  | "High confidence"
  | "Good confidence"
  | "Moderate confidence"
  | "Low confidence";

export type Confidence = {
  score: number;
  band: ConfidenceBand;
  label: ConfidenceLabel;
};

export type EvidenceType = "direct" | "sector" | "macro" | "contextual";

export type MoveAlignment = "supports_move" | "contradicts_move" | "neutral";

export type NewsRelevance =
  | "direct_company"
  | "company_context"
  | "sector_context"
  | "macro_context"
  | "low_relevance";

export type EventTag =
  | "EARNINGS"
  | "ANALYST_ACTION"
  | "AI_DEMAND"
  | "SECTOR_MOVE"
  | "MACRO_RATE"
  | "PRODUCT_NEWS"
  | "LEGAL_RISK"
  | "MANAGEMENT_CHANGE"
  | "SUPPLY_CHAIN"
  | "PRICE_ACTION"
  | "UNKNOWN";

export type WhyMovingRequest = {
  ticker: string;
  timeframe: ChartRange;
  useAIWording?: boolean;
  forceRefresh?: boolean;
};

export type WhyMovingResponse = {
  ticker: string;
  timeframe: ChartRange;
  movePct: number;
  chartMovePct: number | null;
  dailyMoveLabel: string;
  chartMoveLabel: string;
  summary: string;
  keyFactors: WhyMovingKeyFactor[];
  counterEvidence: CounterEvidence[];
  confidence: Confidence;
  sourceCount: number;
  generatedAt: string;
  expiresAt: string;
};

export type WhyMovingKeyFactor = {
  label: string;
  description: string;
  score: number;
  evidenceCount: number;
  evidenceType: EvidenceType;
  moveAlignment: MoveAlignment;
  newsRelevance?: NewsRelevance;
};

export type CounterEvidence = {
  label: string;
  description: string;
};

export type TaggedNewsItem = StockNewsItem & {
  tags: EventTag[];
  relevance: NewsRelevance;
};

export type CauseCandidate = {
  tag: EventTag;
  label: string;
  description: string;
  score: number;
  evidenceType: EvidenceType;
  moveAlignment: MoveAlignment;
  newsRelevance?: NewsRelevance;
  evidenceWeight: number;
  recency: number;
  tickerRelevance: number;
  evidenceCount: number;
  isSpecific: boolean;
  isDirectCatalyst: boolean;
  evidence: string[];
  summary: string;
};

export type WhyMovingInputs = {
  ticker: string;
  timeframe: ChartRange;
  companyName?: string;
  sector?: string;
  quote?: StockQuote;
  chartPoints: ChartPoint[];
  chartStatus?: string;
  chartFallback?: string | null;
  newsItems: TaggedNewsItem[];
  topCauses?: Array<{ tag: string; score: number; evidence?: string }>;
};

export type QuoteApiPayload = StockQuote & {
  companyProfile?: CompanyProfile | null;
  error?: string;
};

export type ChartApiPayload = {
  symbol: string;
  range: ChartRange;
  provider?: string;
  points: ChartPoint[];
  status:
    | "ok"
    | "empty"
    | "provider_access_error"
    | "provider_error"
    | "rate_limited";
  fallback?: "demo-chart-structure" | null;
  providerAccessError?: boolean;
  providerRateLimited?: boolean;
  providerStatus?: number;
  providerMessage?: string;
  error?: string;
};

export type NewsApiPayload = {
  symbol: string;
  items: StockNewsItem[];
  status?: "ok" | "empty";
  filteredOut?: number;
  error?: string;
};
