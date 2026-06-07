import { redirect } from "next/navigation";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  Activity,
  LogOut,
  Sparkles,
} from "lucide-react";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import {
  EarningsThisWeekCard,
  SectorPulseCard,
  TopMoversCard,
} from "@/components/dashboard/market-intelligence-modules";
import { DashboardBriefCoordinator } from "@/components/dashboard/dashboard-brief-coordinator";
import { MarketNewsFeed } from "@/components/dashboard/market-news-feed";
import { MarketPulseRow } from "@/components/dashboard/market-pulse-row";
import { SectorCascadeFeed } from "@/components/dashboard/sector-cascade-feed";
import { RecentReadsSection } from "@/components/explanations/recent-reads-section";
import { DashboardPortfolioCard } from "@/components/portfolio/dashboard-portfolio-card";
import { Button } from "@/components/ui/button";
import { TickerSearch } from "@/components/stocks/ticker-search";
import { WatchlistSection } from "@/components/watchlist/watchlist-section";
import { PageContainer } from "@/components/ui/layout";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import { hasCompletedOnboarding } from "@/lib/profile/investor-profile";
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

  const completedOnboarding = await hasCompletedOnboarding(supabase, user.id);

  if (!completedOnboarding) {
    redirect("/onboarding");
  }

  const { items: savedWatchlistItems, error: watchlistError } =
    await getDashboardWatchlist(supabase, user.id);
  const watchlistItems = watchlistError
    ? []
    : await enrichWatchlistItems(savedWatchlistItems);
  const recentReads = await getDashboardRecentReads(supabase, user.id);
  const preferences = await getUserPreferences(supabase, user.id);
  const portfolioTickers = await getDashboardPortfolioTickers(supabase, user.id);
  const popularReads = getPreferredMarketReads(preferences.defaultTicker);
  const dashboardNewsTickers = getDashboardNewsTickers({
    watchlistTickers: savedWatchlistItems.map((item) => item.ticker),
    portfolioTickers,
    fallbackTickers: popularReads.map((stock) => stock.symbol),
  });
  const profileFullName = await getDashboardProfileFullName(supabase, user.id);
  const userName = getDashboardUserName({
    fullName: profileFullName,
    email: user.email,
  });

  return (
    <main
      className="min-h-dvh overflow-x-hidden bg-[#03060b] text-[var(--ink)]"
      style={{
        "--ink": "#f4f8ff",
        "--ink-muted": "#a7b7cc",
        "--ink-subtle": "#74869d",
        "--accent": "#75e7dc",
        "--gain": "#39e2a0",
        "--loss": "#ff7580",
        "--info": "#86b7d4",
      } as CSSProperties}
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_8%,rgba(35,92,142,0.24),transparent_34rem),radial-gradient(ellipse_at_70%_24%,rgba(92,84,180,0.13),transparent_36rem),radial-gradient(ellipse_at_34%_22%,rgba(45,184,170,0.11),transparent_30rem),linear-gradient(180deg,#03060b,#06101b_48%,#03060b)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(125,166,217,0.009)_1px,transparent_1px),linear-gradient(90deg,rgba(125,166,217,0.008)_1px,transparent_1px)] bg-[size:118px_118px] opacity-[0.065] [mask-image:linear-gradient(180deg,#000,transparent_68%)]" />
      <header className="relative z-20 border-b border-[rgba(86,126,176,0.18)] bg-[rgba(4,8,15,0.92)] backdrop-blur-xl">
        <PageContainer className="max-w-[98rem] py-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#4f6684]">
            <span>VOL. 1 / ISSUE 274</span>
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()} / ALQIS TODAY</span>
          </div>
          <div className="mt-2 grid gap-3 xl:grid-cols-[auto_minmax(0,1fr)_auto] xl:items-center">
            <div className="flex flex-wrap items-center gap-4">
            <AlqisLogo variant="lockup" tone="dark" size="sm" priority />
            <nav
              aria-label="Primary"
                className="scrollbar-dark flex min-h-9 max-w-full items-center gap-1 overflow-x-auto rounded-full border border-[rgba(86,126,176,0.22)] bg-[rgba(7,13,24,0.9)] p-1"
            >
                <NavPill href="/dashboard" active label="Today" />
                <NavPill href="#watchlist" label="Watchlist" />
                <NavPill href="/portfolio" label="Portfolio" />
                <NavPill href="#stock-search" label="Explore" />
                <NavPill href="#earnings" label="Alerts" muted />
                <NavPill href="/learn" label="Learn" />
            </nav>
          </div>

            <TickerSearch
              chrome="nav"
              placeholder="Search a ticker, ask for a read..."
              showShortcut
              className="xl:min-w-[24rem]"
            />

            <div className="flex flex-wrap items-center gap-2 xl:justify-end">
              <div className="hidden min-h-10 items-center gap-3 rounded-[0.85rem] border border-[rgba(86,126,176,0.22)] bg-[rgba(7,13,24,0.92)] px-3 md:flex">
                <div>
                  <p className="text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#5f7898]">
                    Watchlist
                  </p>
                  <p className="text-sm font-semibold text-[#f2f7ff]" data-numeric>
                    {watchlistItems.length} saved
                  </p>
                </div>
                <span className="text-sm font-semibold text-[#86b7d4]">
                  Tracking only
                </span>
              </div>
              <Button asChild variant="secondary" size="sm" className="min-h-10 border-[rgba(117,231,220,0.38)] bg-[rgba(10,21,38,0.92)] text-[var(--accent)]">
                <Link href="/dashboard#stock-search">
                  <Sparkles className="h-4 w-4" />
                  Ask ALQIS
              </Link>
            </Button>
            {process.env.NODE_ENV !== "production" ? (
                <Button asChild variant="quiet" size="sm" className="min-h-10 border border-[rgba(86,126,176,0.22)]">
                <Link href="/diagnostics">
                  <Activity className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
            <form action={signOutAction}>
                <Button type="submit" variant="quiet" size="sm" className="min-h-10 border border-[rgba(86,126,176,0.22)]">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
              <Link
                href="/profile"
                aria-label="Open profile settings"
                className="grid h-10 w-10 place-items-center rounded-full border border-[rgba(139,132,199,0.34)] bg-[rgba(28,36,68,0.72)] text-sm font-semibold text-[#d9e9ff] shadow-[0_0_10px_rgba(139,132,199,0.1)] transition hover:border-[rgba(117,231,220,0.5)] hover:text-[#f4f8ff]"
              >
                {userName?.charAt(0) ?? "A"}
              </Link>
            </div>
          </div>
        </PageContainer>
      </header>

      <PageContainer className="relative z-10 max-w-[98rem] py-4 sm:py-5 lg:py-6">
        <section className="space-y-3.5 lg:space-y-4">
          <DashboardBriefCoordinator
            generatedAt={formatDashboardTime(new Date())}
            defaultTicker={preferences.defaultTicker}
            watchlistCount={watchlistItems.length}
            userName={userName}
            portfolioTickers={[]}
            fallbackTickers={popularReads.map((stock) => stock.symbol)}
            compact
          />

          <MarketPulseRow />

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(24rem,0.82fr)] xl:items-start">
            <div className="min-w-0">
              <DashboardPortfolioCard />
            </div>

            <div className="min-w-0 space-y-3.5">
              <TopMoversCard stocks={popularReads} />
            </div>
          </section>

          <div id="watchlist">
            <WatchlistSection
              initialItems={watchlistItems}
              initialError={watchlistError}
              compact
              maxItems={5}
            />
          </div>

          <RecentReadsSection items={recentReads} />

          <ContextBreak />

          <SectorPulseCard />
          <SectorCascadeFeed />

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(24rem,0.75fr)]">
            <MarketNewsFeed tickers={dashboardNewsTickers} />
            <div id="earnings" className="min-w-0">
              <EarningsThisWeekCard />
            </div>
          </section>

          <p className="rounded-[1rem] border border-[#213d63]/72 bg-[#07111e]/70 px-4 py-3 text-body-sm leading-6 text-[#7891ad]">
            ALQIS explanations are informational only and do not constitute
            investment advice. ALQIS is a tracking and explanation tool and
            cannot place trades. Demo-labeled market pulse, sector, and earnings
            modules are placeholders until live providers are connected for those
            surfaces.
          </p>
        </section>
      </PageContainer>
    </main>
  );
}

