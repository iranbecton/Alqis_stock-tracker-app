import Link from "next/link";
import { CalendarDays, Flame, Newspaper, RadioTower } from "lucide-react";
import { SparklineChart } from "@/components/alqis/sparkline-chart";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DemoStock } from "@/lib/stocks/demo-stocks";

const earnings = [
  { ticker: "CRM", company: "Salesforce", day: "Today AMC", estimate: "$2.34", status: "Software margin" },
  { ticker: "CRWD", company: "CrowdStrike", day: "Today AMC", estimate: "$0.93", status: "Security demand" },
  { ticker: "WMT", company: "Walmart", day: "Tue BMO", estimate: "$0.52", status: "Consumer read" },
  { ticker: "NVDA", company: "NVIDIA", day: "Wed AMC", estimate: "$5.59", status: "AI demand" },
  { ticker: "COST", company: "Costco", day: "Thu BMO", estimate: "$3.78", status: "Membership context" },
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
  ["Tech", 1.84, 2.65],
  ["Comm.", 1.42, 1.1],
  ["Cons. Disc.", 0.74, 1.25],
  ["Fin.", 0.31, 1.35],
  ["Indust.", 0.18, 0.9],
  ["Health", -0.04, 1.1],
  ["Mat.", -0.21, 0.45],
  ["RE", -0.40, 0.38],
  ["Util.", -0.62, 0.48],
  ["Staples", -0.81, 0.62],
  ["Energy", -1.27, 0.58],
] as const;

