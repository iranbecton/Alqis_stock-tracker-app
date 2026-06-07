import { NextResponse } from "next/server";
import { recordRouteEvent } from "@/lib/diagnostics/observability";
import {
  generateDailyIdeasWithCacheStatus,
  type UserExploreContext,
} from "@/lib/explore/generate-ideas";
import { getUniverseSector } from "@/lib/market/universe-sector-map";
import { rateLimitedResponse } from "@/lib/errors/api-error";
import { requireApiUser } from "@/lib/security/auth";
import {
  getRateLimitKey,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";
import type { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/explore/ideas";
const DISCLAIMER =
  "ALQIS explanations are informational only and do not constitute investment advice.";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type PortfolioTickerRow = {
  ticker?: unknown;
};

type ProfileRow = {
  market_experience?: unknown;
};

type ExplanationRow = {
  ticker?: unknown;
  confidence_band?: unknown;
};

export async function GET(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({
      category: "auth_required_failed",
      route: ROUTE,
      method: "GET",
    });
    return auth.response;
  }

  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "explore-ideas"),
    RATE_LIMITS.marketData
  );

  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  try {
    const userContext = await getUserExploreContext(auth.supabase, auth.userId);
    const result = await generateDailyIdeasWithCacheStatus(
      auth.userId,
      userContext
    );

    return NextResponse.json({
      status: "ok",
      ideas: result.ideas,
      generatedAt: result.generatedAt,
      fallback: result.fallback,
      cacheStatus: result.cacheStatus,
      disclaimer: DISCLAIMER,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS explore] Idea generation failed", { error });
    }

    return NextResponse.json({
      status: "ok",
      ideas: [],
      generatedAt: new Date().toISOString(),
      fallback: true,
      cacheStatus: "miss",
      error: "Explore ideas are temporarily unavailable.",
      disclaimer: DISCLAIMER,
    });
  }
}

async function getUserExploreContext(
  supabase: SupabaseServerClient,
  userId: string
): Promise<UserExploreContext> {
  const [portfolioTickers, watchlistTickers, riskProfile, existingExplanations] =
    await Promise.all([
      getPortfolioTickers(supabase, userId),
      getWatchlistTickers(supabase, userId),
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

async function getPortfolioTickers(
  supabase: SupabaseServerClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("portfolio_holdings")
    .select("ticker")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return normalizeTickerRows(data as PortfolioTickerRow[]);
}

async function getWatchlistTickers(
  supabase: SupabaseServerClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("watchlist_items")
    .select("ticker")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return normalizeTickerRows(data as PortfolioTickerRow[]);
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

function normalizeTickerRows(rows: PortfolioTickerRow[]) {
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
