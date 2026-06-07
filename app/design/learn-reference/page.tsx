import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  Building2,
  ChevronRight,
  Clock,
  FileText,
  Landmark,
  LineChart,
  Newspaper,
  Percent,
  PieChart,
  Search,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { SearchInput } from "@/components/ui/input";

const navItems = ["Today", "Watchlist", "Portfolio", "Explore", "Alerts", "Learn"];

const justInTimeCards = [
  {
    ticker: "NVDA",
    direction: "up",
    delta: "4.32%",
    title: "NVDA gapped +4.32% on earnings",
    concept: "Earnings beats",
    readTime: "4 min",
    reason:
      "A result above consensus can shift how investors model revenue, margins, and future estimates.",
  },
  {
    ticker: "TNX",
    direction: "down",
    delta: "0.94%",
    title: "10Y yield dropped to 4.21%",
    concept: "Yield curve",
    readTime: "5 min",
    reason:
      "Lower long-term yields can affect discount rates, growth-stock multiples, and bond math.",
  },
  {
    ticker: "VIX",
    direction: "down",
    delta: "3.12%",
    title: "VIX fell to 16 — fear is fading",
    concept: "Volatility",
    readTime: "3 min",
    reason:
      "The VIX tracks expected index volatility; lower readings often indicate calmer option pricing.",
  },
  {
    ticker: "AAPL",
    direction: "down",
    delta: "1.14%",
    title: "AAPL trading at 28x — above its 24x average",
    concept: "Forward P/E",
    readTime: "4 min",
    reason:
      "Comparing current multiples with history helps frame how expectations are being reflected.",
  },
];

const conceptTables = [
  {
    title: "P/E ratio",
    subtitle: "What investors are paying per $1 of profit",
    rows: [
      ["NVDA", "32×", "priced for AI growth", "gain"],
      ["AAPL", "28×", "premium to 5y avg", "info"],
      ["TSLA", "65×", "future-anchored valuation", "loss"],
      ["T", "18×", "mature, lower-growth", "info"],
    ],
  },
  {
    title: "Dividend yield",
    subtitle: "Income per dollar today",
    rows: [
      ["T", "6.8%", "higher income", "gain"],
      ["VZ", "6.5%", "telecom payout", "gain"],
      ["KO", "3.0%", "steady dividend grower", "info"],
      ["AAPL", "0.5%", "minimal — repurchases instead", "loss"],
    ],
  },
  {
    title: "Beta",
    subtitle: "How much each stock moves vs the market",
    rows: [
      ["TSLA", "2.3", "moves much more than market", "loss"],
      ["NVDA", "1.6", "~60% more than SPY", "loss"],
      ["SPY", "1.0", "the market itself", "info"],
      ["KO", "0.6", "lower-volatility profile", "gain"],
    ],
  },
];

const topics = [
  ["Stock fundamentals", "12 lessons", "Beginner OK", BarChart3, "gain", "linear-gradient(135deg, #1e5fa8, #2d8fd4)"],
  ["How to read a chart", "6 lessons", "Beginner OK", LineChart, "info", "linear-gradient(135deg, #1a7a3a, #28b857)"],
  ["Earnings", "9 lessons", "Beginner OK", WalletCards, "warn", "linear-gradient(135deg, #b85c10, #e07820)"],
  ["Sectors & themes", "7 lessons", "", Building2, "warn", "linear-gradient(135deg, #5a2d9a, #7c45c8)"],
  ["Macro & Fed", "10 lessons", "Beginner OK", Landmark, "loss", "linear-gradient(135deg, #0e7a7a, #18b8b8)"],
  ["Risk & diversification", "8 lessons", "Beginner OK", PieChart, "gain", "linear-gradient(135deg, #a82020, #d43030)"],
  ["Behavioral finance", "6 lessons", "", Zap, "loss", "linear-gradient(135deg, #1a4a8a, #2868c0)"],
  ["Options basics", "8 lessons", "", TargetIcon, "info", "linear-gradient(135deg, #7a7010, #b8a818)"],
  ["Tax basics", "5 lessons", "", FileText, "info", "linear-gradient(135deg, #1a6a2a, #28a040)"],
] as const;

const glossaryChips = [
  "P/E ratio",
  "EPS",
  "Market cap",
  "Dividend yield",
  "Beta",
  "Yield curve",
  "Inflation",
  "Federal Reserve",
];

