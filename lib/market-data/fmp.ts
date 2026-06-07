import { normalizeTicker } from "@/lib/market-data/validation";

const FMP_STABLE_BASE_URL = "https://financialmodelingprep.com/stable/";

type FMPRecord = Record<string, unknown>;

export type FMPIncomeStatement = {
  symbol: string;
  date: string | null;
  fiscalYear: string | null;
  period: string | null;
  reportedCurrency: string | null;
  revenue: number | null;
  netIncome: number | null;
  ebitda: number | null;
  eps: number | null;
};

export type FMPKeyMetrics = {
  symbol: string;
  date: string | null;
  fiscalYear: string | null;
  period: string | null;
  reportedCurrency: string | null;
  marketCap: number | null;
  enterpriseValue: number | null;
  evToEBITDA: number | null;
  evToSales: number | null;
  freeCashFlowYield: number | null;
  earningsYield: number | null;
};

export type FMPProfile = {
  symbol: string;
  companyName: string | null;
  description: string | null;
  sector: string | null;
  industry: string | null;
  country: string | null;
  marketCap: number | null;
  employees: number | null;
  beta: number | null;
  volume: number | null;
  range: string | null;
  ceo: string | null;
  website: string | null;
};

export type FMPEarningsCalendarItem = {
  symbol: string;
  date: string | null;
  epsActual: number | null;
  epsEstimated: number | null;
  revenueActual: number | null;
  revenueEstimated: number | null;
};

export type FMPAnalystEstimate = {
  symbol: string;
  date: string | null;
  estimatedEpsAvg: number | null;
  estimatedRevenueAvg: number | null;
};

export type FMPSegmentPeriod = {
  symbol: string;
  date: string | null;
  fiscalYear: string | null;
  period: string | null;
  reportedCurrency: string | null;
  segments: Array<{
    name: string;
    revenue: number;
  }>;
};

function getFMPApiKey() {
  return process.env.FMP_API_KEY?.trim() || null;
}

function getFMPUrl(endpoint: string, params: Record<string, string | number>) {
  const apiKey = getFMPApiKey();

  if (!apiKey) {
    return null;
  }

  const url = new URL(endpoint, FMP_STABLE_BASE_URL);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  url.searchParams.set("apikey", apiKey);

  return url;
}

async function fetchFMPArray(
  endpoint: string,
  params: Record<string, string | number>
): Promise<FMPRecord[]> {
  const url = getFMPUrl(endpoint, params);

  if (!url) {
    return [];
  }

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      return [];
    }

    const payload: unknown = await response.json();

    if (!Array.isArray(payload)) {
      return [];
    }

    return payload.filter(isRecord);
  } catch {
    return [];
  }
}

export async function getFMPIncomeStatement(
  ticker: string,
  period = "annual",
  limit = 5
): Promise<FMPIncomeStatement[]> {
  const symbol = normalizeTicker(ticker);
  const rows = await fetchFMPArray("income-statement", {
    symbol,
    period,
    limit,
  });

  return rows.map(normalizeIncomeStatement).filter(Boolean);
}

export async function getFMPKeyMetrics(
  ticker: string
): Promise<FMPKeyMetrics | null> {
  const symbol = normalizeTicker(ticker);
  const rows = await fetchFMPArray("key-metrics", {
    symbol,
    limit: 1,
  });

  return rows[0] ? normalizeKeyMetrics(rows[0]) : null;
}

export async function getFMPProfile(ticker: string): Promise<FMPProfile | null> {
  const symbol = normalizeTicker(ticker);
  const rows = await fetchFMPArray("profile", {
    symbol,
  });

  return rows[0] ? normalizeProfile(rows[0]) : null;
}

export async function getFMPEarningsCalendar(
  ticker: string
): Promise<FMPEarningsCalendarItem[]> {
  const symbol = normalizeTicker(ticker);
  const rows = await fetchFMPArray("earnings-calendar", {
    symbol,
  });

  return rows.map(normalizeEarningsCalendarItem).filter(Boolean);
}

export async function getFMPAnalystEstimates(
  ticker: string
): Promise<FMPAnalystEstimate | null> {
  const symbol = normalizeTicker(ticker);
  const rows = await fetchFMPArray("analyst-estimates", {
    symbol,
    limit: 1,
  });

  return rows[0] ? normalizeAnalystEstimate(rows[0]) : null;
}

