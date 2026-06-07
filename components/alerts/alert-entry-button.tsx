import { useState, type ReactNode } from "react";
import { Bell } from "lucide-react";
import { AlertModal } from "@/components/alerts/alert-modal";
import { Button } from "@/components/ui/button";
import type { Alert } from "@/lib/alerts/types";
import { cn } from "@/lib/utils";

type AlertEntryButtonProps = {
  initialTicker?: string;
  initialCompanyName?: string | null;
  mode?: "button" | "icon";
  className?: string;
  children?: ReactNode;
  onSaved?: (alert: Alert) => void;
};

export function AlertEntryButton({
  initialTicker,
  initialCompanyName,
  mode = "button",
  className,
  children,
  onSaved,
}: AlertEntryButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {mode === "icon" ? (
        <button
          type="button"
          className={cn(
            "grid h-10 w-10 place-items-center border border-[#2f72d5]/20 bg-[#07111f]/72 text-[#b8c8df] transition hover:border-[#72c7be]/42 hover:text-[#eef6ff]",
            className
          )}
          aria-label="Open alert setup"
          onClick={() => setOpen(true)}
        >
          <Bell className="h-4 w-4" />
        </button>
      ) : (
        <Button
          type="button"
          variant="secondary"
          className={cn("border-[#72c7be]/28 text-[#72c7be]", className)}
          onClick={() => setOpen(true)}
        >
          <Bell className="h-4 w-4" />
          {children ?? "New alert"}
        </Button>
      )}

      {open ? (
        <AlertModal
          initialTicker={initialTicker}
          initialCompanyName={initialCompanyName}
          onClose={() => setOpen(false)}
          onSaved={onSaved}
        />
      ) : null}
    </>
  );
}
