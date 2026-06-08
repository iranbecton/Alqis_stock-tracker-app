import { NextResponse } from "next/server";
import {
  countAngleDataKeys,
  generateAndCacheAngle,
} from "@/lib/explore/angle-cache";
import { normalizedApiError } from "@/lib/errors/api-error";
import { requireApiUser } from "@/lib/security/auth";
import { hashId, rateLimit } from "@/lib/security/rate-limit";
import { parseJsonObject } from "@/lib/security/validation";
import { validateTicker } from "@/lib/security/validation";
import { createServiceRoleClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AngleRequestBody = {
  ticker?: unknown;
  fitScore?: unknown;
  forceRefresh?: unknown;
};

type ExploreAngleRow = {
  id: string;
  ideas: unknown;
  fit_scores: unknown;
  angle_data: Record<string, AngleResult> | null;
};

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

type StoredExploreIdea = {
  ticker?: unknown;
  fitScore?: {
    score?: unknown;
  };
};

const ANGLE_RATE_LIMIT = {
  limit: 10,
  windowSeconds: 60 * 60,
};
const REFRESH_COOLDOWN_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
  }

  const limit = await rateLimit(
    `explore-angle:user:${hashId(auth.userId)}`,
    ANGLE_RATE_LIMIT
  );

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "rate_limited",
        retryAfter: getRetryAfterSeconds(limit.resetAt),
      },
      { status: 429 }
    );
  }

  const body = await parseJsonObject(request);

  if (!body.ok) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: body.error,
    });
  }

  const parsed = parseAngleRequest(body.value as AngleRequestBody);

  if (!parsed.ok) {
    return normalizedApiError({
      code: "VALIDATION_ERROR",
      message: parsed.error,
    });
  }

  try {
    const row = await readCurrentExploreAngleRow(auth.userId);

    if (!row) {
      return normalizedApiError({
        code: "NOT_FOUND",
        message: "Explore ideas are not available yet.",
      });
    }

    const idea = findStoredIdea(row.ideas, parsed.value.ticker);

    if (!idea) {
      return NextResponse.json(
        { error: "ticker_not_in_explore_pool" },
        { status: 400 }
      );
    }

    const fitScore = getStoredFitScore(idea, row.fit_scores, parsed.value.ticker);

    if (fitScore === null) {
      return normalizedApiError({
        code: "INTERNAL_ERROR",
        message: "Angle unavailable.",
        status: 500,
      });
    }

    const cached = row.angle_data?.[parsed.value.ticker];

    if (cached && !parsed.value.forceRefresh) {
      return NextResponse.json({
        status: "ok",
        angle: cached,
        cacheStatus: "hit",
      });
    }

    if (cached && parsed.value.forceRefresh && isWithinRefreshCooldown(cached)) {
      return NextResponse.json({
        status: "ok",
        angle: cached,
        cacheStatus: "hit",
        cached: true,
        refreshCooledDown: true,
      });
    }

    if (countAngleDataKeys(row) >= 30) {
      return normalizedApiError({
        code: "RATE_LIMITED",
        message: "Daily angle limit reached",
        status: 429,
      });
    }

    const angle = await generateAndCacheAngle({
      row,
      ticker: parsed.value.ticker,
      fitScore,
      forceRefresh: parsed.value.forceRefresh,
    });

    if (!angle) {
      return normalizedApiError({
        code: "RATE_LIMITED",
        message: "Daily angle limit reached",
        status: 429,
      });
    }

    return NextResponse.json({
      status: "ok",
      angle,
      cacheStatus: "miss",
    });
  } catch {
    return normalizedApiError({
      code: "INTERNAL_ERROR",
      message: "Angle unavailable.",
      status: 500,
    });
  }
}

function parseAngleRequest(body: AngleRequestBody):
  | {
      ok: true;
      value: {
        ticker: string;
        forceRefresh: boolean;
      };
    }
  | { ok: false; error: string } {
  const ticker = validateTicker(body.ticker);

  if (!ticker.ok) {
    return { ok: false, error: "Choose a valid ticker." };
  }

  return {
    ok: true,
    value: {
      ticker: ticker.ticker,
      forceRefresh: body.forceRefresh === true,
    },
  };
}

async function readCurrentExploreAngleRow(userId: string) {
  const serviceSupabase = createServiceRoleClient();
  const { data, error } = await serviceSupabase
    .from("explore_daily_ideas")
    .select("id,ideas,fit_scores,angle_data")
    .eq("user_id", userId)
    .eq("generated_date", getDateKey())
    .maybeSingle();

  if (error || !data || typeof data.id !== "string") {
    return null;
  }

  return {
    id: data.id,
    ideas: data.ideas,
    fit_scores: data.fit_scores,
    angle_data: normalizeAngleData(data.angle_data),
  } satisfies ExploreAngleRow;
}

function findStoredIdea(ideas: unknown, ticker: string) {
  if (!Array.isArray(ideas)) {
    return null;
  }

  const normalizedTicker = ticker.trim().toUpperCase();
  const idea = ideas.find((item) => {
    if (!item || typeof item !== "object") {
      return false;
    }

    const candidate = (item as StoredExploreIdea).ticker;
    return typeof candidate === "string" && candidate.trim().toUpperCase() === normalizedTicker;
  });

  return idea && typeof idea === "object" ? (idea as StoredExploreIdea) : null;
}

function getStoredFitScore(
  idea: StoredExploreIdea,
  fitScores: unknown,
  ticker: string
) {
  const score = idea.fitScore?.score;

  if (typeof score === "number" && Number.isFinite(score)) {
    return Math.min(100, Math.max(0, Math.round(score)));
  }

  const scoreMap = getFitScoreMap(fitScores);
  const fallbackScore = scoreMap?.[ticker.trim().toUpperCase()];

  if (typeof fallbackScore === "number" && Number.isFinite(fallbackScore)) {
    return Math.min(100, Math.max(0, Math.round(fallbackScore)));
  }

  return null;
}

function getFitScoreMap(fitScores: unknown) {
  if (!fitScores || typeof fitScores !== "object") {
    return null;
  }

  const scores = (fitScores as { scores?: unknown }).scores;
  return scores && typeof scores === "object" && !Array.isArray(scores)
    ? (scores as Record<string, unknown>)
    : null;
}

function normalizeAngleData(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, AngleResult>;
}

function isWithinRefreshCooldown(angle: AngleResult) {
  const generatedAt = Date.parse(angle.generatedAt);

  return Number.isFinite(generatedAt) && Date.now() - generatedAt < REFRESH_COOLDOWN_MS;
}

function getRetryAfterSeconds(resetAt: string) {
  const resetAtMs = Date.parse(resetAt);

  if (!Number.isFinite(resetAtMs)) {
    return ANGLE_RATE_LIMIT.windowSeconds;
  }

  return Math.max(1, Math.ceil((resetAtMs - Date.now()) / 1000));
}

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}
