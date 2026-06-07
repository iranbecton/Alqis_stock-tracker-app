import { NextResponse } from "next/server";
import {
  countAngleDataKeys,
  generateAndCacheAngle,
  readTodayAngleRow,
} from "@/lib/explore/angle-cache";
import { normalizedApiError } from "@/lib/errors/api-error";
import { requireApiUser } from "@/lib/security/auth";
import { parseJsonObject } from "@/lib/security/validation";
import { validateTicker } from "@/lib/security/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AngleRequestBody = {
  ticker?: unknown;
  fitScore?: unknown;
  forceRefresh?: unknown;
};

export async function POST(request: Request) {
  const auth = await requireApiUser();

  if (!auth.ok) {
    return auth.response;
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
    const row = await readTodayAngleRow(auth.supabase, auth.userId);

    if (!row) {
      return normalizedApiError({
        code: "NOT_FOUND",
        message: "Explore ideas are not available yet.",
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
      fitScore: parsed.value.fitScore,
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
        fitScore: number;
        forceRefresh: boolean;
      };
    }
  | { ok: false; error: string } {
  const ticker = validateTicker(body.ticker);

  if (!ticker.ok) {
    return { ok: false, error: "Choose a valid ticker." };
  }

  if (typeof body.fitScore !== "number" || !Number.isFinite(body.fitScore)) {
    return { ok: false, error: "FIT score is required." };
  }

  return {
    ok: true,
    value: {
      ticker: ticker.ticker,
      fitScore: Math.min(100, Math.max(0, Math.round(body.fitScore))),
      forceRefresh: body.forceRefresh === true,
    },
  };
}
