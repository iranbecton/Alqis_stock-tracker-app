import "server-only";
import type {
  AIWordingInput,
  AIWordingOutput,
  AIWordingProvider,
} from "@/lib/ai/providers/types";
import {
  buildAIWordingSystemPrompt,
  buildAIWordingUserPrompt,
} from "@/lib/ai/wording/prompt";
import { validateAIWordingOutput } from "@/lib/ai/wording/validate";

export const anthropicWordingProvider: AIWordingProvider = {
  name: "anthropic",
  async generateWording(input: AIWordingInput): Promise<AIWordingOutput> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("Missing ANTHROPIC_API_KEY.");
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_WORDING_MODEL ?? "claude-sonnet-4-6",
        max_tokens: 1200,
        system: buildAIWordingSystemPrompt(),
        messages: [
          {
            role: "user",
            content: buildAIWordingUserPrompt(input),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
    };
    const rawText = data.content
      .filter((block) => block.type === "text")
      .map((block) => block.text ?? "")
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error("Anthropic wording response returned invalid JSON.");
    }

    const validation = validateAIWordingOutput(parsed as AIWordingOutput, input);
    if (!validation.isValid) {
      throw new Error("Anthropic wording response failed schema validation.");
    }

    return parsed as AIWordingOutput;
  },
};