const explainers = [
  ["STOCK FUNDAMENTALS", "What's a P/E ratio, really?", "What investors are paying per dollar of profit.", "4 min read", "Beginner", BarChart3, "info"],
  ["CHARTS", "How to read a stock chart", "Candles, volume, support, resistance — the vocabulary in 5 minutes.", "5 min read", "Beginner", LineChart, "gain"],
  ["EARNINGS", "Earnings reports without the jargon", "Revenue, EPS, margins, and guidance in plain English.", "6 min read", "Beginner", WalletCards, "warn"],
  ["MACRO", "Why the Fed moves markets", "Rates, inflation, and the central bank calendar.", "7 min read", "Intermediate", Landmark, "loss"],
  ["SECTORS", "The 11 sectors, briefly", "Technology, financials, energy — how the market groups companies.", "3 min read", "Beginner", Building2, "warn"],
  ["RISK", "Why diversification isn't optional", "Why one stock is rarely the whole story.", "5 min read", "Beginner", PieChart, "gain"],
  ["BEHAVIORAL", "The mistakes everyone makes", "Common pattern-recognition errors in market decisions.", "8 min read", "Intermediate", Sparkles, "loss"],
  ["OPTIONS", "Options basics: calls and puts", "Core option vocabulary without the noise.", "6 min read", "Intermediate", TargetIcon, "info"],
  ["TAX", "Taxes on stocks, the simple version", "Short-term vs long-term treatment and wash-sale basics.", "5 min read", "Beginner", FileText, "info"],
  ["EARNINGS", "How to read an earnings call", "Revenue tone, margin tone, and question themes.", "7 min read", "Intermediate", Newspaper, "info"],
  ["RISK", "Position sizing — how much to commit", "How concentration changes the shape of risk.", "6 min read", "Intermediate", PieChart, "warn"],
  ["MACRO", "Inflation, in plain English", "Prices, rates, and why markets care.", "4 min read", "Beginner", Landmark, "loss"],
] as const;

const raisedSurface: CSSProperties = {
  background:
    "radial-gradient(ellipse at 14% 0%, color-mix(in srgb, var(--accent) 7%, transparent), transparent 36%), var(--surface-raised)",
  border: "1px solid color-mix(in srgb, var(--border-strong) 70%, transparent)",
  boxShadow:
    "0 16px 40px color-mix(in srgb, black 42%, transparent), inset 0 1px 0 rgba(255,255,255,0.06)",
};

const groundedSurface: CSSProperties = {
  background: "var(--surface-grounded)",
  border: "1px solid color-mix(in srgb, var(--border) 82%, transparent)",
  boxShadow: "0 6px 16px color-mix(in srgb, black 24%, transparent)",
};

const featureCardSurface: CSSProperties = {
  background:
    "radial-gradient(ellipse at 18% 0%, color-mix(in srgb, var(--accent) 5%, transparent), transparent 44%), color-mix(in srgb, var(--surface-raised) 78%, transparent)",
  backdropFilter: "blur(18px) saturate(118%)",
  border: "1px solid color-mix(in srgb, var(--accent) 14%, rgba(255,255,255,0.05))",
  borderRadius: "12px",
  boxShadow:
    "var(--highlight-top), 0 14px 38px 0 rgba(2,6,12,0.42), inset 0 1px 0 0 rgba(255,255,255,0.035)",
};

const toolSurface: CSSProperties = {
  background:
    "radial-gradient(ellipse at 12% 0%, color-mix(in srgb, var(--accent) 6%, transparent), transparent 44%), radial-gradient(ellipse at 100% 0%, color-mix(in srgb, var(--info) 4%, transparent), transparent 46%), color-mix(in srgb, var(--surface-raised) 74%, transparent)",
  backdropFilter: "blur(20px) saturate(116%)",
  border: "1px solid color-mix(in srgb, var(--accent) 16%, rgba(255,255,255,0.045))",
  borderRadius: "18px",
  boxShadow:
    "var(--highlight-top), 0 18px 46px rgba(2,6,12,0.42), 0 0 26px color-mix(in srgb, var(--accent) 3%, transparent)",
};

