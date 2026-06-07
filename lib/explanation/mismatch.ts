export type MismatchType =
  | "large_move_weak_evidence"
  | "strong_evidence_muted_move"
  | null;

export type MismatchResult = {
  type: MismatchType;
  label: string;
  detail: string;
} | null;

export function detectMismatch(
  movePct: number,
  confidenceScore: number,
  confidenceBand: string
): MismatchResult {
  const absMov = Math.abs(movePct);

  if (absMov >= 3 && (confidenceBand === "C" || confidenceBand === "D")) {
    return {
      type: "large_move_weak_evidence",
      label: "Move vs. Evidence",
      detail:
        "Move outsized relative to available evidence — additional context may be missing.",
    };
  }

  if (absMov < 1 && confidenceScore >= 0.85) {
    return {
      type: "strong_evidence_muted_move",
      label: "Evidence vs. Move",
      detail:
        "Strong evidence, muted market response — watch for delayed reaction.",
    };
  }

  return null;
}
