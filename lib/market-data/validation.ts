import type { ChartRange } from "@/lib/market-data/types";
import {
  normalizeSecurityTicker,
  validateChartRange,
  validateTicker,
} from "@/lib/security/validation";

export function normalizeTicker(value: string) {
  return normalizeSecurityTicker(value);
}

export function isValidTicker(value: string) {
  return validateTicker(value).ok;
}

export function parseChartRange(value: string | null): ChartRange | null {
  return validateChartRange(value);
}
