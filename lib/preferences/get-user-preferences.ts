import { createClient } from "@/lib/supabase/server";
import {
  createDefaultPreferences,
  normalizePreferencesRow,
  type UserPreferences,
  type UserPreferencesRow,
} from "./types";

export async function getUserPreferences(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from("user_preferences")
    .select(
      "id,user_id,default_ticker,default_chart_range,experience_level,brief_focus,preferred_sectors,show_education_tips,created_at,updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[ALQIS preferences] Load failed", { userId, error });
    }

    return createDefaultPreferences(userId);
  }

  if (!data) {
    return createDefaultPreferences(userId);
  }

  return normalizePreferencesRow(data as UserPreferencesRow, userId);
}
