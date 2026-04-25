import { BrainCircuit, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfidenceDot } from "@/components/ui/confidence-dot";
import { Disclaimer } from "@/components/ui/disclaimer";
import { stockDetailDemoData } from "@/lib/stock-detail-demo-data";

type StockWhyCardData = typeof stockDetailDemoData & {
  explanation: typeof stockDetailDemoData.explanation & {
    wordingNote?: string;
    wordingDetail?: string;
    plainEnglishRead?: string;
    aiWhyItMatters?: string[];
  };
};

type StockWhyCardProps = {
  data?: StockWhyCardData;
};

export function StockWhyCard({ data = stockDetailDemoData }: StockWhyCardProps) {
  const { explanation, asOf } = data;

  return (
    <Card
      variant="elevated"
      padding="lg"
      radius="xl"
      className="relative self-start overflow-hidden border-accent-ai/14 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_88%,var(--accent-ai)_12%)_0%,color-mix(in_srgb,var(--surface)_95%,var(--accent-ai)_5%)_100%)] shadow-[0_36px_90px_rgba(2,6,12,0.42)] xl:sticky xl:top-6"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,132,199,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(114,199,190,0.06),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_26%)]" />

      <CardHeader className="relative mb-4 gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <Badge variant="ai" size="md" className="shadow-[0_8px_22px_rgba(12,10,20,0.18)]">
              <Sparkles className="h-3.5 w-3.5" />
              {explanation.title}
            </Badge>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[0.86rem] leading-5 text-ink-muted">
              <span className="rounded-full border border-accent-ai/14 bg-[color-mix(in_srgb,var(--accent-ai)_10%,transparent)] px-2.5 py-1">
                {explanation.freshness}
              </span>
              <span>{explanation.sourceCount} sources</span>
              <span>{asOf}</span>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-accent-ai/12 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--accent-ai)_18%)] px-4 py-3">
            <span className="mb-2 block section-kicker">ALQIS confidence</span>
            <ConfidenceDot band={explanation.confidence} />
          </div>
        </div>

        <div className="space-y-3.5">
          <div className="flex items-center gap-2 text-body-sm text-accent-ai">
            <BrainCircuit className="h-4 w-4" />
            First answer
          </div>

          <div className="space-y-2.5">
            <h2 className="font-serif text-[2.15rem] leading-[0.98] tracking-tight text-ink sm:text-[2.85rem]">
              {explanation.headline}
            </h2>
            <p className="max-w-2xl text-body text-ink-muted">{explanation.summary}</p>
            {explanation.wordingNote ? (
              <div className="inline-flex flex-wrap gap-x-2 gap-y-1 rounded-full border border-accent-ai/14 bg-[color-mix(in_srgb,var(--accent-ai)_10%,transparent)] px-3 py-1.5 text-[0.72rem] font-medium uppercase tracking-[0.16em] text-accent-ai">
                <span>{explanation.wordingNote}</span>
                {explanation.wordingDetail ? (
                  <span className="normal-case tracking-normal text-ink-subtle">
                    {explanation.wordingDetail}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative space-y-5">
        {explanation.plainEnglishRead ? (
          <section className="space-y-3 rounded-[var(--radius-lg)] border border-accent-ai/12 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--accent-ai)_7%)] p-4">
            <div>
              <p className="section-kicker">Plain-English read</p>
              <p className="mt-2 text-body leading-7 text-ink">
                {explanation.plainEnglishRead}
              </p>
            </div>

            {explanation.aiWhyItMatters?.length ? (
              <div className="space-y-2 border-t border-border/50 pt-3">
                <p className="section-kicker">Why it matters</p>
                <ul className="space-y-2">
                  {explanation.aiWhyItMatters.map((item) => (
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

        <section aria-labelledby="reason-stack" className="space-y-3">
          <h3 id="reason-stack" className="section-kicker">
            Top drivers
          </h3>

          <div className="space-y-3">
            {explanation.reasons.map((reason) => (
              <div
                key={reason.label}
                className="space-y-2 rounded-[var(--radius-lg)] border border-border/60 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--accent-ai)_6%)] p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{reason.label}</p>
                    <p className="mt-1 text-[0.84rem] leading-5 text-ink-muted">{reason.detail}</p>
                  </div>
                  <span className="text-sm font-medium text-ink" data-numeric>
                    {reason.score}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/6">
                  <div
                    className="h-full rounded-full bg-[linear-gradient(90deg,rgba(139,132,199,0.92)_0%,rgba(142,216,208,0.84)_100%)]"
                    style={{ width: `${reason.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3 rounded-[var(--radius-lg)] border border-border/60 bg-[color-mix(in_srgb,var(--surface-elevated)_80%,var(--background)_20%)] p-4">
          <div>
            <p className="section-kicker">Counterevidence</p>
            <p className="mt-1 text-sm font-medium text-ink">What could weaken the thesis.</p>
          </div>

          <div className="space-y-3">
            {explanation.counterEvidence.map((item) => (
              <div
                key={item.label}
                className="rounded-[var(--radius-md)] border border-border/60 bg-surface/40 px-4 py-3"
              >
                <p className="text-sm font-medium text-ink">{item.label}</p>
                <p className="mt-1.5 text-[0.84rem] leading-5 text-ink-muted">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <details className="group rounded-[var(--radius-lg)] border border-accent-ai/12 bg-[color-mix(in_srgb,var(--surface-elevated)_82%,var(--accent-ai)_6%)]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-left">
            <div className="space-y-1.5">
              <p className="section-kicker">What would change this read</p>
              <p className="text-sm font-medium text-ink">The few conditions that would force a downgrade.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full border border-border/60 bg-surface/40 px-2.5 py-1 text-[0.7rem] uppercase tracking-[0.16em] text-ink-subtle">
                {explanation.changeTriggers.length} triggers
              </span>
              <span className="text-body-sm text-ink-subtle transition-transform group-open:rotate-45">+</span>
            </div>
          </summary>

          <div className="space-y-4 border-t border-border/60 px-4 py-4">
            <div className="space-y-3">
              <p className="section-kicker">Shift triggers</p>
              <ul className="space-y-2.5">
                {explanation.changeTriggers.map((trigger, index) => (
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
                {explanation.sourceLabels.map((label) => (
                  <Badge key={label} variant="outline" size="sm" className="normal-case tracking-normal">
                    {label}
                  </Badge>
                ))}
              </div>
              <p className="text-[0.84rem] leading-5 text-ink-muted">{explanation.trustNote}</p>
            </div>

            <div className="space-y-3 border-t border-border/50 pt-4">
              <p className="section-kicker">Evidence notes</p>
              <ol className="space-y-3">
                {explanation.evidence.map((item) => (
                  <li
                    key={`${item.time}-${item.title}`}
                    className="rounded-[var(--radius-md)] border border-border/70 bg-surface-elevated/72 px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-ink">{item.title}</p>
                        <p className="mt-2 text-[0.84rem] leading-5 text-ink-muted">{item.detail}</p>
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
        </details>

        <div className="rounded-[var(--radius-lg)] border border-accent-ai/14 bg-[color-mix(in_srgb,var(--accent-ai)_10%,var(--surface-elevated))] px-5 py-3.5">
          <p className="section-kicker text-accent-ai">Bottom line</p>
          <p className="mt-2 text-body leading-7 text-ink">{explanation.confidenceSummary}</p>
        </div>

        <Disclaimer />
      </CardContent>
    </Card>
  );
}
