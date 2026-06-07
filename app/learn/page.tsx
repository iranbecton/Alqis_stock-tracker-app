import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BarChart3,
  BookOpen,
  ChevronRight,
  Clock,
  Landmark,
  Search,
} from "lucide-react";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import { GlossaryBrowser } from "@/components/education/glossary-browser";
import {
  JustInTimeMovers,
  type JustInTimeMover,
} from "@/components/education/just-in-time-movers";
import { LearnNavSearch } from "@/components/education/learn-nav-search";
import { LearnPaths } from "@/components/education/learn-paths";
import { Badge } from "@/components/ui/badge";
import { PageContainer } from "@/components/ui/layout";
import { glossaryItems } from "@/lib/education/glossary";
import { demoStocks } from "@/lib/stocks/demo-stocks";

export const metadata: Metadata = {
  title: "ALQIS Investment Encyclopedia",
  description: "Plain-English market terms used across ALQIS reads.",
};

const focusCards = [
  {
    title: "How to read an ALQIS confidence score",
    tag: "ALQIS Concepts",
    description: "What the score means, when it drops, and why it's never certainty.",
    readTime: "3 min",
    termId: "confidence-score",
    Icon: BarChart3,
  },
  {
    title: "Why counterevidence makes a read stronger",
    tag: "ALQIS Concepts",
    description: "How showing what could be wrong builds trust in the explanation.",
    readTime: "3 min",
    termId: "counterevidence",
    Icon: BookOpen,
  },
  {
    title: "Sector moves vs company moves",
    tag: "Market Structure",
    description: "How to tell whether a stock moved on its own or with its sector.",
    readTime: "4 min",
    termId: "sector",
    Icon: Landmark,
  },
  {
    title: "What 'data limited' actually means",
    tag: "ALQIS Concepts",
    description: "When ALQIS holds back, and why that's a feature not a bug.",
    readTime: "2 min",
    termId: "data-limited",
    Icon: Search,
  },
];

const wildConcepts = [
  {
    title: "P/E ratio",
    subtitle: "What investors are paying per $1 of profit",
    termId: "pe-ratio",
    rows: [
      ["NVDA", "32x", "priced for AI growth", "gain"],
      ["AAPL", "28x", "premium to 5y avg", "info"],
      ["TSLA", "65x", "future-anchored valuation", "loss"],
      ["T", "18x", "mature, lower-growth", "info"],
    ],
  },
  {
    title: "Dividend yield",
    subtitle: "Income per dollar today",
    termId: "dividend-yield",
    rows: [
      ["T", "6.8%", "higher income", "gain"],
      ["VZ", "6.5%", "telecom payout", "gain"],
      ["KO", "3.0%", "steady dividend grower", "info"],
      ["AAPL", "0.5%", "minimal - repurchases instead", "loss"],
    ],
  },
  {
    title: "Beta",
    subtitle: "How much each stock moves vs the market",
    termId: "beta",
    rows: [
      ["TSLA", "2.3", "moves much more than market", "loss"],
      ["NVDA", "1.6", "~60% more than SPY", "loss"],
      ["SPY", "1.0", "the market itself", "info"],
      ["KO", "0.6", "lower-volatility profile", "gain"],
    ],
  },
];

export default function LearnPage() {
  const justInTimeMovers = getJustInTimeMovers();

  return (
    <main className="min-h-dvh overflow-x-hidden bg-bg text-ink">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(60%_50%_at_20%_0%,rgba(114,199,190,0.06)_0%,transparent_60%),radial-gradient(50%_40%_at_85%_5%,rgba(125,166,217,0.05)_0%,transparent_55%),linear-gradient(180deg,var(--bg),color-mix(in_srgb,var(--bg)_82%,black_18%)_62%,color-mix(in_srgb,var(--bg)_62%,black_38%))]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(125,166,217,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(125,166,217,0.008)_1px,transparent_1px)] bg-[size:110px_110px] opacity-40 [mask-image:linear-gradient(180deg,black,transparent_72%)]" />

      <div className="relative z-10">
        <LearnTopNav />
        <PageContainer className="max-w-[82rem] pb-14 pt-8">
          <HeroSection />
          <JustInTimeSection movers={justInTimeMovers} />
          <InFocusSection />
          <InTheWildSection />
          <LearnPaths />
          <GlossarySection />
        </PageContainer>
      </div>
    </main>
  );
}

