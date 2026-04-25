import type { AIWordingInput } from "@/lib/ai/providers/types";

export const AI_WORDING_FORBIDDEN_TERMS = [
  "buy",
  "sell",
  "hold",
  "price target",
  "target price",
  "should invest",
  "I recommend",
  "guaranteed",
  "will go up",
  "will go down",
];

export function buildAIWordingSystemPrompt() {
  return [
    "You are polishing wording for ALQIS, a premium market-intelligence app.",
    "The structured ALQIS engine is the only source of truth.",
    "You may only use the structured facts provided by the user message.",
    "Do not create new facts, causes, prices, source counts, confidence levels, recommendations, or claims.",
    "Do not mention sources that are not provided.",
    "Do not change confidence, direction, move percentages, timeframe, or evidence strength.",
    "Do not give investment advice.",
    "Do not use buy, sell, hold, price target, or target price language.",
    "Do not say will go up or will go down.",
    "Keep language neutral, explanatory, educational, calm, and premium.",
    "Keep summary under 55 words.",
    "Keep plainEnglishRead under 90 words.",
    "Explain uncertainty clearly.",
    "If chartStatus is fallback or unavailable, do not say chart confirms the move.",
    "Return only JSON matching the requested schema.",
  ].join("\n");
}

export function buildAIWordingUserPrompt(input: AIWordingInput) {
  return JSON.stringify(
    {
      task: "Rewrite the provided structured ALQIS explanation into clearer wording without changing facts.",
      constraints: {
        sourceOfTruth: "structured_fields_only",
        forbiddenTerms: input.forbiddenTerms,
        summaryMaxWords: 55,
        plainEnglishReadMaxWords: 90,
        chartConfirmationAllowed: input.chartStatus === "ok",
      },
      structuredInput: input,
      requiredOutput: {
        headline: "Short premium headline using only approved drivers.",
        summary: "Neutral summary under 55 words.",
        plainEnglishRead: "Plain-English explanation under 90 words.",
        whyItMatters: "Two or three concise bullets.",
        counterevidence: "One to three concise caution bullets from provided counterevidence only.",
        trustNote: "One sentence explaining that wording is polished but structured evidence is source of truth.",
      },
    },
    null,
    2
  );
}
