import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Bookmark,
  BrainCircuit,
  ExternalLink,
  LineChart,
  LogOut,
  Sparkles,
} from "lucide-react";
import { TickerSearch } from "@/components/stocks/ticker-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WatchlistRemoveButton } from "@/components/watchlist/watchlist-remove-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageContainer } from "@/components/ui/layout";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { demoStocks } from "@/lib/stocks/demo-stocks";
import { enrichWatchlistItems } from "@/lib/watchlist/intelligence";
import type {
  WatchlistApiItem,
  WatchlistIntelligenceItem,
} from "@/lib/watchlist/types";
import { signOutAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!hasSupabaseEnv()) {
    redirect(
      "/login?error=Supabase%20environment%20variables%20are%20required%20before%20opening%20the%20dashboard."
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { items: savedWatchlistItems, error: watchlistError } =
    await getDashboardWatchlist(supabase, user.id);
  const watchlistItems = watchlistError
    ? []
    : await enrichWatchlistItems(savedWatchlistItems);

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--background)_0%,#050b0f_100%)]">
      <header className="border-b border-border/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_97%,var(--surface)_3%)_0%,color-mix(in_srgb,var(--background)_88%,transparent)_100%)] backdrop-blur-xl">
        <PageContainer className="flex items-center justify-between gap-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-lg)] border border-accent-ai/16 bg-[color-mix(in_srgb,var(--accent-ai)_14%,transparent)] text-sm font-semibold tracking-[0.2em] text-accent-ai">
              A
            </div>
            <div>
              <p className="section-kicker">ALQIS</p>
              <p className="text-body-sm text-ink-muted">Market intelligence workspace</p>
            </div>
          </div>

          <form action={signOutAction}>
            <Button type="submit" variant="quiet" size="md">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </form>
        </PageContainer>
      </header>

      <PageContainer className="py-8 sm:py-10">
        <section className="space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge variant="ai" size="md">
                <BrainCircuit className="h-3.5 w-3.5" />
                Protected intelligence shell
              </Badge>
              <div className="space-y-2">
                <h1 className="font-serif text-[2.6rem] leading-none tracking-tight text-ink sm:text-[3.75rem]">
                  Welcome to ALQIS.
                </h1>
                <p className="text-body-lg text-ink-muted">
                  Signed in as {user.email}. Search a ticker to open the explanation-led stock detail screen.
                </p>
              </div>
            </div>

            <div className="rounded-[var(--radius-xl)] border border-border/60 bg-surface/42 px-4 py-3">
              <p className="section-kicker">Tracked universe</p>
              <p className="mt-1 text-body-sm text-ink-muted">
                {demoStocks.map((stock) => stock.symbol).join(" / ")}
              </p>
            </div>
          </div>

          <WatchlistCard items={watchlistItems} error={watchlistError} />

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.42fr)]">
            <div className="space-y-4">
              <div>
                <p className="section-kicker">Stock intelligence search</p>
                <h2 className="mt-2 font-serif text-[2rem] leading-tight tracking-tight text-ink sm:text-[2.4rem]">
                  Search for a market read.
                </h2>
              </div>
              <TickerSearch />
            </div>

            <DashboardPlaceholder
              icon={<Sparkles className="h-5 w-5" />}
              label="Why Is It Moving?"
              title="Every stock page starts with the first answer."
              description="Search routes into an explanation-first view with proof-of-move charting, key drivers, counterevidence, and peer read-through."
              tone="ai"
            />
          </section>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.42fr)]">
            <Card variant="subtle" radius="xl" className="border-border/72">
              <CardHeader>
                <CardEyebrow>Popular market reads</CardEyebrow>
                <CardTitle>Open a market read.</CardTitle>
                <CardDescription>
                  Jump into tracked names that already support quote, chart, news, and structured explanation reads.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2">
                  {demoStocks.slice(0, 4).map((stock) => (
                    <Link
                      key={stock.symbol}
                      href={`/stocks/${stock.symbol}`}
                      className="group rounded-[var(--radius-lg)] border border-border/70 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--surface)_18%)] p-4 transition duration-[var(--duration-fast)] hover:border-border-strong hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-ink">{stock.symbol}</p>
                          <p className="mt-1 text-body-sm text-ink-muted">
                            {stock.companyName}
                          </p>
                        </div>
                        <Badge
                          variant={stock.dailyChangePercent >= 0 ? "gain" : "loss"}
                          size="sm"
                        >
                          {stock.dailyChangePercent >= 0 ? "+" : ""}
                          {stock.dailyChangePercent.toFixed(2)}%
                        </Badge>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-body-sm text-ink-subtle">
                        <LineChart className="h-4 w-4 text-accent-secondary" />
                        {stock.headline}
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <DashboardPlaceholder
              icon={<LineChart className="h-5 w-5" />}
              label="Search a stock"
              title="Build your watchlist from market reads."
              description="Use search or popular reads to open a ticker, then save it into your personal ALQIS watchlist."
            />
          </div>
        </section>
      </PageContainer>
    </main>
  );
}

async function getDashboardWatchlist(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<{
  items: WatchlistApiItem[];
  error?: string;
}> {
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("id,ticker,company_name,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS watchlist] Dashboard load failed", { error });
    }

    return {
      items: [],
      error: "Watchlist unavailable. Try refreshing after your database migration is applied.",
    };
  }

  return {
    items: (data ?? []).map((item) => ({
      id: item.id,
      ticker: item.ticker,
      companyName: item.company_name,
      createdAt: item.created_at,
    })),
  };
}

