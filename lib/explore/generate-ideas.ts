import { stableHash } from "@/lib/cache/keys";
import {
  fetchTickerFundamentals,
  type TickerFundamentals,
} from "@/lib/explore/fetch-fundamentals";
import {
  computeFitScore,
  type FitScoreResult,
  type FitScoreInputs,
} from "@/lib/explore/fit-score";
import { getUniverseSector } from "@/lib/market/universe-sector-map";
import { createClient } from "@/lib/supabase/server";

export type UserExploreContext = {
  portfolioTickers: string[];
  portfolioSectors: string[];
  watchlistTickers: string[];
  riskProfile: "conservative" | "moderate" | "aggressive" | null;
  existingExplanations: { ticker: string; confidenceBand: string }[];
};

export type IdeaCard = {
  rank: number;
  ticker: string;
  sector: string;
  fitScore: FitScoreResult;
  fundamentals: TickerFundamentals;
  angle: string | null;
};

export type DailyIdeasResult = {
  ideas: IdeaCard[];
  generatedAt: string;
  fallback: boolean;
};

export type DailyIdeasWithCacheStatus = DailyIdeasResult & {
  cacheStatus: "hit" | "miss";
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type DailyIdeasRow = {
  ideas?: unknown;
  fit_scores?: unknown;
  created_at?: string | null;
  expires_at?: string | null;
};

type CachedFitScores = {
  contextHash?: unknown;
};

const DAILY_IDEAS_TTL_MS = 24 * 60 * 60 * 1000;
const FUNDAMENTALS_STAGGER_MS = 100;

// Discovery uses a 25-ticker candidate pool for acceptable first-load performance.
// Full 103-ticker universe scoring is a post-v1 background job.
const DISCOVERY_CANDIDATE_POOL = [
  "AAPL",
  "MSFT",
  "NVDA",
  "AVGO",
  "ORCL",
  "AMD",
  "QCOM",
  "AMAT",
  "ASML",
  "GOOGL",
  "META",
  "NFLX",
  "AMZN",
  "TSLA",
  "COST",
  "JPM",
  "BAC",
  "V",
  "MA",
  "LLY",
  "JNJ",
  "ABBV",
  "XOM",
  "TSM",
  "PLTR",
] as const;

export async function generateDailyIdeas(
  userId: string,
  userContext: UserExploreContext
): Promise<DailyIdeasResult> {
  const result = await generateDailyIdeasWithCacheStatus(userId, userContext);
  return {
    ideas: result.ideas,
    generatedAt: result.generatedAt,
    fallback: result.fallback,
  };
}

export async function generateDailyIdeasWithCacheStatus(
  userId: string,
  userContext: UserExploreContext
): Promise<DailyIdeasWithCacheStatus> {
  const supabase = await createClient();
  const contextHash = getExploreContextHash(userContext);
  const dateKey = getDateKey();
  const cached = await readCachedDailyIdeas(
    supabase,
    userId,
    dateKey,
    contextHash
  );

  if (cached) {
    return { ...cached, cacheStatus: "hit" };
  }

  const result = await buildDailyIdeas(userContext);
  await storeDailyIdeas(supabase, userId, dateKey, contextHash, result);

  return { ...result, cacheStatus: "miss" };
}

async function buildDailyIdeas(
  userContext: UserExploreContext
): Promise<DailyIdeasResult> {
  const excludedTickers = new Set(
    [...userContext.portfolioTickers, ...userContext.watchlistTickers].map(
      normalizeTicker
    )
  );
  const candidateTickers = DISCOVERY_CANDIDATE_POOL.filter(
    (ticker) => !excludedTickers.has(normalizeTicker(ticker))
  );
  const fundamentals = await fetchCandidateFundamentals(candidateTickers);
  const explanationByTicker = new Map(
    userContext.existingExplanations.map((item) => [
      normalizeTicker(item.ticker),
      normalizeConfidenceBand(item.confidenceBand),
    ])
  );

  const scoredIdeas = fundamentals
    .map((fundamental) => {
      const ticker = normalizeTicker(fundamental.ticker);
      const confidenceBand = explanationByTicker.get(ticker) ?? null;
      const sector = getUniverseSector(ticker);
      const fitScore = computeFitScore({
        ticker,
        sector,
        beta: fundamental.beta,
        peRatio: fundamental.peRatio,
        marketCap: fundamental.marketCap,
        oneMonthChange: fundamental.oneMonthChange,
        hasRecentExplanation: confidenceBand !== null,
        explanationConfidenceBand: confidenceBand,
        userPortfolioTickers: userContext.portfolioTickers,
        userPortfolioSectors: userContext.portfolioSectors,
        userRiskProfile: userContext.riskProfile,
      } satisfies FitScoreInputs);

      return {
        ticker,
        sector,
        fitScore,
        fundamentals: fundamental,
      };
    })
    .sort((a, b) => b.fitScore.score - a.fitScore.score);

  return {
    ideas: scoredIdeas.slice(0, 5).map((idea, index) => ({
      ...idea,
      rank: index + 1,
      angle: null,
    })),
    generatedAt: new Date().toISOString(),
    fallback: userContext.portfolioTickers.length === 0,
  };
}

async function fetchCandidateFundamentals(
  tickers: readonly string[]
): Promise<TickerFundamentals[]> {
  return Promise.all(
    tickers.map(async (ticker, index) => {
      if (index > 0) {
        await delay(index * FUNDAMENTALS_STAGGER_MS);
      }

      return fetchTickerFundamentals(ticker);
    })
  );
}

async function readCachedDailyIdeas(
  supabase: SupabaseServerClient,
  userId: string,
  dateKey: string,
  contextHash: string
): Promise<DailyIdeasResult | null> {
  const { data, error } = await supabase
    .from("explore_daily_ideas")
    .select("ideas,fit_scores,created_at,expires_at")
    .eq("user_id", userId)
    .eq("generated_date", dateKey)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as DailyIdeasRow;
  const expiresAt = typeof row.expires_at === "string" ? row.expires_at : null;

  if (!expiresAt || Date.parse(expiresAt) <= Date.now()) {
    return null;
  }

  if (!hasMatchingContext(row.fit_scores, contextHash)) {
    return null;
  }

  const ideas = Array.isArray(row.ideas) ? (row.ideas as IdeaCard[]) : [];

  return {
    ideas,
    generatedAt: row.created_at ?? new Date().toISOString(),
    fallback: ideas.some((idea) => idea.fitScore?.fallback) || ideas.length === 0,
  };
}

async function storeDailyIdeas(
  supabase: SupabaseServerClient,
  userId: string,
  dateKey: string,
  contextHash: string,
  result: DailyIdeasResult
) {
  const scores = Object.fromEntries(
    result.ideas.map((idea) => [idea.ticker, idea.fitScore.score])
  );

  await supabase.from("explore_daily_ideas").upsert(
    {
      user_id: userId,
      generated_date: dateKey,
      ideas: result.ideas,
      fit_scores: {
        contextHash,
        scores,
      },
      expires_at: new Date(Date.now() + DAILY_IDEAS_TTL_MS).toISOString(),
    },
    { onConflict: "user_id,generated_date" }
  );
}

function getExploreContextHash(userContext: UserExploreContext) {
  return stableHash({
    portfolioTickers: normalizeList(userContext.portfolioTickers),
    portfolioSectors: normalizeList(userContext.portfolioSectors),
    watchlistTickers: normalizeList(userContext.watchlistTickers),
    riskProfile: userContext.riskProfile,
    explanations: userContext.existingExplanations.map((item) => ({
      ticker: normalizeTicker(item.ticker),
      confidenceBand: normalizeConfidenceBand(item.confidenceBand),
    })),
  });
}

function hasMatchingContext(value: unknown, contextHash: string) {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (value as CachedFitScores).contextHash === contextHash;
}

function normalizeConfidenceBand(
  value: string
): FitScoreInputs["explanationConfidenceBand"] {
  const band = value.trim().toUpperCase();

  return band === "A" || band === "B" || band === "C" || band === "D"
    ? band
    : null;
}

function normalizeList(values: string[]) {
  return Array.from(new Set(values.map(normalizeTicker).filter(Boolean))).sort();
}

function normalizeTicker(value: string) {
  return value.trim().toUpperCase();
}

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
