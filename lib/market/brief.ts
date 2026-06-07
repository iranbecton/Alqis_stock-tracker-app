import type { StockQuote } from "@/lib/market-data/types";
import type { BriefFocus } from "@/lib/preferences/types";

export type DailyBriefStatus = "ok" | "limited" | "unavailable";

export type MarketSession =
  | "pre_market"
  | "market_open"
  | "midday"
  | "after_close"
  | "weekend";

export type DailyBriefMover = {
  ticker: string;
  companyName: string;
  sector: string | null;
  price: number;
  change: number;
  changePercent: number;
  direction: "up" | "down" | "flat";
  note: string;
  portfolioHeld?: boolean;
};

export type DailyBriefSectionItem = {
  label: string;
  detail: string;
};

export type DailyMarketBrief = {
  status: DailyBriefStatus;
  session: MarketSession;
  generatedAt: string;
  headline: string;
  summary: string;
  watchlistMovers: DailyBriefMover[];
  marketThemes: DailyBriefSectionItem[];
  whatToWatch: DailyBriefSectionItem[];
  portfolioNotes: string[];
  dataNotes: string[];
};

export type DailyBriefInputItem = {
  ticker: string;
  companyName: string;
  sector: string | null;
  quote?: StockQuote;
  dataStatus: "ok" | "unavailable";
};

export type PortfolioBriefHolding = {
  ticker: string;
  shares: number;
  avgCost: number;
};

export type DailyBriefCatalyst = {
  ticker: string;
  headline: string;
  publishedAt: string;
};

