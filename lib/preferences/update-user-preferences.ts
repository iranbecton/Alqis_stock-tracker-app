import { createClient } from "@/lib/supabase/server";
import {
  normalizePreferenceTicker,
  normalizePreferencesRow,
  type UserPreferences,
  type UserPreferencesRow,
  type UserPreferencesUpdate,
} from "./types";

export async function updateUserPreferences(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  update: UserPreferencesUpdate
): Promise<UserPreferences> {
  const payload = {
    user_id: userId,
    ...(update.defaultTicker !== undefined
      ? { default_ticker: normalizePreferenceTicker(update.defaultTicker) }
      : {}),
    ...(update.defaultChartRange !== undefined
      ? { default_chart_range: update.defaultChartRange }
      : {}),
    ...(update.experienceLevel !== undefined
      ? { experience_level: update.experienceLevel }
      : {}),
    ...(update.briefFocus !== undefined ? { brief_focus: update.briefFocus } : {}),
    ...(update.preferredSectors !== undefined
      ? { preferred_sectors: update.preferredSectors }
      : {}),
    ...(update.showEducationTips !== undefined
      ? { show_education_tips: update.showEducationTips }
      : {}),
  };

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select(
      "id,user_id,default_ticker,default_chart_range,experience_level,brief_focus,preferred_sectors,show_education_tips,created_at,updated_at"
    )
    .single();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS preferences] Update failed", { userId, error });
    }

    throw new Error("Preferences unavailable.");
  }

  return normalizePreferencesRow(data as UserPreferencesRow, userId);
}
