export type WatchlistItem = {
  id: string;
  userId: string;
  ticker: string;
  companyName: string | null;
  createdAt: string;
};

export type WatchlistApiItem = {
  id: string;
  ticker: string;
  companyName: string | null;
  createdAt: string;
};

export type WatchlistApiResponse = {
  items: WatchlistApiItem[];
};

export type WatchlistDirection = "up" | "down" | "flat";

export type WatchlistIntelligenceItem = {
  id: string;
  ticker: string;
  companyName: string | null;
  currentPrice: number | null;
  change: number | null;
  changePercent: number | null;
  direction: WatchlistDirection;
  sector: string | null;
  confidence: string | null;
  readStatus: string;
  quickRead: string;
  providerStatus: "ok" | "partial" | "unavailable";
};
