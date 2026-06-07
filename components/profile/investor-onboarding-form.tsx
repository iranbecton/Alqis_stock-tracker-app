"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    label: "Advanced / active market follower",
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

const steps = [
  "Knowledge",
  "Experience",
  "Depth",
  "Interests",
  "Tickers",
  "Disclaimer",
] as const;

type InvestorOnboardingFormProps = {
  initialProfile?: InvestorProfile | null;
};

type FormState = {
  investmentKnowledgeLevel: InvestmentKnowledgeLevel;
  marketExperience: MarketExperience;
  explanationDepth: ExplanationDepth;
  marketInterests: MarketInterest[];
  startingTickers: string;
  disclaimerAcknowledged: boolean;
};

export function InvestorOnboardingForm({
  initialProfile,
}: InvestorOnboardingFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<FormState>({
    investmentKnowledgeLevel: initialProfile?.investmentKnowledgeLevel ?? "basic",
    marketExperience: initialProfile?.marketExperience ?? "starting",
    explanationDepth: initialProfile?.explanationDepth ?? "balanced",
    marketInterests: initialProfile?.marketInterests?.length
      ? initialProfile.marketInterests
      : ["individual_stocks", "earnings"],
    startingTickers: "",
    disclaimerAcknowledged: initialProfile?.disclaimerAcknowledged ?? false,
  });

  const currentStep = steps[activeStep];
  const isLastStep = activeStep === steps.length - 1;

  function update<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setError(null);
    setState((current) => ({ ...current, [key]: value }));
  }

  function toggleInterest(value: MarketInterest) {
    setError(null);
    setState((current) => {
      const exists = current.marketInterests.includes(value);
      return {
        ...current,
        marketInterests: exists
          ? current.marketInterests.filter((item) => item !== value)
          : [...current.marketInterests, value],
      };
    });
  }

  function goNext() {
    if (currentStep === "Interests" && state.marketInterests.length === 0) {
      setError("Choose at least one area for ALQIS to explain.");
      return;
    }

    if (currentStep === "Disclaimer" && !state.disclaimerAcknowledged) {
      setError("Acknowledge the informational-only disclaimer to continue.");
      return;
    }

    setError(null);
    setActiveStep((step) => Math.min(step + 1, steps.length - 1));
  }

  async function submitProfile() {
    if (!state.disclaimerAcknowledged) {
      setError("Acknowledge the informational-only disclaimer to continue.");
      return;
    }

    setError(null);
    const startingTickers = state.startingTickers
      .split(/[\s,]+/)
      .map((ticker) => ticker.trim())
      .filter(Boolean);

    setIsSaving(true);

    try {
      const response = await fetch("/api/profile/investor", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investmentKnowledgeLevel: state.investmentKnowledgeLevel,
          marketExperience: state.marketExperience,
          explanationDepth: state.explanationDepth,
          marketInterests: state.marketInterests,
          startingTickers,
          disclaimerAcknowledged: state.disclaimerAcknowledged,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
          message?: string;
        } | null;
        setError(
          payload?.error ??
            payload?.message ??
            "Profile could not be saved. Please try again."
        );
        setIsSaving(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Profile could not be saved. Please try again.");
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4 py-5 sm:px-8 lg:px-10">
      <header className="flex items-center justify-between gap-4">
        <div className="inline-flex items-center gap-3" aria-label="ALQIS">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-lg)] border border-accent-ai/16 bg-[color-mix(in_srgb,var(--accent-ai)_14%,transparent)] text-sm font-semibold tracking-[0.2em] text-accent-ai">
            A
          </span>
          <span className="font-serif text-[1.05rem] font-semibold leading-none tracking-[-0.04em] text-ink">
            ALQIS
          </span>
        </div>
        <p className="hidden text-[0.7rem] font-bold uppercase tracking-[0.18em] text-blue-100/42 sm:block">
          Market intelligence profile
        </p>
      </header>

      <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.82fr_1.18fr]">
        <section className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-300/14 bg-blue-500/8 px-4 py-2 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-blue-200">
            <ShieldCheck className="h-3.5 w-3.5" />
            Education-first setup
          </div>
          <div className="space-y-4">
            <h1 className="font-serif text-[clamp(2.8rem,7vw,5.8rem)] leading-[0.9] tracking-[-0.065em] text-[#eef5ff]">
              Tune your ALQIS profile.
            </h1>
            <p className="max-w-xl text-[1rem] leading-8 text-blue-100/62">
              Help ALQIS explain market moves at the right level for you.
            </p>
          </div>
          <p className="max-w-xl text-[0.78rem] leading-6 text-blue-100/42">
            This profile personalizes education and explanation style only. ALQIS explanations are informational and educational only. They do not constitute investment, tax, legal, or financial advice.
          </p>
        </section>

        <section className="rounded-[2rem] border border-blue-200/12 bg-[linear-gradient(180deg,rgba(13,27,48,0.88),rgba(7,14,25,0.95))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.045),0_30px_90px_rgba(2,6,14,0.4)] backdrop-blur-xl sm:p-6">
          <StepProgress activeStep={activeStep} />

          <div className="mt-6 min-h-[23rem]">
            {currentStep === "Knowledge" ? (
              <OptionStep
                title="How familiar are you with investing terms?"
                options={knowledgeOptions}
                value={state.investmentKnowledgeLevel}
                onChange={(value) => update("investmentKnowledgeLevel", value)}
              />
            ) : null}

            {currentStep === "Experience" ? (
              <OptionStep
                title="How long have you followed or invested in markets?"
                options={experienceOptions}
                value={state.marketExperience}
                onChange={(value) => update("marketExperience", value)}
              />
            ) : null}

            {currentStep === "Depth" ? (
              <OptionStep
                title="How should ALQIS explain market moves?"
                options={depthOptions}
                value={state.explanationDepth}
                onChange={(value) => update("explanationDepth", value)}
              />
            ) : null}

            {currentStep === "Interests" ? (
              <InterestStep
                selected={state.marketInterests}
                onToggle={toggleInterest}
              />
            ) : null}

            {currentStep === "Tickers" ? (
              <TickerStep
                value={state.startingTickers}
                onChange={(value) => update("startingTickers", value)}
              />
            ) : null}

            {currentStep === "Disclaimer" ? (
              <DisclaimerStep
                checked={state.disclaimerAcknowledged}
                onChange={(value) => update("disclaimerAcknowledged", value)}
              />
            ) : null}
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-loss/24 bg-loss-bg/42 px-4 py-3 text-body-sm text-blue-50/78" role="alert">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-blue-200/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="quiet"
              size="lg"
              disabled={activeStep === 0 || isSaving}
              onClick={() => setActiveStep((step) => Math.max(step - 1, 0))}
              className="rounded-xl text-blue-100/60 hover:text-blue-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            {isLastStep ? (
              <Button
                type="button"
                variant="primary"
                size="lg"
                disabled={isSaving}
                onClick={submitProfile}
                className="rounded-xl bg-[#4d8dff] text-white shadow-[0_0_32px_rgba(77,141,255,0.26)] hover:bg-[#6aa1ff]"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Finish setup
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="lg"
                onClick={goNext}
                className="rounded-xl bg-[#4d8dff] text-white shadow-[0_0_32px_rgba(77,141,255,0.26)] hover:bg-[#6aa1ff]"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function StepProgress({ activeStep }: { activeStep: number }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" aria-label="Onboarding steps">
      {steps.map((step, index) => (
        <div
          key={step}
          className={cn(
            "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-[0.68rem] font-bold uppercase tracking-[0.14em]",
            index === activeStep
              ? "border-blue-300/30 bg-blue-500/14 text-blue-100 shadow-[0_0_24px_rgba(77,141,255,0.14)]"
              : index < activeStep
                ? "border-gain/22 bg-gain/8 text-gain"
                : "border-blue-200/10 bg-blue-950/12 text-blue-100/38"
          )}
        >
          {index < activeStep ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
          {step}
        </div>
      ))}
    </div>
  );
}

