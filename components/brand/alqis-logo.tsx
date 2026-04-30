import Image from "next/image";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  ALQIS_ICON,
  ALQIS_ICON_DARK,
  ALQIS_ICON_LIGHT,
  ALQIS_LOCKUP,
  ALQIS_WORDMARK,
  ALQIS_WORDMARK_DARK,
  ALQIS_WORDMARK_LIGHT,
} from "@/lib/brand/assets";
import { cn } from "@/lib/utils";

type AlqisLogoProps = {
  variant?: "wordmark" | "icon" | "lockup";
  tone?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
};

const sizeClasses = {
  sm: {
    icon: "h-9 w-9",
    wordmark: "h-9",
    lockup: "h-9",
    text: "text-[1.05rem]",
  },
  md: {
    icon: "h-11 w-11",
    wordmark: "h-11",
    lockup: "h-11",
    text: "text-[1.18rem]",
  },
  lg: {
    icon: "h-14 w-14",
    wordmark: "h-14",
    lockup: "h-14",
    text: "text-[1.4rem]",
  },
} as const;

const assetDimensions = {
  icon: { width: 56, height: 56 },
  wordmark: { width: 164, height: 56 },
  lockup: { width: 216, height: 56 },
} as const;

function getAssetPath(variant: NonNullable<AlqisLogoProps["variant"]>, tone: NonNullable<AlqisLogoProps["tone"]>) {
  if (variant === "icon") {
    return firstExistingAsset(tone === "dark" ? ALQIS_ICON_DARK : ALQIS_ICON_LIGHT, ALQIS_ICON);
  }

  if (variant === "wordmark") {
    return firstExistingAsset(
      tone === "dark" ? ALQIS_WORDMARK_DARK : ALQIS_WORDMARK_LIGHT,
      ALQIS_WORDMARK
    );
  }

  return firstExistingAsset(ALQIS_LOCKUP);
}

function firstExistingAsset(...paths: string[]) {
  return paths.find((path) => existsSync(join(process.cwd(), "public", path.replace(/^\//, ""))));
}

export function AlqisLogo({
  variant = "lockup",
  tone = "dark",
  size = "md",
  className,
  priority = false,
}: AlqisLogoProps) {
  const assetPath = getAssetPath(variant, tone);
  const dimensions = assetDimensions[variant];

  if (assetPath) {
    return (
      <Image
        src={assetPath}
        alt="ALQIS"
        width={dimensions.width}
        height={dimensions.height}
        priority={priority}
        className={cn("block w-auto object-contain", sizeClasses[size][variant], className)}
      />
    );
  }

  if (variant === "icon") {
    return <FallbackIcon tone={tone} size={size} className={className} />;
  }

  if (variant === "wordmark") {
    return <FallbackWordmark tone={tone} size={size} className={className} />;
  }

  return (
    <div
      className={cn("inline-flex items-center gap-3", className)}
      aria-label="ALQIS"
      role="img"
    >
      <FallbackIcon tone={tone} size={size} />
      <FallbackWordmark tone={tone} size={size} />
    </div>
  );
}

function FallbackIcon({
  tone,
  size,
  className,
}: {
  tone: NonNullable<AlqisLogoProps["tone"]>;
  size: NonNullable<AlqisLogoProps["size"]>;
  className?: string;
}) {
  return (
    <span
      aria-label="ALQIS"
      role="img"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[var(--radius-lg)] border text-sm font-semibold tracking-[0.2em]",
        tone === "dark"
          ? "border-accent-ai/16 bg-[color-mix(in_srgb,var(--accent-ai)_14%,transparent)] text-accent-ai"
          : "border-border/60 bg-surface/70 text-ink",
        sizeClasses[size].icon,
        className
      )}
    >
      A
    </span>
  );
}

function FallbackWordmark({
  tone,
  size,
  className,
}: {
  tone: NonNullable<AlqisLogoProps["tone"]>;
  size: NonNullable<AlqisLogoProps["size"]>;
  className?: string;
}) {
  return (
    <span
      aria-label="ALQIS"
      role="img"
      className={cn(
        "inline-flex items-center font-serif font-semibold leading-none tracking-[-0.04em]",
        tone === "dark" ? "text-ink" : "text-bg",
        sizeClasses[size].text,
        className
      )}
    >
      ALQIS
    </span>
  );
}
