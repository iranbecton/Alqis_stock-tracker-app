import type { ConfidenceBand } from "@/components/ui/confidence-dot";

export type StockChartRange = "1d" | "5d" | "1m";

export type ChartPoint = {
  label: string;
  value: number;
};

export type ChartMarker = {
  index: number;
  label: string;
  kind: "checkpoint" | "event";
  time: string;
  title?: string;
  explanation?: string;
  whyItMatters?: string;
};

export type ChartRangeData = {
  label: string;
  subtitle: string;
  points: ChartPoint[];
  markers: ChartMarker[];
  stats: Array<{
    label: string;
    value: string;
  }>;
  footer: string;
};

export type ExplanationReason = {
  label: string;
  score: number;
  detail: string;
};

export type CounterEvidence = {
  label: string;
  detail: string;
};

export type EvidenceNote = {
  time: string;
  title: string;
  detail: string;
};

export type Metric = {
  label: string;
  value: string;
  context: string;
};

export type QuickFact = {
  label: string;
  value: string;
};

export type NewsItem = {
  source: string;
  time: string;
  headline: string;
  summary: string;
  whyItMatters: string;
};

export type SentimentPoint = {
  title: string;
  detail: string;
};

export type Peer = {
  symbol: string;
  name: string;
  price: string;
  changePct: number;
  note: string;
  readThrough: string;
  timeframe: string;
  points: ChartPoint[];
};

