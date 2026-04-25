import {
  BellRing,
  Compass,
  Orbit,
  Radar,
  Sparkles,
  Waves,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfidenceDot } from "@/components/ui/confidence-dot";
import { Delta } from "@/components/ui/delta";
import { alqisDemoData, type RadarSignal, type ToneTag } from "@/lib/alqis-demo-data";
import { SparklineChart } from "./price-line-chart";
import { WhyItMovingCard } from "./why-it-moving-card";

const toneClasses: Record<ToneTag["tone"], string> = {
  gain: "border-gain/30 bg-gain-muted text-gain",
  neutral: "border-border/80 bg-surface-elevated text-ink-muted",
  warn: "border-warn/20 bg-warn-muted text-warn",
};

export function MarketShell() {
  const { hero, spotlight, pulse, radar, asOf } = alqisDemoData;

  return (
    <main className="min-h-dvh">
      <section className="border-b border-border/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_97%,var(--surface)_3%)_0%,color-mix(in_srgb,var(--background)_72%,transparent)_100%)]">
        <div className="mx-auto flex w-full max-w-[90rem] items-center justify-between gap-6 px-5 py-5 sm:px-8 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-accent-ai/16 bg-[color-mix(in_srgb,var(--accent-ai)_14%,transparent)] text-sm font-semibold tracking-[0.2em] text-accent-ai">
              A
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-label text-ink-subtle">
                ALQIS
              </p>
              <p className="text-sm text-ink-muted">Signal over noise</p>
            </div>
          </div>

          <nav
            aria-label="Primary"
            className="hidden items-center gap-8 text-sm text-ink-muted lg:flex"
          >
            <a href="#spotlight" className="transition-colors hover:text-ink">
              Spotlight
            </a>
            <a href="#pulse" className="transition-colors hover:text-ink">
              Market pulse
            </a>
            <a href="#radar" className="transition-colors hover:text-ink">
              Radar
            </a>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Button variant="ghost">Live demo</Button>
            <Button>{hero.primaryAction}</Button>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[90rem] flex-col gap-8 px-5 py-8 sm:px-8 sm:py-10 lg:gap-10 lg:px-10 lg:py-12">
        <section
          aria-labelledby="hero-title"
          className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.75fr)]"
        >
          <Card
            variant="flat"
            padding="none"
            className="overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--surface-elevated)_86%,var(--accent-ai)_14%)_0%,color-mix(in_srgb,var(--background)_92%,var(--surface)_8%)_46%,color-mix(in_srgb,var(--surface)_88%,var(--accent-primary)_12%)_100%)] p-6 sm:p-8 lg:p-10"
          >
            <CardContent className="space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="accent" size="md">
                  {hero.eyebrow}
                </Badge>
                <Badge variant="outline" size="md">
                  {asOf}
                </Badge>
              </div>

              <div className="max-w-3xl space-y-4">
                <h1
                  id="hero-title"
                  className="font-serif text-5xl leading-[0.95] tracking-tight text-ink sm:text-6xl lg:text-7xl"
                >
                  {hero.title}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-ink-muted sm:text-lg">
                  {hero.summary}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button size="lg">{hero.primaryAction}</Button>
                <Button size="lg" variant="secondary">
                  {hero.secondaryAction}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card padding="lg" className="rounded-[2rem] border-border/70 bg-surface/90">
            <CardHeader className="mb-6">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-label text-ink-subtle">
                <Compass className="h-3.5 w-3.5" />
                Session context
              </div>
              <CardTitle className="text-[2rem]">Calm leadership, improving breadth.</CardTitle>
            </CardHeader>

            <CardContent className="grid gap-5">
              {pulse.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-[1.35rem] border border-border/70 bg-surface-elevated/85 p-4"
                >
                  <p className="text-[11px] uppercase tracking-label text-ink-subtle">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-xl font-medium text-ink">{metric.value}</p>
                  <p className="mt-1 text-sm leading-6 text-ink-muted">{metric.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section
          id="spotlight"
          className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,0.72fr)]"
        >
          <WhyItMovingCard signal={spotlight} asOf={asOf} />

          <div className="grid gap-6">
            <MarketPulseCard />
            <DailyBriefCard />
          </div>
        </section>

        <section
          id="radar"
          className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]"
        >
          <SignalRadarCard signals={radar} />

          <div className="grid gap-6">
            <WatchlistCard />
            <PortfolioStateCard />
          </div>
        </section>
      </div>
    </main>
  );
}

