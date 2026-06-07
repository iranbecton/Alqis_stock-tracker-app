import { Bell, MoreVertical, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Delta } from "@/components/ui/delta";
import { ExplainThis } from "@/components/education/explain-this";
import { WatchlistToggle } from "@/components/watchlist/watchlist-toggle";
import type { stockDetailDemoData } from "@/lib/stock-detail-demo-data";

type CompanyData = typeof stockDetailDemoData.company & {
  quoteStats?: Array<{
    label: string;
    value: string;
  }>;
  quoteSourceLabel?: string;
  priceReadLabel?: string;
  quoteStatusDetail?: string;
};

type StockHeroHeaderProps = {
  company: CompanyData;
  asOf: string;
  watchlist: {
    initialSaved: boolean;
    ticker: string;
    companyName: string;
  };
};

export function StockHeroHeader({
  company,
  asOf,
  watchlist,
}: StockHeroHeaderProps) {
  return (
    <header className="relative grid gap-3 border-b border-[#2f72d5]/20 pb-3 xl:grid-cols-[minmax(0,1fr)_25rem] xl:items-end xl:gap-x-5">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-[0.45rem] border border-[#446890]/38 bg-[#12243d] text-base font-bold text-[#f5f1e8] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            {company.symbol.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[1.9rem] font-semibold leading-none tracking-tight text-[#f5f1e8] sm:text-[2.3rem]">
                {company.symbol}
              </h1>
              <Badge variant="outline" size="sm" className="border-[#446890]/45 bg-[#07111f]/58">
                {company.exchange}
              </Badge>
            </div>
            <p className="mt-1 text-body-sm text-[#91a9c6]">
              {company.name} / {company.sector}
            </p>
          </div>
          <Badge variant="ai" size="sm" className="border-accent-secondary/22 bg-accent-secondary/10 text-accent-secondary">
            <Sparkles className="h-3.5 w-3.5" />
            ALQIS Read active
          </Badge>
          <Badge variant="live" size="sm">
            {company.marketStatus}
          </Badge>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="section-kicker inline-flex items-center gap-1.5 text-[#7189a8]">
              Current price
              <ExplainThis termId="current-price" compact />
            </p>
            <div className="mt-1 flex flex-wrap items-end gap-3">
              <span className="text-[2.7rem] font-semibold leading-none tracking-tight text-[#f5f1e8] sm:text-[3.4rem]" data-numeric>
                {company.price}
              </span>
              <Delta
                value={company.dailyChangePct}
                absoluteChange={company.dailyChange}
                format="both"
                size="lg"
              />
              <span className="mb-1 rounded-full border border-accent-secondary/16 bg-accent-secondary/8 px-2.5 py-1 text-xs text-accent-secondary">
                {company.statusDetail}
              </span>
            </div>
            <p className="mt-1.5 max-w-[62rem] text-body-sm leading-5 text-[#91a9c6]">
              {company.quoteStatusDetail ?? "Provider quote data is used where available."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 md:justify-end">
            <WatchlistToggle
              ticker={watchlist.ticker}
              companyName={watchlist.companyName}
              initialSaved={watchlist.initialSaved}
            />
            <button
              type="button"
              disabled
              className="inline-flex h-11 items-center gap-2 rounded-[0.9rem] border border-[#446890]/34 bg-[#07111f]/62 px-3 text-sm font-semibold text-[#d8e8ff]"
              aria-disabled="true"
            >
              <Bell className="h-4 w-4" />
              Alert
            </button>
            <button
              type="button"
              disabled
              className="grid h-11 w-11 place-items-center rounded-[0.9rem] border border-[#446890]/34 bg-[#07111f]/62 text-[#d8e8ff]"
              aria-label="More stock options"
              aria-disabled="true"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-px overflow-hidden border border-[#2f72d5]/20 bg-[#2f72d5]/12 sm:grid-cols-2">
        <div className="bg-[#07111f]/78 px-3 py-2.5 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="section-kicker text-accent-secondary">Latest data</p>
            <span className="text-xs text-[#91a9c6]">{asOf}</span>
          </div>
          <p className="mt-1 text-body-sm text-[#91a9c6]">{company.priceReadLabel ?? company.marketStatus}</p>
        </div>
        {(company.quoteStats ?? []).map((stat) => (
          <div
            key={stat.label}
            className="bg-[#07111f]/78 px-3 py-2.5"
          >
            <p className="section-kicker inline-flex items-center gap-1.5">
              {stat.label}
              {getQuoteStatTermId(stat.label) ? (
                <ExplainThis termId={getQuoteStatTermId(stat.label) ?? ""} compact />
              ) : null}
            </p>
            <p className="mt-1.5 text-sm font-medium text-ink" data-numeric>
              {stat.value}
            </p>
          </div>
        ))}
        <div className="bg-[linear-gradient(180deg,rgba(22,53,89,0.76),rgba(7,17,31,0.82))] px-3 py-2.5">
          <p className="section-kicker">Quote source</p>
          <p className="mt-1.5 text-sm font-medium text-ink">
            {company.quoteSourceLabel ?? "Market data"}
          </p>
        </div>
        <div className="bg-[#07111f]/78 px-3 py-2.5">
          <p className="section-kicker inline-flex items-center gap-1.5">
            Delay
            <ExplainThis termId="market-delayed" compact />
          </p>
          <p className="mt-1.5 text-sm font-medium text-ink">
            {company.marketStatus.toLowerCase().includes("delayed")
              ? "Delayed"
              : "Provider timestamp"}
          </p>
        </div>
      </div>

      <p className="max-w-[72rem] border-l-2 border-accent-secondary/60 bg-[#07111f]/42 px-3 py-2 text-body-sm leading-5 text-[#a9bad0] xl:col-span-2">
        {company.oneLineSummary}
      </p>
    </header>
  );
}

function getQuoteStatTermId(label: string) {
  const normalized = label.toLowerCase();

  if (normalized.includes("prev")) {
    return "previous-close";
  }

  if (normalized === "open") {
    return "open";
  }

  if (normalized === "high") {
    return "high";
  }

  if (normalized === "low") {
    return "low";
  }

  return null;
}
