import { createHash } from "node:crypto";
import type { ChartRange } from "@/lib/market-data/types";
import { normalizeTicker } from "@/lib/market-data/validation";

export function quoteCacheKey(ticker: string) {
  return `quote:${normalizeTicker(ticker)}`;
}

export function chartCacheKey(ticker: string, range: ChartRange) {
  return `chart:${normalizeTicker(ticker)}:${range.toUpperCase()}`;
}

export function newsCacheKey(ticker: string) {
  return `news:${normalizeTicker(ticker)}`;
}

export function explanationCacheKey(
  ticker: string,
  timeframe: ChartRange,
  evidenceHash: string
) {
  return `explain:${normalizeTicker(ticker)}:${timeframe.toUpperCase()}:${evidenceHash}`;
}

export function searchCacheKey(query: string) {
  return `search:${query.trim().toLowerCase()}`;
}

export function marketBriefCacheKey(userId: string, dateKey: string) {
  return `market-brief:user:${userId}:${dateKey}`;
}

export function stableHash(value: unknown) {
  return createHash("sha256")
    .update(stableStringify(value))
    .digest("hex")
    .slice(0, 16);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}
