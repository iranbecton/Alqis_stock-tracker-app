export type StockUniverseItem = {
  ticker: string;
  companyName: string;
  sector: string;
  exchange: string;
  type: string;
  currency: string;
};

export const stockUniverse = [
  {
    ticker: "NVDA",
    companyName: "NVIDIA Corporation",
    sector: "AI infrastructure",
    exchange: "NASDAQ",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "AAPL",
    companyName: "Apple Inc.",
    sector: "Consumer platforms",
    exchange: "NASDAQ",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "MSFT",
    companyName: "Microsoft Corporation",
    sector: "Cloud software",
    exchange: "NASDAQ",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "AMD",
    companyName: "Advanced Micro Devices",
    sector: "Semiconductors",
    exchange: "NASDAQ",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "TSLA",
    companyName: "Tesla Inc.",
    sector: "Electric vehicles",
    exchange: "NASDAQ",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "GOOGL",
    companyName: "Alphabet Inc.",
    sector: "Search and AI platforms",
    exchange: "NASDAQ",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "META",
    companyName: "Meta Platforms Inc.",
    sector: "Social platforms and AI",
    exchange: "NASDAQ",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "AMZN",
    companyName: "Amazon.com Inc.",
    sector: "Commerce and cloud",
    exchange: "NASDAQ",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "NFLX",
    companyName: "Netflix Inc.",
    sector: "Streaming media",
    exchange: "NASDAQ",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "AVGO",
    companyName: "Broadcom Inc.",
    sector: "Semiconductor infrastructure",
    exchange: "NASDAQ",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "TSM",
    companyName: "Taiwan Semiconductor Manufacturing Company",
    sector: "Semiconductor foundry",
    exchange: "NYSE",
    type: "ADR",
    currency: "USD",
  },
  {
    ticker: "QQQ",
    companyName: "Invesco QQQ Trust",
    sector: "Technology ETF",
    exchange: "NASDAQ",
    type: "ETF",
    currency: "USD",
  },
  {
    ticker: "SPY",
    companyName: "SPDR S&P 500 ETF Trust",
    sector: "Broad market ETF",
    exchange: "NYSE Arca",
    type: "ETF",
    currency: "USD",
  },
  {
    ticker: "JPM",
    companyName: "JPMorgan Chase & Co.",
    sector: "Banking",
    exchange: "NYSE",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "BAC",
    companyName: "Bank of America Corporation",
    sector: "Banking",
    exchange: "NYSE",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "COST",
    companyName: "Costco Wholesale Corporation",
    sector: "Retail staples",
    exchange: "NASDAQ",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "WMT",
    companyName: "Walmart Inc.",
    sector: "Retail staples",
    exchange: "NYSE",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "DIS",
    companyName: "The Walt Disney Company",
    sector: "Media and entertainment",
    exchange: "NYSE",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "PLTR",
    companyName: "Palantir Technologies Inc.",
    sector: "Data analytics and AI",
    exchange: "NASDAQ",
    type: "Common Stock",
    currency: "USD",
  },
  {
    ticker: "INTC",
    companyName: "Intel Corporation",
    sector: "Semiconductors",
    exchange: "NASDAQ",
    type: "Common Stock",
    currency: "USD",
  },
] satisfies StockUniverseItem[];

export function getStockUniverseItem(symbol: string) {
  const normalizedSymbol = symbol.trim().toUpperCase();

  return stockUniverse.find((item) => item.ticker === normalizedSymbol);
}