function MarketPulseCard() {
  const { pulse } = alqisDemoData;

  return (
    <Card id="pulse" className="rounded-[1.75rem] border-border/70 bg-surface/92">
      <CardHeader className="mb-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-label text-ink-subtle">
          <Orbit className="h-3.5 w-3.5" />
          {pulse.title}
        </div>
        <CardTitle className="text-[2rem]">The market is participating with discipline.</CardTitle>
        <p className="text-sm leading-6 text-ink-muted">{pulse.summary}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {pulse.tones.map((tone) => (
            <span
              key={tone.label}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${toneClasses[tone.tone]}`}
            >
              {tone.label}
            </span>
          ))}
        </div>

        <div className="grid gap-3">
          {pulse.metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-[1.15rem] border border-border/70 bg-surface-elevated/70 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-ink-muted">{metric.label}</span>
                <span className="font-medium text-ink">{metric.value}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DailyBriefCard() {
  const { dailyBrief } = alqisDemoData;

  return (
    <Card className="rounded-[1.75rem] border-border/70 bg-surface/92">
      <CardHeader className="mb-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-label text-ink-subtle">
          <Sparkles className="h-3.5 w-3.5" />
          Daily brief
        </div>
        <CardTitle className="text-[2rem]">Three things that matter right now.</CardTitle>
      </CardHeader>

      <CardContent>
        <ol className="space-y-4">
          {dailyBrief.map((item, index) => (
            <li
              key={item.title}
              className="rounded-[1.25rem] border border-border/70 bg-surface-elevated/75 p-4"
            >
              <div className="flex items-start gap-4">
                  <span className="mt-0.5 text-sm font-medium text-accent-ai">
                    0{index + 1}
                  </span>
                <div>
                  <h3 className="text-sm font-medium text-ink">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">{item.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

function SignalRadarCard({ signals }: { signals: RadarSignal[] }) {
  return (
    <Card className="rounded-[1.75rem] border-border/70 bg-surface/92">
      <CardHeader className="mb-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-label text-ink-subtle">
          <Radar className="h-3.5 w-3.5" />
          Signal radar
        </div>
        <CardTitle className="text-[2rem]">Other moves worth understanding.</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {signals.map((signal) => (
          <article
            key={signal.symbol}
            className="grid gap-4 rounded-[1.35rem] border border-border/70 bg-surface-elevated/75 p-4 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold tracking-tight text-ink">
                      {signal.symbol}
                    </span>
                    <span className="text-sm text-ink-muted">{signal.name}</span>
                  </div>
                  <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
                    {signal.summary}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-medium text-ink" data-numeric>
                    {signal.price}
                  </p>
                  <Delta value={signal.changePct} size="sm" />
                </div>
              </div>

              <ConfidenceDot band={signal.confidence} showLabel={false} />
            </div>

            <SparklineChart
              data={signal.points}
              trend={signal.changePct >= 0 ? "up" : "down"}
              className="self-center justify-self-start sm:justify-self-end"
            />
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

function WatchlistCard() {
  const { watchlist } = alqisDemoData;

  return (
    <Card className="rounded-[1.75rem] border-border/70 bg-surface/92">
      <CardHeader className="mb-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-label text-ink-subtle">
          <Waves className="h-3.5 w-3.5" />
          Watchlist changes
        </div>
        <CardTitle className="text-[2rem]">Thesis updates, not headline spam.</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
        {watchlist.map((item) => (
          <article
            key={item.symbol}
            className="rounded-[1.25rem] border border-border/70 bg-surface-elevated/75 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-lg font-semibold text-ink">{item.symbol}</span>
              <span className="text-xs uppercase tracking-label text-ink-subtle">
                Thesis change
              </span>
            </div>
            <h3 className="mt-2 text-sm font-medium text-ink">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-muted">{item.note}</p>
          </article>
        ))}
      </CardContent>
    </Card>
  );
}

function PortfolioStateCard() {
  const { portfolioState } = alqisDemoData;

  return (
    <Card className="rounded-[1.75rem] border-border/70 bg-surface/92">
      <CardHeader className="mb-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-label text-ink-subtle">
          <BellRing className="h-3.5 w-3.5" />
          {portfolioState.title}
        </div>
        <CardTitle className="text-[2rem]">{portfolioState.emptyTitle}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-[1.35rem] border border-dashed border-border bg-surface-elevated/65 p-5">
          <p className="text-sm leading-6 text-ink-muted">{portfolioState.emptyBody}</p>
        </div>

        <div className="rounded-[1.35rem] border border-border/70 bg-surface-elevated/75 p-4">
          <p className="text-[11px] uppercase tracking-label text-ink-subtle">
            {portfolioState.queueLabel}
          </p>
          <p className="mt-2 text-base font-medium text-ink">{portfolioState.queueStatus}</p>
          <p className="mt-1 text-sm leading-6 text-ink-muted">
            {portfolioState.queueDetail}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
