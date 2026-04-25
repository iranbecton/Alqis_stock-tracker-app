import type {
  ChartProvider,
  ChartProviderResult,
} from "@/lib/market-data/chart-provider";
import type { ChartPoint, ChartRange } from "@/lib/market-data/types";

const TWELVE_DATA_BASE_URL = "https://api.twelvedata.com";
const SUCCESS_CACHE_TTL_MS = 60_000;

type TwelveDataInterval = "5min" | "15min" | "30min" | "1h" | "1day";

type TwelveDataRangeConfig = {
  interval: TwelveDataInterval;
  outputsize: number;
};

type TwelveDataTimeSeriesValue = {
  datetime?: string;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
};

type TwelveDataTimeSeriesResponse = {
  meta?: {
    symbol?: string;
    interval?: string;
    exchange_timezone?: string;
  };
  values?: TwelveDataTimeSeriesValue[];
  status?: string;
  code?: number;
  message?: string;
};

export class TwelveDataProviderError extends Error {
  provider = "twelve-data";

  constructor(
    message: string,
    public status: number,
    public responseBody: string,
    public kind: "access" | "rate_limited" | "provider_error" = "provider_error"
  ) {
    super(message);
    this.name = "TwelveDataProviderError";
  }
}

const chartResultCache = new Map<
  string,
  {
    expiresAt: number;
    promise: Promise<ChartProviderResult>;
  }
>();

function getTwelveDataApiKey() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Missing TWELVE_DATA_API_KEY. Add it to .env.local without NEXT_PUBLIC."
    );
  }

  return apiKey;
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function getTwelveDataUrl(
  symbol: string,
  { interval, outputsize }: TwelveDataRangeConfig
) {
  const url = new URL(`${TWELVE_DATA_BASE_URL}/time_series`);

  url.searchParams.set("symbol", normalizeSymbol(symbol));
  url.searchParams.set("interval", interval);
  url.searchParams.set("outputsize", String(outputsize));
  url.searchParams.set("order", "asc");
  url.searchParams.set("format", "JSON");
  url.searchParams.set("timezone", "UTC");
  url.searchParams.set("apikey", getTwelveDataApiKey());

  return url;
}

function redactApiKey(url: URL) {
  const safeUrl = new URL(url);
  safeUrl.searchParams.set("apikey", "[redacted]");
  return safeUrl.toString();
}

export function mapRangeToTwelveDataInterval(
  range: ChartRange
): TwelveDataRangeConfig {
  return mapRangeToTwelveDataIntervals(range)[0];
}

function mapRangeToTwelveDataIntervals(
  range: ChartRange
): TwelveDataRangeConfig[] {
  if (range === "1D") {
    return [
      {
        interval: "5min",
        outputsize: 96,
      },
      {
        interval: "15min",
        outputsize: 64,
      },
    ];
  }

  if (range === "5D") {
    return [
      {
        interval: "30min",
        outputsize: 80,
      },
      {
        interval: "1h",
        outputsize: 60,
      },
    ];
  }

  return [
    {
      interval: "1day",
      outputsize: 30,
    },
  ];
}

function toNumber(value?: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseTwelveDataTime(value?: string) {
  if (!value) {
    return new Date().toISOString();
  }

  const normalizedValue = value.includes(":")
    ? `${value.replace(" ", "T")}Z`
    : `${value}T00:00:00Z`;
  const parsed = new Date(normalizedValue);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
}

export function normalizeTwelveDataPoints(
  raw: TwelveDataTimeSeriesResponse
): ChartPoint[] {
  if (!raw.values?.length) {
    return [];
  }

  return raw.values
    .map((point) => ({
      time: parseTwelveDataTime(point.datetime),
      open: toNumber(point.open),
      high: toNumber(point.high),
      low: toNumber(point.low),
      close: toNumber(point.close),
      volume: point.volume ? toNumber(point.volume) : undefined,
    }))
    .filter((point) => point.close > 0);
}

function isNoDataResponse(message: string, status: number) {
  return (
    status === 404 ||
    /no data|not found|symbol is invalid|invalid symbol|no such symbol/i.test(message)
  );
}

function isRateLimitedResponse(message: string, status: number) {
  return (
    status === 429 ||
    /rate limit|too many requests|api credits|credits|quota|limit exceeded/i.test(
      message
    )
  );
}

function getProviderErrorKind(message: string, status: number) {
  if (status === 401 || status === 403) return "access" as const;
  if (isRateLimitedResponse(message, status)) return "rate_limited" as const;
  return "provider_error" as const;
}

function logTwelveDataIssue({
  label,
  symbol,
  range,
  status,
  body,
  url,
}: {
  label: string;
  symbol: string;
  range: ChartRange;
  status: number;
  body: string;
  url: URL;
}) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  console.error(`[ALQIS market-data] Twelve Data ${label}`, {
    provider: "twelve-data",
    symbol,
    range,
    status,
    body,
    url: redactApiKey(url),
  });
}

