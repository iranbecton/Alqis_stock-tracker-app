import Link from "next/link";
import { ArrowRight, BrainCircuit, Clock3, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type TodayHeroProps = {
  generatedAt: string;
  defaultTicker: string;
  watchlistCount: number;
};

const supportCards = [
  {
    label: "Market Setup",
    title: "Tech leadership is carrying the early tone.",
    copy: "Investors are watching AI leaders, yields, and mega-cap breadth before treating the move as broad-based.",
  },
  {
    label: "Today's Catalysts",
    title: "Macro and earnings remain the cleanest drivers.",
    copy: "Fed minutes, semiconductor commentary, and this week's earnings calendar are the highest-signal inputs.",
  },
  {
    label: "Watchlist Impact",
    title: "Saved names shape the first dashboard read.",
    copy: "ALQIS prioritizes your watchlist, then separates direct evidence from broader market context.",
  },
];

export function TodayHero({
  generatedAt,
  defaultTicker,
  watchlistCount,
}: TodayHeroProps) {
  const promptChips = [
    {
      label: `Why is ${defaultTicker} moving?`,
      href: `/stocks/${defaultTicker}`,
    },
    { label: "What changed in tech?", href: "/dashboard#stock-search" },
    { label: "Explain today's market move", href: "/dashboard#stock-search" },
    { label: "Compare to yesterday", href: "/dashboard#stock-search" },
    {
      label: "What earnings matter this week?",
      href: "/dashboard#stock-search",
    },
  ];

  return (
    <section className="relative overflow-hidden rounded-[var(--radius-2xl)] border border-accent-ai/14 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface-elevated)_88%,var(--accent-ai)_10%)_0%,color-mix(in_srgb,var(--surface)_91%,var(--accent-secondary)_5%)_54%,color-mix(in_srgb,var(--background)_94%,var(--surface-alt)_6%)_100%)] p-4 shadow-[0_30px_76px_rgba(2,6,10,0.3)] sm:p-5 lg:p-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(139,132,199,0.17),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(142,216,208,0.1),transparent_25%)]" />

      <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(21rem,0.4fr)] xl:items-end">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="ai" size="md">
              <BrainCircuit className="h-3.5 w-3.5" />
              Pre-market
            </Badge>
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-border/60 bg-surface/42 px-3 text-body-sm text-ink-muted">
              <Clock3 className="h-3.5 w-3.5" />
              {generatedAt}
            </span>
          </div>

          <div className="max-w-4xl space-y-3">
            <p className="section-kicker text-accent-ai">Explanation first</p>
            <h1 className="font-serif text-[2.55rem] leading-[0.96] tracking-tight text-ink sm:text-[4.25rem] xl:text-[4.5rem]">
              Today&apos;s ALQIS Read
            </h1>
            <p className="max-w-3xl text-body leading-7 text-ink-muted sm:text-body-lg sm:leading-8">
              Markets are leaning higher as investors watch Fed minutes, AI leaders,
              and this week&apos;s earnings. Tech is leading early while defensive groups
              are softer, so ALQIS is treating breadth and catalyst quality as the
              first proof points.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {promptChips.map((chip) => (
              <Link
                key={chip.label}
                href={chip.href}
                className="min-h-10 rounded-full border border-border/70 bg-surface/42 px-4 py-2 text-sm font-medium text-ink-muted transition hover:border-accent-secondary/35 hover:bg-surface-elevated hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
              >
                {chip.label}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-3 rounded-[var(--radius-xl)] border border-border/60 bg-surface/34 p-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body-sm leading-6 text-ink-muted">
              Search a ticker to generate an ALQIS Read with the structured
              evidence engine.
            </p>
            <Button asChild variant="secondary" size="sm" className="min-h-10 shrink-0">
              <Link href="/dashboard#stock-search">
                <Search className="h-4 w-4" />
                Explain a ticker
              </Link>
            </Button>
          </div>
        </div>

        <div className="rounded-[var(--radius-xl)] border border-border/60 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--background)_18%)] p-4">
          <p className="section-kicker text-ink-subtle">Personal context</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Metric label="Default read" value={defaultTicker} />
            <Metric label="Saved names" value={String(watchlistCount)} />
          </div>
          <Button asChild variant="primary" size="md" className="mt-4 w-full">
            <Link href={`/stocks/${defaultTicker}`}>
              Get ALQIS Read
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      <div className="relative mt-5 grid gap-3 md:grid-cols-3">
        {supportCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[var(--radius-xl)] border border-border/60 bg-surface/38 p-4"
          >
            <p className="section-kicker text-accent-ai">{card.label}</p>
            <h2 className="mt-3 text-base font-semibold tracking-tight text-ink">
              {card.title}
            </h2>
            <p className="mt-2 text-body-sm leading-6 text-ink-muted">{card.copy}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-border/60 bg-surface/44 px-3 py-3">
      <p className="section-kicker text-ink-subtle">{label}</p>
      <p className="mt-2 text-xl font-semibold text-ink" data-numeric>
        {value}
      </p>
    </div>
  );
}
