import type { StockQuote } from "@/lib/market-data/types";

export type DailyBriefStatus = "ok" | "limited" | "unavailable";

export type DailyBriefMover = {
  ticker: string;
  companyName: string;
  sector: string | null;
  price: number;
  change: number;
  changePercent: number;
  direction: "up" | "down" | "flat";
  note: string;
};

export type DailyBriefSectionItem = {
  label: string;
  detail: string;
};

export type DailyMarketBrief = {
  status: DailyBriefStatus;
  generatedAt: string;
  headline: string;
  summary: string;
  watchlistMovers: DailyBriefMover[];
  marketThemes: DailyBriefSectionItem[];
  whatToWatch: DailyBriefSectionItem[];
  dataNotes: string[];
};

export type DailyBriefInputItem = {
  ticker: string;
  companyName: string;
  sector: string | null;
  quote?: StockQuote;
  dataStatus: "ok" | "unavailable";
};

export function buildDailyMarketBrief({
  items,
  isPersonalized,
}: {
  items: DailyBriefInputItem[];
  isPersonalized: boolean;
}): DailyMarketBrief {
  const generatedAt = new Date().toISOString();
  const usableItems = items.filter(hasUsableQuote);
  const sortedMovers = [...usableItems].sort(
    (a, b) => Math.abs(b.quote.changePercent) - Math.abs(a.quote.changePercent)
  );
  const positiveMovers = usableItems
    .filter((item) => item.quote.changePercent > 0.05)
    .sort((a, b) => b.quote.changePercent - a.quote.changePercent);
  const negativeMovers = usableItems
    .filter((item) => item.quote.changePercent < -0.05)
    .sort((a, b) => a.quote.changePercent - b.quote.changePercent);
  const strongestPositive = positiveMovers[0];
  const strongestNegative = negativeMovers[0];
  const status = getBriefStatus(usableItems.length);
  const dataNotes = createDataNotes({
    itemCount: items.length,
    usableCount: usableItems.length,
    isPersonalized,
  });

  return {
    status,
    generatedAt,
    headline: createHeadline({
      status,
      strongestPositive,
      strongestNegative,
      isPersonalized,
    }),
    summary: createSummary({
      status,
      usableCount: usableItems.length,
      strongestPositive,
      strongestNegative,
      isPersonalized,
    }),
    watchlistMovers: sortedMovers.slice(0, 4).map(toBriefMover),
    marketThemes: createMarketThemes(usableItems),
    whatToWatch: createWhatToWatch({
      usableItems,
      strongestPositive,
      strongestNegative,
      isPersonalized,
    }),
    dataNotes,
  };
}

function hasUsableQuote(
  item: DailyBriefInputItem
): item is DailyBriefInputItem & { quote: StockQuote } {
  return (
    item.dataStatus === "ok" &&
    Boolean(item.quote) &&
    typeof item.quote?.price === "number" &&
    typeof item.quote?.changePercent === "number"
  );
}

function getBriefStatus(usableCount: number): DailyBriefStatus {
  if (usableCount >= 3) return "ok";
  if (usableCount >= 1) return "limited";
  return "unavailable";
}

function createHeadline({
  status,
  strongestPositive,
  strongestNegative,
  isPersonalized,
}: {
  status: DailyBriefStatus;
  strongestPositive?: DailyBriefInputItem & { quote: StockQuote };
  strongestNegative?: DailyBriefInputItem & { quote: StockQuote };
  isPersonalized: boolean;
}) {
  if (status === "unavailable") {
    return "Market brief unavailable while provider data is limited.";
  }

  if (!isPersonalized) {
    return "Today’s brief is using curated market reads until your watchlist grows.";
  }

  if (
    strongestPositive &&
    (!strongestNegative ||
      strongestPositive.quote.changePercent >=
        Math.abs(strongestNegative.quote.changePercent))
  ) {
    return `${strongestPositive.ticker} is the clearest positive mover in your saved names.`;
  }

  if (strongestNegative) {
    return `${strongestNegative.ticker} is the clearest pressure point in your saved names.`;
  }

  return "Your saved names are mostly steady in the latest market snapshot.";
}