export default function LearnReferencePage() {
  return (
    <main className="min-h-dvh overflow-x-hidden bg-[var(--bg)] text-[var(--ink)]">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 20% 0%, rgba(114, 199, 190, 0.06) 0%, transparent 60%), radial-gradient(50% 40% at 85% 5%, rgba(125, 166, 217, 0.05) 0%, transparent 55%), radial-gradient(120% 80% at 50% 120%, rgba(0, 0, 0, 0.4) 0%, transparent 50%), var(--canvas, #070F14)",
        }}
      />
      <style>{`
        .learn-topic-card:hover {
          border-color: rgba(114, 199, 190, 0.35) !important;
          transform: translateY(-2px);
        }
      `}</style>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_7%,color-mix(in_srgb,var(--info)_14%,transparent),transparent_34rem),radial-gradient(ellipse_at_76%_22%,color-mix(in_srgb,var(--accent)_9%,transparent),transparent_34rem),linear-gradient(180deg,var(--bg),color-mix(in_srgb,var(--bg)_88%,black_12%)_58%,color-mix(in_srgb,var(--bg)_64%,black_36%))]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(125,166,217,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(125,166,217,0.008)_1px,transparent_1px)] bg-[size:110px_110px] opacity-40 [mask-image:linear-gradient(180deg,black,transparent_72%)]" />
      <div className="relative z-10">
        <TopNav />
        <section className="mx-auto w-full max-w-[82rem] px-4 pb-12 pt-8 sm:px-6">
          <Hero />
          <ResumeCard />
          <JustInTime />
          <InTheWild />
          <LearnByTopic />
          <Glossary />
          <FreshToday />
          <MoreExplainers />
          <FooterDisclaimer />
        </section>
      </div>
    </main>
  );
}

