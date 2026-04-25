import type {
  AIWordingInput,
  AIWordingOutput,
  AIWordingValidationResult,
} from "@/lib/ai/providers/types";
import { AI_WORDING_FORBIDDEN_TERMS } from "@/lib/ai/wording/prompt";

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function flattenOutput(output: AIWordingOutput) {
  return [
    output.headline,
    output.summary,
    output.plainEnglishRead,
    output.trustNote,
    ...output.whyItMatters,
    ...output.counterevidence,
  ].join(" ");
}

function findForbiddenTerms(value: string) {
  const normalized = value.toLowerCase();

  return AI_WORDING_FORBIDDEN_TERMS.filter((term) => {
    const escaped = term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = term.includes(" ")
      ? new RegExp(escaped, "i")
      : new RegExp(`\\b${escaped}\\b`, "i");

    return pattern.test(normalized);
  });
}

function formattedPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function outputContradictsDirection(text: string, direction: AIWordingInput["direction"]) {
  const lowerText = text.toLowerCase();

  if (direction === "higher") {
    return /\bmoved lower\b|\btraded lower\b|\bfell\b|\bdeclined\b/.test(lowerText);
  }

  if (direction === "lower") {
    return /\bmoved higher\b|\btraded higher\b|\brose\b|\brallied\b|\bgained\b/.test(lowerText);
  }

  return /\bmoved higher\b|\bmoved lower\b|\brallied\b|\bfell\b/.test(lowerText);
}

function outputClaimsChartConfirmation(text: string) {
  return /chart (confirmed|confirms|validated|validates)|price action confirmed|chart confirmation|confirmed by the chart/i.test(
    text
  );
}

function outputUpgradesConfidence(text: string, input: AIWordingInput) {
  const lowerText = text.toLowerCase();
  const confidenceRanks = {
    "low confidence": 1,
    "moderate confidence": 2,
    "good confidence": 3,
    "high confidence": 4,
  } as const;
  const currentRank = confidenceRanks[input.confidence.label.toLowerCase() as keyof typeof confidenceRanks] ?? 0;

  return Object.entries(confidenceRanks).some(([label, rank]) => {
    return rank > currentRank && lowerText.includes(label);
  });
}

function outputInventsSourceCount(text: string, sourceCount: number) {
  const sourceMatches = [...text.matchAll(/\b(\d+)\s+sources?\b/gi)];

  return sourceMatches.some((match) => Number(match[1]) !== sourceCount);
}

function outputInventsPercentages(text: string, input: AIWordingInput) {
  const percentMatches = [...text.matchAll(/[+-]?\d+(?:\.\d+)?%/g)].map(
    (match) => match[0]
  );

  if (!percentMatches.length) {
    return false;
  }

  const allowed = new Set([
    formattedPercent(input.movePct),
    `${input.movePct.toFixed(2)}%`,
  ]);

  if (typeof input.chartMovePct === "number") {
    allowed.add(formattedPercent(input.chartMovePct));
    allowed.add(`${input.chartMovePct.toFixed(2)}%`);
  }

  return percentMatches.some((match) => !allowed.has(match));
}

export function validateAIWordingOutput(
  output: AIWordingOutput,
  input: AIWordingInput
): AIWordingValidationResult {
  const warnings: string[] = [];
  const text = flattenOutput(output);

  if (
    !output.headline ||
    !output.summary ||
    !output.plainEnglishRead ||
    !output.trustNote
  ) {
    warnings.push("AI wording output is missing required text fields.");
  }

  if (!Array.isArray(output.whyItMatters) || output.whyItMatters.length < 1) {
    warnings.push("AI wording output must include whyItMatters.");
  }

  if (!Array.isArray(output.counterevidence)) {
    warnings.push("AI wording output must include counterevidence.");
  }

  if (countWords(output.summary) > 55) {
    warnings.push("AI wording summary must be under 55 words.");
  }

  if (countWords(output.plainEnglishRead) > 90) {
    warnings.push("AI wording plainEnglishRead must be under 90 words.");
  }

  const forbiddenTerms = findForbiddenTerms(text);

  if (forbiddenTerms.length) {
    warnings.push(`Forbidden terms detected: ${forbiddenTerms.join(", ")}`);
  }

  if (outputContradictsDirection(text, input.direction)) {
    warnings.push("AI wording contradicts structured direction.");
  }

  if (outputUpgradesConfidence(text, input)) {
    warnings.push("AI wording upgrades structured confidence.");
  }

  if (input.chartStatus !== "ok" && outputClaimsChartConfirmation(text)) {
    warnings.push("AI wording claims chart confirmation without live chart data.");
  }

  if (outputInventsSourceCount(text, input.sourceCount)) {
    warnings.push("AI wording invents or changes source count.");
  }

  if (outputInventsPercentages(text, input)) {
    warnings.push("AI wording invents or changes move percentages.");
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
