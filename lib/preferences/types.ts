export const chartRanges = ["1D", "5D", "1M", "6M", "1Y"] as const;
export const experienceLevels = ["beginner", "intermediate", "advanced"] as const;
export const briefFocusOptions = [
  "balanced",
  "watchlist",
  "market_context",
  "education",
] as const;

export type UserChartRange = (typeof chartRanges)[number];
export type ExperienceLevel = (typeof experienceLevels)[number];
export type BriefFocus = (typeof briefFocusOptions)[number];

export type UserPreferences = {
  id: string | null;
  userId: string;
  defaultTicker: string;
  defaultChartRange: UserChartRange;
  experienceLevel: ExperienceLevel;
  briefFocus: BriefFocus;
  preferredSectors: string[];
  showEducationTips: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type UserPreferencesUpdate = Partial<{
  defaultTicker: string;
  defaultChartRange: UserChartRange;
  experienceLevel: ExperienceLevel;
  briefFocus: BriefFocus;
  preferredSectors: string[];
  showEducationTips: boolean;
}>;

export type UserPreferencesRow = {
  id: string;
  user_id: string;
  default_ticker: string | null;
  default_chart_range: string | null;
  experience_level: string | null;
  brief_focus: string | null;
  preferred_sectors: string[] | null;
  show_education_tips: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export function createDefaultPreferences(userId: string): UserPreferences {
  return {
    id: null,
    userId,
    defaultTicker: "NVDA",
    defaultChartRange: "1D",
    experienceLevel: "beginner",
    briefFocus: "balanced",
    preferredSectors: [],
    showEducationTips: true,
    createdAt: null,
    updatedAt: null,
  };
}

export function isUserChartRange(value: unknown): value is UserChartRange {
  return typeof value === "string" && chartRanges.includes(value as UserChartRange);
}

export function isExperienceLevel(value: unknown): value is ExperienceLevel {
  return (
    typeof value === "string" &&
    experienceLevels.includes(value as ExperienceLevel)
  );
}

export function isBriefFocus(value: unknown): value is BriefFocus {
  return typeof value === "string" && briefFocusOptions.includes(value as BriefFocus);
}

export function normalizePreferencesRow(
  row: UserPreferencesRow,
  userId: string
): UserPreferences {
  return {
    id: row.id,
    userId,
    defaultTicker: normalizePreferenceTicker(row.default_ticker),
    defaultChartRange: isUserChartRange(row.default_chart_range)
      ? row.default_chart_range
      : "1D",
    experienceLevel: isExperienceLevel(row.experience_level)
      ? row.experience_level
      : "beginner",
    briefFocus: isBriefFocus(row.brief_focus) ? row.brief_focus : "balanced",
    preferredSectors: Array.isArray(row.preferred_sectors)
      ? row.preferred_sectors.filter((sector) => typeof sector === "string")
      : [],
    showEducationTips: row.show_education_tips ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function normalizePreferenceTicker(value: unknown) {
  const ticker = typeof value === "string" ? value.trim().toUpperCase() : "";

  return /^[A-Z]{1,5}$/.test(ticker) ? ticker : "NVDA";
}
