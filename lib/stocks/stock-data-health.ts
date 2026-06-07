import type {
  ChartPoint,
  CompanyProfile,
  StockNewsItem,
  StockQuote,
} from "@/lib/market-data/types";

export type DataFieldStatus = "ok" | "partial" | "missing" | "error";
export type ChartHealthStatus = "ok" | "fallback" | "missing" | "error";
export type NewsHealthStatus = "ok" | "limited" | "missing" | "error";
export type OverallStockDataStatus =
  | "complete"
  | "partial"
  | "limited"
  | "unavailable";

export type StockDataHealth = {
  quoteStatus: DataFieldStatus;
  profileStatus: DataFieldStatus;
  chartStatus: ChartHealthStatus;
  newsStatus: NewsHealthStatus;
  overallStatus: OverallStockDataStatus;
  missingFields: string[];
  availableFields: string[];
  userFacingLabel: string;
  userFacingSummary: string;
};

type ChartRangeHealthInput = {
  status?: string;
  fallback?: string | null;
  providerMessage?: string;
};

export type StockDataHealthInput = {
  quote?: Partial<StockQuote>;
  profile?: Partial<CompanyProfile> | null;
  chartPoints?: ChartPoint[];
  chartRanges?: Record<string, ChartRangeHealthInput | undefined>;
  news?: StockNewsItem[];
  quoteError?: string;
  profileError?: string;
  chartError?: string;
  newsError?: string;
};

const STALE_QUOTE_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;

export function evaluateStockDataHealth(
  input: StockDataHealthInput
): StockDataHealth {
  const missingFields: string[] = [];
  const availableFields: string[] = [];
  const quoteStatus = evaluateQuoteStatus(input, missingFields, availableFields);
  const profileStatus = evaluateProfileStatus(input, missingFields, availableFields);
  const chartStatus = evaluateChartStatus(input, missingFields, availableFields);
  const newsStatus = evaluateNewsStatus(input, missingFields, availableFields);
  const overallStatus = evaluateOverallStatus({
    quoteStatus,
    profileStatus,
    chartStatus,
    newsStatus,
  });

  return {
    quoteStatus,
    profileStatus,
    chartStatus,
    newsStatus,
    overallStatus,
    missingFields,
    availableFields,
    ...getUserFacingCopy(overallStatus),
  };
}

export function hasUsableQuote(quote?: Partial<StockQuote>) {
  return isPositiveNumber(quote?.price);
}

export function hasCompleteQuote(quote?: Partial<StockQuote>) {
  return (
    hasUsableQuote(quote) &&
    isPositiveNumber(quote?.previousClose) &&
    isFiniteNumber(quote?.change) &&
    isFiniteNumber(quote?.changePercent)
  );
}

function evaluateQuoteStatus(
  input: StockDataHealthInput,
  missingFields: string[],
  availableFields: string[]
): DataFieldStatus {
  if (input.quoteError) {
    missingFields.push("quote");
    return "error";
  }

  if (!hasUsableQuote(input.quote)) {
    missingFields.push("quote");
    return "missing";
  }

  availableFields.push("quote");

  const missingQuoteParts = [
    !isPositiveNumber(input.quote?.previousClose) ? "previous close" : null,
    !isFiniteNumber(input.quote?.change) ? "daily move amount" : null,
    !isFiniteNumber(input.quote?.changePercent) ? "daily move percent" : null,
    isStaleTimestamp(input.quote?.timestamp) ? "fresh quote timestamp" : null,
  ].filter(Boolean) as string[];

  if (missingQuoteParts.length) {
    missingFields.push(...missingQuoteParts);
    return "partial";
  }

  return "ok";
}

function evaluateProfileStatus(
  input: StockDataHealthInput,
  missingFields: string[],
  availableFields: string[]
): DataFieldStatus {
  if (input.profileError) {
    missingFields.push("profile");
    return "error";
  }

  if (!input.profile) {
    missingFields.push("profile");
    return "missing";
  }

  const hasName = Boolean(input.profile.companyName || input.profile.symbol);

  if (!hasName) {
    missingFields.push("company identity");
    return "missing";
  }

  availableFields.push("profile");

  if (!input.profile.sector && !input.profile.exchange) {
    missingFields.push("sector or exchange");
    return "partial";
  }

  return "ok";
}

function evaluateChartStatus(
  input: StockDataHealthInput,
  missingFields: string[],
  availableFields: string[]
): ChartHealthStatus {
  if (input.chartError) {
    missingFields.push("chart");
    return "error";
  }

  const chartRanges = Object.values(input.chartRanges ?? {});
  const hasLiveRange = chartRanges.some(
    (range) => range?.status === "ok" && range.fallback === null
  );
  const hasFallbackRange = chartRanges.some((range) => Boolean(range?.fallback));
  const hasProviderError = chartRanges.some((range) =>
    ["provider_access_error", "provider_error", "rate_limited"].includes(
      range?.status ?? ""
    )
  );
  const hasDirectPoints = (input.chartPoints?.length ?? 0) > 1;

  if (hasLiveRange || hasDirectPoints) {
    availableFields.push("chart");
    return "ok";
  }

  if (hasFallbackRange) {
    missingFields.push("live chart");
    return "fallback";
  }

  if (hasProviderError) {
    missingFields.push("chart");
    return "error";
  }

  missingFields.push("chart");
  return "missing";
}

function evaluateNewsStatus(
  input: StockDataHealthInput,
  missingFields: string[],
  availableFields: string[]
): NewsHealthStatus {
  if (input.newsError) {
    missingFields.push("news");
    return "error";
  }

  const count = input.news?.length ?? 0;

  if (count >= 2) {
    availableFields.push("news");
    return "ok";
  }

  if (count === 1) {
    availableFields.push("limited news");
    missingFields.push("additional news context");
    return "limited";
  }

  missingFields.push("news");
  return "missing";
}

function evaluateOverallStatus({
  quoteStatus,
  chartStatus,
}: Pick<
  StockDataHealth,
  "quoteStatus" | "profileStatus" | "chartStatus" | "newsStatus"
>): OverallStockDataStatus {
  if (
    (quoteStatus === "ok" || quoteStatus === "partial") &&
    chartStatus === "ok"
  ) {
    return "complete";
  }

  if (quoteStatus === "missing" || quoteStatus === "error") {
    return "unavailable";
  }

  if (
    chartStatus === "missing" ||
    chartStatus === "error" ||
    chartStatus === "fallback"
  ) {
    return "limited";
  }

  return "partial";
}

function getUserFacingCopy(status: OverallStockDataStatus) {
  if (status === "complete") {
    return {
      userFacingLabel: "Live market data connected.",
      userFacingSummary:
        "Quote, profile, chart, and news context are available for this read.",
    };
  }

  if (status === "partial") {
    return {
      userFacingLabel: "Market data partially available.",
      userFacingSummary:
        "ALQIS is showing live inputs where available and labeling missing provider context.",
    };
  }

  if (status === "limited") {
    return {
      userFacingLabel: "Limited market context available.",
      userFacingSummary:
        "ALQIS can show the page shell and available inputs, but confidence should remain conservative.",
    };
  }

  return {
    userFacingLabel: "Market data unavailable for this ticker.",
    userFacingSummary:
      "ALQIS could not build a market read for this ticker yet.",
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isPositiveNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value > 0;
}

function isStaleTimestamp(value: unknown) {
  if (typeof value !== "string") {
    return true;
  }

  const timestamp = new Date(value).getTime();

  if (Number.isNaN(timestamp)) {
    return true;
  }

  return Date.now() - timestamp > STALE_QUOTE_MAX_AGE_MS;
}