async function requestTwelveDataTimeSeries(
  symbol: string,
  range: ChartRange,
  config: TwelveDataRangeConfig
) {
  const normalizedSymbol = normalizeSymbol(symbol);
  const url = getTwelveDataUrl(normalizedSymbol, config);
  const response = await fetch(url, {
    cache: "no-store",
  });
  const body = await response.text();

  if (!response.ok) {
    logTwelveDataIssue({
      label: "upstream error",
      symbol: normalizedSymbol,
      range,
      status: response.status,
      body,
      url,
    });

    if (isNoDataResponse(body, response.status)) {
      return [];
    }

    throw new TwelveDataProviderError(
      `Twelve Data request failed with ${response.status}.`,
      response.status,
      body,
      getProviderErrorKind(body, response.status)
    );
  }

  const raw = JSON.parse(body) as TwelveDataTimeSeriesResponse;

  if (raw.status === "error") {
    const providerStatus = raw.code ?? response.status;
    const providerMessage = raw.message ?? body;

    logTwelveDataIssue({
      label: "provider error",
      symbol: normalizedSymbol,
      range,
      status: providerStatus,
      body,
      url,
    });

    if (isNoDataResponse(providerMessage, providerStatus)) {
      return [];
    }

    throw new TwelveDataProviderError(
      raw.message ?? "Twelve Data returned an error.",
      providerStatus,
      body,
      getProviderErrorKind(providerMessage, providerStatus)
    );
  }

  const points = normalizeTwelveDataPoints(raw);

  if (!points.length) {
    logTwelveDataIssue({
      label: "empty response",
      symbol: normalizedSymbol,
      range,
      status: response.status,
      body,
      url,
    });
  }

  return points;
}

export async function getTwelveDataTimeSeries(
  symbol: string,
  range: ChartRange
): Promise<ChartPoint[]> {
  const normalizedSymbol = normalizeSymbol(symbol);
  let lastError: TwelveDataProviderError | undefined;

  for (const config of mapRangeToTwelveDataIntervals(range)) {
    try {
      const points = await requestTwelveDataTimeSeries(
        normalizedSymbol,
        range,
        config
      );

      if (points.length > 0) {
        return points;
      }
    } catch (error) {
      if (error instanceof TwelveDataProviderError) {
        lastError = error;

        if (error.kind === "access" || error.kind === "rate_limited") {
          break;
        }

        continue;
      }

      throw error;
    }
  }

  if (lastError) {
    throw lastError;
  }

  return [];
}

async function getTwelveDataChartProviderResultUncached(
  symbol: string,
  range: ChartRange
): Promise<ChartProviderResult> {
  const normalizedSymbol = normalizeSymbol(symbol);

  try {
    const points = await getTwelveDataTimeSeries(normalizedSymbol, range);

    return {
      provider: "twelve-data",
      symbol: normalizedSymbol,
      range,
      points,
      status: points.length > 0 ? "ok" : "empty",
      providerMessage:
        points.length > 0
          ? undefined
          : `Twelve Data returned no chart points for ${normalizedSymbol} ${range}.`,
    };
  } catch (error) {
    if (error instanceof TwelveDataProviderError) {
      return {
        provider: "twelve-data",
        symbol: normalizedSymbol,
        range,
        points: [],
        status: error.kind === "rate_limited" ? "rate_limited" : "provider_error",
        providerAccessError: error.kind === "access",
        providerRateLimited: error.kind === "rate_limited",
        providerStatus: error.status,
        providerMessage: error.responseBody || error.message,
      };
    }

    throw error;
  }
}

export async function getTwelveDataChartProviderResult(
  symbol: string,
  range: ChartRange
): Promise<ChartProviderResult> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const cacheKey = `${normalizedSymbol}:${range}`;
  const cached = chartResultCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.promise;
  }

  const promise = getTwelveDataChartProviderResultUncached(
    normalizedSymbol,
    range
  );

  chartResultCache.set(cacheKey, {
    expiresAt: Date.now() + SUCCESS_CACHE_TTL_MS,
    promise,
  });

  try {
    const result = await promise;

    if (result.status !== "ok") {
      chartResultCache.delete(cacheKey);
    }

    return result;
  } catch (error) {
    chartResultCache.delete(cacheKey);
    throw error;
  }
}

export const twelveDataChartProvider: ChartProvider = {
  name: "twelve-data",
  getCandles: getTwelveDataChartProviderResult,
};