function TopNav() {
  return (
    <header className="border-b border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[color-mix(in_srgb,var(--bg)_88%,black_12%)] backdrop-blur-xl">
      <div className="mx-auto w-full max-w-[82rem] px-4 sm:px-6">
        <div className="relative flex h-8 items-center justify-between text-[0.62rem] font-black uppercase tracking-[0.22em] text-[var(--ink-subtle)]">
          <p>
            VOL. 1 <span className="mx-2 text-[var(--border-strong)]">/</span> ISSUE 274
          </p>
          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg border border-[color-mix(in_srgb,var(--info)_32%,transparent)] bg-[color-mix(in_srgb,var(--info)_14%,var(--surface)_86%)] text-[0.7rem] font-black text-[var(--ink)] shadow-[0_0_16px_color-mix(in_srgb,var(--info)_9%,transparent)]">
              A
            </span>
            <span className="text-sm font-black normal-case tracking-tight text-[var(--ink)]">ALQIS</span>
          </div>
          <p className="hidden sm:block">
            TUE · APR 22 · 2026 <span className="mx-2 text-[var(--border-strong)]">/</span> EDITION 3
          </p>
        </div>

        <div className="flex flex-col gap-2 border-t border-[color-mix(in_srgb,var(--border)_35%,transparent)] py-2 lg:flex-row lg:items-center">
          <nav className="scrollbar-hide flex gap-1.5 overflow-x-auto" aria-label="Learn prototype navigation">
            {navItems.map((item) => (
              <Link
                href={item === "Learn" ? "/learn" : "/dashboard"}
                key={item}
                className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                  item === "Learn"
                    ? "bg-[color-mix(in_srgb,var(--info)_20%,transparent)] text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "text-[var(--ink-subtle)] hover:bg-[var(--surface)] hover:text-[var(--ink-muted)]"
                }`}
              >
                {item}
              </Link>
            ))}
          </nav>
          <div className="lg:ml-6 lg:flex-1">
            <SearchInput
              placeholder="Search a ticker, ask anything..."
              aria-label="Search"
              trailingIcon={<span className="rounded border border-[var(--border)] px-1.5 py-0.5 text-[0.62rem]">⌘K</span>}
              className="text-xs"
            />
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
            <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_78%,black_22%)] px-3 py-1.5 text-xs font-black">
              <div>
                <p className="text-[0.55rem] uppercase tracking-[0.16em] text-[var(--ink-subtle)]">TODAY</p>
                <p data-numeric>+$2,143</p>
              </div>
              <Sparkline path="M2 18 C12 15 18 13 26 10 C37 6 45 8 58 3" color="var(--gain)" />
              <span className="text-[var(--gain)]" data-numeric>
                +1.52%
              </span>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-lg border border-[color-mix(in_srgb,var(--accent-ai)_34%,transparent)] bg-[color-mix(in_srgb,var(--accent-ai)_18%,var(--surface)_82%)] px-3 py-2 text-xs font-black text-[var(--ink)] shadow-[0_0_18px_color-mix(in_srgb,var(--accent-ai)_14%,transparent)]">
              <Sparkles className="h-3.5 w-3.5" />
              Ask ALQIS
            </button>
            <button className="grid h-8 w-8 place-items-center rounded-full border border-[color-mix(in_srgb,var(--info)_30%,transparent)] bg-[color-mix(in_srgb,var(--info)_12%,var(--surface)_88%)] text-xs font-black">
              A
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="pb-8">
      <p className="eyebrow text-[var(--accent)]">ALQIS · LEARN</p>
      <h1 className="mt-3 max-w-4xl text-[clamp(2.8rem,5vw,4.2rem)] font-extrabold leading-[1.05] tracking-[-0.02em] text-[var(--ink)]">
        Learn the market{" "}
        <span className="font-serif italic font-normal tracking-[-0.04em] text-[var(--accent)]">
          as it happens.
        </span>
      </h1>
      <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-[var(--ink-muted)]">
        Concepts anchored to real tickers. Lessons tied to today&apos;s moves. A map of what you know, and what&apos;s still ahead.
      </p>
      <p className="mt-3 text-xs font-semibold text-[var(--ink-subtle)]">
        Educational information only. Not investment, legal, or tax advice.
      </p>
    </section>
  );
}

function ResumeCard() {
  return (
    <section className="mb-10 rounded-2xl p-4 sm:p-5" style={raisedSurface}>
      <div className="grid gap-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
        <div className="grid h-12 w-12 place-items-center rounded-xl border border-[color-mix(in_srgb,var(--accent)_24%,transparent)] bg-[color-mix(in_srgb,var(--accent)_13%,var(--surface)_87%)] text-[var(--accent)]">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <Badge variant="accent" size="sm">Pick up where you left off · this morning</Badge>
          <h2 className="mt-2 font-serif text-2xl italic tracking-[-0.04em] text-[var(--ink)]">
            What&apos;s a P/E ratio, really?
          </h2>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--border)_72%,transparent)]">
              <div className="h-full w-[62%] rounded-full bg-[linear-gradient(90deg,var(--accent),var(--info))]" />
            </div>
            <span className="text-xs font-black text-[var(--ink-subtle)]" data-numeric>
              62% · 4 min
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--ink-subtle)]">Sample — lesson progress not yet connected.</p>
        </div>
        <Button className="bg-[var(--accent)] text-[var(--bg)] hover:bg-[var(--accent-hover)]" size="sm">
          Resume <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </section>
  );
}

function JustInTime() {
  return (
    <Section
      eyebrow="JUST-IN-TIME"
      title="Tied to"
      emphasis="what's moving"
      suffix="right now"
      subtitle="The market just did these four things. Each links to the concept that explains it."
      action={<Badge variant="accent">● Curated · updated daily</Badge>}
    >
      <div className="grid gap-3 lg:grid-cols-4">
        {justInTimeCards.map((card) => (
          <article key={card.ticker} className="p-4" style={featureCardSurface}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-[var(--ink)]">{card.ticker}</span>
                <DeltaChip direction={card.direction as "up" | "down"} value={card.delta} />
              </div>
              <span
                className="rounded-full px-2 py-1 text-[0.58rem] font-black uppercase tracking-[0.14em]"
                style={{
                  border: "1px solid rgba(114, 199, 190, 0.45)",
                  color: "#72c7be",
                }}
              >
                Curated
              </span>
            </div>
            <h3 className="mt-6 text-base font-black text-[var(--ink)]">{card.title}</h3>
            <p className="mt-4 border-l-2 border-[#72c7be] pl-2 text-[0.65rem] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
              + Learn this because
            </p>
            <p className="mt-2 min-h-20 text-sm leading-6 text-[var(--ink-muted)]">{card.reason}</p>
            <div className="mt-4 flex items-center justify-between gap-2">
              <span
                className="rounded-md px-2 py-1 text-xs font-black text-[var(--accent)]"
                style={{
                  background: "var(--surface-floating)",
                  border: "1px solid rgba(114, 199, 190, 0.22)",
                }}
              >
                {card.concept}
              </span>
              <span className="text-xs text-[var(--ink-subtle)]">{card.readTime}</span>
              <Link href="/learn" className="text-xs font-black text-[var(--accent)]">
                Read →
              </Link>
            </div>
          </article>
        ))}
      </div>
      <DataLabel>Sample data — curated examples, not a live market feed.</DataLabel>
    </Section>
  );
}

function InTheWild() {
  return (
    <Section
      eyebrow="IN THE WILD"
      title="The same concepts, in"
      emphasis="real tickers"
      suffix="right now"
      subtitle="Numbers without context are noise. See where every concept actually lives in today's market."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {conceptTables.map((table) => (
          <article key={table.title} className="rounded-2xl p-4" style={groundedSurface}>
            <p className="eyebrow text-[var(--accent)]">Concept — sample</p>
            <h3 className="mt-2 font-serif text-2xl italic tracking-[-0.04em] text-[var(--ink)]">{table.title}</h3>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">{table.subtitle}</p>
            <div className="mt-4 divide-y divide-[var(--border)]">
              {table.rows.map(([ticker, value, context, tone]) => (
                <div key={`${table.title}-${ticker}`} className="grid grid-cols-[3.5rem_4rem_minmax(0,1fr)_auto] items-center gap-3 py-3 text-sm">
                  <span
                    style={{
                      color: "#F4EEE2",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                    }}
                  >
                    {ticker}
                  </span>
                  <span
                    data-numeric
                    style={{
                      color: "#72c7be",
                      fontSize: "0.95rem",
                      fontWeight: 700,
                      opacity: 1,
                    }}
                  >
                    {value}
                  </span>
                  <span style={{ color: "rgba(244, 238, 226, 0.55)" }}>{context}</span>
                  <Dot tone={tone as "gain" | "loss" | "info"} />
                </div>
              ))}
            </div>
            <Link href="/learn" className="mt-4 inline-flex items-center gap-1 text-xs font-black text-[var(--accent)]">
              Open the explainer <ChevronRight className="h-3 w-3" />
            </Link>
          </article>
        ))}
      </div>
      <DataLabel>Sample data — illustrative values, not live quotes.</DataLabel>
    </Section>
  );
}

function LearnByTopic() {
  return (
    <Section
      eyebrow="PATHS"
      title="Learn by"
      emphasis="topic"
      subtitle="Five to ten short lessons each. No quizzes, no streaks, no pressure."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {topics.map(([title, lessons, meta, Icon, , gradient]) => (
          <article key={title} className="learn-topic-card min-h-44 rounded-[14px] p-5" style={topicSurface}>
            <div
              className="grid h-10 w-10 place-items-center rounded-[10px] border border-[rgba(255,255,255,0.12)] text-[var(--ink)] shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_12px_24px_rgba(2,6,12,0.34)]"
              style={{ background: gradient, backgroundImage: gradient }}
            >
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-base font-black text-[var(--ink)]">{title}</h3>
            <p className="mt-2 text-xs font-semibold text-[var(--ink-muted)]">
              {lessons}
              {meta ? <span className="text-[var(--gain)]"> · {meta}</span> : null}
            </p>
            <div className="mt-4 flex gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <span
                  key={index}
                  className="h-2.5 w-2.5 rounded-full border border-[var(--border-strong)] bg-[color-mix(in_srgb,var(--surface-elevated)_72%,var(--ink-subtle)_28%)]"
                />
              ))}
            </div>
          </article>
        ))}
      </div>
      <DataLabel>Progress tracking — coming soon.</DataLabel>
    </Section>
  );
}

function Glossary() {
  return (
    <section className="mb-24">
      <SectionIntro
        eyebrow="GLOSSARY"
        title="What's"
        emphasis="that"
        suffix="mean?"
        description="Look up any finance term. No jargon, no condescension."
        icon={<Search className="h-4 w-4" />}
      />
      <div className="p-4 sm:p-5" style={toolSurface}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--accent)]">Market vocabulary</p>
            <p className="mt-1 text-sm font-semibold text-[var(--ink-muted)]">A fast ALQIS lookup surface for concepts in the page.</p>
          </div>
          <Badge variant="outline">15 terms</Badge>
        </div>
        <SearchInput
          placeholder="Try 'P/E' or 'inflation' or 'yield curve'..."
          trailingIcon={<Badge variant="outline">15 terms</Badge>}
          aria-label="Glossary search"
          className="border-[color-mix(in_srgb,var(--accent)_18%,transparent)] bg-[color-mix(in_srgb,var(--surface-floating)_58%,transparent)] shadow-[0_0_20px_color-mix(in_srgb,var(--accent)_4%,transparent)] backdrop-blur-xl focus-within:border-[color-mix(in_srgb,var(--accent)_62%,transparent)]"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {glossaryChips.map((chip) => (
            <button
              key={chip}
              className="rounded-full border border-[rgba(114,199,190,0.16)] bg-[color-mix(in_srgb,var(--surface-raised)_62%,transparent)] px-3 py-1 text-xs font-semibold tracking-[0.02em] text-[color-mix(in_srgb,var(--ink)_84%,transparent)] backdrop-blur-md transition hover:border-[color-mix(in_srgb,var(--accent)_65%,transparent)] hover:text-[var(--ink)]"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function FreshToday() {
  return (
    <section className="mb-24">
      <div className="mb-5 flex items-end justify-between gap-3">
        <SectionIntro
          eyebrow="FRESH TODAY"
          title="Fresh"
          emphasis="today"
          description="Editorial explainers connected to current market context."
          icon={<Newspaper className="h-4 w-4" />}
          compact
        />
        <h2 className="hidden text-xl font-black text-[var(--ink)]">
          Fresh today <span className="text-sm font-semibold text-[var(--ink-subtle)]">· tied to what&apos;s moving</span>
        </h2>
        <Link href="/learn" className="text-xs font-black text-[var(--accent)]">See all →</Link>
      </div>
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <EditorialCard
          tag="TODAY"
          title="What does the Fed's pause mean for your portfolio?"
          subtitle="Three things that change when the Fed sits still."
          readTime="4 min read"
          icon={<Landmark className="h-5 w-5" />}
          accent="#72c7be"
          contextChips={["Macro", "Market context"]}
        />
        <EditorialCard
          tag="GEOPOLITICS"
          title="The 'China premium' — and what happens when it fades"
          subtitle="Why every US-listed company with China exposure is being repriced."
          readTime="6 min read"
          icon={<Building2 className="h-5 w-5" />}
          accent="#7da6d9"
          contextChips={["Geopolitics", "Market structure"]}
        />
      </div>
    </section>
  );
}

function MoreExplainers() {
  const [featuredExplainer, ...compactExplainers] = explainers;
  const [featuredCategory, featuredTitle, featuredSubtitle, featuredTime, featuredLevel, FeaturedIcon] = featuredExplainer;
  const featuredColor = explainerCategoryColor(featuredCategory);
  const featuredProgressColor = explainerProgressColor(featuredCategory);

  return (
    <section className="mb-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <SectionIntro
          eyebrow="MORE EXPLAINERS"
          title="Build the"
          emphasis="foundation"
          description="A structured shelf of short lessons, organized for fast scanning."
          icon={<BookOpen className="h-4 w-4" />}
          compact
        />
        <div className="flex rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_78%,transparent)] p-1">
          {["ALL", "BEGINNER", "INTERMEDIATE"].map((tab) => (
            <span
              key={tab}
              className={`rounded-lg px-3 py-1.5 text-[0.65rem] font-black tracking-[0.12em] ${
                tab === "ALL" ? "bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--ink)]" : "text-[var(--ink-subtle)]"
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.12fr_2fr]">
        <article className="rounded-2xl p-5" style={toolSurface}>
          <div
            className="grid h-12 w-12 place-items-center rounded-xl"
            style={{
              background: "linear-gradient(135deg, #1e5fa8, #2d8fd4)",
              border: "1px solid color-mix(in srgb, #2d8fd4 28%, transparent)",
              color: "#F4EEE2",
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FeaturedIcon className="h-5 w-5" />
          </div>
          <p className="mt-5 text-[0.68rem] font-bold uppercase tracking-[0.1em]" style={{ color: featuredColor }}>
            Start here · {featuredCategory}
          </p>
          <h3 className="mt-3 font-serif text-3xl italic leading-[1.05] tracking-[-0.04em] text-[var(--ink)]">{featuredTitle}</h3>
          <p className="mt-4 text-sm leading-6 text-[var(--ink-muted)]">{featuredSubtitle}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rounded-full border border-[rgba(114,199,190,0.16)] bg-[color-mix(in_srgb,var(--surface-raised)_62%,transparent)] px-2.5 py-1 text-xs font-black text-[var(--accent)]">
              {featuredTime}
            </span>
            <span className="rounded-full border border-[color-mix(in_srgb,var(--border)_74%,transparent)] bg-[color-mix(in_srgb,var(--surface-grounded)_64%,transparent)] px-2.5 py-1 text-xs font-semibold text-[var(--ink-muted)]">
              {featuredLevel}
            </span>
            <span className="rounded-full border border-[color-mix(in_srgb,var(--border)_74%,transparent)] bg-[color-mix(in_srgb,var(--surface-grounded)_64%,transparent)] px-2.5 py-1 text-xs font-semibold text-[var(--ink-muted)]">
              Core concept
            </span>
          </div>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <span
                key={index}
                style={{
                  background: index === 0 ? featuredProgressColor : "rgba(255, 255, 255, 0.12)",
                  borderRadius: "3px",
                  display: "block",
                  flex: "1 1 0%",
                  height: "4px",
                  minHeight: "4px",
                  opacity: 1,
                }}
              />
            ))}
          </div>
          <div className="mt-6 h-px bg-[linear-gradient(90deg,color-mix(in_srgb,var(--accent)_18%,transparent),transparent)]" />
          <Link href="/learn" className="mt-4 inline-flex items-center gap-1 text-xs font-black text-[var(--accent)]">
            Open explainer <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </article>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {compactExplainers.map(([category, title, subtitle, time, level, Icon]) => {
          const categoryColor = explainerCategoryColor(category);
          const progressColor = explainerProgressColor(category);

          return (
          <article key={title} className="rounded-2xl p-4" style={groundedSurface}>
            <div
              className="grid h-10 w-10 place-items-center rounded-xl"
            style={{
                background: `color-mix(in srgb, ${categoryColor} 6%, color-mix(in srgb, var(--surface-elevated) 68%, transparent))`,
                border: `1px solid color-mix(in srgb, ${categoryColor} 16%, transparent)`,
                color: categoryColor,
              }}
            >
              <Icon className="h-4.5 w-4.5" />
            </div>
            <p
              className="mt-4 text-[0.68rem] font-extrabold uppercase tracking-[0.12em]"
              style={{ color: categoryColor }}
            >
              {category}
            </p>
            <h3 className="mt-2 text-sm font-black leading-5 text-[var(--ink)]">{title}</h3>
            <p className="mt-2 min-h-12 text-sm leading-5 text-[var(--ink-muted)]">{subtitle}</p>
            <p className="mt-4 flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--border)_72%,transparent)] bg-[color-mix(in_srgb,var(--surface-grounded)_58%,transparent)] px-2 py-1 text-xs font-semibold text-[var(--ink-subtle)]">
              <Clock className="h-3.5 w-3.5" />
              {time} · {level}
            </p>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: 4 }).map((_, index) => (
                <span
                  key={index}
                  style={{
                    background:
                      index === 0
                        ? progressColor
                        : "rgba(255, 255, 255, 0.12)",
                    borderRadius: "3px",
                    display: "block",
                    flex: "1 1 0%",
                    height: "4px",
                    minHeight: "4px",
                    opacity: 1,
                  }}
                />
              ))}
            </div>
          </article>
          );
        })}
        </div>
      </div>
    </section>
  );
}

