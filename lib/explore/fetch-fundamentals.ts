import { withCache } from "@/lib/cache";
import { fundamentalsCacheKey } from "@/lib/cache/keys";
import { normalizeTicker } from "@/lib/market-data/validation";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const FUNDAMENTALS_TTL_SECONDS = 6 * 60 * 60;
const FUNDAMENTALS_SEQUENCE_DELAY_MS = 150;
const FUNDAMENTALS_BATCH_SIZE = 10;
const FUNDAMENTALS_BATCH_WINDOW_MS = 60_000;

type FinnhubMetricResponse = {
  metric?: Record<string, unknown>;
};

export type TickerFundamentals = {
  ticker: string;
  beta: number | null;
  peRatio: number | null;
  marketCap: number | null;
  oneMonthChange: number | null;
  dividendYield: number | null;
  revenueGrowth: number | null;
  fetchedAt: string;
};

export async function fetchTickerFundamentals(
  ticker: string
): Promise<TickerFundamentals> {
  const symbol = normalizeTicker(ticker);

  const { data } = await withCache(
    fundamentalsCacheKey(symbol),
    FUNDAMENTALS_TTL_SECONDS,
    () => fetchTickerFundamentalsFromFinnhub(symbol)
  );

  return data;
}

export async function fetchTickerFundamentalsBatch(
  tickers: string[]
): Promise<TickerFundamentals[]> {
  const symbols = Array.from(
    new Set(tickers.map((ticker) => normalizeTicker(ticker)).filter(Boolean))
  );
  const fundamentals: TickerFundamentals[] = [];

  for (let index = 0; index < symbols.length; index += 1) {
    if (index > 0) {
      await delay(FUNDAMENTALS_SEQUENCE_DELAY_MS);
    }

    if (index > 0 && index % FUNDAMENTALS_BATCH_SIZE === 0) {
      await delay(
        Math.max(
          0,
          FUNDAMENTALS_BATCH_WINDOW_MS -
            FUNDAMENTALS_SEQUENCE_DELAY_MS * (FUNDAMENTALS_BATCH_SIZE - 1)
        )
      );
    }

    fundamentals.push(await fetchTickerFundamentals(symbols[index]));
  }

  return fundamentals;
}

async function fetchTickerFundamentalsFromFinnhub(
  symbol: string
): Promise<TickerFundamentals> {
  const metric = await getFinnhubMetric(symbol);

  return {
    ticker: symbol,
    beta: numberValue(metric?.beta),
    peRatio:
      numberValue(metric?.peNormalizedAnnual) ?? numberValue(metric?.peTTM),
    marketCap: toBillions(numberValue(metric?.marketCapitalization)),
    oneMonthChange:
      numberValue(metric?.monthToDatePriceReturnDaily) ??
      numberValue(metric?.["1MonthPriceReturnDaily"]),
    dividendYield: numberValue(metric?.dividendYieldIndicatedAnnual),
    revenueGrowth: numberValue(metric?.revenueGrowthTTMYoy),
    fetchedAt: new Date().toISOString(),
  };
}

async function getFinnhubMetric(symbol: string) {
  const apiKey = process.env.FINNHUB_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  const url = new URL(`${FINNHUB_BASE_URL}/stock/metric`);
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("metric", "all");
  url.searchParams.set("token", apiKey);

  try {
    const response = await fetch(url, {
      next: { revalidate: FUNDAMENTALS_TTL_SECONDS },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as FinnhubMetricResponse;
    return payload.metric ?? null;
  } catch {
    return null;
  }
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/,/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function toBillions(value: number | null) {
  return typeof value === "number" ? value / 1000 : null;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
