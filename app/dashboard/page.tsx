import { redirect } from "next/navigation";
import Link from "next/link";
import { Activity, BookOpen, LogOut, Search } from "lucide-react";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import {
  AITaggedNewsCard,
  EarningsThisWeekCard,
  SectorPulseCard,
  TopMoversCard,
} from "@/components/dashboard/market-intelligence-modules";
import { MarketPulseRow } from "@/components/dashboard/market-pulse-row";
import { SessionTabs } from "@/components/dashboard/session-tabs";
import { TodayHero } from "@/components/dashboard/today-hero";
import { RecentReadsSection } from "@/components/explanations/recent-reads-section";
import { DailyBriefCard } from "@/components/market/daily-brief-card";
import { PreferencesPanel } from "@/components/preferences/preferences-panel";
import { TickerSearch } from "@/components/stocks/ticker-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WatchlistSection } from "@/components/watchlist/watchlist-section";
import { PageContainer } from "@/components/ui/layout";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import {
  type StockExplanationRow,
  toExplanationHistoryItem,
} from "@/lib/explanations/types";
import { demoStocks } from "@/lib/stocks/demo-stocks";
import { enrichWatchlistItems } from "@/lib/watchlist/intelligence";
import type { WatchlistApiItem } from "@/lib/watchlist/types";
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
  const recentReads = await getDashboardRecentReads(supabase, user.id);
  const preferences = await getUserPreferences(supabase, user.id);
  const popularReads = getPreferredMarketReads(preferences.defaultTicker);

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--background)_0%,#050b0f_100%)]">
      <header className="border-b border-border/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_97%,var(--surface)_3%)_0%,color-mix(in_srgb,var(--background)_88%,transparent)_100%)] backdrop-blur-xl">
        <PageContainer className="flex max-w-[90rem] flex-wrap items-center justify-between gap-3 py-3 sm:gap-4 sm:py-4">
          <div className="flex flex-wrap items-center gap-4">
            <AlqisLogo variant="lockup" tone="dark" size="sm" priority />
            <nav
              aria-label="Primary"
              className="flex min-h-10 items-center gap-1 rounded-full border border-border/60 bg-surface/38 p-1"
            >
              <Link
                href="/dashboard"
                aria-current="page"
                className="rounded-full bg-surface-elevated px-3 py-1.5 text-sm font-medium text-ink"
              >
                Today
              </Link>
              <Link
                href="/learn"
                className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-surface/60 hover:text-ink"
              >
                Learn
              </Link>
            </nav>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" size="md" className="h-11">
              <Link href="/dashboard#stock-search">
                <Search className="h-4 w-4" />
                Explain a Ticker
              </Link>
            </Button>
            {process.env.NODE_ENV !== "production" ? (
              <Button asChild variant="quiet" size="md" className="h-11">
                <Link href="/diagnostics">
                  <Activity className="h-4 w-4" />
                  Diagnostics
                </Link>
              </Button>
            ) : null}
            <form action={signOutAction}>
              <Button type="submit" variant="quiet" size="md" className="h-11">
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </form>
          </div>
        </PageContainer>
      </header>

      <PageContainer className="max-w-[90rem] py-5 sm:py-7 lg:py-8">
        <section className="space-y-6 lg:space-y-7">
          <div className="space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-3">
                <Badge variant="ai" size="md">
                  ALQIS Today
                </Badge>
                <div className="space-y-2">
                  <h1 className="font-serif text-[2.25rem] leading-[0.98] tracking-tight text-ink sm:text-[3.55rem] xl:text-[3.8rem]">
                    Market intelligence, explained first.
                  </h1>
                  <p className="break-words text-body leading-7 text-ink-muted sm:text-body-lg sm:leading-8">
                    Signed in as {user.email}. Today is organized around the
                    question that matters first: why the market and your saved
                    names are moving.
                  </p>
                </div>
              </div>

              <div className="w-full rounded-[var(--radius-xl)] border border-border/60 bg-surface/42 px-4 py-3 lg:w-auto lg:min-w-72">
                <p className="section-kicker">Today&apos;s Context</p>
                <p className="mt-1 break-words text-body-sm text-ink-muted">
                  Following: {demoStocks.map((stock) => stock.symbol).join(" / ")}
                </p>
                <p className="mt-2 text-body-sm text-accent-secondary">
                  Default read: {preferences.defaultTicker}
                </p>
              </div>
            </div>

            <SessionTabs />
          </div>

          <TodayHero
            generatedAt={formatDashboardTime(new Date())}
            defaultTicker={preferences.defaultTicker}
            watchlistCount={watchlistItems.length}
          />

          <MarketPulseRow />

          <DailyBriefCard briefFocus={preferences.briefFocus} />

          <section
            id="stock-search"
            className="space-y-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker text-accent-ai">Explain a ticker</p>
                <h2 className="mt-2 font-serif text-[1.65rem] leading-tight tracking-tight text-ink sm:text-[2.4rem]">
                  Stock Intelligence Search
                </h2>
              </div>
              <Button asChild variant="quiet" size="sm" className="min-h-10 w-fit">
                <Link href="/learn">
                  <BookOpen className="h-4 w-4" />
                  Learn terms
                </Link>
              </Button>
            </div>
            <TickerSearch />
          </section>

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.14fr)_minmax(22rem,0.86fr)]">
            <div className="min-w-0 space-y-5">
              <WatchlistSection
                initialItems={watchlistItems}
                initialError={watchlistError}
              />
              <RecentReadsSection items={recentReads} />
              <PreferencesPanel initialPreferences={preferences} />
            </div>

            <div className="min-w-0 space-y-5">
              <TopMoversCard stocks={popularReads} />
              <AITaggedNewsCard />
              <EarningsThisWeekCard />
              <SectorPulseCard />
            </div>
          </section>

          <p className="rounded-[var(--radius-lg)] border border-border/60 bg-surface/32 px-4 py-3 text-body-sm leading-6 text-ink-subtle">
            ALQIS explanations are informational only and do not constitute
            investment advice. Demo-labeled market pulse, sector, earnings, and
            AI-tagged news modules are placeholders until live providers are
            connected for those surfaces.
          </p>
        </section>
      </PageContainer>
    </main>
  );
}

function formatDashboardTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
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

async function getDashboardRecentReads(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from("stock_explanations")
    .select(
      "id,ticker,company_name,timeframe,summary,confidence_score,confidence_band,confidence_label,source_count,key_factors,counterevidence,generated_at,created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS explanations] Dashboard history load failed", {
        error,
      });
    }

    return [];
  }

  return ((data ?? []) as StockExplanationRow[])
    .map(toExplanationHistoryItem)
    .filter((item) => !isTestTicker(item.ticker))
    .slice(0, 6);
}

function getPreferredMarketReads(defaultTicker: string) {
  const normalizedDefault = defaultTicker.toUpperCase();
  const preferred = demoStocks.find((stock) => stock.symbol === normalizedDefault);
  const remaining = demoStocks.filter((stock) => stock.symbol !== normalizedDefault);

  return preferred ? [preferred, ...remaining] : demoStocks;
}

function isTestTicker(ticker: string) {
  const normalized = ticker.trim().toUpperCase();

  return (
    normalized === "FAKE123" ||
    normalized.startsWith("FAKE") ||
    normalized.includes("TEST")
  );
}
