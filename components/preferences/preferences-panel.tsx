"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  briefFocusOptions,
  chartRanges,
  experienceLevels,
  type UserPreferences,
} from "@/lib/preferences/types";

type PreferencesResponse = {
  preferences?: UserPreferences;
  error?: string;
};

export function PreferencesPanel({
  initialPreferences,
}: {
  initialPreferences: UserPreferences;
}) {
  const [preferences, setPreferences] = useState(initialPreferences);
  const [draft, setDraft] = useState(initialPreferences);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/preferences", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          defaultTicker: draft.defaultTicker,
          defaultChartRange: draft.defaultChartRange,
          experienceLevel: draft.experienceLevel,
          briefFocus: draft.briefFocus,
          showEducationTips: draft.showEducationTips,
        }),
      });
      const json = (await response.json()) as PreferencesResponse;

      if (!response.ok || !json.preferences) {
        throw new Error(json.error ?? "Preferences unavailable.");
      }

      setPreferences(json.preferences);
      setDraft(json.preferences);
      setStatus("Preferences saved.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Preferences unavailable."
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card variant="subtle" radius="xl" className="border-border/72">
      <CardHeader>
        <CardEyebrow>
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Preferences
        </CardEyebrow>
        <CardTitle>Personalize the reading surface.</CardTitle>
        <CardDescription>
          Lightweight defaults for how ALQIS opens charts, briefs, and education cues.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Default ticker" htmlFor="default-ticker">
              <Input
                id="default-ticker"
                value={draft.defaultTicker}
                maxLength={6}
                autoComplete="off"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    defaultTicker: event.target.value.toUpperCase(),
                  }))
                }
              />
            </Field>

            <Field label="Chart range" htmlFor="default-chart-range">
              <Select
                id="default-chart-range"
                value={draft.defaultChartRange}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    defaultChartRange: value as UserPreferences["defaultChartRange"],
                  }))
                }
              >
                {chartRanges.map((range) => (
                  <option key={range} value={range}>
                    {range}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Explanation level" htmlFor="experience-level">
              <Select
                id="experience-level"
                value={draft.experienceLevel}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    experienceLevel: value as UserPreferences["experienceLevel"],
                  }))
                }
              >
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>
                    {formatOptionLabel(level)}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Daily brief focus" htmlFor="brief-focus">
              <Select
                id="brief-focus"
                value={draft.briefFocus}
                onChange={(value) =>
                  setDraft((current) => ({
                    ...current,
                    briefFocus: value as UserPreferences["briefFocus"],
                  }))
                }
              >
                {briefFocusOptions.map((focus) => (
                  <option key={focus} value={focus}>
                    {formatOptionLabel(focus)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <label className="flex min-h-12 items-center justify-between gap-3 rounded-[var(--radius-lg)] border border-border/70 bg-surface/42 px-4 py-3">
            <span>
              <span className="block text-sm font-medium text-ink">Education tips</span>
              <span className="mt-1 block text-body-sm text-ink-muted">
                Show lightweight learning cues and encyclopedia links.
              </span>
            </span>
            <input
              type="checkbox"
              checked={draft.showEducationTips}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  showEducationTips: event.target.checked,
                }))
              }
              className="h-5 w-5 accent-[var(--accent-primary)]"
            />
          </label>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" size="sm" className="normal-case tracking-normal">
                Default: {preferences.defaultTicker}
              </Badge>
              <Badge variant="ai" size="sm" className="normal-case tracking-normal">
                {formatOptionLabel(preferences.briefFocus)} brief
              </Badge>
            </div>
            <Button type="submit" variant="secondary" size="sm" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save preferences"}
            </Button>
          </div>

          {status ? <p className="text-body-sm text-accent-secondary">{status}</p> : null}
          {error ? <p className="text-body-sm text-warn">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="section-kicker block text-ink-muted">
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  children,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-[var(--radius-md)] border border-border bg-surface-elevated px-4 text-sm text-ink outline-none transition focus:border-accent focus:shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent-primary)_24%,transparent)]"
    >
      {children}
    </select>
  );
}

function formatOptionLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
