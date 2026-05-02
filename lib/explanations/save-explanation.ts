import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { WhyMovingInputs, WhyMovingResponse } from "@/lib/ai/types";
import { stableHash } from "@/lib/cache/keys";
import type { ExplanationHistoryStatus } from "@/lib/explanations/types";
import { normalizeTicker } from "@/lib/market-data/validation";

type SaveExplanationInput = {
  supabase: SupabaseClient;
  user: User | null;
  explanation: WhyMovingResponse;
  inputs?: WhyMovingInputs;
  explanationHash?: string;
};

type SaveExplanationResult = {
  status: ExplanationHistoryStatus;
  savedExplanationId?: string;
};

export async function saveExplanationHistory({
  supabase,
  user,
  explanation,
  inputs,
  explanationHash,
}: SaveExplanationInput): Promise<SaveExplanationResult> {
  if (!user) {
    return { status: "skipped_logged_out" };
  }

  const hash = explanationHash ?? createExplanationHash(explanation);

  try {
    const { data, error } = await supabase
      .from("stock_explanations")
      .upsert(
        {
          user_id: user.id,
          ticker: normalizeTicker(explanation.ticker),
          company_name: inputs?.companyName ?? null,
          timeframe: explanation.timeframe,
          summary: explanation.summary,
          confidence_score: explanation.confidence.score,
          confidence_band: explanation.confidence.band,
          confidence_label: explanation.confidence.label,
          source_count: explanation.sourceCount,
          key_factors: explanation.keyFactors,
          counterevidence: explanation.counterEvidence,
          data_health: {
            chartStatus: inputs?.chartStatus,
            chartFallback: inputs?.chartFallback,
            hasQuote: Boolean(inputs?.quote),
            newsCount: inputs?.newsItems.length ?? 0,
          },
          provider_status: {
            quote: inputs?.quote ? "ok" : "missing",
            chart:
              inputs?.chartStatus === "ok" && !inputs.chartFallback
                ? "ok"
                : inputs?.chartFallback
                  ? "fallback"
                  : "missing",
            news: inputs?.newsItems.length ? "ok" : "limited",
          },
          explanation_hash: hash,
          generated_at: explanation.generatedAt,
        },
        {
          onConflict: "user_id,ticker,timeframe,explanation_hash",
          ignoreDuplicates: true,
        }
      )
      .select("id")
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data?.id) {
      return { status: "duplicate" };
    }

    return {
      status: "saved",
      savedExplanationId: data.id,
    };
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS explanations] Save failed", {
        ticker: explanation.ticker,
        error,
      });
    }

    return { status: "save_failed" };
  }
}

export function createExplanationHash(explanation: WhyMovingResponse) {
  return stableHash({
    ticker: explanation.ticker,
    timeframe: explanation.timeframe,
    summary: explanation.summary,
    confidence: explanation.confidence,
    keyFactors: explanation.keyFactors,
    counterEvidence: explanation.counterEvidence,
    generatedAt: explanation.generatedAt,
  });
}