function WatchlistCard({
  items,
  error,
}: {
  items: WatchlistIntelligenceItem[];
  error?: string;
}) {
  return (
    <Card
      variant="subtle"
      radius="xl"
      className="border-accent-ai/16 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_84%,var(--accent-ai)_9%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-secondary)_4%)_100%)] shadow-[0_24px_60px_rgba(2,6,10,0.22)]"
    >
      <CardHeader>
        <CardEyebrow>
          <Bookmark className="h-3.5 w-3.5" />
          Your Watchlist
        </CardEyebrow>
        <CardTitle>Saved market reads.</CardTitle>
        <CardDescription>
          Personal tickers you want ALQIS to keep close for explanation-led review.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {error ? (
          <div className="rounded-[var(--radius-lg)] border border-warn/20 bg-warn-bg/28 px-4 py-3 text-body-sm text-warn">
            {error}
          </div>
        ) : items.length ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="group min-w-0 rounded-[var(--radius-lg)] border border-border/70 bg-[color-mix(in_srgb,var(--surface-elevated)_84%,var(--surface)_16%)] p-4 transition duration-[var(--duration-fast)] hover:border-accent-secondary/35 hover:bg-surface-elevated"
              >
                <div className="flex h-full min-w-0 flex-col gap-4">
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="min-w-0 truncate text-lg font-semibold tracking-tight text-ink">
                          {item.ticker}
                        </p>
                        <Badge variant={getDirectionBadgeVariant(item.direction)} size="sm">
                          {formatDirection(item.direction)}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-body-sm font-medium text-ink-muted">
                        {item.companyName ?? "Saved ticker"}
                      </p>
                    </div>
                    <div className="min-w-[7.25rem] shrink-0 text-right">
                      <p className="text-lg font-semibold tracking-tight text-ink" data-numeric>
                        {formatCurrencyOrDash(item.currentPrice)}
                      </p>
                      <p className={getMoveClassName(item.direction)} data-numeric>
                        {formatMove(item.change, item.changePercent)}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/stocks/${item.ticker}`}
                    className="min-w-0 flex-1 rounded-[var(--radius-md)] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-4"
                  >
                    <div className="flex min-w-0 flex-wrap gap-2">
                      {item.sector ? (
                        <Badge variant="outline" size="sm" className="max-w-full normal-case tracking-normal">
                          {item.sector}
                        </Badge>
                      ) : null}
                      <Badge variant="ai" size="sm" className="max-w-full normal-case tracking-normal">
                        {item.confidence ?? item.readStatus}
                      </Badge>
                      <Badge
                        variant="outline"
                        size="sm"
                        className="max-w-full normal-case tracking-normal"
                      >
                        {formatProviderStatus(item.providerStatus)}
                      </Badge>
                    </div>
                    <p className="mt-4 overflow-hidden break-words text-body-sm leading-6 text-ink [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
                      {shortenQuickRead(item.quickRead)}
                    </p>
                  </Link>

                  <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/60 pt-3">
                    <Button asChild variant="quiet" size="sm" className="min-w-0">
                      <Link href={`/stocks/${item.ticker}`}>
                        <span className="truncate">Open read</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <WatchlistRemoveButton ticker={item.ticker} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            variant="compact"
            icon={<Bookmark className="h-5 w-5" />}
            title="No saved tickers yet."
            description="Search a stock and save it to start building your ALQIS watchlist."
            className="rounded-[var(--radius-lg)] border border-dashed border-border/70 bg-surface/45 px-5 py-6"
          />
        )}
      </CardContent>
    </Card>
  );
}

function getDirectionBadgeVariant(direction: WatchlistIntelligenceItem["direction"]) {
  if (direction === "up") return "gain";
  if (direction === "down") return "loss";
  return "outline";
}

function formatDirection(direction: WatchlistIntelligenceItem["direction"]) {
  if (direction === "up") return "Up";
  if (direction === "down") return "Down";
  return "Flat";
}

function getMoveClassName(direction: WatchlistIntelligenceItem["direction"]) {
  const base = "mt-1 whitespace-nowrap text-[0.82rem] font-medium leading-5";

  if (direction === "up") {
    return `${base} text-gain`;
  }

  if (direction === "down") {
    return `${base} text-loss`;
  }

  return `${base} text-ink-subtle`;
}

function formatProviderStatus(status: WatchlistIntelligenceItem["providerStatus"]) {
  if (status === "ok") return "Live data";
  if (status === "partial") return "Partial data";
  return "Provider unavailable";
}

function formatCurrencyOrDash(value: number | null) {
  if (typeof value !== "number") {
    return "N/A";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 2 : 2,
  }).format(value);
}

function formatMove(change: number | null, changePercent: number | null) {
  if (typeof change !== "number" || typeof changePercent !== "number") {
    return "Data unavailable";
  }

  const changePrefix = change >= 0 ? "+" : "";
  const pctPrefix = changePercent >= 0 ? "+" : "";

  return `${changePrefix}${formatCompactNumber(change)} / ${pctPrefix}${changePercent.toFixed(2)}%`;
}

function shortenQuickRead(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();

  if (normalized.length <= 132) {
    return normalized;
  }

  return `${normalized.slice(0, 129).trim()}...`;
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function DashboardPlaceholder({
  icon,
  label,
  title,
  description,
  tone = "default",
}: {
  icon: ReactNode;
  label: string;
  title: string;
  description: string;
  tone?: "default" | "ai";
}) {
  return (
    <Card
      variant="subtle"
      radius="xl"
      className={
        tone === "ai"
          ? "border-accent-ai/14 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_84%,var(--accent-ai)_10%)_0%,color-mix(in_srgb,var(--surface)_94%,var(--accent-ai)_6%)_100%)]"
          : "border-border/70"
      }
    >
      <CardHeader>
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] border border-border/70 bg-surface/60 text-accent-secondary">
          {icon}
        </div>
        <CardDescription>{label}</CardDescription>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-body text-ink-muted">{description}</p>
      </CardContent>
    </Card>
  );
}
