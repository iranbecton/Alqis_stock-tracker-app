import type {
  ChartRange,
} from "@/lib/market-data/types";
import type {
  Confidence,
  CounterEvidence,
  WhyMovingKeyFactor,
} from "@/lib/ai/types";

export type AIWordingStatus =
  | "not_requested"
  | "ok"
  | "provider_error"
  | "validation_failed";

export type AIWordingFailureReason =
  | "missing OPENAI_API_KEY"
  | "insufficient_quota"
  | "provider_error"
  | "validation_failed"
  | "cache_miss"
  | "schema_error";

export type AIWordingChartStatus = "ok" | "fallback" | "unavailable";

export type AIWordingInput = {
  ticker: string;
  companyName?: string;
  direction: "higher" | "lower" | "flat";
  movePct: number;
  chartMovePct: number | null;
  timeframe: ChartRange;
  confidence: Confidence;
  topDrivers: WhyMovingKeyFactor[];
  counterevidence: CounterEvidence[];
  sourceCount: number;
  chartStatus: AIWordingChartStatus;
  newsRelevanceSummary: string;
  forbiddenTerms: string[];
};

export type AIWordingOutput = {
  headline: string;
  summary: string;
  plainEnglishRead: string;
  whyItMatters: string[];
  counterevidence: string[];
  trustNote: string;
};

export type AIWordingProvider = {
  name: "openai" | "structured" | "anthropic";
  generateWording(input: AIWordingInput): Promise<AIWordingOutput>;
};

export type AIWordingValidationResult = {
  isValid: boolean;
  warnings: string[];
};

export type AIWordingRouteResponse = {
  structuredExplanation: import("@/lib/ai/types").WhyMovingResponse;
  aiWording?: AIWordingOutput;
  aiWordingStatus: AIWordingStatus;
  aiWordingProvider?: SupportedAIWordingProvider;
  aiWordingFailureReason?: AIWordingFailureReason;
};

export type SupportedAIWordingProvider = AIWordingProvider["name"];
