export type ConfidenceBand = "A" | "B" | "C" | "D";

export type ChartPoint = {
  label: string;
  value: number;
};

export type ChartMarker = {
  index: number;
  label: string;
};

export type SpotlightCatalyst = {
  time: string;
  title: string;
  detail: string;
  source: string;
};

export type Contribution = {
  label: string;
  value: number;
};

export type SpotlightSignal = {
  symbol: string;
  name: string;
  price: string;
  changePct: number;
  absoluteChange: number;
  rangeLabel: string;
  thesis: string;
  confidence: ConfidenceBand;
  confidenceSummary: string;
  points: ChartPoint[];
  markers: ChartMarker[];
  catalysts: SpotlightCatalyst[];
  contributions: Contribution[];
};

export type MarketPulseMetric = {
  label: string;
  value: string;
  detail: string;
};

export type ToneTag = {
  label: string;
  tone: "gain" | "neutral" | "warn";
};

export type RadarSignal = {
  symbol: string;
  name: string;
  price: string;
  changePct: number;
  summary: string;
  points: ChartPoint[];
  confidence: ConfidenceBand;
};

export type BriefItem = {
  title: string;
  body: string;
};

export type WatchlistShift = {
  symbol: string;
  title: string;
  note: string;
};

export const alqisDemoData = {
  asOf: "Demo snapshot · Apr 22, 2:14 PM ET",
  hero: {
    eyebrow: "AI market intelligence",
    title: "Why Is It Moving?",
    summary:
      "ALQIS turns price action into calm, evidence-backed explanations so investors can understand the market without decoding trader noise.",
    primaryAction: "Open morning brief",
    secondaryAction: "Review watchlist",
  },
  spotlight: {
    symbol: "NVDA",
    name: "NVIDIA",
    price: "$989.32",
    changePct: 3.84,
    absoluteChange: 36.73,
    rangeLabel: "5D",
    thesis:
      "NVIDIA is advancing because fresh hyperscaler spending commentary reinforced AI infrastructure demand while margin concerns stayed contained.",
    confidence: "A",
    confidenceSummary:
      "Signal quality is high. The move is supported by demand commentary, sector follow-through, and improving breadth rather than a single headline.",
    points: [
      { label: "Mon", value: 918 },
      { label: "Tue", value: 926 },
      { label: "Wed", value: 935 },
      { label: "Thu", value: 944 },
      { label: "Fri", value: 952 },
      { label: "09:30", value: 961 },
      { label: "10:15", value: 968 },
      { label: "11:00", value: 973 },
      { label: "11:45", value: 981 },
      { label: "12:30", value: 986 },
      { label: "13:15", value: 992 },
      { label: "14:00", value: 989 },
    ],
    markers: [
      { index: 5, label: "Open" },
      { index: 7, label: "Capex note" },
      { index: 10, label: "Semis extend" },
    ],
    catalysts: [
      {
        time: "09:42",
        title: "Hyperscaler demand stayed firm",
        detail:
          "Management commentary across large-cap tech kept AI server demand expectations elevated for the second half.",
        source: "Conference notes",
      },
      {
        time: "11:18",
        title: "Semiconductor breadth widened",
        detail:
          "The move expanded beyond one name, with equipment and memory suppliers confirming healthier participation.",
        source: "Sector flow",
      },
      {
        time: "13:07",
        title: "Macro pressure eased",
        detail:
          "Treasury yields softened intraday, improving the backdrop for long-duration growth leadership.",
        source: "Rates monitor",
      },
    ],
    contributions: [
      { label: "Demand revision", value: 86 },
      { label: "Sector follow-through", value: 72 },
      { label: "Macro relief", value: 58 },
      { label: "Short-covering risk", value: 24 },
    ],
  } satisfies SpotlightSignal,
  pulse: {
    title: "Market pulse",
    summary:
      "Risk appetite is constructive, but leadership is disciplined rather than euphoric. Quality growth is leading while defensives remain mixed.",
    metrics: [
      {
        label: "Breadth",
        value: "68% positive",
        detail: "Participation is healthy across the S&P 500.",
      },
      {
        label: "Leadership",
        value: "Semis, software",
        detail: "AI-linked groups are carrying the tape.",
      },
      {
        label: "Rates",
        value: "10Y -6 bps",
        detail: "Lower yields are reducing valuation pressure.",
      },
    ] satisfies MarketPulseMetric[],
    tones: [
      { label: "Constructive", tone: "gain" },
      { label: "Not overheated", tone: "neutral" },
      { label: "Macro-sensitive", tone: "warn" },
    ] satisfies ToneTag[],
  },
  radar: [
    {
      symbol: "MSFT",
      name: "Microsoft",
      price: "$428.51",
      changePct: 1.42,
      summary:
        "Cloud commentary is leaning stronger, and the market is rewarding durable AI monetization rather than pure narrative.",
      confidence: "A",
      points: [
        { label: "1", value: 402 },
        { label: "2", value: 406 },
        { label: "3", value: 411 },
        { label: "4", value: 417 },
        { label: "5", value: 421 },
        { label: "6", value: 429 },
      ],
    },
    {
      symbol: "LLY",
      name: "Eli Lilly",
      price: "$782.80",
      changePct: -1.18,
      summary:
        "Healthcare is lagging today as capital rotates toward growth leadership despite the long-term thesis staying intact.",
      confidence: "B",
      points: [
        { label: "1", value: 806 },
        { label: "2", value: 801 },
        { label: "3", value: 797 },
        { label: "4", value: 791 },
        { label: "5", value: 786 },
        { label: "6", value: 783 },
      ],
    },
    {
      symbol: "XOM",
      name: "Exxon Mobil",
      price: "$117.44",
      changePct: 0.63,
      summary:
        "Energy is stable, but it is no longer driving the index narrative. Oil strength is support, not the lead story.",
      confidence: "C",
      points: [
        { label: "1", value: 112 },
        { label: "2", value: 113 },
        { label: "3", value: 115 },
        { label: "4", value: 116 },
        { label: "5", value: 117 },
        { label: "6", value: 117.4 },
      ],
    },
  ] satisfies RadarSignal[],
  dailyBrief: [
    {
      title: "Leadership is broad enough to trust",
      body:
        "Today's advance is being confirmed by adjacent AI names, which makes the move sturdier than a single-stock squeeze.",
    },
    {
      title: "Rates are helping, not dominating",
      body:
        "The softer yield backdrop is supportive, but the main driver is still improving demand confidence inside technology.",
    },
    {
      title: "The tone is confident, not frantic",
      body:
        "Positioning looks engaged but controlled. That is consistent with institutions adding to conviction rather than chasing headlines.",
    },
  ] satisfies BriefItem[],
  watchlist: [
    {
      symbol: "AMZN",
      title: "Margin narrative improving",
      note:
        "Retail margin expectations are getting less skeptical as logistics efficiency keeps surprising to the upside.",
    },
    {
      symbol: "TSM",
      title: "Foundry demand still firm",
      note:
        "Supplier read-through remains supportive, which helps validate the broader semiconductor move.",
    },
    {
      symbol: "JPM",
      title: "Credit tone stable",
      note:
        "Banks are quieter today, but stable credit commentary is helping keep macro stress contained.",
    },
  ] satisfies WatchlistShift[],
  portfolioState: {
    title: "Portfolio intelligence",
    emptyTitle: "Connect holdings to unlock thesis-level alerts",
    emptyBody:
      "ALQIS will surface concentration risk, earnings exposure, and portfolio-level explanations once positions are linked.",
    queueLabel: "Alert queue",
    queueStatus: "No critical alerts",
    queueDetail: "Everything on your watchlist is within its normal signal band.",
  },
};