function FooterDisclaimer() {
  return (
    <Disclaimer
      variant="banner"
      copy="ALQIS is informational only and does not provide investment advice. Educational content only."
      className="mt-8"
    />
  );
}

function Section({
  eyebrow,
  title,
  emphasis,
  suffix,
  subtitle,
  action,
  children,
}: {
  eyebrow: string;
  title: string;
  emphasis: string;
  suffix?: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mb-24">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-[var(--accent)]">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[var(--ink)]">
            {title}{" "}
            <span className="font-serif italic font-normal text-[var(--accent)]">{emphasis}</span>
            {suffix ? ` ${suffix}` : null}
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[var(--ink-muted)]">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function SectionIntro({
  eyebrow,
  title,
  emphasis,
  suffix,
  description,
  icon,
  compact = false,
}: {
  eyebrow: string;
  title: string;
  emphasis: string;
  suffix?: string;
  description: string;
  icon: ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-[color-mix(in_srgb,var(--accent)_16%,transparent)] bg-[color-mix(in_srgb,var(--accent)_6%,var(--surface)_94%)] text-[var(--accent)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_16px_color-mix(in_srgb,var(--accent)_3%,transparent)]">
          {icon}
        </span>
        <p className="eyebrow text-[var(--accent)]">{eyebrow}</p>
      </div>
      <h2 className={`${compact ? "mt-3 text-2xl" : "mt-4 text-3xl"} font-black tracking-[-0.04em] text-[var(--ink)]`}>
        {title} <span className="font-serif italic font-normal text-[var(--accent)]">{emphasis}</span>
        {suffix ? ` ${suffix}` : null}
      </h2>
      <p className="mt-2 max-w-2xl text-sm font-semibold text-[var(--ink-muted)]">{description}</p>
      <div className="mt-4 h-px w-full max-w-xl bg-[linear-gradient(90deg,color-mix(in_srgb,var(--accent)_16%,transparent),color-mix(in_srgb,var(--info)_7%,transparent),transparent)]" />
    </div>
  );
}

