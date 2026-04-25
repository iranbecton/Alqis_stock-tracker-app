import type { WhyMovingExplanation } from "@/lib/explanation/types";
import { findForbiddenTerms } from "@/lib/explanation/forbidden-terms";

export type ExplanationValidationResult = {
  isValid: boolean;
  warnings: string[];
};

export function validateExplanationOutput(
  explanation: WhyMovingExplanation
): ExplanationValidationResult {
  const warnings: string[] = [];
  const serialized = JSON.stringify(explanation);

  if (!explanation.headline || explanation.headline.length < 12) {
    warnings.push("Headline is too short.");
  }

  if (!explanation.summary || explanation.summary.length < 40) {
    warnings.push("Summary is too short.");
  }

  if (explanation.causes.length < 3) {
    warnings.push("At least three causes are required.");
  }

  if (!explanation.disclaimer.includes("informational only")) {
    warnings.push("Required informational-only disclaimer is missing.");
  }

  const forbiddenTerms = findForbiddenTerms(serialized);

  if (forbiddenTerms.length) {
    warnings.push(`Forbidden language detected: ${forbiddenTerms.join(", ")}`);
  }

  return {
    isValid: warnings.length === 0,
    warnings,
  };
}
