import { redirect } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  BrainCircuit,
  LineChart,
  LogOut,
  Sparkles,
} from "lucide-react";
import { AlqisLogo } from "@/components/brand/alqis-logo";
import { TickerSearch } from "@/components/stocks/ticker-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WatchlistSection } from "@/components/watchlist/watchlist-section";
import {
  Card,
  CardContent,
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer } from "@/components/ui/layout";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
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

  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,var(--background)_0%,#050b0f_100%)]">
      <header className="border-b border-border/70 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--background)_97%,var(--surface)_3%)_0%,color-mix(in_srgb,var(--background)_88%,transparent)_100%)] backdrop-blur-xl">
        <PageContainer className="flex flex-wrap items-center justify-between gap-3 py-3 sm:gap-4 sm:py-4">
          <div className="flex items-center gap-3">
            <AlqisLogo variant="lockup" tone="dark" size="sm" priority />
            <div>
              <p className="text-body-sm text-ink-muted">Market intelligence workspace</p>
            </div>
          </div>

          <form action={signOutAction}>
            <Button type="submit" variant="quiet" size="md" className="h-11">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </form>
        </PageContainer>
      </header>

      <PageContainer className="py-5 sm:py-10">
        <section className="space-y-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <Badge variant="ai" size="md">
                <BrainCircuit className="h-3.5 w-3.5" />
                Protected intelligence shell
              </Badge>
              <div className="space-y-2">
                <h1 className="font-serif text-[2.2rem] leading-[0.98] tracking-tight text-ink sm:text-[3.75rem]">
                  Welcome to ALQIS.
                </h1>
                <p className="break-words text-body text-ink-muted sm:text-body-lg">
                  Signed in as {user.email}. Search a ticker to open the explanation-led stock detail screen.
                </p>
              </div>
            </div>

            <div className="w-full rounded-[var(--radius-xl)] border border-border/60 bg-surface/42 px-4 py-3 lg:w-auto">
              <p className="section-kicker">Tracked universe</p>
              <p className="mt-1 break-words text-body-sm text-ink-muted">
                {demoStocks.map((stock) => stock.symbol).join(" / ")}
              </p>
            </div>
          </div>

          <WatchlistSection
            initialItems={watchlistItems}
            initialError={watchlistError}
          />

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(22rem,0.42fr)]">
            <div className="space-y-4">
              <div>
                <p className="section-kicker">Stock intelligence search</p>
                <h2 className="mt-2 font-serif text-[1.65rem] leading-tight tracking-tight text-ink sm:text-[2.4rem]">
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
                <div className="grid gap-3 lg:grid-cols-2">
                  {demoStocks.slice(0, 4).map((stock) => (
                    <Link
                      key={stock.symbol}
                      href={`/stocks/${stock.symbol}`}
                      className="group min-w-0 rounded-[var(--radius-lg)] border border-border/70 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--surface)_18%)] p-4 transition duration-[var(--duration-fast)] hover:border-border-strong hover:bg-surface-elevated focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      <div className="flex flex-col gap-3 min-[430px]:flex-row min-[430px]:items-start min-[430px]:justify-between">
                        <div className="min-w-0">
                          <p className="text-lg font-semibold text-ink">{stock.symbol}</p>
                          <p className="mt-1 break-words text-body-sm text-ink-muted">
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
                      <div className="mt-4 flex items-start gap-2 text-body-sm text-ink-subtle">
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