export function TopMoversCard({ stocks }: { stocks: DemoStock[] }) {
  const movers = [...stocks]
    .sort((a, b) => Math.abs(b.dailyChangePercent) - Math.abs(a.dailyChangePercent))
    .slice(0, 5);

  return (
    <Card
      variant="subtle"
      radius="xl"
      className="border-[rgba(108,155,205,0.30)] bg-[radial-gradient(ellipse_at_18%_0%,rgba(57,226,160,0.12),transparent_36%),radial-gradient(ellipse_at_94%_8%,rgba(117,231,220,0.11),transparent_38%),linear-gradient(180deg,#1d2d3c_0%,#132230_55%,#0d1825_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.13),inset_0_0_0_1px_rgba(255,255,255,0.05),0_28px_64px_rgba(2,6,12,0.62),0_0_42px_rgba(57,226,160,0.07)]"
    >
      <CardHeader className="mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardEyebrow className="text-[#7bbcff]">
            <Flame className="h-3.5 w-3.5" />
            Top Movers
          </CardEyebrow>
          <PlaceholderPill label="Demo data" />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-[1.25rem]">What needs an explanation?</CardTitle>
          <div className="rounded-full border border-[#25476f]/70 bg-[#081525]/70 p-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em]">
            <span className="rounded-full bg-[#0f6c4f] px-2.5 py-1 text-[#c8ffdf]">Gainers</span>
            <span className="px-2.5 py-1 text-[#7891ad]">Losers</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {movers.map((stock) => {
            const isUp = stock.dailyChangePercent >= 0;

            return (
              <Link
                key={stock.symbol}
                href={`/stocks/${stock.symbol}`}
                className="grid grid-cols-[3.5rem_minmax(5rem,1fr)_5.5rem_auto] items-center gap-3 border-b border-[rgba(70,105,150,0.16)] px-2 py-2.5 transition last:border-b-0 hover:bg-[#102033]/58"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-[#f2f7ff]">{stock.symbol}</p>
                  <p className="mt-0.5 truncate text-[0.72rem] text-[#7891ad]">{stock.sector}</p>
                </div>
                <SparklineChart
                  data={stock.chartData}
                  trend={isUp ? "up" : "down"}
                  className="h-8 w-full"
                />
                <p className="text-right text-body-sm text-[#91a9c6]" data-numeric>
                  ${stock.price.toFixed(2)}
                </p>
                <span
                  className={isUp ? "text-right text-sm font-semibold text-gain" : "text-right text-sm font-semibold text-loss"}
                  data-numeric
                >
                  {isUp ? "+" : ""}
                  {stock.dailyChangePercent.toFixed(2)}%
                </span>
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
    <Card variant="subtle" radius="xl" className="border-[rgba(108,155,205,0.26)] bg-[radial-gradient(circle_at_92%_0%,rgba(210,169,107,0.07),transparent_30%),linear-gradient(180deg,#102033_0%,#06101b_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <CardHeader className="mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardEyebrow className="text-[#7bbcff]">
            <CalendarDays className="h-3.5 w-3.5" />
            Earnings This Week
          </CardEyebrow>
          <PlaceholderPill label="Static preview" />
        </div>
        <CardTitle className="text-[1.25rem]">Earnings this week</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-1">
          {earnings.map((item) => (
            <div
              key={`${item.ticker}-${item.day}`}
              className="grid grid-cols-[5.5rem_4rem_minmax(0,1fr)_4.25rem] items-center gap-3 border-b border-[rgba(70,105,150,0.16)] px-2 py-2.5 last:border-b-0"
            >
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.1em] text-[#7891ad]">{item.day}</p>
              <p className="text-sm font-semibold text-[#f2f7ff]">{item.ticker}</p>
              <div className="min-w-0">
                <p className="truncate text-body-sm text-[#91a9c6]">{item.company}</p>
                <p className="truncate text-[0.72rem] text-[#7891ad]">{item.status}</p>
              </div>
              <span className="text-right text-body-sm text-[#d9e9ff]" data-numeric>
                est {item.estimate}
              </span>
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
      className="border-[rgba(108,155,205,0.26)] bg-[radial-gradient(circle_at_8%_0%,rgba(61,91,160,0.07),transparent_30%),linear-gradient(180deg,#102033_0%,#06101b_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
    >
      <CardHeader className="mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardEyebrow className="text-[#7bbcff]">
            <Newspaper className="h-3.5 w-3.5" />
            News: AI-Tagged
          </CardEyebrow>
          <PlaceholderPill label="Static preview" />
        </div>
        <CardTitle className="text-[1.25rem]">News: AI-tagged</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {newsItems.map((item) => (
            <article
              key={item.headline}
              className="relative overflow-hidden border-b border-[rgba(70,105,150,0.16)] bg-transparent px-3 py-3 last:border-b-0"
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
              <p className="pl-3 text-[0.94rem] font-medium leading-6 text-[#f2f7ff]">
                {item.headline}
              </p>
              <p className="mt-1 pl-3 text-body-sm text-[#7891ad]">
                {item.source} - {item.time}
              </p>
              <div className="mt-2 flex flex-wrap gap-2 pl-3">
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
    <Card variant="subtle" radius="xl" className="border-[rgba(108,155,205,0.24)] bg-[radial-gradient(ellipse_at_50%_0%,rgba(117,231,220,0.055),transparent_42%),linear-gradient(180deg,#102032_0%,#07111d_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_9px_26px_rgba(0,0,0,0.32)]">
      <CardHeader className="mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardEyebrow className="text-[#7bbcff]">
            <RadioTower className="h-3.5 w-3.5" />
            Sector Performance
          </CardEyebrow>
          <PlaceholderPill label="Static preview" />
        </div>
        <CardTitle className="text-[1.25rem]">S&amp;P weighted performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="-mx-1 overflow-x-auto px-1">
          <div className="flex min-w-[54rem] gap-1.5">
            {sectors.map(([sector, value, weight]) => {
              const isUp = value >= 0;
              const tileStyle = sectorTileStyle(value);

            return (
              <div
                key={sector}
                className="flex h-28 flex-col justify-between rounded-[0.65rem] border p-3 text-xs font-black"
                style={{ flex: weight, ...tileStyle }}
              >
                <p className="truncate text-[0.75rem] font-semibold text-[#f2f7ff]">{sector}</p>
                <span
                  className={isUp ? "text-sm font-semibold text-[#f2fff8]" : "text-sm font-semibold text-[#fff2f2]"}
                  data-numeric
                >
                  {isUp ? "+" : ""}
                  {value.toFixed(2)}%
                </span>
              </div>
            );
          })}
          </div>
        </div>
        <p className="mt-3 text-body-sm leading-6 text-[#7891ad]">
          Static sector breadth preview. ALQIS will label this as live only when
          a sector provider is connected.
        </p>
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

function sectorTileStyle(value: number) {
  if (value >= 1.25) {
    return {
      background:
        "linear-gradient(135deg, color-mix(in srgb, #63cfa8 86%, #0c1622) 0%, color-mix(in srgb, #39e2a0 66%, #07111d) 100%)",
      borderColor: "rgba(99,207,168,0.46)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.11), inset 0 -16px 28px rgba(2,6,12,0.22), 0 0 22px rgba(99,207,168,0.14)",
      color: "#f2fff8",
    };
  }

  if (value >= 0.5) {
    return {
      background:
        "linear-gradient(135deg, color-mix(in srgb, #63cfa8 64%, #0c1622) 0%, color-mix(in srgb, #39e2a0 46%, #07111d) 100%)",
      borderColor: "rgba(99,207,168,0.32)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.07), inset 0 -16px 28px rgba(2,6,12,0.23)",
      color: "#f0f5ff",
    };
  }

  if (value >= 0.05) {
    return {
      background:
        "linear-gradient(135deg, color-mix(in srgb, #63cfa8 50%, #0c1622) 0%, color-mix(in srgb, #39e2a0 38%, #07111d) 100%)",
      borderColor: "rgba(99,207,168,0.26)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.058), inset 0 -16px 28px rgba(2,6,12,0.24)",
      color: "#f0f5ff",
    };
  }

  if (value >= -0.04) {
    return {
      background: "linear-gradient(135deg, #1b2738 0%, #0d1522 100%)",
      borderColor: "rgba(148,163,184,0.2)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.044), inset 0 -14px 26px rgba(2,6,12,0.23)",
      color: "#f0f5ff",
    };
  }

  if (value >= -0.49) {
    return {
      background:
        "linear-gradient(135deg, color-mix(in srgb, #e0556b 42%, #0c1622) 0%, color-mix(in srgb, #e0556b 28%, #07111d) 100%)",
      borderColor: "rgba(224,85,107,0.28)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -16px 28px rgba(2,6,12,0.24)",
      color: "#f0f5ff",
    };
  }

  if (value >= -0.99) {
    return {
      background:
        "linear-gradient(135deg, color-mix(in srgb, #e0556b 58%, #0c1622) 0%, color-mix(in srgb, #e0556b 42%, #07111d) 100%)",
      borderColor: "rgba(224,85,107,0.34)",
      boxShadow:
        "inset 0 1px 0 rgba(255,255,255,0.046), inset 0 -16px 28px rgba(2,6,12,0.24)",
      color: "#f0f5ff",
    };
  }

  return {
    background:
      "linear-gradient(135deg, color-mix(in srgb, #e0556b 76%, #0c1622) 0%, color-mix(in srgb, #e0556b 54%, #07111d) 100%)",
    borderColor: "rgba(224,85,107,0.42)",
    boxShadow:
      "inset 0 1px 0 rgba(255,255,255,0.052), inset 0 -16px 28px rgba(2,6,12,0.24), 0 0 16px rgba(224,85,107,0.08)",
    color: "#f0f5ff",
  };
}
