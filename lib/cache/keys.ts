import { createHash } from "node:crypto";
import type { ChartRange } from "@/lib/market-data/types";
import { normalizeTicker } from "@/lib/market-data/validation";

export function quoteCacheKey(ticker: string) {
  return `quote:${cacheSafeTicker(ticker)}`;
}

export function chartCacheKey(ticker: string, range: ChartRange) {
  return `chart:${cacheSafeTicker(ticker)}:${range.toUpperCase()}`;
}

export function newsCacheKey(ticker: string) {
  return `news:${cacheSafeTicker(ticker)}`;
}

export function newsSurfaceCacheKey(ticker: string, surface: "stock" | "dashboard") {
  return `news:${cacheSafeTicker(ticker)}:${surface}`;
}

export function financialsCacheKey(ticker: string) {
  return `financials:${cacheSafeTicker(ticker)}`;
}

export function segmentsCacheKey(ticker: string) {
  return `segments:${cacheSafeTicker(ticker)}`;
}

export function earningsHistoryCacheKey(ticker: string) {
  return `history:${cacheSafeTicker(ticker)}`;
}

export function explanationCacheKey(
  ticker: string,
  timeframe: ChartRange,
  evidenceHash: string
) {
  return `explain:${cacheSafeTicker(ticker)}:${timeframe.toUpperCase()}:${evidenceHash}`;
}

export function fundamentalsCacheKey(ticker: string) {
  return `fundamentals:${cacheSafeTicker(ticker)}`;
}

export function searchCacheKey(query: string) {
  return `search:${query.trim().toLowerCase()}`;
}

export function marketBriefCacheKey(
  userId: string,
  dateKey: string,
  focus = "balanced"
) {
  return `market-brief:user:${userId}:${dateKey}:${focus}`;
}

export function stableHash(value: unknown) {
  return createHash("sha256")
    .update(stableStringify(value))
    .digest("hex")
    .slice(0, 16);
}

function cacheSafeTicker(ticker: string) {
  return normalizeTicker(ticker).replace(/\./g, "-");
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
