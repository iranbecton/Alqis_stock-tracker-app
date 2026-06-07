import { validateTicker } from "@/lib/security/validation";

export const investmentKnowledgeLevels = [
  "new",
  "basic",
  "comfortable",
  "advanced",
] as const;

export const marketExperienceOptions = [
  "starting",
  "lt_1y",
  "1_3y",
  "3_7y",
  "7y_plus",
] as const;

export const explanationDepthOptions = ["simple", "balanced", "detailed"] as const;

export const marketInterestOptions = [
  "individual_stocks",
  "etfs",
  "earnings",
  "ai_technology",
  "healthcare",
  "energy",
  "crypto_context",
  "macro_fed_rates",
  "beginner_terms",
] as const;

export type InvestmentKnowledgeLevel = (typeof investmentKnowledgeLevels)[number];
export type MarketExperience = (typeof marketExperienceOptions)[number];
export type ExplanationDepth = (typeof explanationDepthOptions)[number];
export type MarketInterest = (typeof marketInterestOptions)[number];

export type InvestorProfile = {
  userId: string;
  investmentKnowledgeLevel: InvestmentKnowledgeLevel;
  marketExperience: MarketExperience;
  explanationDepth: ExplanationDepth;
  marketInterests: MarketInterest[];
  onboardingCompleted: boolean;
  disclaimerAcknowledged: boolean;
  disclaimerAcknowledgedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type InvestorProfileRow = {
  user_id: string;
  investment_knowledge_level: string | null;
  market_experience: string | null;
  explanation_depth: string;
  market_interests: string[] | null;
  onboarding_completed: boolean | null;
  disclaimer_acknowledged: boolean | null;
  disclaimer_acknowledged_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type InvestorProfileInput = {
  investmentKnowledgeLevel: InvestmentKnowledgeLevel;
  marketExperience: MarketExperience;
  explanationDepth: ExplanationDepth;
  marketInterests: MarketInterest[];
  disclaimerAcknowledged: boolean;
  startingTickers: string[];
};

export function isInvestmentKnowledgeLevel(
  value: unknown
): value is InvestmentKnowledgeLevel {
  return (
    typeof value === "string" &&
    investmentKnowledgeLevels.includes(value as InvestmentKnowledgeLevel)
  );
}

export function isMarketExperience(value: unknown): value is MarketExperience {
  return (
    typeof value === "string" &&
    marketExperienceOptions.includes(value as MarketExperience)
  );
}

export function isExplanationDepth(value: unknown): value is ExplanationDepth {
  return (
    typeof value === "string" &&
    explanationDepthOptions.includes(value as ExplanationDepth)
  );
}

export function isMarketInterest(value: unknown): value is MarketInterest {
  return (
    typeof value === "string" &&
    marketInterestOptions.includes(value as MarketInterest)
  );
}

export function normalizeInvestorProfileRow(
  row: InvestorProfileRow
): InvestorProfile {
  const interests = Array.isArray(row.market_interests)
    ? row.market_interests.filter(isMarketInterest)
    : [];

  return {
    userId: row.user_id,
    investmentKnowledgeLevel: isInvestmentKnowledgeLevel(
      row.investment_knowledge_level
    )
      ? row.investment_knowledge_level
      : "basic",
    marketExperience: isMarketExperience(row.market_experience)
      ? row.market_experience
      : "starting",
    explanationDepth: isExplanationDepth(row.explanation_depth)
      ? row.explanation_depth
      : "balanced",
    marketInterests: interests,
    onboardingCompleted: row.onboarding_completed ?? false,
    disclaimerAcknowledged: row.disclaimer_acknowledged ?? false,
    disclaimerAcknowledgedAt: row.disclaimer_acknowledged_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function validateInvestorProfileInput(body: unknown):
  | { ok: true; value: InvestorProfileInput }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const record = body as Record<string, unknown>;
  const allowedFields = new Set([
    "investmentKnowledgeLevel",
    "marketExperience",
    "explanationDepth",
    "marketInterests",
    "disclaimerAcknowledged",
    "startingTickers",
  ]);
  const unknownFields = Object.keys(record).filter((key) => !allowedFields.has(key));

  if (unknownFields.length) {
    return { ok: false, error: "Unsupported profile field." };
  }

  if (!isInvestmentKnowledgeLevel(record.investmentKnowledgeLevel)) {
    return { ok: false, error: "Choose a valid investing terms familiarity level." };
  }

  if (!isMarketExperience(record.marketExperience)) {
    return { ok: false, error: "Choose a valid market experience range." };
  }

  if (!isExplanationDepth(record.explanationDepth)) {
    return { ok: false, error: "Choose a valid explanation depth." };
  }

  if (!Array.isArray(record.marketInterests)) {
    return { ok: false, error: "Choose at least one market interest." };
  }

  const marketInterests = Array.from(
    new Set(record.marketInterests.filter(isMarketInterest))
  ).slice(0, 9);

  if (!marketInterests.length) {
    return { ok: false, error: "Choose at least one market interest." };
  }

  if (record.disclaimerAcknowledged !== true) {
    return {
      ok: false,
      error: "Acknowledge the informational-only disclaimer to continue.",
    };
  }

  if (
    "startingTickers" in record &&
    record.startingTickers !== undefined &&
    !Array.isArray(record.startingTickers)
  ) {
    return { ok: false, error: "Starting tickers must be a list." };
  }

  const parsedStartingTickers = Array.isArray(record.startingTickers)
    ? record.startingTickers.map((ticker) => validateTicker(ticker))
    : [];
  const invalidStartingTicker = parsedStartingTickers.find((ticker) => !ticker.ok);

  if (invalidStartingTicker) {
    return { ok: false, error: "Starting tickers must use valid symbols." };
  }

  const startingTickers = Array.from(
    new Set(parsedStartingTickers.map((ticker) => ticker.ticker))
  ).slice(0, 8);

  return {
    ok: true,
    value: {
      investmentKnowledgeLevel: record.investmentKnowledgeLevel,
      marketExperience: record.marketExperience,
      explanationDepth: record.explanationDepth,
      marketInterests,
      disclaimerAcknowledged: true,
      startingTickers,
    },
  };
}
