import type { ConfidenceBand } from "@/lib/ai/types";

export type ExplanationHistoryStatus =
  | "saved"
  | "duplicate"
  | "skipped_logged_out"
  | "save_failed";

export type ExplanationHistoryItem = {
  id: string;
  ticker: string;
  companyName: string | null;
  timeframe: string;
  summary: string;
  confidenceScore: number | null;
  confidenceBand: ConfidenceBand | null;
  confidenceLabel: string | null;
  sourceCount: number | null;
  keyFactors: unknown;
  counterEvidence: unknown;
  generatedAt: string;
  createdAt: string;
};

export type StockExplanationRow = {
  id: string;
  ticker: string;
  company_name: string | null;
  timeframe: string;
  summary: string;
  confidence_score: number | null;
  confidence_band: ConfidenceBand | null;
  confidence_label: string | null;
  source_count: number | null;
  key_factors: unknown;
  counterevidence: unknown;
  generated_at: string;
  created_at: string;
};

export function toExplanationHistoryItem(
  row: StockExplanationRow
): ExplanationHistoryItem {
  return {
    id: row.id,
    ticker: row.ticker,
    companyName: row.company_name,
    timeframe: row.timeframe,
    summary: row.summary,
    confidenceScore:
      typeof row.confidence_score === "number"
        ? row.confidence_score
        : row.confidence_score
          ? Number(row.confidence_score)
          : null,
    confidenceBand: row.confidence_band,
    confidenceLabel: row.confidence_label,
    sourceCount: row.source_count,
    keyFactors: row.key_factors,
    counterEvidence: row.counterevidence,
    generatedAt: row.generated_at,
    createdAt: row.created_at,
  };
}
