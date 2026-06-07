import { BrainCircuit, Sparkles } from "lucide-react";
import { ExplainThis } from "@/components/education/explain-this";
import { MismatchBadge } from "@/components/stocks/mismatch-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfidenceDot } from "@/components/ui/confidence-dot";
import { Disclaimer } from "@/components/ui/disclaimer";
import { detectMismatch } from "@/lib/explanation/mismatch";
import { stockDetailDemoData } from "@/lib/stock-detail-demo-data";
import { cn } from "@/lib/utils";

type StockWhyCardData = typeof stockDetailDemoData & {
  explanation: typeof stockDetailDemoData.explanation & {
    wordingNote?: string;
    wordingDetail?: string;
    plainEnglishRead?: string;
    aiWhyItMatters?: string[];
    movePct?: number;
    confidenceScore?: number;
    confidenceBand?: string;
  };
};

type StockWhyCardProps = {
  data?: StockWhyCardData;
  density?: "full" | "compact";
};

export function StockWhyCard({ data = stockDetailDemoData, density = "full" }: StockWhyCardProps) {
  const { explanation } = data;
  const isCompact = density === "compact";
  const reasons = Array.isArray(explanation.reasons) ? explanation.reasons : [];
  const counterEvidence = Array.isArray(explanation.counterEvidence)
    ? explanation.counterEvidence
    : [];
  const changeTriggers = Array.isArray(explanation.changeTriggers)
    ? explanation.changeTriggers
    : [];
  const sourceLabels = Array.isArray(explanation.sourceLabels)
    ? explanation.sourceLabels
    : [];
  const evidence = Array.isArray(explanation.evidence) ? explanation.evidence : [];
  const aiWhyItMatters = Array.isArray(explanation.aiWhyItMatters)
    ? explanation.aiWhyItMatters
    : [];
  const mismatch =
    typeof explanation.movePct === "number" &&
    typeof explanation.confidenceScore === "number"
      ? detectMismatch(
          explanation.movePct,
          explanation.confidenceScore,
          explanation.confidenceBand ?? explanation.confidence
        )
      : null;
  const visibleReasons = isCompact ? reasons.slice(0, 3) : reasons;
  const visibleCounterEvidence = counterEvidence.slice(0, 2);
  const hiddenCounterEvidence = counterEvidence.slice(2);

  return (
    <Card
      variant="flat"
      padding="lg"
      radius="xl"
      className={cn(
        "alqis-stock-read-object relative self-start overflow-hidden p-4 xl:sticky xl:top-6",
        isCompact ? "rounded-[0.65rem] sm:p-4" : "sm:p-6 lg:p-7"
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_30%)]" />
      <div className="pointer-events-none absolute left-0 top-5 h-36 w-[3px] rounded-r-full bg-[linear-gradient(180deg,rgba(73,145,255,0.18),rgba(142,216,208,0.94),rgba(139,132,199,0.2))]" />

      <CardHeader className={cn("relative gap-3", isCompact ? "mb-3" : "mb-4")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="ai" size="md" className="border-accent-secondary/22 bg-accent-secondary/10 text-accent-secondary shadow-[0_8px_24px_rgba(49,139,255,0.12)]">
              <Sparkles className="h-3.5 w-3.5" />
              ALQIS READ
            </Badge>
            <Badge variant="outline" size="sm" className="border-accent-secondary/22 text-accent-secondary">
              {explanation.sourceCount} sources
            </Badge>
            <Badge variant="ai" size="sm" className="normal-case tracking-normal">
              {explanation.confidenceSummary.split(".")[0] || "Confidence visible"}
            </Badge>
          </div>

          <div className="flex flex-col items-start gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent-ai/22 bg-accent-ai/10 px-2.5 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
              <span className="section-kicker inline-flex items-center gap-1.5">
                Confidence
                <ExplainThis termId="confidence-score" compact />
              </span>
              <ConfidenceDot band={explanation.confidence} />
            </div>
            <MismatchBadge mismatch={mismatch} />
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2 text-body-sm font-medium text-accent-secondary">
            <span className="inline-flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" />
            Why this moved
            </span>
            <span className="text-[0.7rem] font-semibold text-ink-subtle">{explanation.freshness}</span>
          </div>

          <div className={cn(
            "space-y-3 border border-accent-secondary/16 bg-[linear-gradient(180deg,rgba(30,45,86,0.68),rgba(7,17,31,0.76))] px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]",
            isCompact ? "py-3" : "py-4"
          )}>
            <h2 className={cn(
              "font-serif leading-[1.02] tracking-tight text-[#f5f1e8]",
              isCompact ? "text-[1.45rem] sm:text-[1.85rem]" : "text-[1.85rem] sm:text-[2.55rem]"
            )}>
              <HighlightedHeadline text={explanation.headline} reasons={visibleReasons} />
            </h2>
            <p className="max-w-2xl text-[1rem] leading-7 text-[#d7e0ea] sm:text-[1.05rem]">
              {explanation.summary}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("relative", isCompact ? "space-y-3" : "space-y-5")}>
        {explanation.plainEnglishRead && !isCompact ? (
          <section className="space-y-3 rounded-[1.25rem] border border-accent-secondary/18 bg-[linear-gradient(180deg,rgba(14,32,54,0.72)_0%,rgba(7,17,31,0.76)_100%)] p-4">
            <div>
              <p className="section-kicker">Plain-English read</p>
              <p className="mt-2 text-body leading-7 text-ink">
                {explanation.plainEnglishRead}
              </p>
            </div>

            {aiWhyItMatters.length ? (
              <div className="space-y-2 border-t border-border/50 pt-3">
                <p className="section-kicker">Why it matters</p>
                <ul className="space-y-2">
                  {aiWhyItMatters.map((item) => (
                    <li key={item} className="flex gap-2 text-body-sm text-ink-muted">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-ai" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </section>
        ) : null}

        <section aria-labelledby="reason-stack" className="space-y-2.5">
          <div className="space-y-2">
            {visibleReasons.map((reason) => (
              <details
                key={reason.label}
                className="group rounded-[0.7rem] border border-[#446890]/34 bg-[linear-gradient(180deg,#102846,#071525)] shadow-[inset_0_1px_0_rgba(255,255,255,0.024)]"
              >
                <summary className="flex min-h-10 cursor-pointer list-none items-center gap-3 px-3 py-2">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-accent-ai shadow-[0_0_12px_rgba(139,132,199,0.72)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{reason.label}</p>
                  </div>
                  <span className="text-xs font-black text-ink" data-numeric>
                    {reason.score}%
                  </span>
                  <span className="text-xs text-ink-subtle transition-transform group-open:rotate-45">+</span>
                </summary>
                <div className="border-t border-[#446890]/26 px-3 pb-3 pt-2">
                  <p className="text-body-sm leading-6 text-ink-muted">{reason.detail}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-white/6">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(90deg,rgba(139,132,199,0.92)_0%,rgba(142,216,208,0.84)_100%)]"
                      style={{ width: `${reason.score}%` }}
                    />
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="grid gap-2 sm:grid-cols-2">
          <ReadBalanceBlock
            title="Supports read"
            copy={visibleReasons[0]?.detail ?? "Evidence aligns with the current read."}
            tone="support"
          />
          <ReadBalanceBlock
            title="Challenges read"
            copy={visibleCounterEvidence[0]?.detail ?? "Counterevidence remains visible when available."}
            tone="challenge"
          />
        </section>

        {hiddenCounterEvidence.length ? (
              <details className="group rounded-[var(--radius-md)] border border-border/50 bg-surface/30">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-ink">
                  <span>View all counterevidence</span>
                  <span className="rounded-full border border-border/60 bg-surface/40 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-ink-subtle">
                    +{hiddenCounterEvidence.length}
                  </span>
                </summary>
                <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 group-open:grid-rows-[1fr]">
                  <div className="space-y-3 overflow-hidden border-t border-border/50 p-3">
                    {hiddenCounterEvidence.map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[var(--radius-md)] border border-border/60 bg-surface/40 px-4 py-3"
                      >
                        <p className="text-sm font-medium text-ink">{item.label}</p>
                        <p className="mt-1.5 text-body-sm leading-6 text-ink-muted">
                          {item.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </details>
        ) : null}

        {!isCompact ? (
        <details className="group rounded-[1.25rem] border border-accent-ai/16 bg-accent-ai/7">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left">
            <div className="space-y-1.5">
              <p className="section-kicker">What would change this read</p>
              <p className="text-sm font-medium text-ink">
                Conditions that would change the current ALQIS read.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-border/60 bg-surface/40 px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.16em] text-ink-subtle">
                {changeTriggers.length} triggers
              </span>
              <span className="text-body-sm text-ink-subtle transition-transform group-open:rotate-45">+</span>
            </div>
          </summary>

          <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 group-open:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <div className="space-y-4 border-t border-border/60 px-4 py-4">
                <div className="space-y-3">
                  <p className="section-kicker">Shift triggers</p>
                  <ul className="space-y-2.5">
                    {changeTriggers.map((trigger, index) => (
                      <li
                        key={trigger}
                        className="flex gap-3 rounded-[var(--radius-md)] border border-accent-ai/10 bg-[color-mix(in_srgb,var(--surface)_72%,var(--accent-ai)_8%)] px-4 py-3 text-body-sm text-ink-muted"
                      >
                        <span className="mt-0.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-accent-ai">
                          0{index + 1}
                        </span>
                        <span>{trigger}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-3 border-t border-border/50 pt-4">
                  <p className="section-kicker">Why this is trustworthy</p>
                  <div className="flex flex-wrap gap-2">
                    {sourceLabels.map((label) => (
                      <Badge key={label} variant="outline" size="sm" className="normal-case tracking-normal">
                        {label}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-body-sm leading-6 text-ink-muted">{explanation.trustNote}</p>
                </div>

                <div className="space-y-3 border-t border-border/50 pt-4">
                  <p className="section-kicker">Evidence notes</p>
                  <ol className="space-y-3">
                    {evidence.map((item) => (
                      <li
                        key={`${item.time}-${item.title}`}
                        className="rounded-[var(--radius-md)] border border-border/70 bg-surface-elevated/72 px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-ink">{item.title}</p>
                            <p className="mt-2 text-body-sm leading-6 text-ink-muted">{item.detail}</p>
                          </div>
                          <span className="shrink-0 text-xs uppercase tracking-label text-ink-subtle">
                            {item.time}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </details>
        ) : null}

        {!isCompact ? (
        <div className="rounded-[var(--radius-xl)] border border-accent-secondary/16 bg-[linear-gradient(90deg,color-mix(in_srgb,var(--accent-ai)_12%,var(--surface-elevated))_0%,color-mix(in_srgb,var(--accent-secondary)_10%,var(--surface-elevated))_100%)] px-5 py-3.5">
          <p className="section-kicker text-accent-ai">Bottom line</p>
          <p className="mt-2 text-body leading-7 text-ink">{explanation.confidenceSummary}</p>
        </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <ActionChip label="Compare to peers" />
          <ActionChip label="Explain top driver" />
          <ActionChip label="What would change this" />
        </div>

        <Disclaimer
          className={cn(
            "border-accent-ai/12 bg-[#06111f]/72",
            isCompact ? "px-3 py-2 text-[0.72rem]" : ""
          )}
        />
      </CardContent>
    </Card>
  );
}

function HighlightedHeadline({
  text,
  reasons,
}: {
  text: string;
  reasons: Array<{ label: string }>;
}) {
  const terms = reasons
    .flatMap((reason) => reason.label.split(/\s+/))
    .map((term) => term.replace(/[^a-z0-9-]/gi, ""))
    .filter((term) => term.length >= 4)
    .slice(0, 4);

  if (!terms.length) {
    return text;
  }

  const pattern = new RegExp(`\\b(${terms.join("|")})\\b`, "gi");
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) =>
        terms.some((term) => term.toLowerCase() === part.toLowerCase()) ? (
          <span key={`${part}-${index}`} className={index % 3 === 0 ? "text-accent-ai" : "text-accent-secondary"}>
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        )
      )}
    </>
  );
}

function ReadBalanceBlock({
  title,
  copy,
  tone,
}: {
  title: string;
  copy: string;
  tone: "support" | "challenge";
}) {
  return (
    <div
      className={cn(
        "rounded-[0.65rem] border px-3 py-2.5",
        tone === "support"
          ? "border-accent-secondary/24 bg-accent-secondary/9"
          : "border-warn/24 bg-warn-bg/22"
      )}
    >
      <p className={cn("section-kicker", tone === "support" ? "text-accent-secondary" : "text-warn")}>
        {title}
      </p>
      <p className="mt-1.5 text-xs leading-5 text-ink-muted">{copy}</p>
    </div>
  );
}

function ActionChip({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      title="Coming in Sprint 25B"
      className="inline-flex min-h-8 items-center rounded-full border border-accent-secondary/24 bg-[#07111f]/68 px-3 text-[0.72rem] font-black text-accent-secondary disabled:cursor-not-allowed disabled:opacity-85"
    >
      {label} -&gt;
    </button>
  );
}