function OptionStep<Value extends string>({
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
    <div className="space-y-4">
      <h2 className="font-serif text-3xl leading-tight tracking-[-0.04em] text-blue-50">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-2xl border p-4 text-left transition hover:border-blue-300/30 hover:bg-blue-500/10",
              option.value === value
                ? "border-blue-300/36 bg-blue-500/14 shadow-[0_0_30px_rgba(77,141,255,0.12)]"
                : "border-blue-200/10 bg-blue-950/12"
            )}
          >
            <span className="block text-sm font-semibold text-blue-50">{option.label}</span>
            <span className="mt-2 block text-[0.78rem] leading-5 text-blue-100/48">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function InterestStep({
  selected,
  onToggle,
}: {
  selected: MarketInterest[];
  onToggle: (value: MarketInterest) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-3xl leading-tight tracking-[-0.04em] text-blue-50">
          What do you want ALQIS to help explain?
        </h2>
        <p className="mt-2 text-body-sm text-blue-100/48">
          Choose one or more areas for dashboard context and education tips.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {interestOptions.map((option) => {
          const active = selected.includes(option.value);
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onToggle(option.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition",
                active
                  ? "border-blue-300/34 bg-blue-500/14 text-blue-50"
                  : "border-blue-200/10 bg-blue-950/12 text-blue-100/58 hover:border-blue-300/26 hover:text-blue-50"
              )}
            >
              {active ? <CheckCircle2 className="h-3.5 w-3.5 text-gain" /> : <Plus className="h-3.5 w-3.5" />}
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TickerStep({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-3xl leading-tight tracking-[-0.04em] text-blue-50">
          Add a few tickers you want to follow.
        </h2>
        <p className="mt-2 text-body-sm text-blue-100/48">
          Optional. Separate symbols with commas or spaces. You can update your watchlist anytime.
        </p>
      </div>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        variant="search"
        size="lg"
        placeholder="NVDA, AAPL, MSFT"
        aria-label="Starting tickers"
      />
      <p className="text-[0.75rem] leading-5 text-blue-100/40">
        ALQIS will use these only to build your first watchlist context.
      </p>
    </div>
  );
}

function DisclaimerStep({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-3xl leading-tight tracking-[-0.04em] text-blue-50">
          One important note.
        </h2>
        <p className="mt-2 text-body-sm text-blue-100/48">
          ALQIS is designed for education and market context.
        </p>
      </div>
      <div className="rounded-2xl border border-blue-200/12 bg-blue-950/16 p-4">
        <p className="text-body leading-7 text-blue-50/82">
          ALQIS explanations are informational and educational only. They do not constitute investment, tax, legal, or financial advice.
        </p>
      </div>
      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-blue-200/10 bg-blue-950/12 p-4 text-body-sm text-blue-100/66">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-blue-200/24 bg-blue-950 text-blue-400"
        />
        <span>I understand ALQIS is for informational and educational purposes only.</span>
      </label>
    </div>
  );
}
