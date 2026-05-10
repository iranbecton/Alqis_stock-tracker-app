import type { ChartRange } from "@/lib/market-data/types";

const TICKER_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;
const CHART_RANGES = ["1D", "5D", "1M"] as const;
const MAX_SEARCH_QUERY_LENGTH = 64;

export type ExplainRequestValidation = {
  ticker: string;
  timeframe: ChartRange;
  useAIWording: boolean;
  forceRefresh: boolean;
};

export function normalizeSecurityTicker(value: unknown) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

export function validateTicker(value: unknown) {
  const ticker = normalizeSecurityTicker(value);

  return {
    ok: TICKER_PATTERN.test(ticker),
    ticker,
  };
}

export function validateChartRange(value: unknown): ChartRange | null {
  const normalizedRange =
    typeof value === "string" && value.trim()
      ? value.trim().toUpperCase()
      : "1D";

  return CHART_RANGES.includes(normalizedRange as ChartRange)
    ? (normalizedRange as ChartRange)
    : null;
}

export function validateSearchQuery(value: unknown) {
  const query = typeof value === "string" ? value.trim() : "";

  if (!query) {
    return { ok: true as const, query: "" };
  }

  if (query.length > MAX_SEARCH_QUERY_LENGTH) {
    return {
      ok: false as const,
      query: "",
      error: "Search query is too long.",
    };
  }

  if (/[\u0000-\u001F<>]/.test(query)) {
    return {
      ok: false as const,
      query: "",
      error: "Search query contains unsupported characters.",
    };
  }

  return {
    ok: true as const,
    query,
  };
}

export function validateExplainRequestBody(
  body: unknown
):
  | { ok: true; value: ExplainRequestValidation }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const record = body as Record<string, unknown>;
  const ticker = validateTicker(record.ticker);
  const timeframe = validateChartRange(record.timeframe);

  if (!ticker.ok) {
    return { ok: false, error: "Invalid ticker symbol." };
  }

  if (!timeframe) {
    return {
      ok: false,
      error: "Unsupported timeframe. Use 1D, 5D, or 1M.",
    };
  }

  if (
    "useAIWording" in record &&
    typeof record.useAIWording !== "boolean"
  ) {
    return { ok: false, error: "useAIWording must be true or false." };
  }

  if (
    "forceRefresh" in record &&
    typeof record.forceRefresh !== "boolean"
  ) {
    return { ok: false, error: "forceRefresh must be true or false." };
  }

  return {
    ok: true,
    value: {
      ticker: ticker.ticker,
      timeframe,
      useAIWording: record.useAIWording === true,
      forceRefresh: record.forceRefresh === true,
    },
  };
}