function NavPill({
  href,
  label,
  active = false,
  muted = false,
}: {
  href: string;
  label: string;
  active?: boolean;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "rounded-full bg-[#123d73] px-3 py-1.5 text-[0.78rem] font-semibold text-[#c8e4ff] shadow-[0_0_22px_rgba(45,128,255,0.16)]"
          : `rounded-full px-3 py-1.5 text-[0.78rem] font-semibold transition hover:bg-[#102033] hover:text-[#d9e9ff] ${
              muted ? "text-[#607894]" : "text-[#91a9c6]"
            }`
      }
    >
      {label}
    </Link>
  );
}

function ContextBreak() {
  return (
    <div className="flex items-center gap-4 py-2">
      <span className="h-px flex-1 bg-[rgba(86,126,176,0.22)]" />
      <p className="text-[0.7rem] font-black uppercase tracking-[0.22em] text-[#a7b7cc]">
        Market Context / Preview
      </p>
      <span className="h-px flex-1 bg-[rgba(86,126,176,0.22)]" />
    </div>
  );
}

async function getDashboardProfileFullName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from("user_investor_profiles")
    .select("full_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return undefined;
  }

  const fullName = (data as { full_name?: unknown } | null)?.full_name;

  return typeof fullName === "string" ? fullName.trim() : undefined;
}

