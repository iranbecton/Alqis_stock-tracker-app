"use client";

import { useEffect, useState } from "react";
import { Search, Sparkles } from "lucide-react";
import { Disclaimer } from "@/components/ui/disclaimer";
import { ConfidenceDot } from "@/components/ui/confidence-dot";
import { cn } from "@/lib/utils";

type ExploreTab = "discovery" | "screener";
type TagTone = "hot" | "defensive" | "risky" | "contrarian" | "volatile" | "cyclical";

type ApiIdea = {
  rank: number;
  ticker: string;
  sector: string;
  angle: string | null;
  angleData?: AngleResult | null;
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
    fallback: boolean;
  };
};

type IdeasResponse = {
  status: "ok";
  ideas: ApiIdea[];
  generatedAt: string;
  fallback: boolean;
  cacheStatus: "hit" | "miss";
  error?: string;
  disclaimer?: string;
};

type AngleResult = {
  hook: string;
  reason: string;
  confidence: {
    score: number;
    band: "A" | "B" | "C" | "D";
    label: string;
  };
  generatedAt: string;
};

const heroChips = [
  "Cheap profitable tech under $50B",
  "Quality dividends with low beta",
  "AI plays I don't already own",
  "What's the best AI stock to add?",
];

const baskets = [
  {
    name: "AI Infrastructure",
    tag: "hot" as const,
    icon: "*",
    tickers: ["NVDA", "AMD", "AVGO", "TSM", "ASML"],
    thesis: "From fab tools to accelerator designers.",
    more: 3,
    performance: "+28.4%",
    match: 88,
  },
  {
    name: "Quality Dividends",
    tag: "defensive" as const,
    icon: "$",
    tickers: ["JNJ", "PG", "KO", "VZ", "PEP"],
    thesis: "Reliable cash return with low volatility.",
    more: 4,
    performance: "+8.2%",
    match: 72,
  },
  {
    name: "EV & Future Mobility",
    tag: "risky" as const,
    icon: "+",
    tickers: ["TSLA", "GM", "UBER", "LCID", "F"],
    thesis: "Beyond Tesla through the economic chain.",
    more: 6,
    performance: "-14.8%",
    match: 48,
  },
  {
    name: "Deep Value",
    tag: "contrarian" as const,
    icon: "%",
    tickers: ["JPM", "BAC", "WFC", "V", "MA"],
    thesis: "Low multiples, real earnings, unloved.",
    more: 2,
    performance: "+4.1%",
    match: 64,
  },
  {
    name: "Reopening Trades",
    tag: "cyclical" as const,
    icon: "^",
    tickers: ["ABNB", "BKNG", "UBER", "DIS", "NCLH"],
    thesis: "Travel, hospitality, and services.",
    more: 5,
    performance: "+12.4%",
    match: 71,
  },
  {
    name: "Crypto-Adjacent",
    tag: "volatile" as const,
    icon: "B",
    tickers: ["COIN", "MSTR", "MARA", "RIOT", "SQ"],
    thesis: "Equity exposure to digital assets.",
    more: 4,
    performance: "+52.4%",
    match: 56,
  },
  {
    name: "Defensive Anchor",
    tag: "defensive" as const,
    icon: "#",
    tickers: ["JNJ", "PG", "KO", "V", "PFE"],
    thesis: "Recession-resistant, steady margins.",
    more: 3,
    performance: "+4.2%",
    match: 68,
  },
  {
    name: "Semiconductors",
    tag: "cyclical" as const,
    icon: "~",
    tickers: ["NVDA", "AMD", "AVGO", "TSM", "ASML"],
    thesis: "From fab tools to designers.",
    more: 2,
    performance: "+24.2%",
    match: 84,
  },
];

