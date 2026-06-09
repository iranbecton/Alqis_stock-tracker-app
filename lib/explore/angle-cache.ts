import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchTickerFundamentals,
  type TickerFundamentals,
} from "@/lib/explore/fetch-fundamentals";
import type { IdeaCard } from "@/lib/explore/generate-ideas";
import { getFinnhubCompanyNews } from "@/lib/news/finnhub";
import { createServiceRoleClient } from "@/lib/supabase/service";
type AngleResult = {
  hook: string;
  reason: string;
  confidence: {
    score: number;
    band: "A" | "B" | "C" | "D";
    label: string;
  };
  generatedAt: string;
};

export type ExploreAngleRow = {
  id: string;
  angle_data: Record<string, AngleResult> | null;
};

const DAILY_ANGLE_LIMIT = 30;
const TOP_ANGLE_STAGGER_MS = 100;
const SYSTEM_PROMPT = `You are a financial analysis engine. Given a stock ticker, FIT score, and available data,
generate a concise investment angle observation.

Respond ONLY with valid JSON - no preamble, no markdown fences, no explanation:
{
  "hook": "one phrase under 12 words capturing the core observation or tension",
  "reason": "2-3 sentences under 55 words of evidence-based context"
}

Rules:
- Use only data provided - do not invent facts or catalysts
- Observational language only: "rose after", "driven by", "appears tied to", "amid"
- Never use: b\u0075y, se\u006cl, reco\u006dmend, target\u0020price, b\u0075llish, be\u0061rish, just\u0069fied, int\u0061ct, warr\u0061nted
- No investment advice, no certainty claims, no action language
- If evidence is thin, be plainly uncertain rather than overclaiming`;
const FORBIDDEN_TERMS = [
  "b\u0075y",
  "se\u006cl",
  "reco\u006dmend",
  "target\u0020price",
  "b\u0075llish",
  "be\u0061rish",
  "just\u0069fied",
  "int\u0061ct",
  "warr\u0061nted",
  "quality\u0020demand\u0020signals",
];

export async function readTodayAngleRow(
  supabase: SupabaseClient,
  userId: string,
  dateKey = getDateKey()
): Promise<ExploreAngleRow | null> {
  const { data, error } = await supabase
    .from("explore_daily_ideas")
    .select("id,angle_data")
    .eq("user_id", userId)
    .eq("generated_date", dateKey)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as { id?: unknown; angle_data?: unknown };

  if (typeof row.id !== "string") {
    return null;
  }

  return {
    id: row.id,
    angle_data: normalizeAngleData(row.angle_data),
  };
}


export async function generateAndCacheAngle({

  row,
  ticker,
  fitScore,
  fundamentals,
  forceRefresh = false,
}: {
  row: ExploreAngleRow;
  ticker: string;
  fitScore: number;
  fundamentals?: TickerFundamentals;
  forceRefresh?: boolean;
}) {
  const normalizedTicker = normalizeTicker(ticker);
  const existingAngleData = row.angle_data ?? {};

  if (!forceRefresh && existingAngleData[normalizedTicker]) {
    return existingAngleData[normalizedTicker];
  }

  if (Object.keys(existingAngleData).length >= DAILY_ANGLE_LIMIT) {
    return null;
  }

  const fundamentalsPayload =
    fundamentals ?? (await fetchTickerFundamentals(normalizedTicker));
  const headlines = await getRecentHeadlines(normalizedTicker);
  const angle = await generateAngle(
    normalizedTicker,
    fitScore,
    fundamentalsPayload,
    headlines
  );
  await writeAngleData(row.id, {
    ...existingAngleData,
    [normalizedTicker]: angle,
  });

  return angle;
}