export function buildDailyMarketBrief({
  items,
  isPersonalized,
  briefFocus = "balanced",
  portfolioHoldings = [],
  catalysts = [],
  session = "market_open",
}: {
  items: DailyBriefInputItem[];
  isPersonalized: boolean;
  briefFocus?: BriefFocus;
  portfolioHoldings?: PortfolioBriefHolding[];
  catalysts?: DailyBriefCatalyst[];
  session?: MarketSession;
}): DailyMarketBrief {
  const generatedAt = new Date().toISOString();
  const heldTickers = new Set(
    portfolioHoldings.map((holding) => holding.ticker.toUpperCase())
  );
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
    session,
  });

  return {
    status,
    session,
    generatedAt,
    headline: createHeadline({
      status,
      strongestPositive,
      strongestNegative,
      isPersonalized,
      briefFocus,
      session,
    }),
    summary: createSummary({
      status,
      usableCount: usableItems.length,
      strongestPositive,
      strongestNegative,
      isPersonalized,
      briefFocus,
      session,
    }),
    watchlistMovers: sortedMovers
      .slice(0, 4)
      .map((item) => toBriefMover(item, heldTickers, session)),
    marketThemes: createMarketThemes(usableItems, briefFocus),
    whatToWatch: createWhatToWatch({
      usableItems,
      strongestPositive,
      strongestNegative,
      isPersonalized,
      briefFocus,
      catalysts,
      session,
    }).map(sanitizeWhatToWatchItem),
    portfolioNotes: createPortfolioNotes({
      heldTickers,
      strongestPositive,
      strongestNegative,
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
  briefFocus,
  session,
}: {
  status: DailyBriefStatus;
  strongestPositive?: DailyBriefInputItem & { quote: StockQuote };
  strongestNegative?: DailyBriefInputItem & { quote: StockQuote };
  isPersonalized: boolean;
  briefFocus: BriefFocus;
  session: MarketSession;
}) {
  let headline: string;

  if (status === "unavailable") {
    headline = "Market brief unavailable while provider data is limited.";
  } else if (!isPersonalized) {
    headline = "Today's brief is using curated market reads until your watchlist grows.";
  } else if (briefFocus === "education") {
    headline = "Today's brief explains the context behind your saved market reads.";
  } else if (briefFocus === "market_context") {
    headline = "Today's brief is emphasizing shared market and sector context.";
  } else if (
    strongestPositive &&
    (!strongestNegative ||
      strongestPositive.quote.changePercent >=
        Math.abs(strongestNegative.quote.changePercent))
  ) {
    headline = `${strongestPositive.ticker} is the clearest positive mover in your saved names.`;
  } else if (strongestNegative) {
    headline = `${strongestNegative.ticker} is the clearest pressure point in your saved names.`;
  } else {
    headline = "Your saved names are mostly steady in the latest market snapshot.";
  }

  return withSessionPrefix(headline, session);
}

function createSummary({
  status,
  usableCount,
  strongestPositive,
  strongestNegative,
  isPersonalized,
  briefFocus,
  session,
}: {
  status: DailyBriefStatus;
  usableCount: number;
  strongestPositive?: DailyBriefInputItem & { quote: StockQuote };
  strongestNegative?: DailyBriefInputItem & { quote: StockQuote };
  isPersonalized: boolean;
  briefFocus: BriefFocus;
  session: MarketSession;
}) {
  if (status === "unavailable") {
    return "ALQIS could not assemble enough live quote data for a reliable daily brief. Refresh later or open individual stock reads for more context.";
  }

  const scope = isPersonalized ? "your watchlist" : "the curated ALQIS universe";
  const movementWord = session === "after_close" ? "closed" : "moved";
  const positiveText = strongestPositive
    ? `${strongestPositive.ticker} ${movementWord} ${formatPercent(strongestPositive.quote.changePercent)}`
    : "positive movers are muted";
  const negativeText = strongestNegative
    ? `${strongestNegative.ticker} ${movementWord} ${formatPercent(strongestNegative.quote.changePercent)}`
    : "pressure is limited";
  const base = `ALQIS found ${usableCount} usable quote snapshots across ${scope}. ${positiveText}, while ${negativeText}.`;

  if (session === "pre_market") {
    return `${base} Check how these names are set to open when regular trading begins. ${getBriefFocusSummary(briefFocus)}`;
  }

  if (session === "midday") {
    return `${base} ALQIS is checking whether early moves are holding or fading. ${getBriefFocusSummary(briefFocus)}`;
  }

  if (session === "after_close") {
    return `${base} This is a session recap using the latest close-aligned quote data. ${getBriefFocusSummary(briefFocus)}`;
  }

  if (session === "weekend") {
    return `${base} Quote data reflects the most recent market close for weekend context. ${getBriefFocusSummary(briefFocus)}`;
  }

  return `${base} Early direction is being checked against saved-name breadth. ${getBriefFocusSummary(briefFocus)}`;
}

function toBriefMover(
  item: DailyBriefInputItem & { quote: StockQuote },
  heldTickers: Set<string>,
  session: MarketSession
): DailyBriefMover {
  const direction = getDirection(item.quote.changePercent);
  const movementWord = session === "after_close" ? "closed" : "moved";
  const portfolioHeld = heldTickers.has(item.ticker);

  return {
    ticker: item.ticker,
    companyName: item.companyName,
    sector: item.sector,
    price: item.quote.price,
    change: item.quote.change,
    changePercent: item.quote.changePercent,
    direction,
    note: `${item.ticker} ${movementWord} ${formatPercent(item.quote.changePercent)} in the latest quote snapshot.`,
    ...(portfolioHeld ? { portfolioHeld: true } : {}),
  };
}

function createMarketThemes(
  items: Array<DailyBriefInputItem & { quote: StockQuote }>,
  briefFocus: BriefFocus
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

  if (briefFocus === "education") {
    themes.push({
      label: "Reading note",
      detail:
        "Daily move compares the latest quote with previous close; it can differ from a chart-window move.",
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
  briefFocus,
  catalysts,
  session,
}: {
  usableItems: Array<DailyBriefInputItem & { quote: StockQuote }>;
  strongestPositive?: DailyBriefInputItem & { quote: StockQuote };
  strongestNegative?: DailyBriefInputItem & { quote: StockQuote };
  isPersonalized: boolean;
  briefFocus: BriefFocus;
  catalysts: DailyBriefCatalyst[];
  session: MarketSession;
}): DailyBriefSectionItem[] {
  const items: DailyBriefSectionItem[] = [];
  const catalystByTicker = new Map(
    catalysts
      .map((catalyst) => [catalyst.ticker, truncateHeadline(catalyst.headline)] as const)
      .filter(([, headline]) => Boolean(headline))
  );

  if (!isPersonalized) {
    items.push({
      label: "Personalization",
      detail: "Save tickers to personalize this brief around names you follow.",
    });
  }

  if (strongestPositive) {
    const baseLabel =
      session === "pre_market"
        ? `${strongestPositive.ticker} set to open`
        : briefFocus === "watchlist"
          ? `${strongestPositive.ticker} watchlist context`
          : `${strongestPositive.ticker} follow-through`;

    items.push({
      label: withCatalystLabel(baseLabel, catalystByTicker.get(strongestPositive.ticker)),
      detail: getPositiveWatchDetail(session),
    });
  }

  if (strongestNegative) {
    const baseLabel =
      session === "pre_market"
        ? `${strongestNegative.ticker} pressure to watch`
        : `${strongestNegative.ticker} pressure check`;

    items.push({
      label: withCatalystLabel(baseLabel, catalystByTicker.get(strongestNegative.ticker)),
      detail: getPressureWatchDetail(session),
    });
  }

  if (!items.length && usableItems.length) {
    items.push({
      label: "Quiet snapshot",
      detail:
        session === "pre_market"
          ? "Check whether any saved name begins to separate when regular trading starts."
          : "Monitor whether any saved name begins to separate from the group.",
    });
  }

  return items.slice(0, 3);
}

function getBriefFocusSummary(briefFocus: BriefFocus) {
  if (briefFocus === "watchlist") {
    return "The brief is weighted toward saved ticker movement.";
  }

  if (briefFocus === "market_context") {
    return "The brief is weighted toward shared sector and market context.";
  }

  if (briefFocus === "education") {
    return "The brief includes plain-English context for interpreting the data.";
  }

  return "Treat this as context for review.";
}

function createDataNotes({
  itemCount,
  usableCount,
  isPersonalized,
  session,
}: {
  itemCount: number;
  usableCount: number;
  isPersonalized: boolean;
  session: MarketSession;
}) {
  const notes: string[] = [];

  if (!isPersonalized) {
    notes.push("Save tickers to personalize this brief.");
  }

  if (session === "weekend") {
    notes.push("Quote data reflects the most recent market close.");
  }

  if (usableCount < 2) {
    notes.push("Brief limited while market data is partially available.");
  }

  if (usableCount < itemCount) {
    notes.push(`${itemCount - usableCount} symbol${itemCount - usableCount === 1 ? "" : "s"} had limited quote data.`);
  }

  return notes;
}

function createPortfolioNotes({
  heldTickers,
  strongestPositive,
  strongestNegative,
}: {
  heldTickers: Set<string>;
  strongestPositive?: DailyBriefInputItem & { quote: StockQuote };
  strongestNegative?: DailyBriefInputItem & { quote: StockQuote };
}) {
  const notes: string[] = [];

  if (!heldTickers.size) {
    return notes;
  }

  if (strongestPositive && heldTickers.has(strongestPositive.ticker)) {
    notes.push(
      `${strongestPositive.ticker} is a position in your tracker and is the clearest positive mover today.`
    );
  }

  if (strongestNegative && heldTickers.has(strongestNegative.ticker)) {
    notes.push(
      `${strongestNegative.ticker} is a position in your tracker and is showing the most pressure today.`
    );
  }

  if (!notes.length) {
    notes.push("Your tracked positions are mostly steady in today's session.");
  }

  return notes.slice(0, 2);
}

function withSessionPrefix(headline: string, session: MarketSession) {
  if (session === "pre_market") {
    return `Before the open - ${headline}`;
  }

  if (session === "midday") {
    return `Midday check - ${headline}`;
  }

  if (session === "after_close") {
    return `After the close - ${headline}`;
  }

  if (session === "weekend") {
    return `Weekend context - ${headline}`;
  }

  return headline;
}

function getPositiveWatchDetail(session: MarketSession) {
  if (session === "pre_market") {
    return "Check whether the move remains visible when regular trading begins.";
  }

  if (session === "midday") {
    return "Check whether early direction is holding or fading through the middle of the session.";
  }

  if (session === "after_close") {
    return "Review whether the close-aligned move had fresh quote and news context.";
  }

  if (session === "weekend") {
    return "Use this as last-close context before the next regular session.";
  }

  return "Monitor whether the move remains supported by fresh quote and news context.";
}

function getPressureWatchDetail(session: MarketSession) {
  if (session === "pre_market") {
    return "Check whether early pressure remains visible when regular trading begins.";
  }

  if (session === "midday") {
    return "Check whether early pressure is holding or fading through the middle of the session.";
  }

  if (session === "after_close") {
    return "Review whether the close-aligned pressure was isolated or shared by related names.";
  }

  if (session === "weekend") {
    return "Use this as last-close context before the next regular session.";
  }

  return "Check whether pressure is isolated or shared by related names.";
}

function withCatalystLabel(label: string, headline?: string | null) {
  if (!headline) {
    return label;
  }

  return `${label} - ${headline}`;
}

function sanitizeWhatToWatchItem(item: DailyBriefSectionItem) {
  return {
    ...item,
    label: sanitizeWhatToWatchLabel(item.label),
  };
}

function sanitizeWhatToWatchLabel(label: string) {
  const normalized = label.replace(/\s+/g, " ").trim();
  const separatorIndex = normalized.indexOf(" - ");
  const baseLabel =
    separatorIndex >= 0 &&
    looksLikeHeadlineFragment(normalized.slice(separatorIndex + 3))
      ? normalized.slice(0, separatorIndex).trim()
      : normalized;

  return truncateAtCompleteWord(baseLabel, 60);
}

function looksLikeHeadlineFragment(value: string) {
  const fragment = value.trim();

  if (!fragment) {
    return false;
  }

  if (fragment.includes(",")) {
    return true;
  }

  const titleCaseWords = fragment
    .split(/\s+/)
    .filter((word) => /^[A-Z][a-z]{2,}/.test(word));

  return fragment.length > 32 && titleCaseWords.length >= 3;
}

function truncateAtCompleteWord(value: string, limit: number) {
  const normalized = value.trim();

  if (normalized.length <= limit) {
    return normalized;
  }

  const trimmed = normalized.slice(0, limit).trimEnd();
  const lastSpace = trimmed.lastIndexOf(" ");

  if (lastSpace <= 0) {
    return trimmed;
  }

  return trimmed.slice(0, lastSpace).trimEnd();
}

const ADVISORY_HEADLINE_PATTERN =
  /\b(buy|sell|target price|price target|recommend|recommendation|outperforming|underperforming|strong buy|weak hold|time to act|enter|exit)\b/i;

function truncateHeadline(headline: string) {
  const normalized = headline.replace(/\s+/g, " ").trim();

  if (!normalized || ADVISORY_HEADLINE_PATTERN.test(normalized)) {
    return null;
  }

  return normalized.split(" ").slice(0, 8).join(" ");
}

function getDirection(value: number): DailyBriefMover["direction"] {
  if (Math.abs(value) < 0.05) return "flat";
  return value > 0 ? "up" : "down";
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}
