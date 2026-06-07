export type GlossaryItem = {
  id: string;
  term: string;
  shortDefinition: string;
  plainEnglish: string;
  whyItMatters: string;
  caution?: string;
  category: GlossaryCategory;
  level: GlossaryLevel;
};

export type GlossaryCategory =
  | "price-and-data"
  | "chart-and-technicals"
  | "fundamentals"
  | "earnings"
  | "market-structure"
  | "alqis-concepts"
  | "macro";

export type GlossaryLevel = "beginner" | "intermediate";

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
    category: "price-and-data",
    level: "beginner",
  },
  {
    id: "previous-close",
    term: "Previous close",
    shortDefinition: "The final price from the prior regular trading session.",
    plainEnglish:
      "ALQIS compares today's latest price with this value to calculate the daily move.",
    whyItMatters:
      "It helps separate today's movement from longer-term chart behavior.",
    category: "price-and-data",
    level: "beginner",
  },
  {
    id: "open",
    term: "Open",
    shortDefinition: "The first available regular-session price for the day.",
    plainEnglish:
      "The open shows where trading began before the session developed.",
    whyItMatters:
      "Comparing the open with the latest price can help explain whether pressure or support built during the day.",
    category: "price-and-data",
    level: "beginner",
  },
  {
    id: "high",
    term: "High",
    shortDefinition: "The highest available price during the selected session or window.",
    plainEnglish:
      "This marks the upper point reached before the stock moved away or continued through it.",
    whyItMatters:
      "It gives useful context for how strong the move became inside the observed period.",
    category: "price-and-data",
    level: "beginner",
  },
  {
    id: "low",
    term: "Low",
    shortDefinition: "The lowest available price during the selected session or window.",
    plainEnglish:
      "This marks the lower point reached before the stock recovered or continued lower.",
    whyItMatters:
      "It helps show whether weakness was brief, persistent, or part of a wider move.",
    category: "price-and-data",
    level: "beginner",
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
    category: "price-and-data",
    level: "beginner",
  },
  {
    id: "market-cap",
    term: "Market cap",
    shortDefinition: "A company's total market value based on share price and shares outstanding.",
    plainEnglish:
      "It is a rough measure of company size in public markets.",
    whyItMatters:
      "Larger companies often move differently than smaller companies because investor base, liquidity, and index exposure vary.",
    category: "fundamentals",
    level: "beginner",
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
    category: "fundamentals",
    level: "beginner",
  },
  {
    id: "earnings",
    term: "Earnings",
    shortDefinition: "A company's reported profit results for a quarter or year.",
    plainEnglish:
      "Earnings reports show how the business performed against expectations.",
    whyItMatters:
      "Stocks can move sharply when earnings change the market's understanding of growth, margins, or demand.",
    category: "earnings",
    level: "beginner",
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
    category: "earnings",
    level: "intermediate",
  },
  {
    id: "revenue-growth",
    term: "Revenue growth",
    shortDefinition: "The rate at which a company's sales increase over time.",
    plainEnglish:
      "It shows whether the business is bringing in more sales than before.",
    whyItMatters:
      "Revenue growth can help explain investor attention around demand, market share, and business momentum.",
    category: "fundamentals",
    level: "intermediate",
  },
  {
    id: "gross-margin",
    term: "Gross margin",
    shortDefinition: "The share of revenue left after direct costs of making or delivering products.",
    plainEnglish:
      "It shows how much money remains from sales before broader operating costs.",
    whyItMatters:
      "Margin changes can explain whether growth is becoming more or less efficient.",
    category: "fundamentals",
    level: "intermediate",
  },
  {
    id: "sector",
    term: "Sector",
    shortDefinition: "A broad industry group such as technology, financials, or consumer names.",
    plainEnglish:
      "A sector groups companies that often share similar demand, risk, and market narratives.",
    whyItMatters:
      "Sector context helps ALQIS separate company-specific drivers from broader market movement.",
    category: "market-structure",
    level: "beginner",
  },
  {
    id: "sector-rotation",
    term: "Sector rotation",
    shortDefinition: "A shift in market attention from one industry group to another.",
    plainEnglish:
      "Investors sometimes move attention toward one part of the market and away from another.",
    whyItMatters:
      "A stock can move because its sector is gaining or losing attention, even without a company-specific catalyst.",
    category: "market-structure",
    level: "intermediate",
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
    category: "price-and-data",
    level: "intermediate",
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
    category: "alqis-concepts",
    level: "intermediate",
  },
  {
    id: "counterevidence",
    term: "Counterevidence",
    shortDefinition: "Evidence that may limit or challenge the current explanation.",
    plainEnglish:
      "These are signals that make the read less clean or less direct.",
    whyItMatters:
      "Counterevidence builds trust by showing what ALQIS is not overclaiming.",
    category: "alqis-concepts",
    level: "intermediate",
  },
  {
    id: "market-delayed",
    term: "Market delayed",
    shortDefinition: "Market data may not reflect the latest live exchange price.",
    plainEnglish:
      "Some provider feeds arrive with a delay, especially outside premium data access.",
    whyItMatters:
      "A delayed quote can still be useful, but it should be read as context rather than a live terminal feed.",
    category: "alqis-concepts",
    level: "beginner",
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
    category: "alqis-concepts",
    level: "intermediate",
  },
  {
    id: "watchlist",
    term: "Watchlist",
    shortDefinition: "A saved group of tickers for repeated review.",
    plainEnglish:
      "Your watchlist keeps important market reads close so you can revisit them quickly.",
    whyItMatters:
      "It helps ALQIS personalize dashboard context without building a portfolio view.",
    category: "alqis-concepts",
    level: "beginner",
  },
  {
    id: "daily-move",
    term: "Daily move",
    shortDefinition: "The change from previous close to the latest available price.",
    plainEnglish:
      "This shows how the stock has moved today versus where it ended the prior session.",
    whyItMatters:
      "It explains the day-level move, which can differ from the selected chart window.",
    category: "price-and-data",
    level: "beginner",
  },
  {
    id: "chart-window-move",
    term: "Chart window move",
    shortDefinition: "The price change across the selected chart range.",
    plainEnglish:
      "This measures movement inside the selected range, such as 1D, 5D, or 1M.",
    whyItMatters:
      "It helps users avoid mixing today's quote move with a broader chart window.",
    category: "chart-and-technicals",
    level: "intermediate",
  },
  {
    id: "data-limited",
    term: "Data limited",
    shortDefinition: "ALQIS has only a narrow evidence set for the current read.",
    plainEnglish:
      "Some provider data may be missing, stale, broad, or not company-specific enough.",
    whyItMatters:
      "Limited data lowers confidence and keeps the explanation appropriately careful.",
    category: "alqis-concepts",
    level: "beginner",
  },
  {
    id: "partial-data",
    term: "Partial data",
    shortDefinition: "Some market data is available, but one or more evidence sources are weak or missing.",
    plainEnglish:
      "ALQIS can still render the page, but the read carries a clearer uncertainty label.",
    whyItMatters:
      "It prevents missing chart, quote, or news data from being treated like complete proof.",
    category: "alqis-concepts",
    level: "beginner",
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
    category: "alqis-concepts",
    level: "beginner",
  },
  {
    id: "recent-alqis-reads",
    term: "Recent ALQIS Reads",
    shortDefinition: "A history of structured stock explanations generated for your account.",
    plainEnglish:
      "Recent reads let you revisit earlier ALQIS explanations without rebuilding your context from scratch.",
    whyItMatters:
      "They help distinguish the current live read from prior market context.",
    category: "alqis-concepts",
    level: "beginner",
  },
  {
    id: "stock-intelligence-search",
    term: "Stock Intelligence Search",
    shortDefinition: "ALQIS search for opening ticker-level market reads.",
    plainEnglish:
      "Search finds symbols and company names, then opens the explanation-led stock page.",
    whyItMatters:
      "It is the entry point for exploring market movement beyond your saved watchlist.",
    category: "alqis-concepts",
    level: "beginner",
  },
  {
    id: "eps",
    term: "EPS (Earnings per share)",
    shortDefinition: "A company's profit divided by the number of shares outstanding.",
    plainEnglish:
      "EPS tells you how much profit the company made per share. A higher number means more profit per share.",
    whyItMatters:
      "Earnings beats and misses are measured against EPS estimates, which is why EPS is often the number that moves a stock on earnings day.",
    caution:
      "EPS can be manipulated through share buybacks. Always check revenue and margin trends alongside it.",
    category: "earnings",
    level: "beginner",
  },
  {
    id: "eps-estimate",
    term: "EPS estimate",
    shortDefinition: "The consensus forecast for a company's earnings per share.",
    plainEnglish:
      "Analysts publish their expectations for EPS before earnings are reported. The estimate is the average of those forecasts.",
    whyItMatters:
      "Stocks react to whether actual EPS beats or misses the estimate, not just whether earnings grew. A growing company can fall if it misses estimates.",
    caution:
      "Estimates vary across analysts. The consensus can be wrong in either direction.",
    category: "earnings",
    level: "intermediate",
  },
  {
    id: "earnings-beat",
    term: "Earnings beat",
    shortDefinition: "When a company reports earnings above analyst estimates.",
    plainEnglish:
      "The company made more profit than analysts expected for the quarter.",
    whyItMatters:
      "Earnings beats often cause price moves, especially if guidance also improves. ALQIS uses beats as a scored cause in move explanations.",
    category: "earnings",
    level: "beginner",
  },
  {
    id: "earnings-miss",
    term: "Earnings miss",
    shortDefinition: "When a company reports earnings below analyst estimates.",
    plainEnglish:
      "The company made less profit than analysts expected for the quarter.",
    whyItMatters:
      "Misses often cause sharp price drops, especially if guidance is cut alongside the miss.",
    caution:
      "A miss is relative to expectations. A company can miss and still be profitable.",
    category: "earnings",
    level: "beginner",
  },
  {
    id: "analyst-upgrade",
    term: "Analyst upgrade",
    shortDefinition: "When a research analyst raises their rating on a stock.",
    plainEnglish:
      "A professional analyst at a bank or research firm has changed their view on a stock from neutral or negative to more positive.",
    whyItMatters:
      "Upgrades from influential analysts can move a stock, especially when accompanied by a price target raise. ALQIS scores analyst action as a cause of price movement.",
    caution:
      "Analyst ratings reflect one firm's view and may lag the market. They do not come from ALQIS.",
    category: "market-structure",
    level: "intermediate",
  },
  {
    id: "analyst-downgrade",
    term: "Analyst downgrade",
    shortDefinition: "When a research analyst lowers their rating on a stock.",
    plainEnglish:
      "A professional analyst has changed their view on a stock from positive or neutral to more negative.",
    whyItMatters:
      "Downgrades can affect price movement, especially among institutions that track analyst coverage.",
    caution:
      "A downgrade is not a signal to act. It reflects one analyst's view at one point in time.",
    category: "market-structure",
    level: "intermediate",
  },
  {
    id: "52-week-high",
    term: "52-week high",
    shortDefinition: "The highest price a stock has traded at in the past year.",
    plainEnglish:
      "This is the peak price reached over the last 52 weeks of trading.",
    whyItMatters:
      "Stocks near their 52-week high are sometimes watched for breakout or reversal behavior. ALQIS shows this as context, not direction.",
    caution:
      "A 52-week high is historical data. It does not predict future movement.",
    category: "price-and-data",
    level: "beginner",
  },
  {
    id: "52-week-low",
    term: "52-week low",
    shortDefinition: "The lowest price a stock has traded at in the past year.",
    plainEnglish:
      "This is the bottom price reached over the last 52 weeks of trading.",
    whyItMatters:
      "Stocks near their 52-week low can attract attention from value investors or show continued pressure.",
    caution:
      "A 52-week low is historical data. It does not predict recovery.",
    category: "price-and-data",
    level: "beginner",
  },
  {
    id: "beta",
    term: "Beta",
    shortDefinition: "A measure of how much a stock moves relative to the market.",
    plainEnglish:
      "Beta of 1.0 means the stock tends to move with the market. Beta above 1.0 means it moves more. Beta below 1.0 means it moves less.",
    whyItMatters:
      "Higher-beta stocks amplify market moves in both directions. ALQIS uses beta context to separate stock-specific moves from broad market moves.",
    caution:
      "Beta describes past behavior. It does not guarantee future sensitivity.",
    category: "price-and-data",
    level: "intermediate",
  },
  {
    id: "dividend-yield",
    term: "Dividend yield",
    shortDefinition: "Annual dividend payments as a percentage of the current share price.",
    plainEnglish:
      "If a stock pays $2 per year in dividends and trades at $40, the yield is 5%. It shows how much income the stock generates relative to its price.",
    whyItMatters:
      "Dividend yield matters for income-focused investors and can signal how the market values the stock's income stream.",
    caution:
      "A very high yield can signal that the market expects the dividend to be cut.",
    category: "fundamentals",
    level: "beginner",
  },
  {
    id: "forward-pe",
    term: "Forward P/E",
    shortDefinition: "Price divided by next year's estimated earnings per share.",
    plainEnglish:
      "Like P/E ratio, but uses analyst estimates for future earnings instead of past reported earnings.",
    whyItMatters:
      "Forward P/E reflects what the market is willing to pay for expected future profits, not just what already happened.",
    caution:
      "Forward P/E relies on estimates that can be wrong. Use it as context, not precision.",
    category: "fundamentals",
    level: "intermediate",
  },
  {
    id: "short-interest",
    term: "Short interest",
    shortDefinition: "The percentage of a stock's shares that are sold short.",
    plainEnglish:
      "Short sellers borrow shares and sell them, hoping to buy back cheaper later. High short interest means many investors are positioned for the stock to fall.",
    whyItMatters:
      "High short interest can lead to a short squeeze if the stock rises sharply, forcing short sellers to buy back quickly.",
    caution:
      "Short interest is reported with a delay and changes rapidly. It describes positioning, not direction.",
    category: "market-structure",
    level: "intermediate",
  },
  {
    id: "moving-average",
    term: "Moving average",
    shortDefinition: "The average price of a stock over a set number of past periods.",
    plainEnglish:
      "A 50-day moving average is the average closing price over the last 50 trading days. It smooths out short-term noise to show the trend.",
    whyItMatters:
      "Moving averages are widely watched as trend indicators. A stock crossing above or below its moving average can attract attention.",
    caution:
      "Moving averages are based on past prices. They describe momentum, not prediction.",
    category: "chart-and-technicals",
    level: "intermediate",
  },
  {
    id: "federal-reserve",
    term: "Federal Reserve",
    shortDefinition: "The US central bank, responsible for setting interest rate policy.",
    plainEnglish:
      "The Fed controls the federal funds rate, which affects borrowing costs across the economy. Rate decisions ripple through stocks, bonds, and currencies.",
    whyItMatters:
      "Fed decisions and statements are among the most market-moving events of the year. ALQIS tracks macro rate signals as a scored cause.",
    caution:
      "Fed policy works with long lags. Markets often react to expectations before the actual policy change.",
    category: "macro",
    level: "beginner",
  },
  {
    id: "inflation",
    term: "Inflation",
    shortDefinition: "The rate at which prices for goods and services are rising.",
    plainEnglish:
      "When inflation is high, each dollar buys less than before. The Fed watches inflation closely when deciding whether to raise or cut rates.",
    whyItMatters:
      "High inflation typically leads to higher interest rates, which can pressure growth stock valuations. Low inflation creates room for rate cuts.",
    caution:
      "Inflation data is backward-looking. Markets price in expectations ahead of the actual reports.",
    category: "macro",
    level: "beginner",
  },
  {
    id: "yield-curve",
    term: "Yield curve",
    shortDefinition: "A graph showing interest rates across different bond maturities.",
    plainEnglish:
      "Normally, longer-term bonds pay higher rates than short-term ones. When short-term rates exceed long-term rates, the curve is inverted, a pattern historically associated with recessions.",
    whyItMatters:
      "The yield curve shapes borrowing costs across the economy and affects how investors value growth versus value stocks.",
    caution:
      "Yield curve inversions have preceded recessions historically, but the timing is unpredictable and varies widely.",
    category: "macro",
    level: "intermediate",
  },
  {
    id: "market-breadth",
    term: "Market breadth",
    shortDefinition: "How many stocks are participating in a market move.",
    plainEnglish:
      "If the index is up but only 10% of stocks are rising, breadth is narrow. If 80% of stocks are rising, breadth is wide.",
    whyItMatters:
      "Wide breadth can show a broad move. Narrow breadth can show the move is driven by a few large names.",
    caution:
      "Breadth is one signal among many. Narrow breadth can persist for extended periods.",
    category: "market-structure",
    level: "intermediate",
  },
  {
    id: "price-target",
    term: "Price target",
    shortDefinition:
      "An analyst's estimate of where a stock's price may go over a defined period.",
    plainEnglish:
      "Research analysts publish price targets alongside their ratings. A raised target signals more confidence in the stock's outlook.",
    whyItMatters:
      "Price target raises and cuts can move stocks, especially when multiple analysts move in the same direction.",
    caution:
      "Price targets are estimates based on models that can be wrong. ALQIS never sets or implies price targets in its own reads.",
    category: "market-structure",
    level: "intermediate",
  },
] satisfies GlossaryItem[];

const glossaryById = new Map(glossaryItems.map((item) => [item.id, item]));

export function getGlossaryEntry(termId: string) {
  return glossaryById.get(termId) ?? null;
}
