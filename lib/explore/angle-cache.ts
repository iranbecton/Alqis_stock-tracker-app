import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateAngle, type AngleResult } from "@/lib/explore/generate-angle";
import {
  fetchTickerFundamentals,
  type TickerFundamentals,
} from "@/lib/explore/fetch-fundamentals";
import type { IdeaCard } from "@/lib/explore/generate-ideas";
import { getFinnhubCompanyNews } from "@/lib/news/finnhub";
import { createServiceRoleClient } from "@/lib/supabase/service";

export type ExploreAngleRow = {
  id: string;
  angle_data: Record<string, AngleResult> | null;
};

const DAILY_ANGLE_LIMIT = 30;
const TOP_ANGLE_STAGGER_MS = 100;

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