function LearnTopNav() {
  const navItems = ["Today", "Watchlist", "Portfolio", "Explore", "Alerts", "Learn"];

  return (
    <header className="border-b border-border/70 bg-[color-mix(in_srgb,var(--bg)_88%,black_12%)] backdrop-blur-xl">
      <PageContainer className="max-w-[82rem] py-2.5">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="flex min-w-fit items-center gap-2.5">
            <AlqisLogo variant="lockup" tone="dark" size="sm" priority />
          </div>
          <nav className="scrollbar-hide flex gap-1.5 overflow-x-auto lg:ml-4" aria-label="Learn navigation">
            {navItems.map((item) => (
              <Link
                key={item}
                href={item === "Learn" ? "/learn" : "/dashboard"}
                className={
                  item === "Learn"
                    ? "rounded-full bg-info-muted px-3 py-1.5 text-xs font-black text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                    : "rounded-full px-3 py-1.5 text-xs font-black text-ink-subtle transition hover:bg-surface hover:text-ink-muted"
                }
              >
                {item}
              </Link>
            ))}
          </nav>
          <LearnNavSearch />
        </div>
      </PageContainer>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="pb-10">
      <p className="eyebrow text-accent">ALQIS / LEARN</p>
      <h1 className="mt-3 max-w-4xl text-[clamp(2.8rem,5vw,4.2rem)] font-extrabold leading-[1.05] tracking-normal text-ink">
        Learn the market{" "}
        <span className="font-serif italic font-normal tracking-normal text-accent">
          as it happens.
        </span>
      </h1>
      <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-ink-muted">
        Concepts anchored to ticker movement, ALQIS reads, and the vocabulary that
        appears across the product.
      </p>
      <p className="mt-3 text-xs font-semibold text-ink-subtle">
        Educational information only. Not investment, legal, or tax advice.
      </p>
    </section>
  );
}

function JustInTimeSection({ movers }: { movers: JustInTimeMover[] }) {
  return (
    <EducationSection
      eyebrow="JUST-IN-TIME"
      title="Tied to"
      emphasis="what's moving"
      suffix="right now"
      subtitle="The dashboard mover source is connected here to the concept that best explains the shape of each move."
    >
      <JustInTimeMovers movers={movers} />
    </EducationSection>
  );
}