function EditorialCard({
  tag,
  title,
  subtitle,
  readTime,
  icon,
  accent,
  contextChips,
}: {
  tag: string;
  title: string;
  subtitle: string;
  readTime: string;
  icon: ReactNode;
  accent: string;
  contextChips: string[];
}) {
  return (
    <article className="box-border flex min-h-[240px] flex-col p-7" style={featureCardSurface}>
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl border border-[rgba(255,255,255,0.08)] bg-[var(--surface-floating)] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
        style={{ color: accent }}
      >
        {icon}
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-2">
        <p
          className="flex items-center gap-1.5 text-[0.7rem] font-bold uppercase tracking-[0.12em]"
          style={{ color: accent }}
        >
          <span className="h-2 w-2 rounded-full" style={{ background: accent }} />
          {tag}
        </p>
        <h3 className="text-[1.2rem] font-semibold leading-[1.3] text-[var(--ink)]">{title}</h3>
        <p className="text-sm leading-6 text-[var(--ink-muted)]">{subtitle}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {contextChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border px-2.5 py-[3px] text-[0.7rem] font-semibold tracking-[0.06em]"
              style={{
                borderColor: `color-mix(in srgb, ${accent} 40%, transparent)`,
                background: `color-mix(in srgb, ${accent} 15%, transparent)`,
                color: accent,
              }}
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-semibold text-[var(--ink-subtle)]">
        <Clock className="h-3.5 w-3.5" />
        {readTime}
      </p>
    </article>
  );
}

function DataLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 rounded-xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_72%,transparent)] px-3 py-2 text-xs font-semibold text-[var(--ink-subtle)]">
      {children}
    </p>
  );
}