export const stockDetailDemoData = {
  asOf: "Updated Apr 22, 2:14 PM ET",
  company: {
    name: "NVIDIA Corporation",
    symbol: "NVDA",
    exchange: "NASDAQ",
    sector: "AI infrastructure",
    marketStatus: "Market open",
    statusDetail: "Closes 4:00 PM ET",
    watchlistLabel: "Saved to watchlist",
    price: "$989.32",
    dailyChange: 36.73,
    dailyChangePct: 3.84,
    afterHoursPrice: "$992.10",
    afterHoursChange: 2.78,
    afterHoursChangePct: 0.28,
    oneLineSummary:
      "NVIDIA is trading higher as fresh enterprise and hyperscaler spending commentary reinforces confidence in AI demand staying stronger for longer.",
    quickFacts: [
      { label: "Narrative", value: "Demand-led" },
      { label: "Next catalyst", value: "Earnings in 30 days" },
      { label: "Positioning", value: "Crowded but justified" },
    ] satisfies QuickFact[],
  },
  chartRanges: {
    "1d": {
      label: "1D",
      subtitle: "Intraday repricing after capex read-through",
      points: [
        { label: "9:30", value: 958 },
        { label: "9:50", value: 962 },
        { label: "10:10", value: 966 },
        { label: "10:30", value: 971 },
        { label: "10:50", value: 974 },
        { label: "11:10", value: 979 },
        { label: "11:30", value: 983 },
        { label: "11:50", value: 987 },
        { label: "12:10", value: 989 },
        { label: "12:30", value: 991 },
        { label: "1:00", value: 994 },
        { label: "1:30", value: 992 },
        { label: "2:00", value: 989 },
      ],
      markers: [
        {
          index: 1,
          label: "Opening bid held",
          kind: "checkpoint",
          time: "Apr 22, 9:50 AM ET",
        },
        {
          index: 5,
          label: "Cloud note",
          kind: "event",
          time: "Apr 22, 11:10 AM ET",
          title: "Cloud capex commentary stayed firm",
          explanation:
            "Fresh enterprise and hyperscaler commentary kept AI infrastructure budget expectations elevated through the second half.",
          whyItMatters:
            "That shifted the move from a momentum read into a demand-backed repricing.",
        },
        {
          index: 10,
          label: "Session high",
          kind: "event",
          time: "Apr 22, 1:00 PM ET",
          title: "Sector breadth helped push the stock to a new intraday high",
          explanation:
            "Semiconductor equipment and memory names joined the move, making the rally look broader and healthier.",
          whyItMatters:
            "A high set with sector confirmation tends to carry more weight than a narrow one-name spike.",
        },
      ],
      stats: [
        { label: "Volume confirmation", value: "+39%" },
        { label: "Intraday validation", value: "$994.08" },
        { label: "Breadth check", value: "Semis broadening" },
      ],
      footer:
        "Volume is running ahead of normal and the high was set after broader semiconductor participation improved, which keeps this move aligned with a demand-led thesis rather than a narrow spike.",
    },
    "5d": {
      label: "5D",
      subtitle: "Momentum building with broader semiconductor support",
      points: [
        { label: "Mon", value: 918 },
        { label: "Tue", value: 926 },
        { label: "Wed", value: 935 },
        { label: "Thu", value: 944 },
        { label: "Fri", value: 952 },
        { label: "Mon", value: 961 },
        { label: "Tue", value: 973 },
        { label: "Wed", value: 989 },
      ],
      markers: [
        {
          index: 1,
          label: "Early follow-through",
          kind: "checkpoint",
          time: "Apr 16, 4:00 PM ET",
        },
        {
          index: 2,
          label: "Demand data",
          kind: "event",
          time: "Apr 17, 10:15 AM ET",
          title: "Enterprise demand data held above expectations",
          explanation:
            "Buy-side checks and enterprise commentary suggested accelerator demand stayed firm rather than normalizing lower.",
          whyItMatters:
            "It reinforced that the five-day move is being carried by fundamental demand, not just technical squeeze dynamics.",
        },
        {
          index: 5,
          label: "Sector follow-through",
          kind: "event",
          time: "Apr 21, 2:20 PM ET",
          title: "Supply-chain names confirmed the move",
          explanation:
            "Foundry and equipment names strengthened alongside the leader, widening participation across the semiconductor complex.",
          whyItMatters:
            "Broader confirmation lowers the odds that the rally is isolated or fragile.",
        },
      ],
      stats: [
        { label: "Five-day follow-through", value: "+7.8%" },
        { label: "Range quality", value: "$918 - $989" },
        { label: "Confirmation", value: "Supply chain joined" },
      ],
      footer:
        "The five-day move has been reinforced by memory, foundry, and equipment names, which makes the explanation sturdier than a narrow one-stock squeeze.",
    },
    "1m": {
      label: "1M",
      subtitle: "Leadership held through macro swings",
      points: [
        { label: "W1", value: 857 },
        { label: "W2", value: 881 },
        { label: "W3", value: 904 },
        { label: "W4", value: 928 },
        { label: "W5", value: 951 },
        { label: "Now", value: 989 },
      ],
      markers: [
        {
          index: 1,
          label: "Trend held",
          kind: "checkpoint",
          time: "Mar 29 close",
        },
        {
          index: 2,
          label: "Earnings reset",
          kind: "event",
          time: "Apr 5, 4:05 PM ET",
          title: "Earnings reset lifted confidence in the forward demand picture",
          explanation:
            "The market came away believing margins and order visibility could stay stronger for longer even as expectations rose.",
          whyItMatters:
            "That reset gave the stock room to lead again through the rest of the month.",
        },
        {
          index: 4,
          label: "Leadership retest",
          kind: "checkpoint",
          time: "Apr 19 close",
        },
      ],
      stats: [
        { label: "One-month leadership", value: "+15.4%" },
        { label: "Long-range context", value: "$391 - $994" },
        { label: "Regime", value: "Leadership intact" },
      ],
      footer:
        "Longer-term performance still reflects persistent AI infrastructure leadership, and the market is rewarding execution and demand visibility more than hype.",
    },
  } satisfies Record<StockChartRange, ChartRangeData>,
  explanation: {
    title: "Why Is It Moving?",
    headline: "The market is paying up for durable AI demand, not just excitement.",
    freshness: "Fresh within 15 minutes",
    summary:
      "Today's move looks conviction-driven. Investors are responding to stronger read-through from hyperscaler and enterprise AI spending while margins remain resilient enough to support the premium multiple.",
    confidence: "A" as ConfidenceBand,
    sourceCount: 4,
    confidenceSummary:
      "ALQIS confidence is high because the move is supported by demand commentary, broader sector confirmation, and healthy volume.",
    trustNote:
      "This explanation blends price action, news flow, rates, and sector breadth rather than relying on one headline.",
    sourceLabels: ["Price action", "News flow", "Rates", "Sector breadth"],
    reasons: [
      {
        label: "Demand confidence",
        score: 88,
        detail:
          "Spending commentary still points to sustained accelerator demand in the second half.",
      },
      {
        label: "Sector confirmation",
        score: 74,
        detail:
          "Semiconductor peers and suppliers are participating, which makes the move sturdier.",
      },
      {
        label: "Macro backdrop",
        score: 56,
        detail:
          "A modest drop in yields is helping long-duration growth names extend rather than stall.",
      },
    ] satisfies ExplanationReason[],
    counterEvidence: [
      {
        label: "Expectations are already elevated",
        detail:
          "The stock is expensive enough that even a small softening in demand commentary could compress the premium quickly.",
      },
      {
        label: "The move still needs earnings confirmation",
        detail:
          "Investors are underwriting second-half durability before management has refreshed the next set of hard numbers.",
      },
    ] satisfies CounterEvidence[],
    evidence: [
      {
        time: "09:42",
        title: "Hyperscaler capex commentary stayed firm",
        detail:
          "Large-cap tech commentary kept AI server demand expectations elevated rather than normalizing lower.",
      },
      {
        time: "11:18",
        title: "Breadth widened across semis",
        detail:
          "Equipment and foundry names joined the move, suggesting this is demand-led rather than purely momentum-led.",
      },
      {
        time: "13:07",
        title: "Rates pressure eased",
        detail:
          "Softer yields reduced valuation pressure and allowed leadership stocks to hold their gains into the afternoon.",
      },
    ] satisfies EvidenceNote[],
    takeaway:
      "If demand commentary holds through upcoming earnings, pullbacks are more likely to be treated as accumulation than a thesis break.",
    changeTriggers: [
      "Hyperscaler or enterprise commentary shifts from capacity-constrained to budget-constrained.",
      "Sector breadth fades and suppliers stop confirming the move.",
      "Margins or lead times soften enough to challenge the durability of the current demand read.",
    ],
  },
  metrics: [
    {
      label: "Market cap",
      value: "$2.44T",
      context: "One of the market's dominant AI infrastructure leaders.",
    },
    {
      label: "Forward P/E",
      value: "34.8x",
      context: "Premium valuation, but still supported by growth durability.",
    },
    {
      label: "Revenue growth",
      value: "+208% YoY",
      context: "Growth remains extreme, even against a larger base.",
    },
    {
      label: "Gross margin",
      value: "75.1%",
      context: "Margins remain well above where skeptics expected normalization.",
    },
    {
      label: "Next earnings",
      value: "May 22",
      context: "The next major catalyst for validating demand and margin strength.",
    },
    {
      label: "Avg daily volume",
      value: "28.4M",
      context: "Today's volume is running clearly above typical levels.",
    },
  ] satisfies Metric[],
  news: [
    {
      source: "Reuters",
      time: "37 min ago",
      headline: "Cloud spending commentary keeps AI infrastructure leaders in focus",
      summary:
        "Fresh enterprise and hyperscaler commentary reinforced confidence that AI hardware demand has not softened into the second half.",
      whyItMatters:
        "This supports the idea that today's move is being underwritten by durable budget signals rather than a short-lived sentiment burst.",
    },
    {
      source: "Bloomberg",
      time: "1 hr ago",
      headline: "Semiconductor breadth improves as equipment names join the rally",
      summary:
        "Investors widened exposure across the supply chain, reducing the sense that today's move is only a single-name chase.",
      whyItMatters:
        "Broader participation makes the rally feel healthier and lowers the odds that the tape is being driven by one crowded leader alone.",
    },
    {
      source: "The Information",
      time: "2 hrs ago",
      headline: "Large customers continue prioritizing accelerator capacity",
      summary:
        "Procurement signals still suggest buyers are treating AI compute capacity as strategic rather than discretionary.",
      whyItMatters:
        "That matters because it keeps the spending narrative tied to mission-critical infrastructure rather than experimental budgets.",
    },
  ] satisfies NewsItem[],
  signals: {
    bullish: [
      {
        title: "Demand remains visible",
        detail: "Customer commentary still supports elevated accelerator demand.",
      },
      {
        title: "Participation is broad",
        detail: "Suppliers and adjacent semiconductor names are confirming the move.",
      },
      {
        title: "Price action is orderly",
        detail: "The stock is extending on healthy volume rather than erratic spikes.",
      },
    ] satisfies SentimentPoint[],
    bearish: [
      {
        title: "Expectations are high",
        detail: "A premium multiple leaves less room for even minor execution misses.",
      },
      {
        title: "Crowding risk remains",
        detail: "Leadership names can pull back quickly if the macro tape worsens.",
      },
      {
        title: "Margins still need to hold",
        detail: "Any sign of pricing pressure would challenge the current narrative.",
      },
    ] satisfies SentimentPoint[],
    analystSummary:
      "Street view stays constructive: 18 Buy, 7 Hold, 1 Reduce, with consensus still anchored to continued AI infrastructure leadership.",
    targetPrice: "$1,045 median target",
    sentimentBand: "Positive but demanding",
    alqisRead:
      "The weight of evidence still leans constructive, but the stock is expensive enough that execution matters more than story quality alone.",
  },
  peers: [
    {
      symbol: "AMD",
      name: "Advanced Micro Devices",
      price: "$182.44",
      changePct: 2.18,
      note:
        "Watching for whether enterprise accelerator demand broadens beyond the clear category leader.",
      readThrough: "Broadening AI demand",
      timeframe: "30D confirmation",
      points: [
        { label: "1", value: 156 },
        { label: "2", value: 162 },
        { label: "3", value: 168 },
        { label: "4", value: 173 },
        { label: "5", value: 178 },
        { label: "6", value: 182 },
      ],
    },
    {
      symbol: "TSM",
      name: "Taiwan Semiconductor",
      price: "$151.83",
      changePct: 1.11,
      note:
        "A clean foundry read-through helps validate that the demand signal is showing up in the supply chain.",
      readThrough: "Supply-chain confirmation",
      timeframe: "30D confirmation",
      points: [
        { label: "1", value: 141 },
        { label: "2", value: 143 },
        { label: "3", value: 145 },
        { label: "4", value: 148 },
        { label: "5", value: 150 },
        { label: "6", value: 152 },
      ],
    },
    {
      symbol: "AVGO",
      name: "Broadcom",
      price: "$1,329.90",
      changePct: 0.94,
      note:
        "Custom AI and networking exposure gives another check on whether spending strength is durable.",
      readThrough: "Networking demand stays firm",
      timeframe: "30D confirmation",
      points: [
        { label: "1", value: 1268 },
        { label: "2", value: 1279 },
        { label: "3", value: 1288 },
        { label: "4", value: 1302 },
        { label: "5", value: 1316 },
        { label: "6", value: 1330 },
      ],
    },
  ] satisfies Peer[],
};
