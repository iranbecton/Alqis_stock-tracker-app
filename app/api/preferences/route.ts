import { NextResponse } from "next/server";
import { getUserPreferences } from "@/lib/preferences/get-user-preferences";
import { updateUserPreferences } from "@/lib/preferences/update-user-preferences";
import {
  isBriefFocus,
  isExperienceLevel,
  isUserChartRange,
  normalizePreferenceTicker,
  type UserPreferencesUpdate,
} from "@/lib/preferences/types";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedFields = new Set([
  "defaultTicker",
  "defaultChartRange",
  "experienceLevel",
  "briefFocus",
  "preferredSectors",
  "showEducationTips",
]);

export async function GET() {
  const auth = await getAuthenticatedUser();

  if ("response" in auth) {
    return auth.response;
  }

  const preferences = await getUserPreferences(auth.supabase, auth.userId);

  return NextResponse.json({ preferences });
}

export async function PATCH(request: Request) {
  const auth = await getAuthenticatedUser();

  if ("response" in auth) {
    return auth.response;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const validation = validatePreferencesUpdate(body);

  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  try {
    const preferences = await updateUserPreferences(
      auth.supabase,
      auth.userId,
      validation.update
    );

    return NextResponse.json({ preferences });
  } catch {
    return NextResponse.json(
      { error: "Preferences unavailable. Try again after the database migration is applied." },
      { status: 500 }
    );
  }
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  return {
    supabase,
    userId: user.id,
  };
}

function validatePreferencesUpdate(body: unknown):
  | { ok: true; update: UserPreferencesUpdate }
  | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, error: "Request body must be an object." };
  }

  const record = body as Record<string, unknown>;
  const unknownFields = Object.keys(record).filter((key) => !allowedFields.has(key));

  if (unknownFields.length) {
    return { ok: false, error: "Unsupported preference field." };
  }

  const update: UserPreferencesUpdate = {};

  if ("defaultTicker" in record) {
    if (typeof record.defaultTicker !== "string") {
      return { ok: false, error: "Default ticker must be text." };
    }

    update.defaultTicker = normalizePreferenceTicker(record.defaultTicker);
  }

  if ("defaultChartRange" in record) {
    if (!isUserChartRange(record.defaultChartRange)) {
      return { ok: false, error: "Chart range must be 1D, 5D, or 1M." };
    }

    update.defaultChartRange = record.defaultChartRange;
  }

  if ("experienceLevel" in record) {
    if (!isExperienceLevel(record.experienceLevel)) {
      return {
        ok: false,
        error: "Experience level must be beginner, intermediate, or advanced.",
      };
    }

    update.experienceLevel = record.experienceLevel;
  }

  if ("briefFocus" in record) {
    if (!isBriefFocus(record.briefFocus)) {
      return {
        ok: false,
        error: "Daily brief focus must be balanced, watchlist, market_context, or education.",
      };
    }

    update.briefFocus = record.briefFocus;
  }

  if ("preferredSectors" in record) {
    if (
      !Array.isArray(record.preferredSectors) ||
      record.preferredSectors.some((sector) => typeof sector !== "string")
    ) {
      return { ok: false, error: "Preferred sectors must be a text list." };
    }

    update.preferredSectors = record.preferredSectors
      .map((sector) => sector.trim())
      .filter(Boolean)
      .slice(0, 8);
  }

  if ("showEducationTips" in record) {
    if (typeof record.showEducationTips !== "boolean") {
      return { ok: false, error: "Education tips must be true or false." };
    }

    update.showEducationTips = record.showEducationTips;
  }

  return { ok: true, update };
}