function DeltaChip({ direction, value }: { direction: "up" | "down"; value: string }) {
  const gain = direction === "up";
  const chipStyle: CSSProperties = gain
    ? {
        background: "rgba(99, 207, 168, 0.15)",
        border: "1px solid rgba(99, 207, 168, 0.5)",
        color: "#63cfa8",
      }
    : {
        background: "rgba(201, 135, 122, 0.15)",
        border: "1px solid rgba(201, 135, 122, 0.5)",
        color: "#c9877a",
      };

  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[0.65rem] font-black" style={chipStyle}>
      {gain ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {gain ? "▲" : "▼"} {value}
    </span>
  );
}

function Sparkline({ path, color }: { path: string; color: string }) {
  return (
    <svg width="60" height="22" viewBox="0 0 60 22" fill="none" aria-hidden>
      <path d={path} stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Dot({ tone }: { tone: "gain" | "loss" | "info" }) {
  const color = tone === "gain" ? "#63cfa8" : tone === "loss" ? "#c9877a" : "#7da6d9";
  return (
    <span
      style={{
        background: color,
        borderRadius: "50%",
        boxShadow: `0 0 12px ${color}`,
        flexShrink: 0,
        height: "10px",
        minWidth: "10px",
        opacity: 1,
        width: "10px",
      }}
    />
  );
}

function explainerCategoryColor(category: string) {
  return {
    "STOCK FUNDAMENTALS": "#72c7be",
    CHARTS: "#63cfa8",
    EARNINGS: "#d2a96b",
    MACRO: "#7da6d9",
    SECTORS: "#72c7be",
    RISK: "#c9877a",
    BEHAVIORAL: "#7da6d9",
    OPTIONS: "#d2a96b",
    TAX: "#63cfa8",
  }[category] ?? "#72c7be";
}

function explainerProgressColor(category: string) {
  return {
    "STOCK FUNDAMENTALS": "#2d8fd4",
    CHARTS: "#28b857",
    EARNINGS: "#e07820",
    MACRO: "#7da6d9",
    SECTORS: "#72c7be",
    RISK: "#d43030",
    BEHAVIORAL: "#2868c0",
    OPTIONS: "#b8a818",
    TAX: "#28a040",
  }[category] ?? "#72c7be";
}

const topicSurface: CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(255, 255, 255, 0.035) 0%, rgba(255, 255, 255, 0.012) 100%), var(--surface-raised)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "14px",
  boxShadow:
    "inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 6px 20px 0 rgba(2, 6, 12, 0.44)",
  transition: "border-color 160ms ease, transform 160ms ease",
};

function TargetIcon({ className }: { className?: string }) {
  return <Percent className={className} />;
}
