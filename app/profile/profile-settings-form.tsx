"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardEyebrow,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  ExplanationDepth,
  InvestmentKnowledgeLevel,
  InvestorProfile,
  MarketExperience,
  MarketInterest,
} from "@/lib/profile/investor-profile-schema";
import { cn } from "@/lib/utils";

const knowledgeOptions: Array<{
  value: InvestmentKnowledgeLevel;
  label: string;
  description: string;
}> = [
  {
    value: "new",
    label: "New to investing",
    description: "Explain core terms as they appear.",
  },
  {
    value: "basic",
    label: "Some basics",
    description: "Keep reads plain, with light market context.",
  },
  {
    value: "comfortable",
    label: "Comfortable with stocks and ETFs",
    description: "Use market language with quick explanations.",
  },
  {
    value: "advanced",
    label: "Advanced market follower",
    description: "Prioritize concise evidence and context.",
  },
];

const experienceOptions: Array<{
  value: MarketExperience;
  label: string;
  description: string;
}> = [
  { value: "starting", label: "Just getting started", description: "Build the basics into reads." },
  { value: "lt_1y", label: "Less than 1 year", description: "Balance education with timely context." },
  { value: "1_3y", label: "1-3 years", description: "Keep explanations efficient and grounded." },
  { value: "3_7y", label: "3-7 years", description: "Surface evidence and nuance sooner." },
  { value: "7y_plus", label: "7+ years", description: "Lean into compact market context." },
];

const depthOptions: Array<{
  value: ExplanationDepth;
  label: string;
  description: string;
}> = [
  { value: "simple", label: "Keep it simple", description: "Short reads with plain-English definitions." },
  { value: "balanced", label: "Balanced explanation", description: "A practical mix of summary and evidence." },
  { value: "detailed", label: "More detailed market context", description: "More supporting context when data allows." },
];

const interestOptions: Array<{ value: MarketInterest; label: string }> = [
  { value: "individual_stocks", label: "Individual stocks" },
  { value: "etfs", label: "ETFs" },
  { value: "earnings", label: "Earnings" },
  { value: "ai_technology", label: "AI and technology" },
  { value: "healthcare", label: "Healthcare" },
  { value: "energy", label: "Energy" },
  { value: "crypto_context", label: "Crypto market context" },
  { value: "macro_fed_rates", label: "Macro/Fed/rates" },
  { value: "beginner_terms", label: "Beginner investing terms" },
];

type ProfileResponse = {
  profile?: InvestorProfile;
  error?: string;
  message?: string;
};

type ProfileDraft = Pick<
  InvestorProfile,
  | "investmentKnowledgeLevel"
  | "marketExperience"
  | "explanationDepth"
  | "marketInterests"
>;

export function ProfileSettingsForm({
  initialProfile,
}: {
  initialProfile: InvestorProfile;
}) {
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState<ProfileDraft>({
    investmentKnowledgeLevel: initialProfile.investmentKnowledgeLevel,
    marketExperience: initialProfile.marketExperience,
    explanationDepth: initialProfile.explanationDepth,
    marketInterests: initialProfile.marketInterests.length
      ? initialProfile.marketInterests
      : ["individual_stocks", "earnings"],
  });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function update<Key extends keyof ProfileDraft>(
    key: Key,
    value: ProfileDraft[Key]
  ) {
    setError(null);
    setStatus(null);
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function toggleInterest(value: MarketInterest) {
    setError(null);
    setStatus(null);
    setDraft((current) => {
      const exists = current.marketInterests.includes(value);
      return {
        ...current,
        marketInterests: exists
          ? current.marketInterests.filter((item) => item !== value)
          : [...current.marketInterests, value],
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!draft.marketInterests.length) {
      setError("Choose at least one market interest.");
      return;
    }

    setError(null);
    setStatus(null);
    setIsSaving(true);

    try {
      const response = await fetch("/api/profile/investor", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const payload = (await response.json().catch(() => null)) as ProfileResponse | null;

      if (!response.ok || !payload?.profile) {
        throw new Error(
          payload?.error ?? payload?.message ?? "Profile could not be saved."
        );
      }

      setProfile(payload.profile);
      setDraft({
        investmentKnowledgeLevel: payload.profile.investmentKnowledgeLevel,
        marketExperience: payload.profile.marketExperience,
        explanationDepth: payload.profile.explanationDepth,
        marketInterests: payload.profile.marketInterests,
      });
      setStatus("Profile updated.");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Profile could not be saved."
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
      <CardHeader>
        <CardEyebrow>Market Intelligence Profile</CardEyebrow>
        <CardTitle className="text-[1.35rem]">How ALQIS reads your level</CardTitle>
        <CardDescription>
          Personalize explanation style without changing any saved disclaimer status.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-7">
          <OptionGroup
            title="Investment knowledge level"
            options={knowledgeOptions}
            value={draft.investmentKnowledgeLevel}
            onChange={(value) => update("investmentKnowledgeLevel", value)}
          />
          <OptionGroup
            title="Market experience"
            options={experienceOptions}
            value={draft.marketExperience}
            onChange={(value) => update("marketExperience", value)}
          />
          <OptionGroup
            title="Explanation depth"
            options={depthOptions}
            value={draft.explanationDepth}
            onChange={(value) => update("explanationDepth", value)}
          />

          <div className="space-y-3">
            <p className="section-kicker text-ink-muted">Market interests</p>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((option) => {
                const active = draft.marketInterests.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleInterest(option.value)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition",
                      active
                        ? "border-accent/34 bg-accent/12 text-ink"
                        : "border-border/70 bg-surface/42 text-ink-muted hover:border-accent/28 hover:text-ink"
                    )}
                  >
                    {active ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-gain" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-body-sm text-ink-subtle">
              Current depth: {formatOptionLabel(profile.explanationDepth)}
            </p>
            <Button type="submit" variant="secondary" size="sm" disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isSaving ? "Saving..." : "Save profile"}
            </Button>
          </div>

          {status ? <p className="text-body-sm text-accent-secondary">{status}</p> : null}
          {error ? <p className="text-body-sm text-warn">{error}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}

function OptionGroup<Value extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ value: Value; label: string; description: string }>;
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="section-kicker text-ink-muted">{title}</p>
      <div className="grid gap-3 md:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-[var(--radius-lg)] border p-4 text-left transition hover:border-accent/30 hover:bg-accent/8",
              option.value === value
                ? "border-accent/36 bg-accent/12"
                : "border-border/70 bg-surface/42"
            )}
          >
            <span className="block text-sm font-semibold text-ink">{option.label}</span>
            <span className="mt-2 block text-body-sm leading-5 text-ink-muted">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function formatOptionLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
