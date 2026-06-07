"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BriefcaseBusiness } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  PortfolioHoldingWithCalcs,
  PortfolioHoldingsResponse,
} from "@/lib/portfolio/types";
import { cn, formatLargeNumber } from "@/lib/utils";

const DASH = "\u2014";

export function DashboardPortfolioCard() {
  const [data, setData] = useState<PortfolioHoldingsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isActive = true;

    async function loadPortfolio() {
      try {
        const response = await fetch("/api/portfolio/holdings", {
          credentials: "same-origin",
        });

        if (!response.ok) {
          throw new Error("Portfolio unavailable.");
        }

        const payload = (await response.json()) as PortfolioHoldingsResponse;

        if (isActive) {
          setData(payload);
        }
      } catch {
        if (isActive) {
          setError(true);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    void loadPortfolio();

    return () => {
      isActive = false;
    };
  }, []);

  const holdings = data?.holdings ?? [];
  const summary = data?.summary;
  const dayChange = getPortfolioDayChange(holdings);
  const sectorNote = getConcentratedSectorNote(holdings);

  return (
    <section className="rounded-[1.25rem] border border-[rgba(108,155,205,0.34)] bg-[radial-gradient(ellipse_at_10%_0%,rgba(117,231,220,0.10),transparent_34%),linear-gradient(180deg,#1a2836_0%,#111d29_55%,#0c1622_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_0_0_1px_rgba(255,255,255,0.04),0_24px_56px_rgba(2,6,12,0.58)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="section-kicker text-[var(--accent)]">Portfolio</p>
            <Badge
              variant="outline"
              size="sm"
              className="border-[#72c7be]/25 bg-[#72c7be]/10 text-[#9de1dc]"
            >
              Manual tracker
            </Badge>
          </div>
          <p
            className="mt-5 text-[2rem] font-black leading-none tracking-tight text-[#f4f8ff] sm:text-[2.45rem]"
            data-numeric
          >
            {loading ? DASH : formatCurrency(summary?.total_current_value)}
          </p>
          <p
            className={cn(
              "mt-2 text-sm font-black text-[#8ca0b8]",
              typeof summary?.total_gain_loss_value === "number" &&
                summary.total_gain_loss_value > 0 &&
                "text-[var(--gain)]",
              typeof summary?.total_gain_loss_value === "number" &&
                summary.total_gain_loss_value < 0 &&
                "text-[var(--loss)]"
            )}
            data-numeric
          >
            {loading ? DASH : formatGainLoss(summary?.total_gain_loss_value, summary?.total_gain_loss_pct)}
          </p>
          {dayChange ? (
            <p
              className={cn(
                "mt-1 text-sm font-black text-[#8ca0b8]",
                dayChange.value > 0 && "text-[var(--gain)]",
                dayChange.value < 0 && "text-[var(--loss)]"
              )}
              data-numeric
            >
              Day {formatDayChange(dayChange.value, dayChange.pct)}
            </p>
          ) : null}
        </div>
        <Button
          asChild
          variant="quiet"
          size="sm"
          className="border border-[rgba(117,231,220,0.32)] text-[#9de1dc]"
        >
          <Link href="/portfolio">
            Open Tracker
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-5 grid max-w-xl grid-cols-3 border-y border-[rgba(70,105,150,0.22)] py-3">
        <Metric label="Holdings" value={loading ? DASH : String(summary?.holdings_count ?? 0)} />
        <Metric label="Cost Basis" value={loading ? DASH : formatCurrency(summary?.total_cost_basis)} />
        <Metric
          label="Data"
          value={summary?.has_data_limited || error ? "Data limited" : loading ? DASH : "Available"}
        />
      </div>

      {loading ? (
        <div className="mt-4 grid gap-2">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-11 animate-pulse rounded-[0.8rem] bg-white/[0.04]" />
          ))}
        </div>
      ) : error ? (
        <p className="mt-4 rounded-[0.85rem] border border-[#c9877a]/24 bg-[#c9877a]/10 px-3 py-2 text-sm text-[#f1c3bb]">
          Portfolio unavailable.
        </p>
      ) : holdings.length ? (
        <div className="mt-4 divide-y divide-[rgba(70,105,150,0.18)]">
          {holdings.slice(0, 4).map((holding) => (
            <DashboardHoldingRow key={holding.id} holding={holding} />
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-[1rem] border border-dashed border-[rgba(117,231,220,0.22)] bg-[rgba(7,17,30,0.42)] px-4 py-5">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-[#72c7be]/24 bg-[#72c7be]/10 text-[#72c7be]">
              <BriefcaseBusiness className="h-4 w-4" />
            </span>
            <div>
              <p className="font-black text-[#f4f8ff]">Track your holdings</p>
              <p className="mt-1 text-sm leading-6 text-[#8ca0b8]">
                Add manually entered positions to monitor current value and gain/loss.
              </p>
              <Button
                asChild
                variant="quiet"
                size="sm"
                className="mt-3 border border-[rgba(117,231,220,0.32)] text-[#9de1dc]"
              >
                <Link href="/portfolio">Get Started</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {sectorNote ? (
        <p className="mt-3 rounded-[0.8rem] border border-[#d2a96b]/22 bg-[#d2a96b]/10 px-3 py-2 text-sm text-[#e6c27d]">
          Concentrated in {sectorNote}
        </p>
      ) : null}

      <p className="mt-3 text-body-sm text-[#74869d]">
        Tracking only &mdash; no trades.
      </p>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.68rem] font-black uppercase tracking-[0.16em] text-[#74869d]">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-[#f4f8ff]" data-numeric>
        {value}
      </p>
    </div>
  );
}

function DashboardHoldingRow({ holding }: { holding: PortfolioHoldingWithCalcs }) {
  return (
    <div className="grid grid-cols-[4.25rem_minmax(0,1fr)_auto] items-center gap-3 py-3">
      <div>
        <p className="font-black text-[#f4f8ff]">{holding.ticker}</p>
        <p className="text-xs text-[#8ca0b8]" data-numeric>
          {formatShares(holding.shares)} sh
        </p>
      </div>
      <div className="min-w-0">
        <p className="text-sm text-[#8ca0b8]">Current value</p>
        {holding.price_status === "data-limited" ? (
          <Badge
            variant="outline"
            size="sm"
            className="mt-1 border-[#7da6d9]/30 bg-[#7da6d9]/10 text-[#9ec3f0]"
          >
            Data limited
          </Badge>
        ) : null}
      </div>
      <div className="text-right">
        <p className="font-black text-[#f4f8ff]" data-numeric>
          {formatCurrency(holding.current_value)}
        </p>
        <p
          className={cn(
            "mt-1 text-xs font-black text-[#8ca0b8]",
            typeof holding.gain_loss_value === "number" &&
              holding.gain_loss_value > 0 &&
              "text-[var(--gain)]",
            typeof holding.gain_loss_value === "number" &&
              holding.gain_loss_value < 0 &&
              "text-[var(--loss)]"
          )}
          data-numeric
        >
          {formatPercent(holding.gain_loss_pct)}
        </p>
      </div>
    </div>
  );
}

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== "number") {
    return DASH;
  }

  if (Math.abs(value) >= 1_000_000) {
    return formatLargeNumber(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatGainLoss(value: number | null | undefined, pct: number | null | undefined) {
  if (typeof value !== "number" || typeof pct !== "number") {
    return DASH;
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${formatCurrency(value)} (${sign}${pct.toFixed(2)}%)`;
}

function formatDayChange(value: number, pct: number) {
  const sign = value > 0 ? "+" : "";

  return `${sign}${formatCurrency(value)} (${sign}${(pct * 100).toFixed(2)}%)`;
}

function formatPercent(value: number | null | undefined) {
  if (typeof value !== "number") {
    return DASH;
  }

  const sign = value > 0 ? "+" : "";

  return `${sign}${value.toFixed(2)}%`;
}

function formatShares(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 6,
  }).format(value);
}

function getPortfolioDayChange(holdings: PortfolioHoldingWithCalcs[]) {
  const holdingsWithDayChange = holdings.filter(
    (holding) =>
      typeof holding.day_change_value === "number" &&
      typeof holding.prev_close === "number" &&
      holding.prev_close > 0
  );

  if (!holdingsWithDayChange.length) {
    return null;
  }

  const value = holdingsWithDayChange.reduce(
    (sum, holding) => sum + (holding.day_change_value ?? 0),
    0
  );
  const previousValue = holdingsWithDayChange.reduce(
    (sum, holding) => sum + holding.shares * (holding.prev_close ?? 0),
    0
  );

  return previousValue > 0 ? { value, pct: value / previousValue } : null;
}

function getConcentratedSectorNote(holdings: PortfolioHoldingWithCalcs[]) {
  const totalValue = holdings.reduce(
    (sum, holding) => sum + (holding.current_value ?? 0),
    0
  );
  const allocations = holdings
    .map((holding) => holding.allocation_pct)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => b - a);
  const topHoldingPct = allocations[0] ?? 0;
  const topThreePct = allocations.slice(0, 3).reduce((sum, value) => sum + value, 0);
  const isConcentrated = topHoldingPct > 40 || topThreePct > 70;

  if (totalValue <= 0 || !isConcentrated) {
    return null;
  }

  const sectorValues = new Map<string, number>();

  holdings.forEach((holding) => {
    if (typeof holding.current_value !== "number" || !holding.sector) {
      return;
    }

    sectorValues.set(
      holding.sector,
      (sectorValues.get(holding.sector) ?? 0) + holding.current_value
    );
  });

  const topSector = [...sectorValues.entries()]
    .map(([sector, value]) => ({ sector, pct: (value / totalValue) * 100 }))
    .sort((a, b) => b.pct - a.pct)[0];

  return topSector?.sector ?? null;
}
