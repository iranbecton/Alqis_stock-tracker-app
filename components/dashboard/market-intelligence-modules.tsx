import Link from "next/link";
import { CalendarDays, Flame, Newspaper, RadioTower } from "lucide-react";
import { SparklineChart } from "@/components/alqis/sparkline-chart";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DemoStock } from "@/lib/stocks/demo-stocks";

const earnings = [
  { ticker: "NVDA", day: "Wed", focus: "AI infrastructure demand" },
  { ticker: "COST", day: "Thu", focus: "Consumer resilience" },
  { ticker: "JPM", day: "Fri", focus: "Credit and deposit tone" },
  { ticker: "ADBE", day: "Tue", focus: "Software AI monetization" },
];

const newsItems = [
  {
    headline: "Fed minutes keep rate sensitivity in focus before the open",
    source: "Macro desk",
    time: "23 min ago",
    tags: ["Macro", "Rates"],
    tone: "warn",
  },
  {
    headline: "AI infrastructure leaders remain central to tech breadth",
    source: "ALQIS scan",
    time: "41 min ago",
    tags: ["AI Demand", "Sector Rotation"],
    tone: "ai",
  },
  {
    headline: "Earnings calendar points to margin commentary as a key read-through",
    source: "Earnings monitor",
    time: "1 hr ago",
    tags: ["Earnings"],
    tone: "accent",
  },
];

const sectors = [
  ["Technology", 0.82],
  ["Communication Services", 0.48],
  ["Consumer Discretionary", 0.22],
  ["Financials", 0.16],
  ["Industrials", 0.08],
  ["Healthcare", -0.12],
  ["Materials", -0.18],
  ["Real Estate", -0.31],
  ["Utilities", -0.36],
  ["Staples", -0.28],
  ["Energy", -0.44],
] as const;

export function TopMoversCard({ stocks }: { stocks: DemoStock[] }) {
  const movers = [...stocks]
    .sort((a, b) => Math.abs(b.dailyChangePercent) - Math.abs(a.dailyChangePercent))
    .slice(0, 5);

  return (
    <Card variant="subtle" radius="xl" className="border-border/72">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardEyebrow>
            <Flame className="h-3.5 w-3.5" />
            Top Movers
          </CardEyebrow>
          <PlaceholderPill label="Demo data" />
        </div>
        <CardTitle>What needs an explanation?</CardTitle>
        <CardDescription>
          Tracked-universe preview. Open a ticker for the live ALQIS read.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3.5">
          {movers.map((stock) => {
            const isUp = stock.dailyChangePercent >= 0;

            return (
              <Link
                key={stock.symbol}
                href={`/stocks/${stock.symbol}`}
                className="grid gap-3 rounded-[var(--radius-lg)] border border-border/60 bg-surface/40 p-3 transition hover:border-accent-secondary/30 hover:bg-surface-elevated min-[430px]:grid-cols-[minmax(0,1fr)_auto]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ink">{stock.symbol}</p>
                    <Badge variant="outline" size="sm" className="normal-case tracking-normal">
                      {stock.sector}
                    </Badge>
                  </div>
                  <p className="mt-2 line-clamp-2 text-body-sm leading-6 text-ink-muted">
                    {stock.headline}
                  </p>
                </div>
                <div className="flex items-center gap-3 min-[430px]:justify-end">
                  <SparklineChart
                    data={stock.chartData}
                    trend={isUp ? "up" : "down"}
                    className="hidden min-[430px]:block"
                  />
                  <span
                    className={isUp ? "text-sm font-medium text-gain" : "text-sm font-medium text-loss"}
                    data-numeric
                  >
                    {isUp ? "+" : ""}
                    {stock.dailyChangePercent.toFixed(2)}%
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function EarningsThisWeekCard() {
  return (
    <Card variant="subtle" radius="xl" className="border-border/72">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardEyebrow>
            <CalendarDays className="h-3.5 w-3.5" />
            Earnings This Week
          </CardEyebrow>
          <PlaceholderPill label="Static preview" />
        </div>
        <CardTitle>What could move next?</CardTitle>
        <CardDescription>
          Planning preview for upcoming read-throughs.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2.5">
          {earnings.map((item) => (
            <div
              key={`${item.ticker}-${item.day}`}
              className="flex items-start justify-between gap-3 rounded-[var(--radius-lg)] border border-border/60 bg-surface/40 px-3 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-ink">{item.ticker}</p>
                <p className="mt-1 text-body-sm leading-6 text-ink-muted">{item.focus}</p>
              </div>
              <Badge variant="ai" size="sm" className="normal-case tracking-normal">
                {item.day}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function AITaggedNewsCard() {
  return (
    <Card
      variant="subtle"
      radius="xl"
      className="border-accent-ai/12 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_82%,var(--accent-ai)_7%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-secondary)_3%)_100%)]"
    >
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardEyebrow>
            <Newspaper className="h-3.5 w-3.5" />
            AI-Tagged News
          </CardEyebrow>
          <PlaceholderPill label="Placeholder - not live" />
        </div>
        <CardTitle>What catalysts are forming?</CardTitle>
        <CardDescription>
          Preview of how ALQIS maps headlines to catalyst types.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3.5">
          {newsItems.map((item) => (
            <article
              key={item.headline}
              className="relative overflow-hidden rounded-[var(--radius-lg)] border border-border/60 bg-surface/42 p-4"
            >
              <span
                className={
                  item.tone === "warn"
                    ? "absolute inset-y-0 left-0 w-1 bg-warn"
                    : item.tone === "ai"
                      ? "absolute inset-y-0 left-0 w-1 bg-accent-ai"
                      : "absolute inset-y-0 left-0 w-1 bg-accent-secondary"
                }
                aria-hidden
              />
              <p className="pl-2 text-[0.94rem] font-medium leading-6 text-ink">
                {item.headline}
              </p>
              <p className="mt-1 pl-2 text-body-sm text-ink-subtle">
                {item.source} - {item.time}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 pl-2">
                {item.tags.map((tag) => (
                  <Badge key={tag} variant="outline" size="sm" className="normal-case tracking-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </article>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function SectorPulseCard() {
  return (
    <Card variant="subtle" radius="xl" className="border-border/72">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardEyebrow>
            <RadioTower className="h-3.5 w-3.5" />
            Sector Pulse
          </CardEyebrow>
          <PlaceholderPill label="Demo data" />
        </div>
        <CardTitle>Where is leadership?</CardTitle>
        <CardDescription>
          Static sector breadth preview, not live sector data.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sectors.map(([sector, value]) => {
            const width = Math.min(Math.max(Math.abs(value) * 86, 10), 86);
            const isUp = value >= 0;

            return (
              <div key={sector} className="grid grid-cols-[minmax(0,1fr)_4.5rem] items-center gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <p className="truncate text-body-sm font-medium text-ink-muted">{sector}</p>
                  </div>
                  <div className="h-2 rounded-full bg-surface/70">
                    <div
                      className={isUp ? "h-full rounded-full bg-accent-secondary" : "h-full rounded-full bg-loss"}
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
                <span
                  className={isUp ? "text-right text-body-sm font-medium text-gain" : "text-right text-body-sm font-medium text-loss"}
                  data-numeric
                >
                  {isUp ? "+" : ""}
                  {value.toFixed(2)}%
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PlaceholderPill({ label }: { label: string }) {
  return (
    <Badge variant="outline" size="sm" className="normal-case tracking-normal">
      {label}
    </Badge>
  );
}