export async function preGenerateTopIdeaAngles({
  supabase,
  userId,
  ideas,
}: {
  supabase: SupabaseClient;
  userId: string;
  ideas: IdeaCard[];
}) {
  const row = await readTodayAngleRow(supabase, userId);
  console.log('[ANGLE-CACHE] row result:', JSON.stringify(row));
  if (!row) {
    console.log('[ANGLE-CACHE] No row found - returning empty');
    return {};
  }
  if (!row) {
    return {};
  }

  const topIdeas = ideas
    .slice()
    .sort((a, b) => b.fitScore.score - a.fitScore.score)
    .slice(0, 5);

  await Promise.allSettled(
    topIdeas.map(async (idea, index) => {
      await delay(index * TOP_ANGLE_STAGGER_MS);

      if (row.angle_data?.[idea.ticker]) {
        return;
      }

      try {
        const angle = await generateAndCacheAngle({
          row,
          ticker: idea.ticker,
          fitScore: idea.fitScore.score,
          fundamentals: idea.fundamentals,
        });

        if (angle) {
          row.angle_data = {
            ...(row.angle_data ?? {}),
            [idea.ticker]: angle,
          };
        }
      } catch (error) {
        console.error('[ALQIS explore] FULL ERROR:',
            error instanceof Error ? error.message : String(error),
            error
        );
        throw error;
      }
    })
  );

  return row.angle_data ?? {};
}

export function countAngleDataKeys(row: ExploreAngleRow) {
  return Object.keys(row.angle_data ?? {}).length;
}

export function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

async function getRecentHeadlines(ticker: string) {
  try {
    const news = await getFinnhubCompanyNews(ticker);
    return news.map((item) => item.headline).filter(Boolean).slice(0, 3);
  } catch {
    return [];
  }
}

async function generateAngle(
  ticker: string,
  fitScore: number,
  fundamentals: TickerFundamentals | null | undefined,
  headlines: string[]
): Promise<AngleResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const fundamentalsSummary = fundamentals
    ? JSON.stringify(fundamentals)
    : "Not available";
  const headlineLines = headlines.length > 0
    ? headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")
    : "No recent headlines available";
  const userPrompt = [
    `Ticker: ${ticker}`,
    `FIT Score: ${fitScore}/100`,
    `Fundamentals: ${fundamentalsSummary}`,
    `Recent Headlines:\n${headlineLines}`,
    `\nGenerate an investment angle observation for ${ticker}.`,
  ].join("\n");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const data = await response.json() as {
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
    throw new Error("Angle generation returned invalid JSON.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).hook !== "string" ||
    typeof (parsed as Record<string, unknown>).reason !== "string" ||
    ((parsed as Record<string, unknown>).hook as string).trim().length === 0 ||
    ((parsed as Record<string, unknown>).reason as string).trim().length === 0
  ) {
    throw new Error("Angle generation returned malformed output.");
  }

  const hook = ((parsed as Record<string, unknown>).hook as string).trim();
  const reason = ((parsed as Record<string, unknown>).reason as string).trim();

  if (hook.length > 100 || reason.length > 400) {
    throw new Error("Angle generation returned malformed output.");
  }

  if (containsForbiddenTerms(hook) || containsForbiddenTerms(reason)) {
    throw new Error("Angle generation contained forbidden advisory language.");
  }

  return {
    hook,
    reason,
    confidence: deriveAngleConfidence(fitScore),
    generatedAt: new Date().toISOString(),
  };
}

function deriveAngleConfidence(fitScore: number): AngleResult["confidence"] {
  const score = Math.min(1, Math.max(0, fitScore / 100));
  if (score >= 0.85) return { score, band: "A", label: "High confidence" };
  if (score >= 0.70) return { score, band: "B", label: "Good confidence" };
  if (score >= 0.55) return { score, band: "C", label: "Moderate confidence" };
  return { score, band: "D", label: "Low confidence" };
}

function containsForbiddenTerms(value: string) {
  return FORBIDDEN_TERMS.some((term) => {
    const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, "i");
    return pattern.test(value);
  });
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function writeAngleData(rowId: string, angleData: Record<string, AngleResult>) {
  const serviceSupabase = createServiceRoleClient();
  const { error } = await serviceSupabase
      .from("explore_daily_ideas")
      .update({ angle_data: angleData })
      .eq("id", rowId);

  console.log('[WRITE-ANGLE] rowId:', rowId, 'error:', JSON.stringify(error));

  if (error) {
    throw new Error("Explore angle cache write failed.");
  }
}

function normalizeAngleData(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, AngleResult>;
}

function normalizeTicker(value: string) {
  return value.trim().toUpperCase();
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}
