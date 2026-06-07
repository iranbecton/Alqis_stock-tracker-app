"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Clock3, Moon, RadioTower, RefreshCw, Sparkles } from "lucide-react";
import { TickerSearch } from "@/components/stocks/ticker-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DailyMarketBrief } from "@/lib/market/brief";

export type DailyBriefResponse = DailyMarketBrief & {
  error?: string;
};

type TodayHeroProps = {
  generatedAt: string;
  defaultTicker: string;
  watchlistCount: number;
  userName?: string;
  portfolioTickers?: string[];
  fallbackTickers?: string[];
  brief: DailyBriefResponse | null;
  briefError: string | null;
  isBriefLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  compact?: boolean;
};

const supportCards = [
  {
    label: "Overnight",
    icon: Moon,
    title: "Asia closed mixed while Europe stabilized.",
    copy: "AI leaders remain firm, yields eased slightly, and crypto softened as macro headlines stayed in focus.",
  },
  {
    label: "Today's Catalysts",
    icon: Sparkles,
    title: "Fed minutes and earnings are the clean inputs.",
    copy: "Markets are watching policy tone, margin commentary, and AI infrastructure demand signals.",
  },
  {
    label: "Your Watchlist",
    icon: RadioTower,
    title: "Saved names shape the first read.",
    copy: "ALQIS checks your followed tickers first, then separates direct evidence from market context.",
  },
];

