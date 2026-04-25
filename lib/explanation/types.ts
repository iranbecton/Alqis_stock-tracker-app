import type {
  ChartPoint,
  ChartRange,
  CompanyProfile,
  StockNewsItem,
  StockQuote,
} from "@/lib/market-data/types";

export type ExplanationTimeframe = ChartRange;

export type ExplanationRequest = {
  ticker: string;
  timeframe: ExplanationTimeframe;
};

export type QuoteApiPayload = StockQuote & {
  companyProfile?: CompanyProfile | null;
};

export type ChartApiPayload = {
  symbol: string;
  range: ChartRange;
  provider?: string;
  points: ChartPoint[];
  status: "ok" | "empty" | "provider_access_error" | "provider_error";
  fallback?: "demo-chart-structure" | null;
  error?: string;
};

export type NewsApiPayload = {
  symbol: string;
  items: StockNewsItem[];
  status: "ok" | "empty";
  error?: string;
};

export type ExplanationInputBundle = {
  ticker: string;
  timeframe: ExplanationTimeframe;
  quote?: QuoteApiPayload;
  chart?: ChartApiPayload;
  news?: NewsApiPayload;
  fetchedAt: string;
};

export type CauseCategory =
  | "price_action"
  | "news_flow"
  | "volume_context"
  | "data_quality";

export type CauseScore = {
  category: CauseCategory;
  label: string;
  score: number;
  detail: string;
  evidence: string[];
};

export type ConfidenceBand = "high" | "medium" | "low";

export type ConfidenceScore = {
  score: number;
  band: ConfidenceBand;
  rationale: string;
  dataQuality: {
    quote: boolean;
    chart: boolean;
    news: boolean;
  };
};

export type WhyMovingExplanation = {
  ticker: string;
  timeframe: ExplanationTimeframe;
  title: "Why Is It Moving?";
  headline: string;
  summary: string;
  confidence: ConfidenceScore;
  causes: CauseScore[];
  counterEvidence: string[];
  whatWouldChangeThisRead: string[];
  sourceCount: number;
  freshness: string;
  generatedAt: string;
  mode: "ai" | "fallback";
  disclaimer: string;
};

export type ExplanationRouteResponse = {
  status: "ok" | "fallback" | "error";
  explanation?: WhyMovingExplanation;
  error?: string;
  diagnostics?: {
    promptConstructed: boolean;
    validationWarnings: string[];
    provider?: string;
  };
};
