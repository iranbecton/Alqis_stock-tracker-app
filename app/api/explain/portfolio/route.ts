import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { setCache, withCache } from "@/lib/cache";
import { stableHash } from "@/lib/cache/keys";
import type { HoldingWithCalcs } from "@/lib/calculations/portfolio";
import { recordRouteEvent } from "@/lib/diagnostics/observability";
import { normalizedApiError, rateLimitedResponse } from "@/lib/errors/api-error";
import {
  buildPortfolioIntelligence,
  buildPortfolioResponse,
  getEnrichedPortfolioHoldings,
} from "@/lib/portfolio/server";
import type {
  PortfolioHoldingWithCalcs,
  PortfolioInsightDataStatus,
  PortfolioInsightResponse,
  PortfolioIntelligence,
} from "@/lib/portfolio/types";
import { requireApiUser } from "@/lib/security/auth";
import {
  getRateLimitKey,
  rateLimit,
  RATE_LIMITS,
} from "@/lib/security/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ROUTE = "/api/explain/portfolio";
const PORTFOLIO_INSIGHT_TTL_SECONDS = 60 * 60;
const BLOCKED_TERMS = [
  "bu" + "y",
  "se" + "ll",
  "ad" + "d",
  "re" + "duce",
  "tar" + "get",
  "rec" + "ommend",
  "you sh" + "ould",
  "con" + "sider",
  "ro" + "tate",
];

export async function POST(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    recordRouteEvent({ category: "auth_required_failed", route: ROUTE, method: "POST" });
    return auth.response;
  }

  const limit = await rateLimit(
    getRateLimitKey(request, auth.userId, "portfolio-insight"),
    RATE_LIMITS.explain
  );

  if (!limit.allowed) {
    return rateLimitedResponse(limit.resetAt);
  }

  try {
    const holdings = await getEnrichedPortfolioHoldings(auth.supabase, auth.userId);
    const calculated = buildPortfolioResponse(holdings);
    const intelligence = buildPortfolioIntelligence(holdings);
    const dataStatus = getDataStatus(calculated.holdings, intelligence);
    const cacheKey = `portfolio-insight:${auth.userId}`;
    const cached = await withCache(
      cacheKey,
      PORTFOLIO_INSIGHT_TTL_SECONDS,
      () =>
        Promise.resolve(
          createPortfolioInsightResponse({
            holdings: calculated.holdings,
            intelligence,
            dataStatus,
          })
        )
    );

    await savePortfolioInsight({
      supabase: auth.supabase,
      userId: auth.userId,
      response: cached.data,
      holdings: calculated.holdings,
    });

    return NextResponse.json(cached.data);
  } catch {
    recordRouteEvent({
      category: "normalized_error_returned",
      route: ROUTE,
      method: "POST",
      reason: "portfolio_insight_failed",
    });

    return normalizedApiError({
      code: "INTERNAL_ERROR",
      message: "Portfolio insight could not be generated. Please retry.",
    });
  }
}

function createPortfolioInsightResponse({
  holdings,
  intelligence,
  dataStatus,
}: {
  holdings: PortfolioHoldingWithCalcs[];
  intelligence: PortfolioIntelligence;
  dataStatus: PortfolioInsightDataStatus;
}): PortfolioInsightResponse {
  const generatedAt = new Date();
  const expiresAt = new Date(
    generatedAt.getTime() + PORTFOLIO_INSIGHT_TTL_SECONDS * 1000
  );
  const insight = validateInsight(
    buildStructuredPortfolioObservation(holdings, intelligence)
  );

  return {
    insight,
    top_contributors: {
      gainers: intelligence.topContributors.gainers.map(toContributor),
      losers: intelligence.topContributors.losers.map(toContributor),
    },
    sector_concentration: intelligence.sectorConcentration.map((sector) => ({
      sector: sector.sector,
      pct: Number(sector.pct.toFixed(2)),
    })),
    concentration_risk: {
      top_holding_pct: roundNullable(intelligence.concentrationRisk.top_holding_pct),
      top_three_pct: roundNullable(intelligence.concentrationRisk.top_three_pct),
      is_concentrated: intelligence.concentrationRisk.is_concentrated,
    },
    portfolio_movement: {
      total_day_change_value: roundNullable(
        intelligence.movement.total_day_change_value
      ),
      total_day_change_pct: roundNullable(
        intelligence.movement.total_day_change_pct
      ),
    },
    confidence: getPortfolioConfidence(dataStatus, intelligence),
    generated_at: generatedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    data_status: dataStatus,
  };
}

