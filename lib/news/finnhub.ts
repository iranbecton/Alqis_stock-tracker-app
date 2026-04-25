import type { StockNewsItem } from "@/lib/market-data/types";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

type FinnhubNewsItem = {
  category?: string;
  datetime?: number;
  headline?: string;
  id?: number;
  image?: string;
  related?: string;
  source?: string;
  summary?: string;
  url?: string;
};

function getFinnhubApiKey() {
  const apiKey = process.env.FINNHUB_API_KEY;

  if (!apiKey) {
    throw new Error("Missing FINNHUB_API_KEY. Add it to .env.local without NEXT_PUBLIC.");
  }

  return apiKey;
}

function getDateDaysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString().slice(0, 10);
}

export function normalizeCompanyNews(raw: FinnhubNewsItem[]): StockNewsItem[] {
  return raw
    .filter((item) => item.headline && item.url)
    .map((item) => ({
      id: String(item.id ?? item.url),
      headline: item.headline ?? "Untitled market update",
      summary: item.summary ?? "",
      source: item.source ?? "Finnhub",
      url: item.url ?? "",
      publishedAt: item.datetime
        ? new Date(item.datetime * 1000).toISOString()
        : new Date().toISOString(),
      image: item.image || undefined,
    }));
}

function normalizeHeadline(headline: string) {
  return headline
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function dedupeNews(items: StockNewsItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = normalizeHeadline(item.headline);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function getCompanyKeywords(symbol: string, companyName?: string | null) {
  const keywords = new Set([symbol.toLowerCase()]);
  const companyTokens = (companyName ?? "")
    .toLowerCase()
    .replace(/\b(inc|corporation|corp|company|co|ltd|plc|class|common|stock)\b/g, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4);

  companyTokens.slice(0, 3).forEach((token) => keywords.add(token));
  return [...keywords];
}

export function filterCompanyNews(
  items: StockNewsItem[],
  symbol: string,
  companyName?: string | null
) {
  const keywords = getCompanyKeywords(symbol, companyName);

  return items.filter((item) => {
    const searchable = `${item.headline} ${item.summary}`.toLowerCase();
    return keywords.some((keyword) => searchable.includes(keyword));
  });
}

export async function getFinnhubCompanyNews(symbol: string) {
  const normalizedSymbol = symbol.trim().toUpperCase();
  const url = new URL(`${FINNHUB_BASE_URL}/company-news`);

  url.searchParams.set("symbol", normalizedSymbol);
  url.searchParams.set("from", getDateDaysAgo(14));
  url.searchParams.set("to", new Date().toISOString().slice(0, 10));
  url.searchParams.set("token", getFinnhubApiKey());

  const response = await fetch(url, {
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Finnhub news request failed with ${response.status}.`);
  }

  const raw = (await response.json()) as FinnhubNewsItem[];
  return dedupeNews(normalizeCompanyNews(raw));
}
