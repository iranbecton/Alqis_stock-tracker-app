import type { ChartPoint, ChartRange } from "@/lib/market-data/types";

export type ChartProviderStatus =
  | "ok"
  | "empty"
  | "provider_error"
  | "rate_limited";

export type ChartProviderResult = {
  provider: string;
  symbol: string;
  range: ChartRange;
  points: ChartPoint[];
  status: ChartProviderStatus;
  providerAccessError?: boolean;
  providerRateLimited?: boolean;
  providerStatus?: number;
  providerMessage?: string;
};

export type ChartProvider = {
  name: string;
  getCandles(symbol: string, range: ChartRange): Promise<ChartProviderResult>;
};