function buildStructuredPortfolioObservation(
  holdings: PortfolioHoldingWithCalcs[],
  intelligence: PortfolioIntelligence
) {
  const movement = intelligence.movement;
  const leader = intelligence.topContributors.gainers[0];
  const detractor = intelligence.topContributors.losers[0];
  const largestSector = intelligence.sectorConcentration[0];
  const topHolding = [...holdings]
    .filter((holding) => typeof holding.allocation_pct === "number")
    .sort((a, b) => (b.allocation_pct ?? 0) - (a.allocation_pct ?? 0))[0];
  const movementText =
    typeof movement.total_day_change_value === "number" &&
    typeof movement.total_day_change_pct === "number"
      ? `The portfolio moved ${formatSignedCurrency(
          movement.total_day_change_value
        )} today (${formatSignedRatio(movement.total_day_change_pct)}).`
      : "Today's movement is data-limited.";
  const leaderText = leader
    ? ` ${leader.ticker} was the leading positive contributor at ${formatSignedCurrency(
        leader.day_change_value ?? 0
      )}.`
    : "";
  const detractorText = detractor
    ? ` ${detractor.ticker} was the largest detractor at ${formatSignedCurrency(
        detractor.day_change_value ?? 0
      )}.`
    : "";
  const sectorText = largestSector
    ? ` ${largestSector.sector} is the largest exposure at ${largestSector.pct.toFixed(0)}%.`
    : "";
  const concentrationText =
    intelligence.concentrationRisk.is_concentrated && topHolding
      ? ` ${topHolding.ticker} accounts for ${topHolding.allocation_pct?.toFixed(0)}% of current value.`
      : "";

  return `${movementText}${leaderText}${detractorText}${sectorText}${concentrationText}`;
}

function validateInsight(value: string) {
  const trimmed = value.trim().split(/\s+/).slice(0, 55).join(" ");
  const lower = trimmed.toLowerCase();
  const hasBlockedTerm = BLOCKED_TERMS.some((term) => lower.includes(term));

  if (hasBlockedTerm) {
    return "Portfolio exposure and today's movement are summarized from available holdings, sector, and price data.";
  }

  return trimmed;
}

function getDataStatus(
  holdings: PortfolioHoldingWithCalcs[],
  intelligence: PortfolioIntelligence
): PortfolioInsightDataStatus {
  if (
    !holdings.length ||
    typeof intelligence.movement.total_day_change_value !== "number"
  ) {
    return "data-limited";
  }

  if (
    intelligence.movement.has_partial_data ||
    holdings.some((holding) => holding.price_status === "data-limited")
  ) {
    return "partial";
  }

  return "live";
}

function getPortfolioConfidence(
  dataStatus: PortfolioInsightDataStatus,
  intelligence: PortfolioIntelligence
): PortfolioInsightResponse["confidence"] {
  const hasSectors = intelligence.sectorConcentration.length > 0;

  if (dataStatus === "live" && hasSectors) {
    return { score: 0.78, band: "B", label: "Good confidence" };
  }

  if (dataStatus === "partial") {
    return { score: 0.62, band: "C", label: "Moderate confidence" };
  }

  return { score: 0.42, band: "D", label: "Low confidence" };
}

function toContributor(holding: HoldingWithCalcs) {
  return {
    ticker: holding.ticker,
    day_change_value: roundNullable(holding.day_change_value),
    day_change_pct: roundNullable(holding.day_change_pct),
  };
}

function roundNullable(value: number | null | undefined) {
  return typeof value === "number" ? Number(value.toFixed(4)) : null;
}

function formatSignedCurrency(value: number) {
  const sign = value > 0 ? "+" : "";

  return `${sign}${new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value)}`;
}

function formatSignedRatio(value: number) {
  const percent = value * 100;
  const sign = percent > 0 ? "+" : "";

  return `${sign}${percent.toFixed(2)}%`;
}

async function savePortfolioInsight({
  supabase,
  userId,
  response,
  holdings,
}: {
  supabase: SupabaseClient;
  userId: string;
  response: PortfolioInsightResponse;
  holdings: PortfolioHoldingWithCalcs[];
}) {
  const hash = stableHash({
    summary: response.insight,
    movement: response.portfolio_movement,
    concentration: response.concentration_risk,
    holdings: holdings.map((holding) => ({
      ticker: holding.ticker,
      shares: holding.shares,
      current_price: holding.current_price,
      sector: holding.sector,
    })),
  });

  try {
    await supabase.from("stock_explanations").upsert(
      {
        user_id: userId,
        ticker: "PORTFOLIO",
        company_name: "Portfolio",
        timeframe: "1D",
        summary: response.insight,
        confidence_score: response.confidence.score,
        confidence_band: response.confidence.band,
        confidence_label: response.confidence.label,
        source_count: holdings.length,
        key_factors: response.top_contributors,
        counterevidence: [],
        data_health: {
          dataStatus: response.data_status,
          sectorCount: response.sector_concentration.length,
        },
        provider_status: {
          holdings: response.data_status,
        },
        explanation_hash: hash,
        generated_at: response.generated_at,
      },
      {
        onConflict: "user_id,ticker,timeframe,explanation_hash",
        ignoreDuplicates: true,
      }
    );
  } catch {
    await setCache(`portfolio-insight-save-failed:${userId}`, true, 5 * 60);
  }
}
