import OpenAI from "openai";
import type {
  AIWordingInput,
  AIWordingOutput,
  AIWordingProvider,
} from "@/lib/ai/providers/types";
import {
  buildAIWordingSystemPrompt,
  buildAIWordingUserPrompt,
} from "@/lib/ai/wording/prompt";

const AI_WORDING_OUTPUT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "headline",
    "summary",
    "plainEnglishRead",
    "whyItMatters",
    "counterevidence",
    "trustNote",
  ],
  properties: {
    headline: {
      type: "string",
      maxLength: 160,
    },
    summary: {
      type: "string",
      maxLength: 420,
    },
    plainEnglishRead: {
      type: "string",
      maxLength: 720,
    },
    whyItMatters: {
      type: "array",
      minItems: 1,
      maxItems: 3,
      items: {
        type: "string",
        maxLength: 220,
      },
    },
    counterevidence: {
      type: "array",
      minItems: 0,
      maxItems: 3,
      items: {
        type: "string",
        maxLength: 220,
      },
    },
    trustNote: {
      type: "string",
      maxLength: 260,
    },
  },
} as const;

function getOpenAIApiKey() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (
    !apiKey ||
    /your|placeholder|example|test/i.test(apiKey) ||
    !apiKey.startsWith("sk-")
  ) {
    throw new Error(
      "Missing OPENAI_API_KEY. Add it to .env.local without NEXT_PUBLIC."
    );
  }

  return apiKey;
}

type ResponseLike = {
  output_text?: unknown;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: unknown;
    }>;
  }>;
};

function parseResponseText(response: unknown) {
  const responseLike = response as ResponseLike;

  if (
    typeof responseLike.output_text === "string" &&
    responseLike.output_text.trim()
  ) {
    return responseLike.output_text;
  }

  const output = responseLike.output ?? [];

  for (const item of output) {
    if (item.type !== "message") {
      continue;
    }

    for (const content of item.content ?? []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response did not include output text.");
}

export const openAIWordingProvider: AIWordingProvider = {
  name: "openai",
  async generateWording(input: AIWordingInput): Promise<AIWordingOutput> {
    const client = new OpenAI({
      apiKey: getOpenAIApiKey(),
    });
    const response = await client.responses.create({
      model: process.env.OPENAI_WORDING_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: buildAIWordingSystemPrompt(),
        },
        {
          role: "user",
          content: buildAIWordingUserPrompt(input),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "alqis_ai_wording_output",
          strict: true,
          schema: AI_WORDING_OUTPUT_SCHEMA,
        },
      },
    });
    const text = parseResponseText(response);

    return JSON.parse(text) as AIWordingOutput;
  },
};
