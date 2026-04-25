import type { ChartRange } from "@/lib/market-data/types";

const TICKER_PATTERN = /^[A-Z][A-Z0-9.-]{0,9}$/;
const CHART_RANGES = ["1D", "5D", "1M"] as const;

export function normalizeTicker(value: string) {
  return value.trim().toUpperCase();
}

export function isValidTicker(value: string) {
  return TICKER_PATTERN.test(normalizeTicker(value));
}

export function parseChartRange(value: string | null): ChartRange | null {
  const normalizedRange = (value || "1D").toUpperCase();

  if (CHART_RANGES.includes(normalizedRange as ChartRange)) {
    return normalizedRange as ChartRange;
  }

  return null;
}
