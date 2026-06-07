import { Info, TriangleAlert } from "lucide-react";
import type { MismatchResult } from "@/lib/explanation/mismatch";
import { cn } from "@/lib/utils";

export function MismatchBadge({ mismatch }: { mismatch: MismatchResult }) {
  if (!mismatch?.type) {
    return null;
  }

  const isWarning = mismatch.type === "large_move_weak_evidence";
  const Icon = isWarning ? TriangleAlert : Info;

  return (
    <div
      className={cn(
        "w-full border border-l-2 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.025)]",
        isWarning
          ? "border-warn/16 border-l-warn bg-warn-bg/10"
          : "border-info/16 border-l-info bg-info-bg/10"
      )}
    >
      <div className="flex items-center gap-1.5">
        <Icon
          className={cn("h-3.5 w-3.5 shrink-0", isWarning ? "text-warn" : "text-info")}
          aria-hidden
        />
        <p className={cn("text-[0.64rem] font-black uppercase tracking-[0.16em]", isWarning ? "text-warn" : "text-info")}>
          {mismatch.label}
        </p>
      </div>
      <p className="mt-1 text-xs leading-5 text-ink-muted">{mismatch.detail}</p>
    </div>
  );
}
