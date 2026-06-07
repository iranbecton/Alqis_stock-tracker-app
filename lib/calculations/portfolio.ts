export type Holding = {
  id: string;
  ticker: string;
  shares: number;
  avg_cost: number;
  current_price: number | null;
  prev_close: number | null;
  day_change_value: number | null;
  day_change_pct: number | null;
  sector: string | null;
  price_status: "live" | "delayed" | "data-limited";
};

export type HoldingWithCalcs = Holding & {
  cost_basis: number;
  current_value: number | null;
  gain_loss_value: number | null;
  gain_loss_pct: number | null;
  allocation_pct: number | null;
};

export type PortfolioSummary = {
  total_cost_basis: number;
  total_current_value: number | null;
  total_gain_loss_value: number | null;
  total_gain_loss_pct: number | null;
  holdings_count: number;
  has_data_limited: boolean;
  all_data_limited: boolean;
};

export type PortfolioMovement = {
  total_day_change_value: number | null;
  total_day_change_pct: number | null;
  has_partial_data: boolean;
};

export type SectorConcentration = {
  sector: string;
  value: number;
  pct: number;
};

export type TopContributors = {
  gainers: HoldingWithCalcs[];
  losers: HoldingWithCalcs[];
};

export type ConcentrationRisk = {
  top_holding_pct: number | null;
  top_three_pct: number | null;
  is_concentrated: boolean;
};

export function calculateHolding(
  holding: Holding,
  totalCurrentValue: number | null
): HoldingWithCalcs {
  const costBasis = holding.shares * holding.avg_cost;
  const currentValue =
    typeof holding.current_price === "number"
      ? holding.shares * holding.current_price
      : null;
  const gainLossValue =
    typeof currentValue === "number" ? currentValue - costBasis : null;
  const gainLossPct =
    typeof gainLossValue === "number" && costBasis > 0
      ? (gainLossValue / costBasis) * 100
      : null;
  const allocationPct =
    typeof currentValue === "number" &&
    typeof totalCurrentValue === "number" &&
    totalCurrentValue > 0
      ? (currentValue / totalCurrentValue) * 100
      : null;

  return {
    ...holding,
    cost_basis: costBasis,
    current_value: currentValue,
    gain_loss_value: gainLossValue,
    gain_loss_pct: gainLossPct,
    allocation_pct: allocationPct,
  };
}

export function calculatePortfolioSummary(
  holdings: Holding[]
): PortfolioSummary {
  const totalCostBasis = holdings.reduce(
    (sum, holding) => sum + holding.shares * holding.avg_cost,
    0
  );
  const pricedHoldings = holdings.filter(
    (holding) => typeof holding.current_price === "number"
  );
  const allDataLimited = holdings.length > 0 && pricedHoldings.length === 0;
  const totalCurrentValue = allDataLimited
    ? null
    : pricedHoldings.reduce(
        (sum, holding) => sum + holding.shares * (holding.current_price ?? 0),
        0
      );
  const totalGainLossValue =
    typeof totalCurrentValue === "number"
      ? totalCurrentValue - totalCostBasis
      : null;
  const totalGainLossPct =
    typeof totalGainLossValue === "number" && totalCostBasis > 0
      ? (totalGainLossValue / totalCostBasis) * 100
      : null;

  return {
    total_cost_basis: totalCostBasis,
    total_current_value: totalCurrentValue,
    total_gain_loss_value: totalGainLossValue,
    total_gain_loss_pct: totalGainLossPct,
    holdings_count: holdings.length,
    has_data_limited: holdings.some(
      (holding) => holding.price_status === "data-limited"
    ),
    all_data_limited: allDataLimited,
  };
}

export function calculatePortfolioMovement(
  holdings: Holding[]
): PortfolioMovement {
  const holdingsWithDayChange = holdings.filter(
    (holding) =>
      typeof holding.day_change_value === "number" &&
      typeof holding.prev_close === "number" &&
      holding.prev_close > 0
  );
  const hasPartialData = holdingsWithDayChange.length < holdings.length;

  if (!holdingsWithDayChange.length) {
    return {
      total_day_change_value: null,
      total_day_change_pct: null,
      has_partial_data: holdings.length > 0,
    };
  }

  const totalDayChangeValue = holdingsWithDayChange.reduce(
    (sum, holding) => sum + (holding.day_change_value ?? 0),
    0
  );
  const totalPreviousCloseValue = holdingsWithDayChange.reduce(
    (sum, holding) => sum + holding.shares * (holding.prev_close ?? 0),
    0
  );

  return {
    total_day_change_value: totalDayChangeValue,
    total_day_change_pct:
      totalPreviousCloseValue > 0
        ? totalDayChangeValue / totalPreviousCloseValue
        : null,
    has_partial_data: hasPartialData,
  };
}

export function calculateSectorConcentration(
  holdings: HoldingWithCalcs[]
): SectorConcentration[] {
  const totalCurrentValue = holdings.reduce(
    (sum, holding) => sum + (holding.current_value ?? 0),
    0
  );

  if (totalCurrentValue <= 0) {
    return [];
  }

  const sectorValues = new Map<string, number>();

  holdings.forEach((holding) => {
    const currentValue = holding.current_value;

    if (typeof currentValue !== "number" || currentValue <= 0) {
      return;
    }

    const sector = holding.sector?.trim() || "Other";
    sectorValues.set(sector, (sectorValues.get(sector) ?? 0) + currentValue);
  });

  return [...sectorValues.entries()]
    .map(([sector, value]) => ({
      sector,
      value,
      pct: (value / totalCurrentValue) * 100,
    }))
    .sort((a, b) => b.value - a.value);
}

export function calculateTopContributors(
  holdings: HoldingWithCalcs[]
): TopContributors {
  const ranked = holdings
    .filter((holding) => typeof holding.day_change_value === "number")
    .sort((a, b) => (b.day_change_value ?? 0) - (a.day_change_value ?? 0));

  return {
    gainers: ranked.filter((holding) => (holding.day_change_value ?? 0) > 0).slice(0, 2),
    losers: ranked
      .filter((holding) => (holding.day_change_value ?? 0) < 0)
      .sort((a, b) => (a.day_change_value ?? 0) - (b.day_change_value ?? 0))
      .slice(0, 2),
  };
}

export function calculateConcentrationRisk(
  holdings: HoldingWithCalcs[]
): ConcentrationRisk {
  const allocations = holdings
    .map((holding) => holding.allocation_pct)
    .filter((value): value is number => typeof value === "number")
    .sort((a, b) => b - a);
  const topHoldingPct = allocations[0] ?? null;
  const topThreePct =
    allocations.length > 0
      ? allocations.slice(0, 3).reduce((sum, value) => sum + value, 0)
      : null;

  return {
    top_holding_pct: topHoldingPct,
    top_three_pct: topThreePct,
    is_concentrated:
      (topHoldingPct ?? 0) > 40 || (topThreePct ?? 0) > 70,
  };
}
