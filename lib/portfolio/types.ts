import type {
  ConcentrationRisk,
  Holding,
  HoldingWithCalcs,
  PortfolioSummary,
  PortfolioMovement,
  SectorConcentration,
  TopContributors,
} from "@/lib/calculations/portfolio";

export type PortfolioHoldingInput = {
  ticker: string;
  shares: number;
  avg_cost: number;
  notes: string | null;
};

export type PortfolioHoldingRow = {
  id: string;
  user_id: string;
  ticker: string;
  shares: string | number;
  avg_cost: string | number;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PortfolioHolding = Holding & {
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PortfolioHoldingWithCalcs = HoldingWithCalcs & {
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PortfolioHoldingsResponse = {
  holdings: PortfolioHoldingWithCalcs[];
  summary: PortfolioSummary;
};

export type PortfolioInsightDataStatus = "live" | "partial" | "data-limited";

export type PortfolioInsightResponse = {
  insight: string;
  top_contributors: {
    gainers: Array<{
      ticker: string;
      day_change_value: number | null;
      day_change_pct: number | null;
    }>;
    losers: Array<{
      ticker: string;
      day_change_value: number | null;
      day_change_pct: number | null;
    }>;
  };
  sector_concentration: Array<{
    sector: string;
    pct: number;
  }>;
  concentration_risk: ConcentrationRisk;
  portfolio_movement: Pick<
    PortfolioMovement,
    "total_day_change_value" | "total_day_change_pct"
  >;
  confidence: {
    score: number;
    band: "A" | "B" | "C" | "D";
    label: "High confidence" | "Good confidence" | "Moderate confidence" | "Low confidence";
  };
  generated_at: string;
  expires_at: string;
  data_status: PortfolioInsightDataStatus;
};

export type PortfolioIntelligence = {
  movement: PortfolioMovement;
  sectorConcentration: SectorConcentration[];
  topContributors: TopContributors;
  concentrationRisk: ConcentrationRisk;
};
