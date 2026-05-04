export type GlossaryItem = {
  id: string;
  term: string;
  shortDefinition: string;
  plainEnglish: string;
  whyItMatters: string;
  caution?: string;
};

export const glossaryItems = [
  {
    id: "current-price",
    term: "Current price",
    shortDefinition: "The latest available trading price for a stock.",
    plainEnglish:
      "This is the most recent price ALQIS received from the market data provider.",
    whyItMatters:
      "It anchors the current read, but it is only one data point without context from the move, chart, and news.",
    caution:
      "Prices can be delayed or briefly stale depending on provider access and market hours.",
  },
  {
    id: "previous-close",
    term: "Previous close",
    shortDefinition: "The final price from the prior regular trading session.",
    plainEnglish:
      "ALQIS compares today's latest price with this value to calculate the daily move.",
    whyItMatters:
      "It helps separate today's movement from longer-term chart behavior.",
  },
  {
    id: "open",
    term: "Open",
    shortDefinition: "The first available regular-session price for the day.",
    plainEnglish:
      "The open shows where trading began before the session developed.",
    whyItMatters:
      "Comparing the open with the latest price can help explain whether pressure or support built during the day.",
  },
  {
    id: "high",
    term: "High",
    shortDefinition: "The highest available price during the selected session or window.",
    plainEnglish:
      "This marks the upper point reached before the stock moved away or continued through it.",
    whyItMatters:
      "It gives useful context for how strong the move became inside the observed period.",
  },
  {
    id: "low",
    term: "Low",
    shortDefinition: "The lowest available price during the selected session or window.",
    plainEnglish:
      "This marks the lower point reached before the stock recovered or continued lower.",
    whyItMatters:
      "It helps show whether weakness was brief, persistent, or part of a wider move.",
  },
  {
    id: "volume",
    term: "Volume",
    shortDefinition: "The number of shares traded during a period.",
    plainEnglish:
      "Volume shows how much participation was behind a price move.",
    whyItMatters:
      "A move with stronger participation can carry more explanatory weight than a thin, quiet move.",
    caution:
      "Volume is not enough by itself; it needs price, news, and market context.",
  },
  {
    id: "market-cap",
    term: "Market cap",
    shortDefinition: "A company's total market value based on share price and shares outstanding.",
    plainEnglish:
      "It is a rough measure of company size in public markets.",
    whyItMatters:
      "Larger companies often move differently than smaller companies because investor base, liquidity, and index exposure vary.",
  },
  {
    id: "pe-ratio",
    term: "P/E ratio",
    shortDefinition: "A valuation measure comparing share price with earnings per share.",
    plainEnglish:
      "It shows how much investors are paying for each dollar of reported earnings.",
    whyItMatters:
      "A higher or lower P/E can add context to how sensitive a stock may be to growth, margins, and rates.",
    caution:
      "P/E is a context signal, not a complete measure of quality or risk.",
  },
  {
    id: "earnings",
    term: "Earnings",
    shortDefinition: "A company's reported profit results for a quarter or year.",
    plainEnglish:
      "Earnings reports show how the business performed against expectations.",
    whyItMatters:
      "Stocks can move sharply when earnings change the market's understanding of growth, margins, or demand.",
  },
  {
    id: "guidance",
    term: "Guidance",
    shortDefinition: "Management's outlook for future business performance.",
    plainEnglish:
      "Guidance is what a company says it expects for upcoming revenue, margins, or demand.",
    whyItMatters:
      "Markets often react to guidance because it changes the forward context, not just the past quarter.",
    caution:
      "Guidance is an estimate and can change as conditions change.",
  },
  {
    id: "revenue-growth",
    term: "Revenue growth",
    shortDefinition: "The rate at which a company's sales increase over time.",
    plainEnglish:
      "It shows whether the business is bringing in more sales than before.",
    whyItMatters:
      "Revenue growth can help explain investor attention around demand, market share, and business momentum.",
  },
  {
    id: "gross-margin",
    term: "Gross margin",
    shortDefinition: "The share of revenue left after direct costs of making or delivering products.",
    plainEnglish:
      "It shows how much money remains from sales before broader operating costs.",
    whyItMatters:
      "Margin changes can explain whether growth is becoming more or less efficient.",
  },
  {
    id: "sector",
    term: "Sector",
    shortDefinition: "A broad industry group such as technology, financials, or consumer names.",
    plainEnglish:
      "A sector groups companies that often share similar demand, risk, and market narratives.",
    whyItMatters:
      "Sector context helps ALQIS separate company-specific drivers from broader market movement.",
  },
  {
    id: "sector-rotation",
    term: "Sector rotation",
    shortDefinition: "A shift in market attention from one industry group to another.",
    plainEnglish:
      "Investors sometimes move attention toward one part of the market and away from another.",
    whyItMatters:
      "A stock can move because its sector is gaining or losing attention, even without a company-specific catalyst.",
  },
  {
    id: "volatility",
    term: "Volatility",
    shortDefinition: "How much a price moves around over time.",
    plainEnglish:
      "Higher volatility means the stock is moving more sharply or less steadily.",
    whyItMatters:
      "It helps frame whether a move is unusual or part of the stock's normal behavior.",
    caution:
      "Volatility describes movement, not direction or quality.",
  },
  {
    id: "confidence-score",
    term: "Confidence score",
    shortDefinition: "ALQIS's structured estimate of evidence strength.",
    plainEnglish:
      "The score reflects how well quote, chart, news, and relevance signals support the current read.",
    whyItMatters:
      "It helps users distinguish a strong evidence trail from a limited or mixed one.",
    caution:
      "Confidence is not certainty. It can fall when data is missing, broad, or contradictory.",
  },
  {
    id: "counterevidence",
    term: "Counterevidence",
    shortDefinition: "Evidence that may limit or challenge the current explanation.",
    plainEnglish:
      "These are signals that make the read less clean or less direct.",
    whyItMatters:
      "Counterevidence builds trust by showing what ALQIS is not overclaiming.",
  },
  {
    id: "market-delayed",
    term: "Market delayed",
    shortDefinition: "Market data may not reflect the latest live exchange price.",
    plainEnglish:
      "Some provider feeds arrive with a delay, especially outside premium data access.",
    whyItMatters:
      "A delayed quote can still be useful, but it should be read as context rather than a live terminal feed.",
  },
  {
    id: "proof-of-move",
    term: "Proof of move",
    shortDefinition: "Chart and evidence signals that test whether the explanation fits price action.",
    plainEnglish:
      "ALQIS checks whether the chart behavior supports, challenges, or only contextualizes the read.",
    whyItMatters:
      "It keeps explanations grounded in observed movement instead of narrative alone.",
    caution:
      "Fallback charts are illustrative only and are not evidence.",
  },
  {
    id: "watchlist",
    term: "Watchlist",
    shortDefinition: "A saved group of tickers for repeated review.",
    plainEnglish:
      "Your watchlist keeps important market reads close so you can revisit them quickly.",
    whyItMatters:
      "It helps ALQIS personalize dashboard context without building a portfolio view.",
  },
  {
    id: "daily-move",
    term: "Daily move",
    shortDefinition: "The change from previous close to the latest available price.",
    plainEnglish:
      "This shows how the stock has moved today versus where it ended the prior session.",
    whyItMatters:
      "It explains the day-level move, which can differ from the selected chart window.",
  },
  {
    id: "chart-window-move",
    term: "Chart window move",
    shortDefinition: "The price change across the selected chart range.",
    plainEnglish:
      "This measures movement inside the selected range, such as 1D, 5D, or 1M.",
    whyItMatters:
      "It helps users avoid mixing today's quote move with a broader chart window.",
  },
  {
    id: "data-limited",
    term: "Data limited",
    shortDefinition: "ALQIS has only a narrow evidence set for the current read.",
    plainEnglish:
      "Some provider data may be missing, stale, broad, or not company-specific enough.",
    whyItMatters:
      "Limited data lowers confidence and keeps the explanation appropriately careful.",
  },
  {
    id: "partial-data",
    term: "Partial data",
    shortDefinition: "Some market data is available, but one or more evidence sources are weak or missing.",
    plainEnglish:
      "ALQIS can still render the page, but the read carries a clearer uncertainty label.",
    whyItMatters:
      "It prevents missing chart, quote, or news data from being treated like complete proof.",
  },
  {
    id: "daily-market-brief",
    term: "Daily Market Brief",
    shortDefinition: "A structured dashboard summary of notable saved-ticker movement.",
    plainEnglish:
      "The brief turns your saved tickers into a compact market context snapshot.",
    whyItMatters:
      "It gives users a fast reason to check ALQIS without opening every stock page.",
    caution:
      "The brief is educational context and depends on available market data.",
  },
  {
    id: "recent-alqis-reads",
    term: "Recent ALQIS Reads",
    shortDefinition: "A history of structured stock explanations generated for your account.",
    plainEnglish:
      "Recent reads let you revisit earlier ALQIS explanations without rebuilding your context from scratch.",
    whyItMatters:
      "They help distinguish the current live read from prior market context.",
  },
  {
    id: "stock-intelligence-search",
    term: "Stock Intelligence Search",
    shortDefinition: "ALQIS search for opening ticker-level market reads.",
    plainEnglish:
      "Search finds symbols and company names, then opens the explanation-led stock page.",
    whyItMatters:
      "It is the entry point for exploring market movement beyond your saved watchlist.",
  },
] satisfies GlossaryItem[];

const glossaryById = new Map(glossaryItems.map((item) => [item.id, item]));

export function getGlossaryEntry(termId: string) {
  return glossaryById.get(termId) ?? null;
}
