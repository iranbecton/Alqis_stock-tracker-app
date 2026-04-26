import { Badge } from "@/components/ui/badge";
import { Delta } from "@/components/ui/delta";
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
    <header className="grid gap-4 border-b border-border/60 pb-4 xl:grid-cols-[minmax(0,1fr)_23.5rem] xl:items-start xl:gap-6">
      <div className="space-y-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="live" size="md">
            {company.marketStatus}
          </Badge>
          <Badge variant="outline" size="md">
            {company.exchange}
          </Badge>
          <Badge variant="outline" size="md">
            {company.sector}
          </Badge>
          <span className="break-words text-body-sm text-ink-subtle">{company.statusDetail}</span>
        </div>

        <div className="space-y-2">
          <div>
            <p className="section-kicker">{company.symbol}</p>
            <h1 className="text-page-title break-words font-serif text-ink">{company.name}</h1>
          </div>
          <p className="reading-width text-body text-ink-muted sm:text-body-lg">{company.oneLineSummary}</p>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-ink-subtle">
            {company.quickFacts.map((fact) => (
              <div key={fact.label} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-border-strong" aria-hidden />
                <span>{fact.label}:</span>
                <span className="font-medium text-ink">{fact.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 xl:items-end">
        <WatchlistToggle
          ticker={watchlist.ticker}
          companyName={watchlist.companyName}
          initialSaved={watchlist.initialSaved}
        />

        <div className="w-full rounded-[var(--radius-xl)] border border-border/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_86%,var(--accent-ai)_8%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-secondary)_6%)_100%)] px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_16px_38px_rgba(2,6,10,0.14)] sm:px-5 xl:w-[23rem]">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-3">
            <p className="section-kicker text-accent-ai">Market snapshot</p>
            <span className="rounded-full border border-accent-secondary/14 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--accent-secondary)_18%)] px-3 py-1.5 text-body-sm text-ink-subtle">
              {asOf}
            </span>
          </div>

          <div className="flex flex-col gap-4 min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between">
            <div className="min-w-0">
              <p className="section-kicker">Current price</p>
              <div className="mt-1.5 flex flex-wrap items-end gap-3">
                <span className="text-[2.55rem] font-semibold tracking-tight text-ink sm:text-5xl" data-numeric>
                  {company.price}
                </span>
                <Delta
                  value={company.dailyChangePct}
                  absoluteChange={company.dailyChange}
                  format="both"
                  size="lg"
                />
              </div>
              <p className="mt-2 text-[0.86rem] leading-5 text-ink-muted">
                {company.quoteStatusDetail ??
                  "Price is connected to the current market snapshot."}
              </p>
            </div>
            <div className="w-fit rounded-[var(--radius-md)] border border-border/60 bg-surface/35 px-3 py-2 text-left min-[430px]:text-right">
              <p className="section-kicker">Status</p>
              <p className="mt-1 text-sm font-medium text-ink">
                {company.priceReadLabel ?? company.marketStatus}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2.5 min-[430px]:grid-cols-2">
            {(company.quoteStats ?? []).map((stat) => (
              <div
                key={stat.label}
                className="rounded-[var(--radius-md)] border border-border/60 bg-[color-mix(in_srgb,var(--surface-elevated)_86%,var(--surface-alt)_14%)] px-3 py-3"
              >
                <p className="section-kicker">{stat.label}</p>
                <p className="mt-1.5 text-sm font-medium text-ink" data-numeric>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3.5 grid grid-cols-1 gap-3 text-body-sm min-[430px]:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-border/60 bg-[color-mix(in_srgb,var(--surface)_76%,var(--accent-secondary)_24%)] px-3 py-3">
              <p className="section-kicker">Quote source</p>
              <p className="mt-1.5 font-medium text-ink">
                {company.quoteSourceLabel ?? "Market data"}
              </p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-border/60 bg-surface/45 px-3 py-3">
              <p className="section-kicker">Delay</p>
              <p className="mt-1.5 font-medium text-ink">
                {company.marketStatus.toLowerCase().includes("delayed")
                  ? "Delayed"
                  : "Provider timestamp"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
