export type FitScoreInputs = {
  ticker: string;
  sector: string;
  beta: number | null;
  peRatio: number | null;
  marketCap: number | null;
  oneMonthChange: number | null;
  hasRecentExplanation: boolean;
  explanationConfidenceBand: "A" | "B" | "C" | "D" | null;
  userPortfolioTickers: string[];
  userPortfolioSectors: string[];
  userRiskProfile: "conservative" | "moderate" | "aggressive" | null;
};

export type FitScoreResult = {
  ticker: string;
  score: number;
  topFactors: string[];
  fallback: boolean;
};

type ComponentScore = {
  key: "overlap" | "sector" | "volatility" | "momentum" | "explanation";
  score: number;
  weight: number;
  label: string;
};

const FALLBACK_FACTOR =
  "Based on market signals only - add holdings for personalized fit";

export function computeFitScore(inputs: FitScoreInputs): FitScoreResult {
  const ticker = normalizeTicker(inputs.ticker);
  const portfolioTickers = inputs.userPortfolioTickers.map(normalizeTicker);
  const portfolioSectors = inputs.userPortfolioSectors.map(normalizeSector);
  const sector = normalizeSector(inputs.sector);
  const sectorCount = portfolioSectors.filter((value) => value === sector).length;
  const fallback = portfolioTickers.length === 0;

  const components: ComponentScore[] = [
    getOverlapScore({ ticker, portfolioTickers, fallback, sectorCount }),
    getSectorScore(sectorCount),
    getVolatilityScore(inputs.beta, inputs.userRiskProfile),
    getMomentumScore(inputs.oneMonthChange),
    getExplanationScore(
      inputs.hasRecentExplanation,
      inputs.explanationConfidenceBand
    ),
  ];

  const score = Math.round(
    components.reduce(
      (total, component) => total + component.score * component.weight,
      0
    ) * 100
  );

  return {
    ticker,
    score: clampScore(score),
    topFactors: getTopFactors(components, fallback),
    fallback,
  };
}

function getOverlapScore({
  ticker,
  portfolioTickers,
  fallback,
  sectorCount,
}: {
  ticker: string;
  portfolioTickers: string[];
  fallback: boolean;
  sectorCount: number;
}): ComponentScore {
  let score = 0.8;

  if (fallback) {
    score = 0.5;
  } else if (portfolioTickers.includes(ticker)) {
    score = 0.2;
  } else if (sectorCount >= 2) {
    score = 0.4;
  } else if (sectorCount === 0) {
    score = 1;
  }

  return {
    key: "overlap",
    score,
    weight: 0.3,
    label:
      score >= 0.8
        ? "Adds missing exposure to your book"
        : "Sector already represented",
  };
}

function getSectorScore(sectorCount: number): ComponentScore {
  let score = 0.1;

  if (sectorCount === 0) {
    score = 1;
  } else if (sectorCount === 1) {
    score = 0.7;
  } else if (sectorCount === 2) {
    score = 0.4;
  }

  return {
    key: "sector",
    score,
    weight: 0.25,
    label:
      score >= 0.7
        ? "Diversifies your sector concentration"
        : "Adds to existing sector weight",
  };
}

function getVolatilityScore(
  beta: number | null,
  userRiskProfile: FitScoreInputs["userRiskProfile"]
): ComponentScore {
  let score = 0.5;

  if (typeof beta === "number" && userRiskProfile === "conservative") {
    if (beta < 1) score = 1;
    else if (beta <= 1.5) score = 0.5;
    else score = 0.1;
  }

  if (typeof beta === "number" && userRiskProfile === "moderate") {
    score = beta >= 0.8 && beta <= 1.5 ? 1 : 0.5;
  }

  if (typeof beta === "number" && userRiskProfile === "aggressive") {
    if (beta > 1.3) score = 1;
    else if (beta < 1) score = 0.5;
    else score = 0.75;
  }

  return {
    key: "volatility",
    score,
    weight: 0.2,
    label:
      score >= 0.75
        ? "Matches your risk profile"
        : "Higher volatility than your profile",
  };
}

function getMomentumScore(oneMonthChange: number | null): ComponentScore {
  let score = 0.5;

  if (typeof oneMonthChange === "number") {
    if (oneMonthChange >= 5) score = 1;
    else if (oneMonthChange >= 1) score = 0.75;
    else if (oneMonthChange >= -1) score = 0.5;
    else score = 0.25;
  }

  return {
    key: "momentum",
    score,
    weight: 0.15,
    label:
      score >= 0.75 ? "Positive recent momentum" : "Muted recent momentum",
  };
}

function getExplanationScore(
  hasRecentExplanation: boolean,
  band: FitScoreInputs["explanationConfidenceBand"]
): ComponentScore {
  let score = 0.5;

  if (hasRecentExplanation) {
    if (band === "A") score = 1;
    else if (band === "B") score = 0.8;
    else if (band === "C") score = 0.5;
    else if (band === "D") score = 0.2;
  }

  return {
    key: "explanation",
    score,
    weight: 0.1,
    label:
      score >= 0.8
        ? "Strong ALQIS read available"
        : "Limited explanation context",
  };
}

function getTopFactors(components: ComponentScore[], fallback: boolean) {
  const factors = components
    .slice()
    .sort((a, b) => b.score * b.weight - a.score * a.weight)
    .map((component) => component.label);

  const uniqueFactors = Array.from(new Set(factors));

  if (fallback) {
    return [FALLBACK_FACTOR, ...uniqueFactors].slice(0, 2);
  }

  return uniqueFactors.slice(0, 2);
}

function normalizeTicker(ticker: string) {
  return ticker.trim().toUpperCase();
}

function normalizeSector(sector: string) {
  return sector.trim().toLowerCase();
}

function clampScore(score: number) {
  return Math.min(100, Math.max(0, score));
}
