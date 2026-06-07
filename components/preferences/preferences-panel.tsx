"use client";

import { FormEvent, useState } from "react";
import type { ReactNode } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  briefFocusOptions,
  chartRanges,
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
    <Card
      variant="subtle"
      radius="xl"
      className="border-border/48 bg-surface/34 shadow-[inset_0_1px_0_rgba(255,255,255,0.015),0_8px_22px_rgba(2,6,10,0.08)]"
    >
      <CardHeader className="mb-3">
        <CardEyebrow>
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Preferences
        </CardEyebrow>
        <CardTitle className="text-[1.2rem] sm:text-[1.35rem]">
          Reading preferences
        </CardTitle>
      </CardHeader>

      <CardContent>
        <details className="group">
          <summary className="flex min-h-12 cursor-pointer list-none flex-col gap-3 rounded-[var(--radius-lg)] border border-border/58 bg-surface/30 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">
                Lightweight defaults for chart range, brief focus, and education cues.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" size="sm" className="normal-case tracking-normal">
                  Default: {preferences.defaultTicker}
                </Badge>
                <Badge variant="ai" size="sm" className="normal-case tracking-normal">
                  {formatOptionLabel(preferences.briefFocus)} brief
                </Badge>
              </div>
            </div>
            <span className="shrink-0 rounded-full border border-border/60 bg-surface/42 px-3 py-1.5 text-body-sm font-medium text-ink-muted transition group-open:text-ink">
              Edit
            </span>
          </summary>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Default ticker" htmlFor="default-ticker">
                <Input
                  id="default-ticker"
                  value={draft.defaultTicker}
                  maxLength={5}
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
        </details>
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