export function TodayHero({
  generatedAt,
  defaultTicker,
  watchlistCount,
  userName,
  portfolioTickers = [],
  fallbackTickers = [],
  brief,
  briefError,
  isBriefLoading,
  isRefreshing,
  onRefresh,
  compact = false,
}: TodayHeroProps) {
  const greeting = `Hey ${userName?.trim() || "there"}`;
  const generatedAtLabel = brief?.generatedAt
    ? formatBriefTime(brief.generatedAt)
    : generatedAt;
  const briefLabels = useMemo(() => getBriefSummaryLabels(brief), [brief]);
  const promptChips = useMemo(
    () =>
      buildPromptChips({
        brief,
        briefLabels,
        portfolioTickers,
        fallbackTickers,
        defaultTicker,
      }),
    [brief, briefLabels, portfolioTickers, fallbackTickers, defaultTicker]
  );

  return (
    <section
      className={`relative overflow-hidden rounded-[1.4rem] border ${
        compact ? "p-4 sm:p-5" : "p-6 sm:p-8"
      }`}
      style={{
        background:
          "radial-gradient(ellipse at 86% 0%, rgba(96,130,210,0.18), transparent 42%), radial-gradient(ellipse at 8% 0%, rgba(117,231,220,0.12), transparent 38%), linear-gradient(180deg, #1d2d3c 0%, #132230 55%, #0d1825 100%)",
        borderColor: "rgba(108,155,205,0.34)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.13), inset 0 0 0 1px rgba(255,255,255,0.05), 0 30px 72px rgba(2,6,12,0.64), 0 0 46px rgba(117,231,220,0.08)",
      }}
    >

      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="ai" size="md" className="bg-[color-mix(in_srgb,var(--info)_22%,transparent)] text-[var(--info)]">
            {brief?.session ? formatSessionLabel(brief.session) : "BRIEF"}
          </Badge>
          <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[rgba(86,126,176,0.25)] bg-[rgba(7,13,24,0.82)] px-3 text-body-sm text-[var(--ink-muted)]">
            <Clock3 className="h-3.5 w-3.5 text-accent-secondary" />
            {generatedAtLabel}
          </span>
        </div>
        <Button
          type="button"
          variant="quiet"
          size="sm"
          disabled={isRefreshing}
          onClick={onRefresh}
          className="min-h-9 border border-[rgba(86,126,176,0.25)] bg-[rgba(7,13,24,0.62)] text-[var(--ink-muted)]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className={`relative max-w-5xl space-y-2.5 ${compact ? "mt-4" : "mt-6"}`}>
        <p className="section-kicker text-[var(--accent)]">Market intelligence brief</p>
        <h1
          className={`font-serif leading-[1.04] tracking-tight text-[#eef6ff] drop-shadow-[0_14px_34px_rgba(2,6,12,0.45)] ${
            compact
              ? "text-[1.8rem] sm:text-[2.45rem] xl:text-[2.82rem]"
              : "text-[2rem] sm:text-[3.05rem] xl:text-[3.55rem]"
          }`}
        >
          {greeting}{" "}
          <span className="italic text-[#8cf4ed] drop-shadow-[0_0_18px_rgba(117,231,220,0.18)]">
            {brief
              ? getHeroBriefHeadline(brief)
              : briefError
                ? "market context is limited."
                : "market context is loading."}
          </span>
        </h1>
        <p
          className={`max-w-4xl text-[0.95rem] text-[var(--ink-muted)] sm:text-[1rem] ${
            compact ? "leading-6" : "leading-7"
          }`}
        >
          {brief
            ? getHeroBriefSummary(brief)
            : briefError
              ? "Daily brief context is temporarily unavailable. Refresh later or open an individual stock read for provider-specific context."
            : "ALQIS is checking your saved names, portfolio context, and available market data."}
        </p>
      </div>

      <div className={`relative grid gap-3 md:grid-cols-3 ${compact ? "mt-4" : "mt-5"}`}>
        {supportCards.map((card) => (
          <article
            key={card.label}
            className={`rounded-[1rem] border ${compact ? "p-3" : "p-4"}`}
            style={{
              background:
                "radial-gradient(circle at 96% 0%, rgba(117,231,220,0.12), transparent 42%), linear-gradient(180deg, rgba(18,34,54,0.96) 0%, rgba(8,17,30,0.92) 100%)",
              borderColor: "rgba(108,155,205,0.34)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.075), inset 0 0 0 1px rgba(255,255,255,0.025), 0 12px 28px rgba(0,0,0,0.40)",
            }}
          >
            <p className="section-kicker flex items-center gap-2 text-[var(--accent)]">
              <card.icon className="h-3.5 w-3.5" />
              {card.label}
            </p>
            <h2 className="mt-2 text-[0.92rem] font-semibold tracking-tight text-[#f2f7ff]">
              {card.title}
            </h2>
            {card.label === "Your Watchlist" ? (
              <div className="mt-1.5">
                {brief?.watchlistMovers.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {brief.watchlistMovers.slice(0, 3).map((mover) => (
                      <span
                        key={mover.ticker}
                        className="inline-flex items-center gap-1 rounded-full border border-[rgba(86,126,176,0.25)] bg-[rgba(7,13,24,0.58)] px-2 py-1 text-[0.72rem] font-semibold text-[#d9e9ff]"
                      >
                        {mover.ticker}
                        <span
                          className={
                            mover.direction === "up"
                              ? "text-[var(--gain)]"
                              : mover.direction === "down"
                                ? "text-[var(--loss)]"
                                : "text-[var(--ink-subtle)]"
                          }
                          data-numeric
                        >
                          {formatPercent(mover.changePercent)}
                        </span>
                        {mover.portfolioHeld ? (
                          <span className="text-[var(--accent)]">Tracked</span>
                        ) : null}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="overflow-hidden text-body-sm leading-5 text-[var(--ink-muted)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                    {watchlistCount > 0
                      ? card.copy
                      : "Save tickers to build your first intelligence list."}
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-1.5 overflow-hidden text-body-sm leading-5 text-[var(--ink-muted)] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                {card.copy}
              </p>
            )}
          </article>
        ))}
      </div>

      {isBriefLoading || briefError || briefLabels.length ? (
      <div className="relative mt-3 rounded-[0.9rem] border border-[rgba(86,126,176,0.22)] bg-[rgba(7,13,24,0.5)] px-3 py-2.5 text-body-sm text-[var(--ink-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="font-semibold text-[#d9e9ff]">Brief:</span>
          {isBriefLoading ? (
            <span>Preparing market context...</span>
          ) : briefError ? (
            <span>Market brief unavailable - check back shortly.</span>
          ) : (
            <>
              <span>{briefLabels.join(" · ")}</span>
              {brief?.generatedAt ? (
                <span className="text-[var(--ink-subtle)]">
                  Generated {formatBriefTime(brief.generatedAt)}
                </span>
              ) : null}
            </>
          )}
        </div>
        {brief?.portfolioNotes?.length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {brief.portfolioNotes.map((note) => (
              <span
                key={note}
                className="rounded-full border border-[rgba(117,231,220,0.22)] bg-[rgba(117,231,220,0.07)] px-2.5 py-1 text-[0.75rem] font-medium text-[#d9e9ff]"
              >
                {note}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      ) : null}

      <div className="relative mt-3 flex flex-col gap-3 border-t border-[rgba(86,126,176,0.22)] pt-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {promptChips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="min-h-9 rounded-full border border-[rgba(86,126,176,0.25)] bg-[rgba(7,13,24,0.82)] px-3.5 py-2 text-[0.82rem] font-medium text-[var(--ink-muted)] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] transition hover:border-[rgba(117,231,220,0.38)] hover:bg-[#102642] hover:text-[#eef6ff] focus-visible:outline-2 focus-visible:outline-accent"
            >
              {chip.label}
            </Link>
          ))}
        </div>
        <Button asChild variant="secondary" size="sm" className="min-h-10 shrink-0 border-[rgba(117,231,220,0.55)] bg-[var(--accent)] text-[#06121a] shadow-[0_0_20px_rgba(117,231,220,0.18)] hover:bg-[#5ab5ac]">
          <Link href={`/stocks/${defaultTicker}`}>
            Get ALQIS Read
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-2 text-body-sm text-[var(--ink-subtle)]">
        <span>Default read: <span className="font-medium text-[#eef6ff]">{defaultTicker}</span></span>
        <span className="h-1 w-1 rounded-full bg-[#3d6ca3]" aria-hidden />
        <span>{watchlistCount} saved names</span>
      </div>
      <div id="stock-search" className="relative mt-3 max-w-2xl">
        <TickerSearch
          chrome="nav"
          placeholder="Search a ticker, ask for a read..."
        />
      </div>
    </section>
  );
}

function getBriefSummaryLabels(brief: DailyBriefResponse | null) {
  if (!brief) {
    return [];
  }

  if (brief.status === "unavailable") {
    return [];
  }

  const labels = [
    ...brief.marketThemes.map((item) => item.label),
    ...brief.whatToWatch.map((item) => item.label),
  ]
    .map((label) => label.trim())
    .filter(isMarketBriefLabel)
    .filter(Boolean)
    .slice(0, 3);

  return labels;
}

type PromptChip = {
  label: string;
  href: string;
};

function buildPromptChips({
  brief,
  briefLabels,
  portfolioTickers,
  fallbackTickers,
  defaultTicker,
}: {
  brief: DailyBriefResponse | null;
  briefLabels: string[];
  portfolioTickers: string[];
  fallbackTickers: string[];
  defaultTicker: string;
}) {
  const chips: PromptChip[] = [];
  const seen = new Set<string>();

  if (brief?.watchlistMovers.length) {
    [...brief.watchlistMovers]
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .forEach((mover) => {
        addPromptChip(chips, seen, {
          label:
            mover.direction === "flat"
              ? `What changed for ${mover.ticker}?`
              : `Why is ${mover.ticker} ${mover.direction} today?`,
          href: `/stocks/${mover.ticker}`,
        });
      });
  }

  portfolioTickers.forEach((ticker) => {
    addPromptChip(chips, seen, {
      label: `What moved ${ticker} this week?`,
      href: `/stocks/${ticker}`,
    });
  });

  briefLabels
    .map(toCatalystPrompt)
    .filter((chip): chip is PromptChip => Boolean(chip))
    .forEach((chip) => addPromptChip(chips, seen, chip));

  fallbackTickers.forEach((ticker) => {
    addPromptChip(chips, seen, {
      label: `Why is ${ticker} moving today?`,
      href: `/stocks/${ticker}`,
    });
  });

  addPromptChip(chips, seen, {
    label: `What changed for ${defaultTicker}?`,
    href: `/stocks/${defaultTicker}`,
  });

  return chips.filter((chip) => !isDefinitionPrompt(chip.label)).slice(0, 4);
}

function addPromptChip(
  chips: PromptChip[],
  seen: Set<string>,
  chip: PromptChip
) {
  const ticker = chip.href.startsWith("/stocks/")
    ? chip.href.replace("/stocks/", "").toUpperCase()
    : "";
  const key = ticker || chip.label.toLowerCase();

  if (seen.has(key) || isDefinitionPrompt(chip.label)) {
    return;
  }

  seen.add(key);
  chips.push(chip);
}

function toCatalystPrompt(label: string) {
  const catalyst = label.trim();

  if (!isMarketCatalyst(catalyst)) {
    return undefined;
  }

  const ticker = catalyst.match(/\b[A-Z]{1,5}\b/)?.[0];

  if (ticker) {
    return {
      label: `What changed for ${ticker}?`,
      href: `/stocks/${ticker}`,
    };
  }

  return {
    label: `How did ${catalyst.toLowerCase()} affect markets?`,
    href: "/dashboard#stock-search",
  };
}

function isMarketCatalyst(label: string) {
  const normalized = label.toLowerCase();
  const catalystTerms = [
    "fed",
    "minutes",
    "earnings",
    "yield",
    "rates",
    "inflation",
    "pce",
    "cpi",
    "jobs",
    "guidance",
    "margin",
    "cloud",
    "ai",
    "tech",
    "semiconductor",
    "pressure",
    "follow-through",
    "concentration",
  ];

  return catalystTerms.some((term) => normalized.includes(term));
}

function isDefinitionPrompt(label: string) {
  return /^what\s+(are|is)\s+/i.test(label.trim());
}

function isMarketBriefLabel(label: string) {
  const normalized = label.toLowerCase();
  const internalLabels = new Set([
    "personalization",
    "market context limited",
    "brief limited",
    "data limited",
  ]);

  if (internalLabels.has(normalized)) {
    return false;
  }

  return !normalized.includes("save tickers");
}

function formatBriefTime(value: string) {
  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return "recently";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatSessionLabel(session: DailyMarketBrief["session"]) {
  if (session === "pre_market") return "PRE-MARKET";
  if (session === "market_open") return "MARKET OPEN";
  if (session === "midday") return "MIDDAY";
  if (session === "after_close") return "AFTER CLOSE";
  return "WEEKEND";
}

function getHeroBriefHeadline(brief: DailyMarketBrief) {
  const normalized = brief.headline.replace(/\s+/g, " ").trim();

  if (normalized.length <= 120) {
    return normalized;
  }

  return `${normalized.slice(0, 117).trim()}...`;
}

function getHeroBriefSummary(brief: DailyMarketBrief) {
  const normalized = brief.summary.replace(/\s+/g, " ").trim();

  if (normalized.length <= 260) {
    return normalized;
  }

  return `${normalized.slice(0, 257).trim()}...`;
}