export async function getFMPRevenueProductSegmentation(
  ticker: string
): Promise<FMPSegmentPeriod[]> {
  const symbol = normalizeTicker(ticker);
  const rows = await fetchFMPArray("revenue-product-segmentation", {
    symbol,
  });

  return rows
    .map(normalizeSegmentPeriod)
    .filter((period): period is FMPSegmentPeriod => Boolean(period));
}

function normalizeIncomeStatement(row: FMPRecord): FMPIncomeStatement {
  const symbol = stringValue(row.symbol);

  return {
    symbol: symbol || "",
    date: stringValue(row.date),
    fiscalYear: stringValue(row.fiscalYear),
    period: stringValue(row.period),
    reportedCurrency: stringValue(row.reportedCurrency),
    revenue: numberValue(row.revenue),
    netIncome: numberValue(row.netIncome) ?? numberValue(row.bottomLineNetIncome),
    ebitda: numberValue(row.ebitda),
    eps: numberValue(row.eps) ?? numberValue(row.epsDiluted),
  };
}

function normalizeKeyMetrics(row: FMPRecord): FMPKeyMetrics {
  const symbol = stringValue(row.symbol);

  return {
    symbol: symbol || "",
    date: stringValue(row.date),
    fiscalYear: stringValue(row.fiscalYear),
    period: stringValue(row.period),
    reportedCurrency: stringValue(row.reportedCurrency),
    marketCap: numberValue(row.marketCap),
    enterpriseValue: numberValue(row.enterpriseValue),
    evToEBITDA: numberValue(row.evToEBITDA),
    evToSales: numberValue(row.evToSales),
    freeCashFlowYield: numberValue(row.freeCashFlowYield),
    earningsYield: numberValue(row.earningsYield),
  };
}

function normalizeProfile(row: FMPRecord): FMPProfile {
  const symbol = stringValue(row.symbol);

  return {
    symbol: symbol || "",
    companyName: stringValue(row.companyName),
    description: stringValue(row.description),
    sector: stringValue(row.sector),
    industry: stringValue(row.industry),
    country: stringValue(row.country),
    marketCap: numberValue(row.mktCap) ?? numberValue(row.marketCap),
    employees: numberValue(row.employees) ?? numberValue(row.fullTimeEmployees),
    beta: numberValue(row.beta),
    volume: numberValue(row.volume),
    range: stringValue(row.range),
    ceo: stringValue(row.ceo),
    website: stringValue(row.website),
  };
}

function normalizeEarningsCalendarItem(
  row: FMPRecord
): FMPEarningsCalendarItem {
  const symbol = stringValue(row.symbol);

  return {
    symbol: symbol || "",
    date: stringValue(row.date),
    epsActual: numberValue(row.epsActual),
    epsEstimated: numberValue(row.epsEstimated),
    revenueActual: numberValue(row.revenueActual),
    revenueEstimated: numberValue(row.revenueEstimated),
  };
}

function normalizeAnalystEstimate(row: FMPRecord): FMPAnalystEstimate {
  const symbol = stringValue(row.symbol);

  return {
    symbol: symbol || "",
    date: stringValue(row.date),
    estimatedEpsAvg:
      numberValue(row.estimatedEpsAvg) ??
      numberValue(row.estimatedEpsAverage) ??
      numberValue(row.estimatedEps),
    estimatedRevenueAvg:
      numberValue(row.estimatedRevenueAvg) ??
      numberValue(row.estimatedRevenueAverage) ??
      numberValue(row.estimatedRevenue),
  };
}

function normalizeSegmentPeriod(row: FMPRecord): FMPSegmentPeriod | null {
  const data = row.data;

  if (!isRecord(data)) {
    return null;
  }

  const segments = Object.entries(data)
    .map(([name, value]) => ({
      name,
      revenue: numberValue(value),
    }))
    .filter(
      (item): item is { name: string; revenue: number } =>
        typeof item.revenue === "number" && item.revenue > 0
    );

  if (!segments.length) {
    return null;
  }

  return {
    symbol: stringValue(row.symbol) || "",
    date: stringValue(row.date),
    fiscalYear: stringValue(row.fiscalYear),
    period: stringValue(row.period),
    reportedCurrency: stringValue(row.reportedCurrency),
    segments,
  };
}

function isRecord(value: unknown): value is FMPRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown) {
  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return null;
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
