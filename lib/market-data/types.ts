export type ChartRange = "1D" | "5D" | "1M";

export type MarketStatus = "open" | "closed" | "delayed";

export type StockQuote = {
  symbol: string;
  price: number;
  previousClose: number;
  open: number;
  high: number;
  low: number;
  change: number;
  changePercent: number;
  timestamp: string;
  marketStatus?: MarketStatus;
};

export type ChartPoint = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

export type CompanyProfile = {
  symbol: string;
  companyName: string;
  exchange?: string;
  sector?: string;
  industry?: string;
  country?: string;
  currency?: string;
  logo?: string;
  webUrl?: string;
};

export type StockNewsItem = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  image?: string;
};