export function ExploreShell({
  initialIdeasResponse = null,
  firstName = "you",
}: {
  initialIdeasResponse?: IdeasResponse | null;
  firstName?: string;
}) {
  const [activeTab, setActiveTab] = useState<ExploreTab>("discovery");

  return (
    <div className="relative z-10 mx-auto w-full max-w-[96rem] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabSwitch activeTab={activeTab} onChange={setActiveTab} />
        <div className="flex items-center gap-2 text-[0.72rem] font-bold text-[#7891ad]">
          <span className="h-2 w-2 rounded-full bg-[#63cfa8]" />
          Universe: 103 stocks
          <span aria-hidden>·</span>
          refreshed 2m ago
          <SampleBadge label="Provider context" />
        </div>
      </div>

      {activeTab === "discovery" ? (
        <ExploreIdeasFeed
          firstName={firstName}
          initialResponse={initialIdeasResponse}
        />
      ) : (
        <ScreenerPreview />
      )}

      <Disclaimer
        variant="banner"
        className="mt-8 border-[rgba(86,126,176,0.18)] bg-[rgba(12,22,38,0.72)]"
      />
    </div>
  );
}

function ExploreIdeasFeed({
  firstName,
  initialResponse,
}: {
  firstName: string;
  initialResponse: IdeasResponse | null;
}) {
  const [state, setState] = useState<{
    loading: boolean;
    response: IdeasResponse | null;
    error: string | null;
  }>({
    loading: !initialResponse,
    response: initialResponse,
    error: null,
  });

  useEffect(() => {
    if (initialResponse) {
      return;
    }

    let active = true;

    async function loadIdeas() {
      try {
        const response = await fetch("/api/explore/ideas", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Explore ideas unavailable.");
        }

        const payload = (await response.json()) as IdeasResponse;

        if (active) {
          setState({ loading: false, response: payload, error: payload.error ?? null });
        }
      } catch {
        if (active) {
          setState({
            loading: false,
            response: null,
            error: "Explore ideas are temporarily unavailable.",
          });
        }
      }
    }

    loadIdeas();

    return () => {
      active = false;
    };
  }, [initialResponse]);

  if (state.loading) {
    return (
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-[1rem] border border-[rgba(86,126,176,0.18)] bg-[var(--surface-raised)]"
          />
        ))}
      </section>
    );
  }

  const ideas = state.response?.ideas ?? [];
  const ideaCount = ideas.length || 5;

  return (
    <section className="mt-6 space-y-8">
      <ExploreHero firstName={firstName} ideaCount={ideaCount} />

      <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black">
                {ideaCount} ideas for {firstName} today
              </h2>
              <SampleBadge label="Provider context" />
            </div>
            <p className="mt-1 text-sm font-semibold text-[#7891ad]">
              Personalized by ALQIS · Refreshed daily, or whenever your portfolio shifts meaningfully.
            </p>
          </div>
          <span className="text-sm font-black text-[#72c7be]">Why these →</span>
        </div>
        {state.response?.fallback ? (
          <p className="mt-3 rounded-[0.75rem] border border-[#8B84C7]/22 bg-[#8B84C7]/10 px-3 py-2 text-sm text-[#c9c4ff]">
            Based on market signals only - add holdings for personalized fit
          </p>
        ) : null}
        {state.error ? (
          <p className="mt-3 rounded-[0.75rem] border border-[#d2a96b]/24 bg-[#d2a96b]/10 px-3 py-2 text-sm text-[#d2a96b]">
            {state.error}
          </p>
        ) : null}

        {ideas.length ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-6">
            {ideas.map((idea, index) => (
              <ProductionIdeaCard
                key={idea.ticker}
                idea={idea}
                className={index < 3 ? "lg:col-span-2" : "lg:col-span-3"}
              />
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-[1rem] border border-[rgba(86,126,176,0.18)] bg-[var(--surface-raised)] p-6 text-sm text-[#91a9c6]">
            No Explore ideas are available yet.
          </div>
        )}
      </section>

      <ThemedBaskets />
    </section>
  );
}

function ExploreHero({
  firstName,
  ideaCount,
}: {
  firstName: string;
  ideaCount: number;
}) {
  const displayName = firstName === "you" ? "your" : `${firstName}'s`;

  return (
    <section className="overflow-hidden rounded-[1.25rem] border border-[rgba(86,126,176,0.18)] bg-[radial-gradient(ellipse_at_0%_0%,rgba(114,199,190,0.18),transparent_34rem),linear-gradient(135deg,var(--surface-floating),#101936_78%)] p-5 shadow-[0_26px_80px_rgba(0,0,0,0.42)] sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[0.72rem] font-black uppercase tracking-[0.18em] text-[#7891ad]">
          EXPLORE / LIVE · UPDATED FOR {displayName.toUpperCase()} BOOK JUST NOW
        </p>
        <SampleBadge label="Provider context" />
      </div>
      <h1 className="mt-4 max-w-5xl font-serif text-[2.3rem] leading-none text-[#f4f8ff] sm:text-[3.7rem]">
        Hey {firstName} — I&apos;ve found{" "}
        <span className="italic text-[#8B84C7]">{ideaCount} stocks</span> for your review today.
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
        {heroChips.map((chip) => (
          <span
            key={chip}
            className="cursor-default rounded-full border border-[#72c7be]/24 bg-[#72c7be]/7 px-3 py-1.5 text-xs font-bold text-[#a9bad0]"
          >
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}

function ProductionIdeaCard({
  idea,
  className,
}: {
  idea: ApiIdea;
  className?: string;
}) {
  const change = idea.fundamentals?.oneMonthChange;
  const [angle, setAngle] = useState<AngleResult | null>(
    idea.angleData ?? null
  );
  const [angleStatus, setAngleStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");

  async function loadAngle() {
    setAngleStatus("loading");

    try {
      const response = await fetch("/api/explore/angle", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          ticker: idea.ticker,
          fitScore: idea.fitScore.score,
        }),
      });

      if (!response.ok) {
        throw new Error("Angle unavailable.");
      }

      const payload = (await response.json()) as {
        angle?: AngleResult;
      };

      if (!payload.angle) {
        throw new Error("Angle unavailable.");
      }

      setAngle(payload.angle);
      setAngleStatus("idle");
    } catch {
      setAngleStatus("error");
    }
  }

  return (
    <article
      className={cn(
        "flex min-h-[27rem] flex-col rounded-[1rem] border border-[rgba(86,126,176,0.18)] bg-[var(--surface-raised)] p-4 shadow-[0_18px_50px_rgba(0,0,0,0.25)]",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#356baa] text-sm font-black text-white">
            {idea.rank}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xl font-black text-[#f4f8ff]">{idea.ticker}</h3>
              <span className="rounded bg-[#07111f]/76 px-2 py-1 text-[0.62rem] font-black text-[#d9e9ff]">
                {idea.ticker}
              </span>
              <SampleBadge label="Provider context" />
            </div>
            <p className="mt-1 text-sm font-black text-[#d9e9ff]" data-numeric>
              {formatMarketCap(idea.fundamentals?.marketCap)}{" "}
              <span className={change && change < 0 ? "text-[#c9877a]" : "text-[#63cfa8]"}>
                {change && change < 0 ? "▼" : "▲"} {formatPercent(change)} 1M
              </span>
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded bg-[#123d73]/70 px-2 py-1 text-[0.62rem] font-black text-[#8be8dd]">
            {abbreviateSector(idea.sector)}
          </span>
          <MiniSparkline trend={change && change < 0 ? "down" : "up"} />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm font-black">
          <span className="text-[0.68rem] uppercase tracking-[0.18em] text-[#5aa9ff]">
            ALQIS FIT
          </span>
          <span className="text-[#8B84C7]">
            {idea.fitScore.score}/100
          </span>
        </div>
        <div className="mt-2 h-2 rounded-full bg-[#243247]">
          <span
            className="block h-full rounded-full bg-[#8B84C7]"
            style={{ width: `${idea.fitScore.score}%` }}
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <Metric label="P/E" value={formatNumber(idea.fundamentals?.peRatio)} />
        <Metric label="DIV" value={formatPercent(idea.fundamentals?.dividendYield)} />
        <Metric label="BETA" value={formatNumber(idea.fundamentals?.beta)} />
      </div>

      <AnglePanel
        angle={angle}
        status={angleStatus}
        onLoad={loadAngle}
      />

      <details className="mt-auto pt-4 text-sm">
        <summary className="cursor-pointer font-black text-[#72c7be]">
          Why this score
        </summary>
        <ul className="mt-2 space-y-1 text-[#91a9c6]">
          {idea.fitScore.topFactors.map((factor) => (
            <li key={factor}>{factor}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}

function AnglePanel({
  angle,
  status,
  onLoad,
}: {
  angle: AngleResult | null;
  status: "idle" | "loading" | "error";
  onLoad: () => void;
}) {
  if (status === "loading") {
    return (
      <div className="mt-4 rounded-[0.85rem] border border-[#8B84C7]/20 bg-[#8B84C7]/8 p-3">
        <div className="h-4 w-40 animate-pulse rounded bg-[#8B84C7]/28" />
        <div className="mt-3 h-3 w-full animate-pulse rounded bg-[#8B84C7]/18" />
        <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-[#8B84C7]/18" />
      </div>
    );
  }

  if (angle) {
    return (
      <section className="mt-4 rounded-[0.85rem] border border-[#8B84C7]/18 border-l-2 border-l-[rgba(139,132,199,0.3)] bg-[#07111f]/82 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <ConfidenceDot
            band={angle.confidence.band}
            showLabel={false}
            className="[&_.bg-accent-ai]:!bg-[#8B84C7] [&_.bg-accent]:!bg-[#8B84C7] [&_.bg-warn]:!bg-[#8B84C7] [&_.bg-loss]:!bg-[#8B84C7]"
          />
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[#8B84C7]">
            {angle.confidence.label}
          </span>
        </div>
        <h3 className="mt-3 font-serif text-xl font-medium leading-7 text-[#F4EEE2]">
          {angle.hook}
        </h3>
        <p className="mt-2 text-sm font-semibold leading-6 text-[#F4EEE2]/70">
          {angle.reason}
        </p>
        <p className="mt-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[#F4EEE2]/45">
          Informational only. Not investment advice.
        </p>
      </section>
    );
  }

  if (status === "error") {
    return (
      <div className="mt-4 rounded-[0.85rem] border border-[rgba(86,126,176,0.18)] bg-[#07111f]/58 p-3 text-sm font-semibold text-[#7891ad]">
        Angle unavailable
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onLoad}
      className="mt-4 min-h-10 rounded-[0.7rem] border border-[#8B84C7]/32 bg-[#8B84C7]/10 px-3 text-sm font-black text-[#c9c4ff]"
    >
      Get The Angle
    </button>
  );
}

function ThemedBaskets() {
  return (
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
  );
}

function BasketCard({ basket }: { basket: (typeof baskets)[number] }) {
  return (
    <article className={cn("min-h-56 rounded-[1rem] border p-4", tagCardClass(basket.tag))}>
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#72c7be]/16 text-xl font-black text-[#d9e9ff]">
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

function ScreenerPreview() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <p className="text-sm uppercase tracking-widest text-[var(--ink-muted)]">
        Power Screener
      </p>
      <p className="text-2xl font-semibold text-[#F4EEE2]">Coming soon</p>
      <p className="text-sm text-[var(--ink-subtle)] max-w-xs text-center">
        Build your own screen with deep filters. Available in a future update.
      </p>
    </div>
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
            ? "bg-[#123d73] text-[#bde9ff]"
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
            ? "bg-[#123d73] text-[#bde9ff]"
            : "text-[#91a9c6] hover:text-[#f4f8ff]"
        )}
      >
        <Search className="h-4 w-4 text-[#72c7be]" />
        Power Screener
      </button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[0.7rem] border border-[rgba(86,126,176,0.18)] bg-[#07111f]/66 px-3 py-2">
      <p className="text-[0.58rem] font-black uppercase tracking-[0.12em] text-[#7189a8]">
        {label}
      </p>
      <p className="mt-1 font-black text-[#f4f8ff]">{value}</p>
    </div>
  );
}

function MiniSparkline({ trend }: { trend: "up" | "down" }) {
  const points =
    trend === "down"
      ? "2,12 12,10 22,13 32,8 42,9 52,5 62,7"
      : "2,14 12,12 22,11 32,8 42,9 52,5 62,3";

  return (
    <svg
      aria-hidden
      className="h-10 w-24"
      viewBox="0 0 64 18"
      fill="none"
    >
      <polyline
        points={points}
        stroke="#F4EEE2"
        strokeOpacity="0.2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

function formatMarketCap(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "Provider metrics";
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}T cap`;
  }

  return `${value.toFixed(0)}B cap`;
}

function formatNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value)
    ? value.toFixed(value > 10 ? 0 : 2)
    : "-";
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "-";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}