function createSummary({
  status,
  usableCount,
  strongestPositive,
  strongestNegative,
  isPersonalized,
}: {
  status: DailyBriefStatus;
  usableCount: number;
  strongestPositive?: DailyBriefInputItem & { quote: StockQuote };
  strongestNegative?: DailyBriefInputItem & { quote: StockQuote };
  isPersonalized: boolean;
}) {
  if (status === "unavailable") {
    return "ALQIS could not assemble enough live quote data for a reliable daily brief. Refresh later or open individual stock reads for more context.";
  }

  const scope = isPersonalized ? "your watchlist" : "the curated ALQIS universe";
  const positiveText = strongestPositive
    ? `${strongestPositive.ticker} moved ${formatPercent(strongestPositive.quote.changePercent)}`
    : "positive movers are muted";
  const negativeText = strongestNegative
    ? `${strongestNegative.ticker} moved ${formatPercent(strongestNegative.quote.changePercent)}`
    : "pressure is limited";

  return `ALQIS found ${usableCount} usable quote snapshots across ${scope}. ${positiveText}, while ${negativeText}. Treat this as context, not a recommendation.`;
}

function toBriefMover(
  item: DailyBriefInputItem & { quote: StockQuote }
): DailyBriefMover {
  const direction = getDirection(item.quote.changePercent);

  return {
    ticker: item.ticker,
    companyName: item.companyName,
    sector: item.sector,
    price: item.quote.price,
    change: item.quote.change,
    changePercent: item.quote.changePercent,
    direction,
    note: `${item.ticker} moved ${formatPercent(item.quote.changePercent)} in the latest quote snapshot.`,
  };
}

function createMarketThemes(
  items: Array<DailyBriefInputItem & { quote: StockQuote }>
): DailyBriefSectionItem[] {
  const sectorCounts = items.reduce<Record<string, number>>((counts, item) => {
    const sector = item.sector ?? "Unclassified";
    counts[sector] = (counts[sector] ?? 0) + 1;
    return counts;
  }, {});
  const sharedSectors = Object.entries(sectorCounts)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1]);
  const positiveCount = items.filter((item) => item.quote.changePercent > 0.05).length;
  const negativeCount = items.filter((item) => item.quote.changePercent < -0.05).length;
  const themes: DailyBriefSectionItem[] = [];

  if (sharedSectors.length) {
    const [sector, count] = sharedSectors[0];
    themes.push({
      label: `${sector} concentration`,
      detail: `${count} saved names share this category, so their moves may reflect common context.`,
    });
  }

  themes.push({
    label: "Breadth snapshot",
    detail: `${positiveCount} names are higher and ${negativeCount} are lower in the latest quote data.`,
  });

  if (!themes.length) {
    themes.push({
      label: "Market context limited",
      detail: "ALQIS needs more usable quote data to identify a stronger theme.",
    });
  }

  return themes.slice(0, 3);
}

function createWhatToWatch({
  usableItems,
  strongestPositive,
  strongestNegative,
  isPersonalized,
}: {
  usableItems: Array<DailyBriefInputItem & { quote: StockQuote }>;
  strongestPositive?: DailyBriefInputItem & { quote: StockQuote };
  strongestNegative?: DailyBriefInputItem & { quote: StockQuote };
  isPersonalized: boolean;
}): DailyBriefSectionItem[] {
  const items: DailyBriefSectionItem[] = [];

  if (!isPersonalized) {
    items.push({
      label: "Personalization",
      detail: "Save tickers to personalize this brief around names you follow.",
    });
  }

  if (strongestPositive) {
    items.push({
      label: `${strongestPositive.ticker} follow-through`,
      detail: "Monitor whether the move remains supported by fresh quote and news context.",
    });
  }

  if (strongestNegative) {
    items.push({
      label: `${strongestNegative.ticker} pressure check`,
      detail: "Watch whether weakness is isolated or shared by related names.",
    });
  }

  if (!items.length && usableItems.length) {
    items.push({
      label: "Quiet snapshot",
      detail: "Monitor whether any saved name begins to separate from the group.",
    });
  }

  return items.slice(0, 3);
}

function createDataNotes({
  itemCount,
  usableCount,
  isPersonalized,
}: {
  itemCount: number;
  usableCount: number;
  isPersonalized: boolean;
}) {
  const notes: string[] = [];

  if (!isPersonalized) {
    notes.push("Save tickers to personalize this brief.");
  }

  if (usableCount < 2) {
    notes.push("Brief limited while market data is partially available.");
  }

  if (usableCount < itemCount) {
    notes.push(`${itemCount - usableCount} symbol${itemCount - usableCount === 1 ? "" : "s"} had limited quote data.`);
  }

  return notes;
}

function getDirection(value: number): DailyBriefMover["direction"] {
  if (Math.abs(value) < 0.05) return "flat";
  return value > 0 ? "up" : "down";
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
