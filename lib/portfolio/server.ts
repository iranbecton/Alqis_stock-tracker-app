import type { SupabaseClient } from "@supabase/supabase-js";
import { withCache } from "@/lib/cache";
import {
  calculateConcentrationRisk,
  calculateHolding,
  calculatePortfolioSummary,
  calculatePortfolioMovement,
  calculateSectorConcentration,
  calculateTopContributors,
  type Holding,
} from "@/lib/calculations/portfolio";
import {
  getFinnhubCompanyProfile,
  getFinnhubQuote,
} from "@/lib/market-data/finnhub";
import type {
  PortfolioHolding,
  PortfolioHoldingRow,
  PortfolioHoldingsResponse,
  PortfolioIntelligence,
} from "@/lib/portfolio/types";

const PORTFOLIO_QUOTE_TTL_SECONDS = 120;
const PORTFOLIO_SECTOR_TTL_SECONDS = 24 * 60 * 60;

type PortfolioQuoteResult = {
  price: number | null;
  prev_close: number | null;
  day_change_value: number | null;
  day_change_pct: number | null;
  status: PortfolioHolding["price_status"];
};

export function normalizePortfolioRow(
  row: PortfolioHoldingRow,
  quote: PortfolioQuoteResult,
  sector: string | null = null
): PortfolioHolding {
  return {
    id: row.id,
    ticker: row.ticker,
    shares: Number(row.shares),
    avg_cost: Number(row.avg_cost),
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
    current_price: quote.price,
    prev_close: quote.prev_close,
    day_change_value: quote.day_change_value,
    day_change_pct: quote.day_change_pct,
    sector,
    price_status: quote.status,
  };
}

export async function getPortfolioQuote(
  ticker: string,
  shares = 0
): Promise<PortfolioQuoteResult> {
  try {
    const { data } = await withCache(
      `portfolio-quote:${ticker.trim().toUpperCase()}`,
      PORTFOLIO_QUOTE_TTL_SECONDS,
      () => getFinnhubQuote(ticker)
    );
    const hasDayChangeInputs =
      typeof data.price === "number" &&
      typeof data.previousClose === "number" &&
      data.previousClose > 0;
    const priceChange = hasDayChangeInputs
      ? data.price - data.previousClose
      : null;

    return {
      price: data.price,
      prev_close: hasDayChangeInputs ? data.previousClose : null,
      day_change_value:
        typeof priceChange === "number" ? priceChange * shares : null,
      day_change_pct:
        typeof priceChange === "number" && data.previousClose > 0
          ? priceChange / data.previousClose
          : null,
      status:
        data.marketStatus === "open" ? ("live" as const) : ("delayed" as const),
    };
  } catch {
    return {
      price: null,
      prev_close: null,
      day_change_value: null,
      day_change_pct: null,
      status: "data-limited" as const,
    };
  }
}

export async function getPortfolioSector(ticker: string) {
  try {
    const { data } = await withCache(
      `sector:${ticker.trim().toUpperCase()}`,
      PORTFOLIO_SECTOR_TTL_SECONDS,
      async () => {
        const profile = await getFinnhubCompanyProfile(ticker);
        return profile.sector?.trim() || null;
      }
    );

    return data;
  } catch {
    return null;
  }
}

export async function getEnrichedPortfolioHoldings(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from("portfolio_holdings")
    .select("id,user_id,ticker,shares,avg_cost,notes,created_at,updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as PortfolioHoldingRow[];
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const shares = Number(row.shares);
      const [quote, sector] = await Promise.all([
        getPortfolioQuote(row.ticker, shares),
        getPortfolioSector(row.ticker),
      ]);

      return normalizePortfolioRow(row, quote, sector);
    })
  );

  return enriched;
}

export function buildPortfolioResponse(
  holdings: PortfolioHolding[]
): PortfolioHoldingsResponse {
  const summary = calculatePortfolioSummary(holdings);
  const totalCurrentValue = summary.total_current_value;

  return {
    holdings: holdings.map((holding) => ({
      ...calculateHolding(holding as Holding, totalCurrentValue),
      notes: holding.notes,
      created_at: holding.created_at,
      updated_at: holding.updated_at,
    })),
    summary,
  };
}

export function buildPortfolioIntelligence(
  holdings: PortfolioHolding[]
): PortfolioIntelligence {
  const response = buildPortfolioResponse(holdings);
  const calculatedHoldings = response.holdings;

  return {
    movement: calculatePortfolioMovement(holdings),
    sectorConcentration: calculateSectorConcentration(calculatedHoldings),
    topContributors: calculateTopContributors(calculatedHoldings),
    concentrationRisk: calculateConcentrationRisk(calculatedHoldings),
  };
}
