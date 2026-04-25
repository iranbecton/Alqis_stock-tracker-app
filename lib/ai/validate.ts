import type { WhyMovingResponse } from "@/lib/ai/types";

const FORBIDDEN_TERMS = [
  "buy",
  "sell",
  "bullish setup",
  "bearish setup",
  "target price",
  "i recommend",
  "you should",
];

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function findForbiddenTerms(value: string) {
  const normalized = value.toLowerCase();
  return FORBIDDEN_TERMS.filter((term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = term.includes(" ")
      ? new RegExp(escaped, "i")
      : new RegExp(`\\b${escaped}\\b`, "i");

    return pattern.test(normalized);
  });
}

export function validateWhyMovingResponse(response: WhyMovingResponse) {
  const warnings: string[] = [];

  if (!response.ticker || !response.timeframe) {
    warnings.push("Missing ticker or timeframe.");
  }

  if (typeof response.movePct !== "number" || Number.isNaN(response.movePct)) {
    warnings.push("movePct must be a number.");
  }

  if (!response.summary) {
    warnings.push("summary is required.");
  }

  if (countWords(response.summary) > 55) {
    warnings.push("summary must be under 55 words.");
  }

  if (response.keyFactors.length < 2 || response.keyFactors.length > 4) {
    warnings.push("keyFactors must include 2 to 4 items.");
  }

  response.keyFactors.forEach((factor, index) => {
    if (!factor.label || !factor.description) {
      warnings.push(`keyFactors[${index}] must include label and description.`);
    }

    if (
      typeof factor.score !== "number" ||
      Number.isNaN(factor.score) ||
      factor.score < 0 ||
      factor.score > 1
    ) {
      warnings.push(`keyFactors[${index}].score must be a number from 0 to 1.`);
    }

    if (
      typeof factor.evidenceCount !== "number" ||
      factor.evidenceCount < 0
    ) {
      warnings.push(`keyFactors[${index}].evidenceCount must be a non-negative number.`);
    }

    if (!["direct", "sector", "macro", "contextual"].includes(factor.evidenceType)) {
      warnings.push(`keyFactors[${index}].evidenceType is invalid.`);
    }

    if (
      !["supports_move", "contradicts_move", "neutral"].includes(
        factor.moveAlignment
      )
    ) {
      warnings.push(`keyFactors[${index}].moveAlignment is invalid.`);
    }

    if (
      factor.newsRelevance &&
      ![
        "direct_company",
        "company_context",
        "sector_context",
        "macro_context",
        "low_relevance",
      ].includes(factor.newsRelevance)
    ) {
      warnings.push(`keyFactors[${index}].newsRelevance is invalid.`);
    }
  });

  response.counterEvidence.forEach((item, index) => {
    if (!item.label || !item.description) {
      warnings.push(`counterEvidence[${index}] must include label and description.`);
    }
  });

  const forbidden = findForbiddenTerms(
    [
      response.summary,
      response.dailyMoveLabel,
      response.chartMoveLabel,
      ...response.keyFactors.flatMap((factor) => [
        factor.label,
        factor.description,
        factor.evidenceType,
        factor.moveAlignment,
        factor.newsRelevance ?? "",
      ]),
      ...response.counterEvidence.flatMap((item) => [
        item.label,
        item.description,
      ]),
    ].join(" ")
  );

  if (forbidden.length) {
    warnings.push(`Forbidden terms detected: ${forbidden.join(", ")}`);
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
