import type { createClient } from "@/lib/supabase/server";
import {
  normalizeInvestorProfileRow,
  type ExplanationDepth,
  type InvestmentKnowledgeLevel,
  type InvestorProfile,
  type InvestorProfileInput,
  type InvestorProfileRow,
  type MarketExperience,
  type MarketInterest,
} from "./investor-profile-schema";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const PROFILE_SELECT =
  "user_id,investment_knowledge_level,market_experience,explanation_depth,market_interests,onboarding_completed,disclaimer_acknowledged,disclaimer_acknowledged_at,created_at,updated_at";

type SupabaseProfileError = {
  code?: string;
  message?: string;
};

function getSafeProfileError(error: unknown): SupabaseProfileError {
  if (!error || typeof error !== "object") {
    return {};
  }

  const record = error as Record<string, unknown>;

  return {
    code: typeof record.code === "string" ? record.code : undefined,
    message: typeof record.message === "string" ? record.message : undefined,
  };
}

function isNoRowsError(error: SupabaseProfileError) {
  return error.code === "PGRST116";
}

function warnProfileLookup(error: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const safeError = getSafeProfileError(error);

  if (isNoRowsError(safeError)) {
    return;
  }

  console.warn("[ALQIS profile] Profile lookup unavailable", {
    code: safeError.code,
    message: safeError.message,
  });
}

function warnProfileSave(label: string, error: unknown) {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  const safeError = getSafeProfileError(error);

  console.warn(label, {
    code: safeError.code,
    message: safeError.message,
  });
}

export async function getInvestorProfile(
  supabase: SupabaseServerClient,
  userId: string
): Promise<InvestorProfile | null> {
  const { data, error } = await supabase
    .from("user_investor_profiles")
    .select(PROFILE_SELECT)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    warnProfileLookup(error);
    return null;
  }

  return data ? normalizeInvestorProfileRow(data as InvestorProfileRow) : null;
}

export async function hasCompletedOnboarding(
  supabase: SupabaseServerClient,
  userId: string
) {
  const profile = await getInvestorProfile(supabase, userId);
  return Boolean(
    profile?.onboardingCompleted &&
      profile.disclaimerAcknowledged &&
      profile.disclaimerAcknowledgedAt
  );
}

export async function saveInvestorProfile(
  supabase: SupabaseServerClient,
  userId: string,
  input: InvestorProfileInput
): Promise<InvestorProfile> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("user_investor_profiles")
    .upsert(
      {
        user_id: userId,
        investment_knowledge_level: input.investmentKnowledgeLevel,
        market_experience: input.marketExperience,
        explanation_depth: input.explanationDepth,
        market_interests: input.marketInterests,
        onboarding_completed: true,
        disclaimer_acknowledged: input.disclaimerAcknowledged,
        disclaimer_acknowledged_at: now,
      },
      { onConflict: "user_id" }
    )
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    warnProfileSave("[ALQIS profile] Profile save unavailable", error);
    throw new Error("Profile unavailable.");
  }

  if (input.startingTickers.length) {
    const rows = input.startingTickers.map((ticker) => ({
      user_id: userId,
      ticker,
      company_name: null,
    }));

    const { error: watchlistError } = await supabase
      .from("watchlist_items")
      .upsert(rows, { onConflict: "user_id,ticker" });

    if (watchlistError) {
      warnProfileSave(
        "[ALQIS profile] Starting tickers save unavailable",
        watchlistError
      );
    }
  }

  return normalizeInvestorProfileRow(data as InvestorProfileRow);
}

export type InvestorProfileUpdate = {
  investmentKnowledgeLevel: InvestmentKnowledgeLevel;
  marketExperience: MarketExperience;
  explanationDepth: ExplanationDepth;
  marketInterests: MarketInterest[];
};

export async function updateInvestorProfile(
  supabase: SupabaseServerClient,
  userId: string,
  update: InvestorProfileUpdate
): Promise<InvestorProfile> {
  const { data, error } = await supabase
    .from("user_investor_profiles")
    .update({
      investment_knowledge_level: update.investmentKnowledgeLevel,
      market_experience: update.marketExperience,
      explanation_depth: update.explanationDepth,
      market_interests: update.marketInterests,
    })
    .eq("user_id", userId)
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    warnProfileSave("[ALQIS profile] Profile update unavailable", error);
    throw new Error("Profile unavailable.");
  }

  return normalizeInvestorProfileRow(data as InvestorProfileRow);
}
