import { redirect } from "next/navigation";
import type { CSSProperties } from "react";
import { ExploreShell } from "@/components/explore/explore-shell";
import {
  preGenerateTopIdeaAngles,
} from "@/lib/explore/angle-cache";
import {
  generateDailyIdeasWithCacheStatus,
  type UserExploreContext,
} from "@/lib/explore/generate-ideas";
import { getUniverseSector } from "@/lib/market/universe-sector-map";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type TickerRow = {
  ticker?: unknown;
};

type ProfileRow = {
  market_experience?: unknown;
};

type ExplanationRow = {
  ticker?: unknown;
  confidence_band?: unknown;
};

export default async function ExplorePage() {
  if (!hasSupabaseEnv()) {
    redirect(
      "/login?error=Supabase%20environment%20variables%20are%20required%20before%20opening%20Explore."
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const userContext = await getExplorePageContext(supabase, user.id);
  const ideasResult = await generateDailyIdeasWithCacheStatus(user.id, userContext);
  const angleData = await preGenerateTopIdeaAngles({
    supabase,
    userId: user.id,
    ideas: ideasResult.ideas,
  });
  const initialIdeasResponse = {
    status: "ok" as const,
    ideas: ideasResult.ideas.map((idea) => ({
      ...idea,
      angleData: angleData[idea.ticker] ?? null,
    })),
    generatedAt: ideasResult.generatedAt,
    fallback: ideasResult.fallback,
    cacheStatus: ideasResult.cacheStatus,
    disclaimer:
      "ALQIS explanations are informational only and do not constitute investment advice.",
  };
  const firstName = getExploreFirstName(user.email);

  return (
    <main
      className="min-h-dvh overflow-x-hidden bg-[var(--surface-grounded)] text-[#f4f8ff]"
      style={
        {
          "--ink": "#f4f8ff",
          "--ink-muted": "#a7b7cc",
          "--ink-subtle": "#74869d",
          "--accent": "#75e7dc",
          "--gain": "#39e2a0",
          "--loss": "#ff7580",
          "--info": "#86b7d4",
        } as CSSProperties
      }
    >
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_8%,rgba(35,92,142,0.24),transparent_34rem),radial-gradient(ellipse_at_34%_22%,rgba(45,184,170,0.11),transparent_30rem),linear-gradient(180deg,#03060b,#06101b_48%,#03060b)]" />
      <ExploreShell
        initialIdeasResponse={initialIdeasResponse}
        firstName={firstName}
      />
    </main>
  );
}

function getExploreFirstName(email?: string) {
  if (!email) {
    return "you";
  }

  const localPart = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  const firstWord = localPart
    ?.split(" ")
    .filter(Boolean)[0]
    ?.replace(/[^a-zA-Z]/g, "");

  if (!firstWord || !/[A-Za-z]/.test(firstWord)) {
    return "you";
  }

  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}

async function getExplorePageContext(
  supabase: SupabaseServerClient,
  userId: string
): Promise<UserExploreContext> {
  const [portfolioTickers, watchlistTickers, riskProfile, existingExplanations] =
    await Promise.all([
      getTickers(supabase, userId, "portfolio_holdings"),
      getTickers(supabase, userId, "watchlist_items"),
      getRiskProfile(supabase, userId),
      getRecentExplanations(supabase, userId),
    ]);

  return {
    portfolioTickers,
    portfolioSectors: portfolioTickers.map(getUniverseSector),
    watchlistTickers,
    riskProfile,
    existingExplanations,
  };
}

async function getTickers(
  supabase: SupabaseServerClient,
  userId: string,
  table: "portfolio_holdings" | "watchlist_items"
) {
  const { data, error } = await supabase
    .from(table)
    .select("ticker")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return normalizeTickerRows(data as TickerRow[]);
}

async function getRiskProfile(
  supabase: SupabaseServerClient,
  userId: string
): Promise<UserExploreContext["riskProfile"]> {
  const { data, error } = await supabase
    .from("user_investor_profiles")
    .select("market_experience")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const experience = (data as ProfileRow).market_experience;

  if (experience === "starting" || experience === "lt_1y") {
    return "conservative";
  }

  if (experience === "3_7y" || experience === "7y_plus") {
    return "aggressive";
  }

  return "moderate";
}

async function getRecentExplanations(
  supabase: SupabaseServerClient,
  userId: string
) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString();
  const { data, error } = await supabase
    .from("stock_explanations")
    .select("ticker,confidence_band,created_at")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    return [];
  }

  return ((data ?? []) as ExplanationRow[])
    .map((row) => ({
      ticker: typeof row.ticker === "string" ? row.ticker : "",
      confidenceBand:
        typeof row.confidence_band === "string" ? row.confidence_band : "",
    }))
    .filter((row) => row.ticker && row.confidenceBand);
}

function normalizeTickerRows(rows: TickerRow[]) {
  return Array.from(
    new Set(
      rows
        .map((row) => row.ticker)
        .filter((ticker): ticker is string => typeof ticker === "string")
        .map((ticker) => ticker.trim().toUpperCase())
        .filter(Boolean)
    )
  );
}