function InFocusSection() {
  return (
    <EducationSection
      eyebrow="IN FOCUS"
      title="Evergreen"
      emphasis="explainers"
      subtitle="Short concept cards for the ideas that show up repeatedly in ALQIS reads."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        {focusCards.map((card) => (
          <Link
            key={card.title}
            href={`#${card.termId}`}
            className="rounded-2xl border border-border/75 bg-[var(--surface-grounded)] p-4 shadow-[0_6px_16px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:border-accent/30"
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-accent/16 bg-accent/8 text-accent">
              <card.Icon className="h-5 w-5" />
            </span>
            <p className="mt-4 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-accent">
              {card.tag}
            </p>
            <h3 className="mt-2 text-base font-black leading-6 text-ink">{card.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{card.description}</p>
            <p className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-ink-subtle">
              <Clock className="h-3.5 w-3.5" />
              {card.readTime}
            </p>
          </Link>
        ))}
      </div>
    </EducationSection>
  );
}

function InTheWildSection() {
  return (
    <EducationSection
      eyebrow="IN THE WILD"
      title="The same concepts, in"
      emphasis="ticker examples"
      subtitle="Sample values show how a concept appears on real-looking ticker rows without presenting them as live data."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {wildConcepts.map((concept) => (
          <article key={concept.title} className="rounded-2xl border border-border/80 bg-[var(--surface-grounded)] p-4 shadow-[0_6px_16px_rgba(0,0,0,0.24)]">
            <p className="eyebrow text-accent">Concept - sample</p>
            <h3 className="mt-2 font-serif text-2xl italic tracking-normal text-ink">
              {concept.title}
            </h3>
            <p className="mt-1 text-sm text-ink-muted">{concept.subtitle}</p>
            <div className="mt-4 divide-y divide-border">
              {concept.rows.map(([ticker, value, context, tone]) => (
                <div key={`${concept.title}-${ticker}`} className="grid grid-cols-[3.5rem_4rem_minmax(0,1fr)_auto] items-center gap-3 py-3 text-sm">
                  <span className="text-[0.85rem] font-bold tracking-[0.04em] text-ink">
                    {ticker}
                  </span>
                  <span className="font-semibold text-ink" data-numeric>{value}</span>
                  <span className="truncate text-ink-muted">{context}</span>
                  <Dot tone={tone as "gain" | "loss" | "info"} />
                </div>
              ))}
            </div>
            <Link href={`#${concept.termId}`} className="mt-4 inline-flex items-center gap-1 text-xs font-black text-accent">
              Open the explainer <ChevronRight className="h-3 w-3" />
            </Link>
          </article>
        ))}
      </div>
      <DataLabel>Sample data - illustrative values, not live quotes.</DataLabel>
    </EducationSection>
  );
}

function GlossarySection() {
  return (
    <section id="glossary" className="scroll-mt-24 border-t border-border/70 pt-12">
      {["daily-move", "volatility", "earnings-beat", "earnings-miss", "confidence-score", "counterevidence", "sector", "data-limited", "pe-ratio", "dividend-yield", "beta"].map((id) => (
        <span key={id} id={id} className="block scroll-mt-24" />
      ))}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-accent/16 bg-accent/10 text-accent">
              <Search className="h-4 w-4" />
            </span>
            <p className="eyebrow text-accent">GLOSSARY</p>
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-ink">
            What&apos;s <span className="font-serif italic font-normal text-accent">that</span> mean?
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-ink-muted">
            Look up any finance term. No jargon, no condescension.
          </p>
        </div>
        <Badge variant="outline">{glossaryItems.length} terms</Badge>
      </div>
      <GlossaryBrowser />
    </section>
  );
}

function EducationSection({
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
    <section className="mb-20 border-t border-border/70 pt-12">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-accent">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-black tracking-normal text-ink">
            {title}{" "}
            <span className="font-serif italic font-normal text-accent">{emphasis}</span>
            {suffix ? ` ${suffix}` : null}
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-ink-muted">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function DataLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 rounded-xl border border-border bg-surface/70 px-3 py-2 text-xs font-semibold text-ink-subtle">
      {children}
    </p>
  );
}

function getJustInTimeMovers(): JustInTimeMover[] {
  return [...demoStocks]
    .sort((a, b) => Math.abs(b.dailyChangePercent) - Math.abs(a.dailyChangePercent))
    .slice(0, 4)
    .map((stock) => {
      const conceptMapping = mapStockToConcept(stock.dailyChangePercent);
      const concept = glossaryItems.find((item) => item.id === conceptMapping.id);

      return {
        ticker: stock.symbol,
        changePercent: stock.dailyChangePercent,
        reason:
          concept?.whyItMatters ??
          glossaryItems.find((item) => item.id === "daily-move")?.whyItMatters ??
          "",
        concept: {
          id: concept?.id ?? "daily-move",
          term: concept?.term ?? "Daily move",
          tagLabel: conceptMapping.tagLabel,
        },
      };
    });
}

function mapStockToConcept(changePercent: number) {
  const absoluteChange = Math.abs(changePercent);

  if (absoluteChange >= 5) {
    return {
      id: changePercent >= 0 ? "earnings-beat" : "earnings-miss",
      tagLabel: "EARNINGS SIGNAL",
    };
  }

  if (absoluteChange >= 3) {
    return { id: "volatility", tagLabel: "VOLATILITY" };
  }

  if (absoluteChange >= 1.5) {
    return { id: "daily-move", tagLabel: "DAILY MOVE" };
  }

  if (absoluteChange >= 0.5) {
    return { id: "sector-rotation", tagLabel: "SECTOR MOVE" };
  }

  return { id: "daily-move", tagLabel: "DAILY MOVE" };
}

function Dot({ tone }: { tone: "gain" | "loss" | "info" }) {
  const className =
    tone === "gain"
      ? "bg-gain shadow-[0_0_12px_var(--gain)]"
      : tone === "loss"
        ? "bg-loss shadow-[0_0_12px_var(--loss)]"
        : "bg-info shadow-[0_0_12px_var(--info)]";

  return <span className={`h-2.5 w-2.5 rounded-full ${className}`} />;
}
