import type {
  ChartPoint,
  ChartRange,
  CompanyProfile,
  MarketStatus,
  StockQuote,
} from "@/lib/market-data/types";
import type {
  ChartProvider,
  ChartProviderResult,
} from "@/lib/market-data/chart-provider";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

type FinnhubQuoteResponse = {
  c?: number;
  d?: number;
  dp?: number;
  h?: number;
  l?: number;
  o?: number;
  pc?: number;
  t?: number;
};

type FinnhubCandleResponse = {
  c?: number[];
  h?: number[];
  l?: number[];
  o?: number[];
  s?: string;
  t?: number[];
  v?: number[];
};

type FinnhubProfileResponse = {
  country?: string;
  currency?: string;
  exchange?: string;
  finnhubIndustry?: string;
  logo?: string;
  name?: string;
  ticker?: string;
  weburl?: string;
};

type FinnhubSearchResponse = {
  count?: number;
  result?: Array<{
    currency?: string;
    description?: string;
    displaySymbol?: string;
    figi?: string;
    mic?: string;
    symbol?: string;
    type?: string;
  }>;
};

export type FinnhubSymbolSearchResult = {
  ticker: string;
  name: string;
  exchange?: string;
  type?: string;
  currency?: string;
};

export class FinnhubProviderError extends Error {
  provider = "finnhub";
  providerAccessError: boolean;

  constructor(
    message: string,
    public status: number,
    public responseBody: string,
    public endpoint: string
  ) {
    super(message);
    this.name = "FinnhubProviderError";
    this.providerAccessError = status === 401 || status === 403;
  }
}

function getFinnhubApiKey() {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    throw new Error("Missing FINNHUB_API_KEY. Add it to .env.local without NEXT_PUBLIC.");
  }

  return apiKey;
}

function normalizeSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

function getFinnhubUrl(pathname: string, params: Record<string, string | number>) {
  const url = new URL(`${FINNHUB_BASE_URL}${pathname}`);
  const apiKey = getFinnhubApiKey();

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  url.searchParams.set("token", apiKey);

  return url;
}

async function fetchFinnhub<T>(pathname: string, params: Record<string, string | number>) {
  const url = getFinnhubUrl(pathname, params);
  const response = await fetch(url, {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    const body = await response.text();

    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS market-data] Finnhub upstream error", {
        endpoint: pathname,
        status: response.status,
        body,
        params: redactToken(url),
      });
    }

    throw new FinnhubProviderError(
      `Finnhub request failed with ${response.status}.`,
      response.status,
      body,
      pathname
    );
  }

  return (await response.json()) as T;
}

function redactToken(url: URL) {
  const safeUrl = new URL(url);
  safeUrl.searchParams.set("token", "[redacted]");
  return safeUrl.toString();
}

function inferMarketStatus(timestamp?: number): MarketStatus {
  if (!timestamp) {
    return "delayed";
  }

  const ageMinutes = (Date.now() - timestamp * 1000) / 60_000;
  return ageMinutes <= 30 ? "open" : "delayed";
}

function getCandleWindow(range: ChartRange) {
  const now = Math.floor(Date.now() / 1000);
  const day = 24 * 60 * 60;

  if (range === "1D") {
    return {
      resolution: "5",
      from: now - day,
      to: now,
    };
  }

  if (range === "5D") {
    return {
      resolution: "60",
      from: now - 7 * day,
      to: now,
    };
  }

  return {
    resolution: "D",
    from: now - 45 * day,
    to: now,
  };
}

export async function getFinnhubQuote(symbol: string): Promise<StockQuote> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const raw = await fetchFinnhub<FinnhubQuoteResponse>("/quote", {
    symbol: normalizedSymbol,
  });

  if (!raw.c || raw.c <= 0) {
    throw new Error(`No quote data returned for ${normalizedSymbol}.`);
  }

  return {
    symbol: normalizedSymbol,
    price: raw.c,
    previousClose: raw.pc ?? 0,
    open: raw.o ?? 0,
    high: raw.h ?? 0,
    low: raw.l ?? 0,
    change: raw.d ?? raw.c - (raw.pc ?? raw.c),
    changePercent:
      raw.dp ?? (raw.pc ? ((raw.c - raw.pc) / raw.pc) * 100 : 0),
    timestamp: raw.t ? new Date(raw.t * 1000).toISOString() : new Date().toISOString(),
    marketStatus: inferMarketStatus(raw.t),
  };
}

export async function getFinnhubCandles(
  symbol: string,
  range: ChartRange
): Promise<ChartPoint[]> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const window = getCandleWindow(range);
  const raw = await fetchFinnhub<FinnhubCandleResponse>("/stock/candle", {
    symbol: normalizedSymbol,
    resolution: window.resolution,
    from: window.from,
    to: window.to,
  });

  if (raw.s !== "ok" || !raw.t?.length) {
    return [];
  }

  return raw.t.map((timestamp, index) => ({
    time: new Date(timestamp * 1000).toISOString(),
    open: raw.o?.[index] ?? raw.c?.[index] ?? 0,
    high: raw.h?.[index] ?? raw.c?.[index] ?? 0,
    low: raw.l?.[index] ?? raw.c?.[index] ?? 0,
    close: raw.c?.[index] ?? 0,
    volume: raw.v?.[index],
  }));
}

export async function getFinnhubChartProviderResult(
  symbol: string,
  range: ChartRange
): Promise<ChartProviderResult> {
  const normalizedSymbol = normalizeSymbol(symbol);

  try {
    const points = await getFinnhubCandles(normalizedSymbol, range);

    return {
      provider: "finnhub",
      symbol: normalizedSymbol,
      range,
      points,
      status: points.length > 0 ? "ok" : "empty",
    };
  } catch (error) {
    if (error instanceof FinnhubProviderError) {
      return {
        provider: "finnhub",
        symbol: normalizedSymbol,
        range,
        points: [],
        status: "empty",
        providerAccessError: error.providerAccessError,
        providerStatus: error.status,
        providerMessage: error.responseBody || error.message,
      };
    }

    throw error;
  }
}

export const finnhubChartProvider: ChartProvider = {
  name: "finnhub",
  getCandles: getFinnhubChartProviderResult,
};

export async function getFinnhubCompanyProfile(symbol: string): Promise<CompanyProfile> {
  const normalizedSymbol = normalizeSymbol(symbol);
  const raw = await fetchFinnhub<FinnhubProfileResponse>("/stock/profile2", {
    symbol: normalizedSymbol,
  });

  return {
    symbol: raw.ticker || normalizedSymbol,
    companyName: raw.name || normalizedSymbol,
    exchange: raw.exchange,
    sector: raw.finnhubIndustry,
    industry: raw.finnhubIndustry,
    country: raw.country,
    currency: raw.currency,
    logo: raw.logo,
    webUrl: raw.weburl,
  };
}

export async function searchFinnhubSymbols(
  query: string
): Promise<FinnhubSymbolSearchResult[]> {
  const normalizedQuery = query.trim();

  if (!normalizedQuery) {
    return [];
  }

  const raw = await fetchFinnhub<FinnhubSearchResponse>("/search", {
    q: normalizedQuery,
  });

  return (raw.result ?? []).map((item) => ({
    ticker: (item.displaySymbol || item.symbol || "").trim().toUpperCase(),
    name: item.description || item.displaySymbol || item.symbol || "",
    exchange: item.mic,
    type: item.type,
    currency: item.currency,
  }));
}
