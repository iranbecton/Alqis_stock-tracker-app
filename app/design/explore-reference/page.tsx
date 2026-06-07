"use client";

import { useEffect, useState } from "react";
import {
  RotateCcw,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { SparklineChart } from "@/components/alqis/sparkline-chart";
import { Disclaimer } from "@/components/ui/disclaimer";
import { UNIVERSE_SIZE } from "@/lib/market/stock-universe";
import { cn } from "@/lib/utils";

type ExploreTab = "discovery" | "screener";
type TagTone = "hot" | "defensive" | "risky" | "contrarian" | "volatile" | "cyclical";
type IdeaLoadStatus = "loading" | "live" | "sample";

const sampleIdeas = [
  {
    rank: 1,
    ticker: "TSM",
    company: "Taiwan Semi",
    sector: "Tech",
    price: "$158.28",
    change: "+6.8%",
    timeframe: "1M",
    fit: 94,
    angle:
      "AI capex exposure that is missing from the current book; similar growth theme to NVDA at a lower valuation multiple.",
    metrics: { pe: "27", growth: "+39%", div: "-", beta: "1.2", ytd: "+35%" },
    risk: "Geopolitical Taiwan exposure and cyclical capex risk.",
    points: [142, 144, 146, 145, 149, 153, 158],
  },
  {
    rank: 2,
    ticker: "AVGO",
    company: "Broadcom",
    sector: "Tech",
    price: "$1,542.00",
    change: "+6.4%",
    timeframe: "1M",
    fit: 89,
    angle:
      "Custom silicon plus dividend context; AI infrastructure exposure paired with a 1.4% yield in a book concentrated in non-payers.",
    metrics: { pe: "38", growth: "+64%", div: "1.4%", beta: "1.2", ytd: "+28%" },
    risk: "Acquisition integration risk after VMware.",
    points: [1350, 1380, 1410, 1395, 1460, 1495, 1542],
  },
  {
    rank: 3,
    ticker: "JPM",
    company: "JPMorgan Chase",
    sector: "Fin",
    price: "$198.48",
    change: "+6.4%",
    timeframe: "1M",
    fit: 82,
    angle:
      "Defensive ballast for a tech-heavy book; 12x P/E, counter-cyclical exposure, and a 2.3% yield.",
    metrics: { pe: "12", growth: "+12%", div: "2.32%", beta: "0.9", ytd: "+14%" },
    risk: "Credit cycle and regulatory pressure.",
    points: [185, 187, 188, 191, 193, 196, 198],
  },
  {
    rank: 4,
    ticker: "UBER",
    company: "Uber",
    sector: "Ind",
    price: "$74.28",
    change: "+6.4%",
    timeframe: "1M",
    fit: 78,
    angle:
      "Profitable platform exposure outside the current holdings; durable post-pandemic demand and autonomous optionality.",
    metrics: { pe: "35", growth: "+21%", div: "-", beta: "1.5", ytd: "+18%" },
    risk: "Driver classification rulings and fuel costs.",
    points: [68, 69, 70, 70.5, 72, 73, 74.2],
  },
  {
    rank: 5,
    ticker: "ABBV",
    company: "AbbVie",
    sector: "Health",
    price: "$168.48",
    change: "+3.4%",
    timeframe: "1M",
    fit: 74,
    angle:
      "Dividend exposure the current book does not emphasize; 3.4% yield with post-Humira pipeline progress in focus.",
    metrics: { pe: "18", growth: "+5%", div: "3.42%", beta: "0.7", ytd: "+12%" },
    risk: "Patent cliff anxiety and drug-pricing politics.",
    points: [160, 161, 160.5, 163, 164, 166, 168],
  },
];

type ReferenceIdea = (typeof sampleIdeas)[number] & {
  topFactors?: string[];
  dataLabel?: string;
};

type ExploreIdeasApiResponse = {
  status: "ok";
  ideas?: {
    rank: number;
    ticker: string;
    sector: string;
    angle: string | null;
    fundamentals?: {
      beta: number | null;
      peRatio: number | null;
      marketCap: number | null;
      oneMonthChange: number | null;
      dividendYield: number | null;
      revenueGrowth: number | null;
    };
    fitScore: {
      score: number;
      topFactors: string[];
    };
  }[];
};

const baskets = [
  {
    name: "AI Infrastructure",
    tag: "hot" as const,
    icon: "🧠",
    tickers: ["NVDA", "AMD", "AVGO", "TSM", "ASML"],
    thesis: "From fab tools to accelerator designers.",
    more: 3,
    performance: "+28.4%",
    match: 88,
  },
  {
    name: "Quality Dividends",
    tag: "defensive" as const,
    icon: "💰",
    tickers: ["JNJ", "PG", "KO", "VZ", "PEP"],
    thesis: "Reliable cash return with low volatility.",
    more: 4,
    performance: "+8.2%",
    match: 72,
  },
  {
    name: "EV & Future Mobility",
    tag: "risky" as const,
    icon: "🔋",
    tickers: ["TSLA", "GM", "UBER", "LCID", "F"],
    thesis: "Beyond Tesla through the economic chain.",
    more: 6,
    performance: "-14.8%",
    match: 48,
  },
  {
    name: "Deep Value",
    tag: "contrarian" as const,
    icon: "🪙",
    tickers: ["JPM", "BAC", "WFC", "V", "MA"],
    thesis: "Low multiples, real earnings, unloved.",
    more: 2,
    performance: "+4.1%",
    match: 64,
  },
  {
    name: "Reopening Trades",
    tag: "cyclical" as const,
    icon: "✈",
    tickers: ["ABNB", "BKNG", "UBER", "DIS", "NCLH"],
    thesis: "Travel, hospitality, and services.",
    more: 5,
    performance: "+12.4%",
    match: 71,
  },
  {
    name: "Crypto-Adjacent",
    tag: "volatile" as const,
    icon: "₿",
    tickers: ["COIN", "MSTR", "MARA", "RIOT", "SQ"],
    thesis: "Equity exposure to digital assets.",
    more: 4,
    performance: "+52.4%",
    match: 56,
  },
  {
    name: "Defensive Anchor",
    tag: "defensive" as const,
    icon: "🛡",
    tickers: ["JNJ", "PG", "KO", "V", "PFE"],
    thesis: "Recession-resistant, steady margins.",
    more: 3,
    performance: "+4.2%",
    match: 68,
  },
  {
    name: "Semiconductors",
    tag: "cyclical" as const,
    icon: "⚙",
    tickers: ["NVDA", "AMD", "AVGO", "TSM", "ASML"],
    thesis: "From fab tools to designers.",
    more: 2,
    performance: "+24.2%",
    match: 84,
  },
];

const trending = [
  {
    ticker: "NVDA",
    company: "NVIDIA",
    sector: "Tech",
    change: "+4.32%",
    vol: "124",
    avg: "18",
    why: "Earnings spillover and AI infrastructure rally.",
    trend: "up" as const,
    points: [870, 884, 892, 900, 915, 928, 945],
  },
  {
    ticker: "TSLA",
    company: "Tesla",
    sector: "Cons",
    change: "+2.87%",
    vol: "94",
    avg: "14",
    why: "Robotaxi date confirmed for June.",
    trend: "up" as const,
    points: [170, 171, 172, 173, 174, 176, 178],
  },
  {
    ticker: "GME",
    company: "GameStop",
    sector: "Cons",
    change: "+48.40%",
    vol: "78",
    avg: "2.8",
    why: "Roaring Kitty posts again, meme rally.",
    trend: "up" as const,
    points: [18, 19, 20, 24, 23, 26, 30],
  },
  {
    ticker: "PLTR",
    company: "Palantir",
    sector: "Tech",
    change: "+1.94%",
    vol: "54",
    avg: "21",
    why: "DoD contract expansion rumored.",
    trend: "up" as const,
    points: [22, 22.2, 22.4, 22.7, 22.8, 23, 23.2],
  },
  {
    ticker: "COIN",
    company: "Coinbase",
    sector: "Fin",
    change: "-3.41%",
    vol: "38",
    avg: "16",
    why: "BTC down on Fed hawkishness.",
    trend: "down" as const,
    points: [245, 240, 242, 235, 238, 232, 229],
  },
  {
    ticker: "AMD",
    company: "Advanced Micro Devices",
    sector: "Tech",
    change: "+5.67%",
    vol: "54",
    avg: "1.5",
    why: "NVDA sympathy and MI300X demand.",
    trend: "up" as const,
    points: [170, 172, 174, 176, 178, 181, 182],
  },
  {
    ticker: "MSTR",
    company: "MicroStrategy",
    sector: "Tech",
    change: "+28.40%",
    vol: "24",
    avg: "3.2",
    why: "BTC proxy and leveraged treasury programs.",
    trend: "up" as const,
    points: [920, 940, 930, 970, 990, 1040, 1080],
  },
  {
    ticker: "SMCI",
    company: "Super Micro",
    sector: "Tech",
    change: "+8.40%",
    vol: "33",
    avg: "18",
    why: "AI server demand validated.",
    trend: "up" as const,
    points: [780, 792, 805, 820, 815, 845, 860],
  },
];

const quickScreens = [
  ["Undervalued", "52 stocks", "💎"],
  ["Dividends", "30 stocks", "💰"],
  ["High growth", "24 stocks", "🚀"],
  ["AI exposure", "18 stocks", "🧠"],
  ["Deep value", "31 stocks", "🪙"],
  ["Momentum", "19 stocks", "📈"],
];

const screenerRows = [
  ["NVDA", "NVIDIA", "Tech", "2.8T", "$945.21", "64", "+154%", "0.83%", "1.7", "+12.4%", "+84.2%", 92],
  ["TSM", "Taiwan Semi", "Tech", "812B", "$158.28", "27", "+39%", "1.21%", "1.1", "+6.8%", "+35.4%", 88],
  ["META", "Meta Platforms", "Comm", "1.2T", "$478.60", "24", "+21%", "0.45%", "1.3", "+5.8%", "+19.4%", 87],
  ["AMD", "AMD", "Tech", "286B", "$178.50", "49", "+18%", "-", "1.8", "+14.1%", "+12.4%", 86],
  ["MSFT", "Microsoft", "Tech", "3.1T", "$421.30", "36", "+15%", "0.72%", "1.1", "+3.2%", "+12.8%", 84],
  ["AVGO", "Broadcom", "Tech", "712B", "$1542.00", "38", "+44%", "1.42%", "1.2", "+8.6%", "+28.4%", 84],
  ["ASML", "ASML", "Tech", "342B", "$868.40", "36", "+17%", "0.86%", "1.1", "+2.1%", "+18.4%", 82],
  ["GOOGL", "Alphabet", "Comm", "1.9T", "$156.40", "23", "+14%", "0.51%", "1.0", "+1.4%", "+11.2%", 81],
  ["UBER", "Uber", "Ind", "154B", "$74.20", "38", "+21%", "-", "1.5", "+6.4%", "+18.4%", 81],
  ["AMZN", "Amazon", "Cons", "1.9T", "$188.40", "41", "+13%", "-", "1.3", "-0.6%", "+8.1%", 78],
  ["JPM", "JPMorgan", "Fin", "564B", "$198.40", "12", "+12%", "2.32%", "1.1", "+4.4%", "+14.4%", 78],
  ["CRM", "Salesforce", "Tech", "241B", "$251.10", "28", "+11%", "-", "1.2", "+3.8%", "+9.7%", 76],
];

const filterSections = [
  {
    title: "Sector",
    options: ["Technology", "Communication", "Consumer", "Healthcare", "Financials", "Industrials", "Energy"],
  },
  {
    title: "Theme",
    options: ["AI", "Quality", "EV", "Deep", "Reopening", "Defensive", "Crypto-Adjacent", "Semiconductors"],
  },
];

const ranges = [
  ["Market cap ($B)", "$0", "$3T"],
  ["P/E ratio", "0", "200"],
  ["Revenue growth %", "-20%", "200%"],
  ["Dividend yield %", "0.0%", "8.0%"],
  ["Beta", "0.6", "4.0"],
  ["ALQIS score", "0", "100"],
];

const quickScreenPills = [
  "Undervalued tech",
  "Quality dividends",
  "High growth",
  "Mega-cap AI",
  "Deep value",
  "Momentum >+10%/mo",
];

export default function ExploreReferencePage() {
  const [activeTab, setActiveTab] = useState<ExploreTab>("discovery");
  const [ideaState, setIdeaState] = useState<{
    status: IdeaLoadStatus;
    ideas: ReferenceIdea[];
  }>({
    status: "loading",
    ideas: sampleIdeas,
  });

  useEffect(() => {
    let active = true;

    async function loadIdeas() {
      try {
        const response = await fetch("/api/explore/ideas", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Explore ideas unavailable.");
        }

        const payload = (await response.json()) as ExploreIdeasApiResponse;
        const liveIdeas = mapApiIdeasToReferenceIdeas(payload);

        if (!active) {
          return;
        }

        setIdeaState(
          liveIdeas.length
            ? { status: "live", ideas: liveIdeas }
            : { status: "sample", ideas: sampleIdeas }
        );
      } catch {
        if (active) {
          setIdeaState({ status: "sample", ideas: sampleIdeas });
        }
      }
    }

    loadIdeas();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="min-h-dvh bg-[var(--surface-grounded)] text-[#f4f8ff]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_52%_0%,rgba(114,199,190,0.08),transparent_34rem),linear-gradient(180deg,#03060b,#050b13_44%,#03060b)]" />
      <div className="relative mx-auto max-w-[96rem] px-4 py-5 sm:px-6 lg:px-8">
        <PrototypeHeader />

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <TabSwitch activeTab={activeTab} onChange={setActiveTab} />
          <div className="flex items-center gap-2 text-[0.72rem] font-bold text-[#7891ad]">
            <span className="h-2 w-2 rounded-full bg-[#63cfa8]" />
            Universe: {UNIVERSE_SIZE} stocks
            <span aria-hidden>·</span>
            refreshed 2m ago
            <SampleBadge label={ideaState.status === "live" ? "Provider context" : "Sample data"} />
          </div>
        </div>

        {activeTab === "discovery" ? (
          <DiscoveryTab
            ideas={ideaState.ideas}
            ideasStatus={ideaState.status}
            onOpenScreener={() => setActiveTab("screener")}
          />
        ) : (
          <ScreenerTab />
        )}

        <Disclaimer
          variant="banner"
          className="mt-8 border-[rgba(86,126,176,0.18)] bg-[rgba(12,22,38,0.72)]"
        />
      </div>
    </main>
  );
}

function mapApiIdeasToReferenceIdeas(payload: ExploreIdeasApiResponse): ReferenceIdea[] {
  if (payload.status !== "ok" || !Array.isArray(payload.ideas)) {
    return [];
  }

  return payload.ideas.slice(0, 5).map((idea) => {
    const fundamentals = idea.fundamentals;
    const score = idea.fitScore.score;

    return {
      rank: idea.rank,
      ticker: idea.ticker,
      company: idea.ticker,
      sector: abbreviateSector(idea.sector),
      price:
        typeof fundamentals?.marketCap === "number"
          ? `${formatCapValue(fundamentals.marketCap)} cap`
          : "Provider metrics",
      change: formatPercent(fundamentals?.oneMonthChange),
      timeframe: "1M",
      fit: score,
      angle: idea.angle ?? "Generating context...",
      metrics: {
        pe: formatMetricNumber(fundamentals?.peRatio),
        growth: formatPercent(fundamentals?.revenueGrowth),
        div: formatPercent(fundamentals?.dividendYield),
        beta: formatMetricNumber(fundamentals?.beta),
        ytd: "-",
      },
      risk: "Risk context pending narrative wiring.",
      points: sparklineFromScore(score, fundamentals?.oneMonthChange),
      topFactors: idea.fitScore.topFactors,
      dataLabel: "Provider context",
    };
  });
}

function abbreviateSector(sector: string) {
  if (sector === "Technology") return "Tech";
  if (sector === "Communication") return "Comm";
  if (sector === "Consumer Discretionary") return "Cons";
  if (sector === "Consumer Staples") return "Staples";
  if (sector === "Financials") return "Fin";
  if (sector === "Healthcare") return "Health";
  if (sector === "Industrials") return "Ind";

  return sector;
}

function sparklineFromScore(score: number, oneMonthChange: number | null | undefined) {
  const change = typeof oneMonthChange === "number" ? oneMonthChange : 0;
  const base = Math.max(20, score);

  return Array.from({ length: 7 }).map((_, index) => {
    const drift = (change / 6) * index;
    return base + drift + Math.sin(index) * 1.5;
  });
}

function formatMetricNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(value >= 10 ? 0 : 2)
    : "-";
}

function formatCapValue(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1)}T` : `${value.toFixed(0)}B`;
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

const headerDate = new Date().toLocaleDateString('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric'
}).toUpperCase();
function PrototypeHeader() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(86,126,176,0.16)] pb-4">
      <div className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#4f6684]">
        VOL. 1 · ISSUE 274
      </div>
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#8B84C7] text-xs font-black">
          A*
        </span>
        <span className="text-sm font-black">ALQIS</span>
      </div>
      <div className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-[#4f6684]">
        {headerDate}
      </div>
    </header>
  );
}

function TabSwitch({
  activeTab,
  onChange,
}: {
  activeTab: ExploreTab;
  onChange: (tab: ExploreTab) => void;
}) {
  return (
    <div className="inline-flex rounded-[0.9rem] border border-[rgba(86,126,176,0.24)] bg-[var(--surface-raised)] p-1">
      <button
        type="button"
        onClick={() => onChange("discovery")}
        className={cn(
          "inline-flex min-h-9 items-center gap-2 rounded-[0.65rem] px-3 text-sm font-black transition",
          activeTab === "discovery"
            ? "bg-[#123d73] text-[#bde9ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            : "text-[#91a9c6] hover:text-[#f4f8ff]"
        )}
      >
        <Sparkles className="h-4 w-4 text-[#72c7be]" />
        AI Discovery
      </button>
      <button
        type="button"
        onClick={() => onChange("screener")}
        className={cn(
          "inline-flex min-h-9 items-center gap-2 rounded-[0.65rem] px-3 text-sm font-black transition",
          activeTab === "screener"
            ? "bg-[#123d73] text-[#bde9ff] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
            : "text-[#91a9c6] hover:text-[#f4f8ff]"
        )}
      >
        <Search className="h-4 w-4 text-[#72c7be]" />
        Power Screener
      </button>
    </div>
  );
}

function DiscoveryTab({
  ideas,
  ideasStatus,
  onOpenScreener,
}: {
  ideas: ReferenceIdea[];
  ideasStatus: IdeaLoadStatus;
  onOpenScreener: () => void;
}) {
  const ideaLabel = ideasStatus === "live" ? "Provider context" : "Sample data";

  return (
    <div className="mt-5 space-y-7">
      <section className="overflow-hidden rounded-[1.25rem] border border-[rgba(86,126,176,0.18)] bg-[radial-gradient(ellipse_at_0%_0%,rgba(114,199,190,0.18),transparent_34rem),linear-gradient(135deg,var(--surface-floating),#101936_78%)] p-5 shadow-[0_26px_80px_rgba(0,0,0,0.42)] sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#72c7be]">
            EXPLORE / LIVE · Updated for Iran&apos;s book just now
          </p>
          <SampleBadge label={ideaLabel} />
        </div>
        <h1 className="mt-4 max-w-5xl font-serif text-[2.3rem] leading-none text-[#f4f8ff] sm:text-[3.7rem]">
          Hey Iran — I&apos;ve found{" "}
          <span className="italic text-[#8B84C7]">5 stocks</span> for your review today.
        </h1>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-[#8ca0b8]">
          Scored against your portfolio&apos;s existing exposures, valuation tolerance,
          and the catalysts most likely to move them this quarter.
        </p>
        <div className="mt-5 rounded-[0.9rem] border border-[rgba(86,126,176,0.22)] bg-[#07111f]/72 p-2">
          <div className="flex min-h-12 items-center gap-3 rounded-[0.65rem] px-3 text-sm font-semibold text-[#7891ad]">
            <Sparkles className="h-4 w-4 text-[#72c7be]" />
            <span className="min-w-0 flex-1 truncate">
              Ask me to find stocks: &apos;cheap profitable tech&apos;, &apos;AI plays I don&apos;t own&apos;, &apos;add a dividend payer&apos;...
            </span>
            <span className="shrink-0 rounded border border-[#8B84C7]/32 bg-[#8B84C7]/12 px-2 py-1 text-[0.68rem] font-black text-[#c9c4ff]">
              Coming soon
            </span>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "Cheap profitable tech under $50B",
            "Quality dividends with low beta",
            "AI plays I don't already own",
            "What's the best AI stock to add?",
          ].map((chip) => (
            <span key={chip} className="rounded-full border border-[#72c7be]/24 bg-[#72c7be]/7 px-3 py-1.5 text-xs font-bold text-[#a9bad0]">
              {chip}
            </span>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black">5 ideas for Iran today</h2>
              <SampleBadge label={ideaLabel} />
            </div>
            <p className="mt-1 text-sm font-semibold text-[#7891ad]">
              Personalized by ALQIS · Refreshed daily, or whenever your portfolio shifts meaningfully.
            </p>
          </div>
          <a href="#why-these-note" className="text-sm font-black text-[#72c7be]">
            Why these →
          </a>
        </div>
        <p
          id="why-these-note"
          className="mt-3 rounded-[0.85rem] border border-[#8B84C7]/22 bg-[#8B84C7]/9 px-3 py-2 text-sm leading-6 text-[#c7d5e8]"
        >
          Stocks are scored against your portfolio exposures and market signals. This is informational only, not investment advice.
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-6">
          {ideasStatus === "loading"
            ? Array.from({ length: 4 }).map((_, index) => (
                <IdeaSkeleton key={index} className={index < 3 ? "lg:col-span-2" : "lg:col-span-3"} />
              ))
            : (ideas ?? []).map((idea, index) => (
                <IdeaCard key={idea.ticker} idea={idea} className={index < 3 ? "lg:col-span-2" : "lg:col-span-3"} />
              ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="Themed baskets"
          copy="Pre-built screens. Each is an investable thesis with 5-10 names."
          action="All themes →"
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {baskets.map((basket) => (
            <BasketCard key={basket.name} basket={basket} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(24rem,0.92fr)]">
        <TrendingNow />
        <ManualScreenCard onOpenScreener={onOpenScreener} />
      </section>
    </div>
  );
}

function IdeaSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "min-h-[18rem] animate-pulse rounded-[1rem] border border-[rgba(86,126,176,0.18)] bg-[var(--surface-raised)] p-4",
        className
      )}
    >
      <div className="h-8 w-28 rounded bg-[#20314b]" />
      <div className="mt-5 h-2 rounded bg-[#243247]" />
      <div className="mt-6 h-4 w-3/4 rounded bg-[#20314b]" />
      <div className="mt-3 h-4 w-2/3 rounded bg-[#20314b]" />
      <div className="mt-8 grid grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-12 rounded bg-[#07111f]/66" />
        ))}
      </div>
    </div>
  );
}

function IdeaCard({ idea, className }: { idea: ReferenceIdea; className?: string }) {
  const topFactors = idea.topFactors ?? [
    "Adds missing exposure to your book",
    "Positive recent momentum",
  ];
  const isDown = idea.change.startsWith("-");
  const dataLabel = idea.dataLabel ?? "Sample data";

  return (
    <article
      className={cn(
        "flex min-h-[27rem] flex-col rounded-[1rem] border border-[rgba(86,126,176,0.18)] bg-[var(--surface-raised)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.25)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#356baa] text-sm font-black text-white">
            {idea.rank}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-2">
              <h3 className="text-xl font-black">{idea.ticker}</h3>
              <p className="text-sm font-semibold text-[#7891ad]">{idea.company}</p>
              <SampleBadge label={dataLabel} />
            </div>
            <p className="mt-1 text-sm font-black" data-numeric>
              {idea.price}{" "}
              <span className={isDown ? "text-[#c9877a]" : "text-[#63cfa8]"}>
                {isDown ? "▼" : "▲"} {idea.change}
              </span>{" "}
              <span className={isDown ? "text-[#c9877a]" : "text-[#63cfa8]"}>
                {idea.timeframe}
              </span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded bg-[#123d73]/70 px-2 py-1 text-[0.62rem] font-black text-[#8be8dd]">
            {idea.sector}
          </span>
          <SparklineChart
            data={idea.points.map((value, i) => ({ label: String(i + 1), value }))}
            trend={isDown ? "down" : "up"}
            className="h-10 w-24"
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#5aa9ff]">
            ALQIS FIT
          </p>
          <span className="font-black text-[#8B84C7]" data-numeric>
            {idea.fit}
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-[#243247]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#6e9cff,#a98bff)]"
            style={{ width: `${idea.fit}%` }}
          />
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#7891ad]">
          The Angle
        </p>
        <p className="mt-2 min-h-[4rem] text-sm font-semibold leading-6 text-[#a9bad0]">
          {idea.angle}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-5 rounded-[0.75rem] border border-[rgba(86,126,176,0.18)] bg-[#07111f]/66">
        {Object.entries(idea.metrics).map(([label, value]) => (
          <div key={label} className="px-2 py-2">
            <p className="text-[0.58rem] font-black uppercase tracking-[0.12em] text-[#7189a8]">
              {label}
            </p>
            <p className="mt-1 text-sm font-black text-[#f4f8ff]" data-numeric>
              {value}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-3 rounded-[0.6rem] border border-[#d2a96b]/24 bg-[#d2a96b]/10 px-2 py-2 text-xs font-semibold text-[#d2a96b]">
        ⚠ Risks: {idea.risk}
      </p>

      <details className="mt-3 rounded-[0.6rem] border border-[#8B84C7]/22 bg-[#8B84C7]/9 px-2 py-2 text-xs text-[#c9c4ff]">
        <summary className="cursor-pointer font-black text-[#d7d3ff]">
          Why this score
        </summary>
        <ul className="mt-2 space-y-1 font-semibold">
          {topFactors.map((factor) => (
            <li key={factor}>{factor}</li>
          ))}
        </ul>
      </details>

      <div className="mt-auto flex gap-2 pt-4">
        <button type="button" className="min-h-10 flex-1 rounded-[0.65rem] bg-[#72c7be] px-3 text-sm font-black text-[#06121a]">
          Open {idea.ticker} →
        </button>
        <button type="button" disabled className="min-h-10 rounded-[0.65rem] border border-[rgba(86,126,176,0.22)] px-3 text-sm font-black text-[#c7d5e8] opacity-85">
          + Compare
        </button>
      </div>
    </article>
  );
}

function BasketCard({ basket }: { basket: (typeof baskets)[number] }) {
  return (
    <article className={cn("min-h-56 rounded-[1rem] border p-4", tagCardClass(basket.tag))}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#72c7be]/16 text-xl">
          {basket.icon}
        </span>
        <div className="flex flex-col items-end gap-1.5">
          <TagPill tone={basket.tag} />
          <SampleBadge />
        </div>
      </div>
      <h3 className="mt-4 text-lg font-black">{basket.name}</h3>
      <p className="mt-1 min-h-10 text-sm font-semibold leading-5 text-[#a9bad0]">
        {basket.thesis}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {basket.tickers.map((ticker) => (
          <span key={ticker} className="rounded bg-[#07111f]/76 px-2 py-1 text-[0.65rem] font-black text-[#d9e9ff]">
            {ticker}
          </span>
        ))}
        <span className="rounded bg-[#07111f]/76 px-2 py-1 text-[0.65rem] font-black text-[#7891ad]">
          +{basket.more}
        </span>
      </div>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-[#7189a8]">
              30D
            </p>
            <p className={cn("text-sm font-black", basket.performance.startsWith("-") ? "text-[#c9877a]" : "text-[#63cfa8]")}>
              {basket.performance}
            </p>
          </div>
          <div>
            <p className="text-[0.58rem] font-black uppercase tracking-[0.14em] text-[#7189a8]">
              ALQIS
            </p>
            <p className="text-sm font-black text-[#8B84C7]">{basket.match}</p>
          </div>
        </div>
        <span className="text-sm font-black text-[#72c7be]">Explore →</span>
      </div>
    </article>
  );
}

function TrendingNow() {
  return (
    <section className="rounded-[1rem] border border-[rgba(86,126,176,0.18)] bg-[var(--surface-raised)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-black uppercase tracking-[0.04em]">Trending Now</h2>
            <SampleBadge />
          </div>
          <p className="text-sm font-semibold text-[#7891ad]">Most-tracked vs average</p>
        </div>
        <span className="text-xs font-bold text-[#7891ad]">Updates every 60s</span>
      </div>
      <div className="mt-3 divide-y divide-[rgba(86,126,176,0.16)]">
        {trending.map((item, index) => (
          <div key={item.ticker} className="grid grid-cols-[2rem_4.5rem_minmax(0,1fr)_7rem_5rem_2rem] items-center gap-3 py-2.5">
            <span className="grid h-6 w-6 place-items-center rounded bg-[#13233a] text-xs font-black text-[#7891ad]">
              {index + 1}
            </span>
            <div>
              <p className="font-black">{item.ticker}</p>
              <p className="text-xs text-[#7891ad]">{item.sector}</p>
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#d9e9ff]">{item.company}</p>
              <p className="truncate text-xs font-semibold text-[#8ca0b8]">{item.why}</p>
              <p className="text-[0.64rem] font-bold text-[#7891ad]">
                VOL: <span className="text-[#d9e9ff]">{item.vol}K</span>{" "}
                <span className="text-[#d2a96b]">{item.avg}hr avg</span>
              </p>
            </div>
            <SparklineChart
              data={item.points.map((value, i) => ({ label: String(i + 1), value }))}
              trend={item.trend}
              className="h-8 w-24"
            />
            <p className={cn("text-right text-sm font-black", item.trend === "up" ? "text-[#63cfa8]" : "text-[#c9877a]")}>
              {item.change}
            </p>
            <span className="grid h-6 w-6 place-items-center rounded border border-[rgba(86,126,176,0.18)] text-[#7891ad]">
              ·
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ManualScreenCard({ onOpenScreener }: { onOpenScreener: () => void }) {
  return (
    <section className="rounded-[1rem] border border-[rgba(86,126,176,0.18)] bg-[var(--surface-raised)] p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-black uppercase tracking-[0.04em]">OR, Screen Manually</h2>
        <SampleBadge />
      </div>
      <p className="mt-1 text-sm font-semibold text-[#7891ad]">
        Build your own screen with our deep filter library.
      </p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {quickScreens.map(([label, count, icon]) => (
          <div key={label} className="rounded-[0.75rem] border border-[rgba(86,126,176,0.18)] bg-[#07111f]/58 px-3 py-3">
            <p className="text-sm font-black text-[#d9e9ff]">
              {icon} {label}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#7891ad]">{count}</p>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onOpenScreener}
        className="mt-4 min-h-11 w-full rounded-[0.7rem] bg-[linear-gradient(90deg,#4f9bff,#a98bff)] text-sm font-black text-white"
      >
        Open full screener →
      </button>
    </section>
  );
}

function ScreenerTab() {
  return (
    <div className="mt-5 space-y-5">
      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(26rem,0.9fr)] lg:items-end">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#72c7be]">
              EXPLORE / SCREENER
            </p>
            <span className="text-xs font-bold text-[#7891ad]">
              · Universe: {UNIVERSE_SIZE} stocks · refreshed 2m ago
            </span>
            <SampleBadge />
          </div>
          <h1 className="mt-2 font-serif text-[2.4rem] leading-none sm:text-[3.4rem]">
            Find stocks that <span className="italic text-[#8B84C7]">fit your thesis.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[#8ca0b8]">
            Filter the whole market by anything that matters, and let ALQIS score
            every match for your portfolio and style.
          </p>
        </div>
        <div className="rounded-[1rem] border border-[rgba(86,126,176,0.18)] bg-[var(--surface-raised)] p-4">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-[#5aa9ff]">
            + Ask ALQIS to screen
          </p>
          <div className="mt-3 flex gap-2">
            <div className="flex min-h-11 flex-1 items-center rounded-[0.65rem] border border-[rgba(86,126,176,0.18)] bg-[#07111f]/68 px-3 text-sm font-semibold text-[#7891ad]">
              Describe what you&apos;re looking for...
            </div>
            <button type="button" disabled className="rounded-[0.65rem] bg-[#2c3a54] px-4 text-sm font-black text-[#d9e9ff]">
              Screen
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {quickScreenPills.map((pill) => (
              <span key={pill} className="rounded-full bg-[#12243d] px-3 py-1 text-xs font-bold text-[#91a9c6]">
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[17rem_minmax(0,1fr)]">
        <FilterPanel />
        <ResultsTable />
      </div>
    </div>
  );
}

function FilterPanel() {
  return (
    <aside className="rounded-[1rem] border border-[rgba(86,126,176,0.18)] bg-[var(--surface-raised)] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-black uppercase tracking-[0.12em]">Filters</p>
          <span className="rounded bg-[#123d73] px-2 py-1 text-xs font-black text-[#8bc9ff]">
            34 match
          </span>
        </div>
        <SampleBadge />
      </div>
      {filterSections.map((section) => (
        <details key={section.title} open className="mt-4">
          <summary className="cursor-default list-none text-sm font-black">{section.title}</summary>
          <div className="mt-2 flex flex-wrap gap-2">
            {section.options.map((option) => (
              <span key={option} className="rounded bg-[#142238] px-2 py-1 text-[0.68rem] font-bold text-[#91a9c6]">
                {option}
              </span>
            ))}
          </div>
        </details>
      ))}
      <div className="mt-4 space-y-4">
        {ranges.map(([label, min, max]) => (
          <div key={label}>
            <div className="flex justify-between gap-3 text-xs font-bold text-[#91a9c6]">
              <span>{label}</span>
              <span>
                {min} — {max}
              </span>
            </div>
            <div className="relative mt-3 h-2 rounded-full bg-[#20314b]">
              <span className="absolute inset-x-0 top-0 h-2 rounded-full bg-[#4f9bff]" />
              <span className="absolute -left-0.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_3px_rgba(79,155,255,0.22)]" />
              <span className="absolute -right-0.5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_3px_rgba(79,155,255,0.22)]" />
            </div>
          </div>
        ))}
      </div>
      <button type="button" disabled className="mt-5 inline-flex min-h-9 items-center gap-2 rounded-[0.65rem] border border-[rgba(86,126,176,0.2)] px-3 text-sm font-black text-[#91a9c6]">
        <RotateCcw className="h-4 w-4" />
        Reset
      </button>
    </aside>
  );
}

function ResultsTable() {
  return (
    <section className="overflow-hidden rounded-[1rem] border border-[rgba(86,126,176,0.18)] bg-[var(--surface-raised)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(86,126,176,0.16)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-[0.6rem] bg-[#07111f]/78 px-3 py-2 text-sm font-black">
            <SlidersHorizontal className="h-4 w-4 text-[#72c7be]" />
            Filters
          </span>
          <p className="text-2xl font-black">
            34 <span className="text-sm text-[#7891ad]">matches of {UNIVERSE_SIZE}</span>
          </p>
          <p className="text-sm font-semibold text-[#7891ad]">
            No filters active — showing entire universe.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" disabled className="rounded-[0.65rem] border border-[rgba(86,126,176,0.2)] px-3 py-2 text-xs font-black text-[#91a9c6]">
            Reset
          </button>
          <button type="button" disabled className="rounded-[0.65rem] bg-[#123d73] px-3 py-2 text-xs font-black text-[#bde9ff]">
            + Save screen
          </button>
        </div>
      </div>
      <div className="px-4 py-2">
        <SampleBadge label="Sample data - live screening available when provider data is connected." />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[58rem] border-collapse text-left text-sm">
          <thead className="bg-[#07111f]/66 text-[0.62rem] uppercase tracking-[0.16em] text-[#7891ad]">
            <tr>
              {["", "Ticker", "Sector", "Cap", "Price", "P/E", "Growth", "Div", "B", "1M", "YTD", "ALQIS ▼", ""].map((head) => (
                <th key={head || "check"} className="px-3 py-3 font-black">
                  {head || " "}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(86,126,176,0.12)]">
            {screenerRows.map((row) => {
              const [ticker, company, sector, cap, price, pe, growth, div, beta, oneMonth, ytd, score] = row;
              const isDown = String(oneMonth).startsWith("-");

              return (
                <tr key={ticker} className="hover:bg-[#102033]/42">
                  <td className="px-3 py-3">
                    <span className="block h-4 w-4 rounded border border-[#c7d5e8] bg-white" />
                  </td>
                  <td className="px-3 py-3">
                    <p className="font-black text-[#f4f8ff]">{ticker}</p>
                    <p className="text-xs text-[#7891ad]">{company}</p>
                  </td>
                  <td className="px-3 py-3">
                    <span className="rounded bg-[#123d73]/64 px-2 py-1 text-xs font-black text-[#8be8dd]">
                      {sector}
                    </span>
                  </td>
                  {[cap, price, pe, growth, div, beta, oneMonth, ytd].map((value, index) => (
                    <td
                      key={`${ticker}-${index}`}
                      className={cn(
                        "px-3 py-3 font-black",
                        index === 6 && (isDown ? "text-[#c9877a]" : "text-[#63cfa8]"),
                        index === 7 && "text-[#63cfa8]"
                      )}
                      data-numeric
                    >
                      {value}
                    </td>
                  ))}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-14 rounded-full bg-[#253248]">
                        <span
                          className="block h-full rounded-full bg-[#8B84C7]"
                          style={{ width: `${score}%` }}
                        />
                      </span>
                      <span className="font-black text-[#8B84C7]" data-numeric>
                        {score}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-xs font-black text-[#72c7be]">Explore →</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SectionHeader({
  title,
  copy,
  action,
}: {
  title: string;
  copy: string;
  action: string;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-black">{title}</h2>
          <SampleBadge />
        </div>
        <p className="mt-1 text-sm font-semibold text-[#7891ad]">{copy}</p>
      </div>
      <span className="text-sm font-black text-[#72c7be]">{action}</span>
    </div>
  );
}

function SampleBadge({ label = "Sample data" }: { label?: string }) {
  return (
    <span className="inline-flex w-fit items-center rounded-full border border-[#72c7be]/24 bg-[#72c7be]/8 px-2.5 py-1 text-[0.65rem] font-black text-[#8be8dd]">
      {label}
    </span>
  );
}

function TagPill({ tone }: { tone: TagTone }) {
  return (
    <span className={cn("rounded px-2 py-1 text-[0.58rem] font-black uppercase tracking-[0.12em]", tagPillClass(tone))}>
      {tone}
    </span>
  );
}

function tagPillClass(tone: TagTone) {
  if (tone === "hot") return "bg-[#72c7be]/16 text-[#72c7be]";
  if (tone === "defensive") return "bg-[#5aa9ff]/16 text-[#8bc9ff]";
  if (tone === "risky") return "bg-[#c9877a]/18 text-[#f0a79d]";
  if (tone === "contrarian") return "bg-[#d2a96b]/18 text-[#d2a96b]";
  if (tone === "volatile") return "bg-[#dc7b55]/20 text-[#ff9f75]";
  return "bg-[#72c7be]/10 text-[#8be8dd]";
}

function tagCardClass(tone: TagTone) {
  if (tone === "hot") return "border-[#72c7be]/26 bg-[#10243a]";
  if (tone === "defensive") return "border-[#5aa9ff]/22 bg-[#0d1d31]";
  if (tone === "risky") return "border-[#c9877a]/22 bg-[#1c1832]";
  if (tone === "contrarian") return "border-[#d2a96b]/22 bg-[#211c16]";
  if (tone === "volatile") return "border-[#dc7b55]/22 bg-[#211814]";
  return "border-[#72c7be]/18 bg-[#101b2e]";
}