function getDashboardUserName({
  fullName,
  email,
}: {
  fullName?: string;
  email?: string;
}) {
  const displayName = sanitizeDisplayName(fullName);

  if (displayName) {
    return displayName;
  }

  if (!email) {
    return "there";
  }

  const localPart = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();

  if (!localPart) {
    return "there";
  }

  return sanitizeEmailLocalPart(localPart) ?? "there";
}

function sanitizeDisplayName(value?: string) {
  if (!value) {
    return undefined;
  }

  const words = value
    .split(" ")
    .filter(Boolean)
    .filter((part) => /[A-Za-z]/.test(part));

  if (!words.length) {
    return undefined;
  }

  return words
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDashboardTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function sanitizeEmailLocalPart(value: string) {
  const words = value
    .replace(/\d+/g, " ")
    .split(" ")
    .filter(Boolean)
    .filter((part) => /^[A-Za-z]+$/.test(part));

  if (!words.length) {
    return undefined;
  }

  return words
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
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
    .filter((item, index, items) =>
      items.findIndex(
        (candidate) => candidate.ticker.toUpperCase() === item.ticker.toUpperCase()
      ) === index
    )
    .slice(0, 6);
}

async function getDashboardPortfolioTickers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data, error } = await supabase
    .from("portfolio_holdings")
    .select("ticker")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    return [];
  }

  return (data ?? [])
    .map((item) => (item as { ticker?: unknown }).ticker)
    .filter((ticker): ticker is string => typeof ticker === "string")
    .map((ticker) => ticker.trim().toUpperCase())
    .filter(Boolean);
}

function getPreferredMarketReads(defaultTicker: string) {
  const normalizedDefault = defaultTicker.toUpperCase();
  const preferred = demoStocks.find((stock) => stock.symbol === normalizedDefault);
  const remaining = demoStocks.filter((stock) => stock.symbol !== normalizedDefault);

  return preferred ? [preferred, ...remaining] : demoStocks;
}

function getDashboardNewsTickers({
  watchlistTickers,
  portfolioTickers,
  fallbackTickers,
}: {
  watchlistTickers: string[];
  portfolioTickers: string[];
  fallbackTickers: string[];
}) {
  return Array.from(
    new Set(
      [...watchlistTickers, ...portfolioTickers, ...fallbackTickers]
        .map((ticker) => ticker.trim().toUpperCase())
        .filter((ticker) => /^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker))
    )
  ).slice(0, 4);
}

function isTestTicker(ticker: string) {
  const normalized = ticker.trim().toUpperCase();

  return (
    normalized === "FAKE123" ||
    normalized.startsWith("FAKE") ||
    normalized.includes("TEST")
  );
}
