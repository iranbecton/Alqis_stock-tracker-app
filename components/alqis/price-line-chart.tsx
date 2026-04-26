"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChartPoint as StockDetailChartPoint } from "@/lib/stock-detail-demo-data";

type Coordinates = {
  x: number;
  y: number;
};

type PriceLineChartPoint = StockDetailChartPoint;

type PriceLineChartMarker = {
  index: number;
  label: string;
  kind?: "checkpoint" | "event";
  time?: string;
  title?: string;
  explanation?: string;
  whyItMatters?: string;
};

export type ChartMarkerInsight = {
  title: string;
  markerType: string;
  stance: "Supports the read" | "Weakens the read" | "Context only";
  timestamp: string;
  price: string;
  changePct: string;
  explanation: string;
};

type InteractiveMarkerKind = "checkpoint" | "event" | "current" | "data";

type InteractiveMarker = Required<Pick<PriceLineChartMarker, "index" | "label">> &
  Omit<PriceLineChartMarker, "index" | "label" | "kind"> & {
  key: string;
  kind: InteractiveMarkerKind;
  time: string;
  point: Coordinates;
  value: number;
  changePct: number;
};

type MarkerGroup = {
  key: string;
  primary: InteractiveMarker;
  members: InteractiveMarker[];
};

type RenderedChartSize = {
  width: number;
  height: number;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const CHART_LAYOUT = {
  bounds: {
    left: 20,
    right: 120,
    top: 34,
    bottom: 30,
  },
  annotation: {
    rightInset: 18,
    highLabelY: 20,
    lowLabelX: 20,
    lowLabelBottomInset: 10,
  },
  endpoint: {
    markerRadius: 8,
    glowRadius: 16,
    rightPadding: 30,
  },
  marker: {
    radius: {
      checkpoint: 5.5,
      event: 6.5,
    },
    hoverRadius: 11,
    selectedRadius: 14,
    strokeWidth: {
      default: 2.75,
      selected: 3.5,
    },
    guideTopOffset: 16,
    topSafePadding: 20,
    bottomSafePadding: 12,
  },
} as const;

const MARKER_COLLISION_DISTANCE_PX = 24;

function getChartGeometry(data: PriceLineChartPoint[], width: number, height: number) {
  const minValue = Math.min(...data.map((point) => point.value));
  const maxValue = Math.max(...data.map((point) => point.value));
  const safeRange = maxValue - minValue || 1;
  const plotLeft = CHART_LAYOUT.bounds.left;
  const plotRight = width - CHART_LAYOUT.bounds.right;
  const plotTop = CHART_LAYOUT.bounds.top;
  const plotBottom = height - CHART_LAYOUT.bounds.bottom;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const drawableWidth = Math.max(
    plotWidth - CHART_LAYOUT.endpoint.rightPadding,
    1
  );
  const topDomainPadding = Math.max(
    CHART_LAYOUT.marker.topSafePadding,
    CHART_LAYOUT.endpoint.glowRadius + 2
  );
  const bottomDomainPadding = CHART_LAYOUT.marker.bottomSafePadding;
  const drawableHeight = Math.max(
    plotHeight - topDomainPadding - bottomDomainPadding,
    1
  );
  const paddedMinValue =
    minValue - (safeRange * bottomDomainPadding) / drawableHeight;
  const paddedMaxValue =
    maxValue + (safeRange * topDomainPadding) / drawableHeight;
  const paddedRange = paddedMaxValue - paddedMinValue || 1;

  const points = data.map<Coordinates>((point, index) => {
    const x =
      plotLeft + (index * drawableWidth) / Math.max(data.length - 1, 1);
    const y =
      plotBottom - ((point.value - paddedMinValue) / paddedRange) * plotHeight;

    return { x, y };
  });

  return {
    points,
    baseline: plotBottom,
    plotLeft,
    plotRight,
    plotTop,
    plotWidth,
    plotHeight,
    markerGuideTop: plotTop + 4,
  };
}

function getSparklineGeometry(
  data: PriceLineChartPoint[],
  width: number,
  height: number
) {
  const minValue = Math.min(...data.map((point) => point.value));
  const maxValue = Math.max(...data.map((point) => point.value));
  const safeRange = maxValue - minValue || 1;
  const left = 4;
  const right = 10;
  const top = 5;
  const bottom = 5;
  const plotWidth = Math.max(width - left - right, 1);
  const plotHeight = Math.max(height - top - bottom, 1);

  const points = data.map<Coordinates>((point, index) => {
    const x = left + (index * plotWidth) / Math.max(data.length - 1, 1);
    const y =
      height -
      bottom -
      ((point.value - minValue) / safeRange) * plotHeight;

    return { x, y };
  });

  return {
    points,
    baseline: height - bottom,
  };
}

function toLinePath(points: Coordinates[]) {
  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");
}

function toAreaPath(points: Coordinates[], baseline: number) {
  if (points.length === 0) {
    return "";
  }

  const first = points[0];
  const last = points[points.length - 1];

  return `${toLinePath(points)} L ${last.x.toFixed(2)} ${baseline.toFixed(
    2
  )} L ${first.x.toFixed(2)} ${baseline.toFixed(2)} Z`;
}

function formatPercent(value: number) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(2)}%`;
}

function getMarkerTypeLabel(marker: InteractiveMarker) {
  if (marker.kind === "current") return "Price confirmation";
  if (marker.kind === "event") return "News context";
  if (marker.kind === "data") return "Data checkpoint";
  if (marker.changePct < -0.25) return "Challenge point";
  return Math.abs(marker.changePct) >= 0.75
    ? "Price confirmation"
    : "Data checkpoint";
}

function getMarkerStance(marker: InteractiveMarker): ChartMarkerInsight["stance"] {
  if (marker.kind === "data") return "Context only";
  if (marker.changePct < -0.25) return "Weakens the read";
  if (marker.changePct > 0.25) return "Supports the read";
  return "Context only";
}

function getMarkerExplanation(marker: InteractiveMarker) {
  if (marker.explanation) {
    return marker.explanation.match(/^[^.!?]+[.!?]?/)?.[0] ?? marker.explanation;
  }

  if (marker.kind === "current") {
    return "The latest plotted point shows where the selected chart window currently resolves.";
  }

  if (marker.kind === "data") {
    return "This checkpoint provides price context for the selected chart window.";
  }

  if (marker.changePct < -0.25) {
    return `${marker.label} shows price action challenging the current read.`;
  }

  if (marker.changePct > 0.25) {
    return `${marker.label} shows price action supporting the current read.`;
  }

  return `${marker.label} adds context without clearly confirming or weakening the read.`;
}

function createMarkerInsight(marker: InteractiveMarker): ChartMarkerInsight {
  return {
    title: marker.title ?? marker.label,
    markerType: getMarkerTypeLabel(marker),
    stance: getMarkerStance(marker),
    timestamp: marker.time,
    price: currencyFormatter.format(marker.value),
    changePct: formatPercent(marker.changePct),
    explanation: getMarkerExplanation(marker),
  };
}

function getMarkerPlacement(point: Coordinates, width: number, height: number) {
  const horizontal =
    point.x < width * 0.22 ? "start" : point.x > width * 0.74 ? "end" : "center";
  const vertical = point.y < height * 0.24 ? "bottom" : "top";

  return {
    left: `${(point.x / width) * 100}%`,
    top: `${(point.y / height) * 100}%`,
    horizontal,
    vertical,
  } as const;
}

function getMarkerBasePriority(marker: InteractiveMarker) {
  if (marker.kind === "current") return 300;
  if (marker.kind === "event") return 200;
  if (marker.kind === "data") return 50;
  return 100;
}

function getMarkerPriority(
  marker: InteractiveMarker,
  selectedMarkerKey: string | null,
  hoveredMarkerKey: string | null
) {
  if (selectedMarkerKey === marker.key) return 500;
  if (hoveredMarkerKey === marker.key) return 400;
  return getMarkerBasePriority(marker);
}

function getVisualDistance(
  a: Coordinates,
  b: Coordinates,
  renderedSize: RenderedChartSize,
  viewBoxWidth: number,
  viewBoxHeight: number
) {
  const scaleX = renderedSize.width / viewBoxWidth;
  const scaleY = renderedSize.height / viewBoxHeight;
  const dx = (a.x - b.x) * scaleX;
  const dy = (a.y - b.y) * scaleY;

  return Math.hypot(dx, dy);
}

function resolveMarkerGroups({
  markers,
  selectedMarkerKey,
  hoveredMarkerKey,
  renderedSize,
  viewBoxWidth,
  viewBoxHeight,
}: {
  markers: InteractiveMarker[];
  selectedMarkerKey: string | null;
  hoveredMarkerKey: string | null;
  renderedSize: RenderedChartSize;
  viewBoxWidth: number;
  viewBoxHeight: number;
}): MarkerGroup[] {
  const sortedMarkers = [...markers].sort(
    (a, b) =>
      getMarkerPriority(b, selectedMarkerKey, hoveredMarkerKey) -
        getMarkerPriority(a, selectedMarkerKey, hoveredMarkerKey) ||
      b.index - a.index
  );
  const groups: MarkerGroup[] = [];

  sortedMarkers.forEach((marker) => {
    const existingGroup = groups.find((group) =>
      group.members.some(
        (member) =>
          getVisualDistance(
            marker.point,
            member.point,
            renderedSize,
            viewBoxWidth,
            viewBoxHeight
          ) < MARKER_COLLISION_DISTANCE_PX
      )
    );

    if (!existingGroup) {
      groups.push({
        key: marker.key,
        primary: marker,
        members: [marker],
      });
      return;
    }

    existingGroup.members.push(marker);
    existingGroup.members.sort(
      (a, b) =>
        getMarkerPriority(b, selectedMarkerKey, hoveredMarkerKey) -
          getMarkerPriority(a, selectedMarkerKey, hoveredMarkerKey) ||
        b.index - a.index
    );
    existingGroup.primary = existingGroup.members[0];
    existingGroup.key = existingGroup.primary.key;
  });

  return groups.sort((a, b) => a.primary.point.x - b.primary.point.x);
}

function MarkerTooltip({
  group,
  width,
  height,
}: {
  group: MarkerGroup;
  width: number;
  height: number;
}) {
  const marker = group.primary;
  const placement = getMarkerPlacement(marker.point, width, height);
  const translateX =
    placement.horizontal === "start"
      ? "0"
      : placement.horizontal === "end"
        ? "-100%"
        : "-50%";
  const translateY =
    placement.vertical === "top" ? "calc(-100% - 14px)" : "14px";

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-20 rounded-[1.1rem] border border-white/10 bg-[rgba(7,12,18,0.94)] px-3.5 py-3 shadow-[0_18px_42px_rgba(0,0,0,0.36)] backdrop-blur-xl transition-all duration-150",
        group.members.length > 1 ? "w-[258px]" : "w-[208px]"
      )}
      style={{
        left: placement.left,
        top: placement.top,
        transform: `translate(${translateX}, ${translateY})`,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[0.62rem] uppercase tracking-[0.18em] text-ink-subtle">
          {group.members.length > 1 ? "Grouped signal" : getMarkerTypeLabel(marker)}
        </p>
        <p
          className={cn(
            "text-[0.72rem] font-medium",
            marker.changePct >= 0 ? "text-gain" : "text-loss"
          )}
        >
          {formatPercent(marker.changePct)}
        </p>
      </div>
      <p className="mt-1.5 text-sm font-semibold text-ink">
        {currencyFormatter.format(marker.value)}
      </p>
      <p className="mt-1 text-[0.76rem] text-ink-subtle">{marker.time}</p>
      {marker.label ? (
        <p className="mt-2 text-[0.8rem] leading-5 text-ink">
          {marker.label}
        </p>
      ) : null}
      <p className="mt-2 text-[0.76rem] leading-5 text-ink-muted">
        {getMarkerExplanation(marker)}
      </p>
      {group.members.length > 1 ? (
        <div className="mt-3 space-y-2 border-t border-white/10 pt-2.5">
          {group.members.map((member) => (
            <div
              key={`tooltip-${member.key}`}
              className="rounded-[0.8rem] bg-white/[0.035] px-2.5 py-2"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[0.76rem] font-medium leading-4 text-ink">
                  {member.label}
                </p>
                <p
                  className={cn(
                    "shrink-0 text-[0.7rem] font-medium",
                    member.changePct >= 0 ? "text-gain" : "text-loss"
                  )}
                >
                  {formatPercent(member.changePct)}
                </p>
              </div>
              <p className="mt-1 text-[0.7rem] leading-4 text-ink-subtle">
                {currencyFormatter.format(member.value)} - {member.time}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function PriceLineChart({
  data,
  markers = [],
  className,
  markersDisabled = false,
  onSelectedInsightChange,
}: {
  data: PriceLineChartPoint[];
  markers?: PriceLineChartMarker[];
  className?: string;
  markersDisabled?: boolean;
  onSelectedInsightChange?: (insight: ChartMarkerInsight | null) => void;
}) {
  const width = 720;
  const height = 320;
  const chartRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredMarkerKey, setHoveredMarkerKey] = useState<string | null>(null);
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string | null>(null);
  const [hoveredDataPointIndex, setHoveredDataPointIndex] = useState<number | null>(null);
  const [selectedDataPointIndex, setSelectedDataPointIndex] = useState<number | null>(null);
  const [renderedSvgSize, setRenderedSvgSize] = useState<RenderedChartSize>({
    width,
    height,
  });
  const chartId = useId().replace(/:/g, "");
  const areaGradientId = `${chartId}-area`;
  const clipPathId = `${chartId}-plot-area`;
  const {
    points,
    baseline,
    plotLeft,
    plotRight,
    plotTop,
    plotWidth,
    plotHeight,
    markerGuideTop,
  } =
    getChartGeometry(data, width, height);
  const areaPath = toAreaPath(points, baseline);
  const linePath = toLinePath(points);
  const finalPoint = points[points.length - 1];
  const finalPointIndex = Math.max(points.length - 1, 0);
  const highPoint = points.reduce(
    (best, point) => (point.y < best.y ? point : best),
    points[0]
  );
  const lowPoint = points.reduce(
    (best, point) => (point.y > best.y ? point : best),
    points[0]
  );
  const highValue = Math.max(...data.map((point) => point.value));
  const lowValue = Math.min(...data.map((point) => point.value));
  const highLabelX = width - CHART_LAYOUT.annotation.rightInset;
  const highLabelY = CHART_LAYOUT.annotation.highLabelY;
  const lowLabelX = CHART_LAYOUT.annotation.lowLabelX;
  const lowLabelY = height - CHART_LAYOUT.annotation.lowLabelBottomInset;
  const interactiveMarkers = useMemo(() => {
    const visibleMarkers = markersDisabled
      ? []
      : markers.filter((marker) => marker.index < finalPointIndex);
    const mappedMarkers = visibleMarkers
      .map<InteractiveMarker | null>((marker) => {
          const point = points[marker.index];
          const value = data[marker.index]?.value;
          const baseValue = data[0]?.value ?? value ?? 0;
          const kind: InteractiveMarkerKind =
            marker.kind ??
            (marker.title || marker.explanation ? "event" : "checkpoint");

          if (!point || value === undefined) {
            return null;
          }

          return {
            ...marker,
            key: `${kind}-${marker.index}-${marker.label}`,
            kind,
            time: marker.time ?? data[marker.index]?.label ?? marker.label,
            point,
            value,
            changePct: baseValue === 0 ? 0 : ((value - baseValue) / baseValue) * 100,
          } satisfies InteractiveMarker;
        })
      .filter((marker): marker is InteractiveMarker => marker !== null);
    const finalValue = data[finalPointIndex]?.value;
    const baseValue = data[0]?.value ?? finalValue ?? 0;

    if (!markersDisabled && finalPoint && finalValue !== undefined) {
      mappedMarkers.push({
        index: finalPointIndex,
        label: "Current price",
        key: `current-${finalPointIndex}-${data[finalPointIndex]?.label ?? "latest"}`,
        kind: "current",
        time: data[finalPointIndex]?.label ?? "Latest",
        point: finalPoint,
        value: finalValue,
        changePct:
          baseValue === 0 ? 0 : ((finalValue - baseValue) / baseValue) * 100,
      });
    }

    return mappedMarkers;
  }, [data, finalPoint, finalPointIndex, markers, markersDisabled, points]);
  const markerGroups = useMemo(
    () =>
      resolveMarkerGroups({
        markers: interactiveMarkers,
        selectedMarkerKey,
        hoveredMarkerKey,
        renderedSize: renderedSvgSize,
        viewBoxWidth: width,
        viewBoxHeight: height,
      }),
    [hoveredMarkerKey, interactiveMarkers, renderedSvgSize, selectedMarkerKey]
  );
  const hoveredGroup =
    markerGroups.find((group) =>
      group.members.some((marker) => marker.key === hoveredMarkerKey)
    ) ?? null;
  const selectedGroup =
    markerGroups.find((group) =>
      group.members.some((marker) => marker.key === selectedMarkerKey)
    ) ?? null;
  const createDataPointMarker = (index: number): InteractiveMarker | null => {
    const point = points[index];
    const value = data[index]?.value;
    const baseValue = data[0]?.value ?? value ?? 0;

    if (!point || value === undefined) {
      return null;
    }

    return {
      index,
      label: "Nearest price point",
      key: `data-${index}-${data[index]?.label ?? "point"}`,
      kind: "data",
      time: data[index]?.label ?? `Point ${index + 1}`,
      point,
      value,
      changePct: baseValue === 0 ? 0 : ((value - baseValue) / baseValue) * 100,
    };
  };
  const hoveredDataMarker =
    hoveredDataPointIndex !== null ? createDataPointMarker(hoveredDataPointIndex) : null;
  const selectedDataMarker =
    selectedDataPointIndex !== null ? createDataPointMarker(selectedDataPointIndex) : null;
  const hoveredDataGroup = hoveredDataMarker
    ? {
        key: hoveredDataMarker.key,
        primary: hoveredDataMarker,
        members: [hoveredDataMarker],
      }
    : null;
  const selectedDataGroup = selectedDataMarker
    ? {
        key: selectedDataMarker.key,
        primary: selectedDataMarker,
        members: [selectedDataMarker],
      }
    : null;
  const activeDataMarker = markersDisabled
    ? null
    : hoveredDataMarker ?? selectedDataMarker;
  const activeTooltipGroup = markersDisabled
    ? null
    : hoveredGroup ?? selectedGroup ?? hoveredDataGroup ?? selectedDataGroup;
  const selectedInsight = selectedGroup
    ? createMarkerInsight(selectedGroup.primary)
    : selectedDataMarker
      ? createMarkerInsight(selectedDataMarker)
      : null;
  const axisLabels = data.filter((_, index) => {
    if (data.length <= 4) return true;
    if (index === 0 || index === data.length - 1) return true;
    const step = Math.max(Math.floor((data.length - 1) / 3), 1);
    return index % step === 0;
  });
  const getNearestDataPointIndex = (event: { clientX: number; clientY: number }) => {
    const rect = svgRef.current?.getBoundingClientRect();

    if (!rect || !points.length) {
      return null;
    }

    const x = ((event.clientX - rect.left) / rect.width) * width;
    const y = ((event.clientY - rect.top) / rect.height) * height;

    if (
      x < plotLeft ||
      x > plotRight ||
      y < plotTop - 8 ||
      y > baseline + 8
    ) {
      return null;
    }

    return points.reduce(
      (nearest, point, index) => {
        const distance = Math.hypot(point.x - x, point.y - y);
        return distance < nearest.distance ? { index, distance } : nearest;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY }
    ).index;
  };

  useEffect(() => {
    const element = svgRef.current;

    if (!element) {
      return;
    }
    const svgElement = element;

    function updateSize() {
      const rect = svgElement.getBoundingClientRect();

      if (!rect.width || !rect.height) {
        return;
      }

      setRenderedSvgSize((current) => {
        if (
          Math.abs(current.width - rect.width) < 0.5 &&
          Math.abs(current.height - rect.height) < 0.5
        ) {
          return current;
        }

        return {
          width: rect.width,
          height: rect.height,
        };
      });
    }

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(svgElement);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!chartRef.current?.contains(event.target as Node)) {
        setSelectedMarkerKey(null);
        setSelectedDataPointIndex(null);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    onSelectedInsightChange?.(markersDisabled ? null : selectedInsight);
  }, [markersDisabled, onSelectedInsightChange, selectedInsight]);

  return (
    <div
      ref={chartRef}
      className={cn(
        "relative overflow-visible rounded-[1.75rem] border border-border/80 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface-elevated)_94%,#18222f_6%)_0%,color-mix(in_srgb,var(--surface)_96%,#0a1018_4%)_100%)] p-4 sm:p-6",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(142,216,208,0.14),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(139,132,199,0.06),transparent_28%)]" />

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="relative h-[280px] w-full sm:h-[360px]"
          role="img"
          aria-label="Price chart with interactive checkpoints and catalyst markers"
        >
          <defs>
            <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8ED8D0" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#8ED8D0" stopOpacity="0" />
            </linearGradient>
            <clipPath id={clipPathId}>
              <rect
                x={plotLeft}
                y={plotTop}
                width={plotWidth}
                height={plotHeight}
                rx="18"
              />
            </clipPath>
          </defs>

          {[0.2, 0.45, 0.7].map((position) => (
            <line
              key={position}
              x1={plotLeft}
              x2={plotRight}
              y1={plotTop + plotHeight * position}
              y2={plotTop + plotHeight * position}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="5 8"
            />
          ))}

          {highPoint ? (
            <>
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={highPoint.y}
                y2={highPoint.y}
                stroke="rgba(255,255,255,0.08)"
                strokeDasharray="3 8"
              />
              <text
                x={highLabelX}
                y={highLabelY}
                textAnchor="end"
                fill="rgba(167,182,200,0.92)"
                fontSize="11"
                letterSpacing="0.16em"
              >
                HIGH {highValue.toFixed(0)}
              </text>
            </>
          ) : null}

          {lowPoint ? (
            <>
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={lowPoint.y}
                y2={lowPoint.y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 8"
              />
              <text
                x={lowLabelX}
                y={lowLabelY}
                fill="rgba(115,131,153,0.88)"
                fontSize="11"
                letterSpacing="0.16em"
              >
                LOW {lowValue.toFixed(0)}
              </text>
            </>
          ) : null}

          <g clipPath={`url(#${clipPathId})`}>
            <path d={areaPath} fill={`url(#${areaGradientId})`} />
            <path
              d={linePath}
              fill="none"
              stroke="rgba(142, 216, 208, 0.98)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {markerGroups.map((group) => {
            const marker = group.primary;
            const isHovered = group.members.some(
              (member) => hoveredMarkerKey === member.key
            );
            const isSelected = group.members.some(
              (member) => selectedMarkerKey === member.key
            );
            const isEvent = marker.kind === "event";
            const isCurrent = marker.kind === "current";
            const badgeX = Math.min(
              Math.max(
                marker.point.x + (marker.point.x > width * 0.72 ? -16 : 16),
                12
              ),
              width - 12
            );
            const badgeY = Math.max(marker.point.y - 16, 12);

            return (
              <g key={`marker-group-${group.key}`}>
                {!isCurrent ? (
                  <line
                    x1={marker.point.x}
                    x2={marker.point.x}
                    y1={Math.max(
                      marker.point.y - CHART_LAYOUT.marker.guideTopOffset,
                      markerGuideTop
                    )}
                    y2={baseline}
                    stroke={
                      isSelected
                        ? "rgba(142, 216, 208, 0.34)"
                        : isEvent
                          ? "rgba(142,216,208,0.22)"
                          : "rgba(255,255,255,0.1)"
                    }
                    strokeDasharray="3 5"
                  />
                ) : null}
                {isCurrent ? (
                  <circle
                    cx={marker.point.x}
                    cy={marker.point.y}
                    r={CHART_LAYOUT.endpoint.glowRadius}
                    fill="rgba(114, 199, 190, 0.1)"
                  />
                ) : null}
                {!isCurrent && (isHovered || isSelected) ? (
                  <circle
                    cx={marker.point.x}
                    cy={marker.point.y}
                    r={
                      isSelected
                        ? CHART_LAYOUT.marker.selectedRadius
                        : CHART_LAYOUT.marker.hoverRadius
                    }
                    fill={
                      isEvent
                        ? "rgba(142, 216, 208, 0.14)"
                        : "rgba(180,196,214,0.11)"
                    }
                  />
                ) : null}
                <circle
                  cx={marker.point.x}
                  cy={marker.point.y}
                  r={
                    isCurrent
                      ? CHART_LAYOUT.endpoint.markerRadius
                      : isEvent
                      ? CHART_LAYOUT.marker.radius.event
                      : CHART_LAYOUT.marker.radius.checkpoint
                  }
                  fill="rgba(7, 13, 19, 0.98)"
                  stroke={
                    isSelected
                      ? "rgba(243, 239, 230, 0.94)"
                      : isCurrent || isEvent
                        ? "rgba(142, 216, 208, 0.98)"
                        : "rgba(126, 144, 167, 0.9)"
                  }
                  strokeWidth={
                    isSelected || isCurrent
                      ? CHART_LAYOUT.marker.strokeWidth.selected
                      : CHART_LAYOUT.marker.strokeWidth.default
                  }
                />
                <circle
                  cx={marker.point.x}
                  cy={marker.point.y}
                  r={isCurrent ? 2.5 : isEvent ? 2.2 : 1.7}
                  fill={
                    isCurrent || isEvent
                      ? "rgba(233, 250, 247, 0.96)"
                      : "rgba(176, 190, 208, 0.92)"
                  }
                />
                {group.members.length > 1 ? (
                  <g aria-hidden>
                    <circle
                      cx={badgeX}
                      cy={badgeY}
                      r="7"
                      fill="rgba(7,12,18,0.96)"
                      stroke="rgba(142,216,208,0.55)"
                      strokeWidth="1.4"
                    />
                    <text
                      x={badgeX}
                      y={badgeY + 3}
                      textAnchor="middle"
                      fill="rgba(233,250,247,0.92)"
                      fontSize="8"
                      fontWeight="600"
                    >
                      {group.members.length}
                    </text>
                  </g>
                ) : null}
              </g>
            );
          })}

          {activeDataMarker && !hoveredGroup && !selectedGroup ? (
            <g>
              <line
                x1={activeDataMarker.point.x}
                x2={activeDataMarker.point.x}
                y1={Math.max(
                  activeDataMarker.point.y - CHART_LAYOUT.marker.guideTopOffset,
                  markerGuideTop
                )}
                y2={baseline}
                stroke="rgba(255,255,255,0.12)"
                strokeDasharray="3 5"
              />
              {selectedDataMarker ? (
                <circle
                  cx={activeDataMarker.point.x}
                  cy={activeDataMarker.point.y}
                  r={CHART_LAYOUT.marker.hoverRadius}
                  fill="rgba(180,196,214,0.1)"
                />
              ) : null}
              <circle
                cx={activeDataMarker.point.x}
                cy={activeDataMarker.point.y}
                r="4.8"
                fill="rgba(7, 13, 19, 0.98)"
                stroke="rgba(126, 144, 167, 0.86)"
                strokeWidth="2.4"
              />
              <circle
                cx={activeDataMarker.point.x}
                cy={activeDataMarker.point.y}
                r="1.5"
                fill="rgba(176, 190, 208, 0.92)"
              />
            </g>
          ) : null}

          {axisLabels.map((labelPoint) => {
            const pointIndex = data.findIndex(
              (point) =>
                point.label === labelPoint.label && point.value === labelPoint.value
            );
            const point = points[pointIndex];

            if (!point) {
              return null;
            }

            return (
              <text
                key={`${labelPoint.label}-${pointIndex}`}
                x={point.x}
                y={height - 4}
                textAnchor="middle"
                fill="rgba(139,154,174,0.88)"
                fontSize="11"
              >
                {labelPoint.label}
              </text>
            );
          })}
        </svg>

        <div
          className={cn(
            "absolute inset-0 z-10",
            markersDisabled && "pointer-events-none"
          )}
          onPointerMove={(event) => {
            if (markersDisabled) {
              return;
            }
            const nearestIndex = getNearestDataPointIndex(event);
            setHoveredDataPointIndex(nearestIndex);
          }}
          onPointerLeave={() => setHoveredDataPointIndex(null)}
          onClick={(event) => {
            if (markersDisabled) {
              return;
            }
            const nearestIndex = getNearestDataPointIndex(event);

            if (nearestIndex !== null) {
              setSelectedMarkerKey(null);
              setSelectedDataPointIndex((current) =>
                current === nearestIndex ? null : nearestIndex
              );
            }
          }}
        >
          {markerGroups.map((group) => {
            const marker = group.primary;
            const markerKindLabel =
              group.members.length > 1
                ? "Grouped"
                : marker.kind === "current"
                  ? "Current"
                  : marker.kind === "event"
                    ? "Event"
                    : "Checkpoint";

            return (
            <button
              key={`anchor-${group.key}`}
              type="button"
              className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none transition-transform duration-150 hover:scale-105 focus-visible:scale-105 focus-visible:ring-2 focus-visible:ring-white/30"
              style={{
                left: `${(marker.point.x / width) * 100}%`,
                top: `${(marker.point.y / height) * 100}%`,
              }}
              aria-label={`${markerKindLabel} marker for ${marker.label} at ${marker.time}${
                group.members.length > 1
                  ? ` with ${group.members.length} nearby signals`
                  : ""
              }`}
              onMouseEnter={() => setHoveredMarkerKey(marker.key)}
              onMouseLeave={() => setHoveredMarkerKey((current) => (current === marker.key ? null : current))}
              onFocus={() => setHoveredMarkerKey(marker.key)}
              onBlur={() => setHoveredMarkerKey((current) => (current === marker.key ? null : current))}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedDataPointIndex(null);
                setSelectedMarkerKey((current) =>
                  current === marker.key ? null : marker.key
                );
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedDataPointIndex(null);
                  setSelectedMarkerKey((current) =>
                    current === marker.key ? null : marker.key
                  );
                }
              }}
            >
              <span className="sr-only">
                {group.members.length > 1
                  ? "Open grouped marker detail"
                  : marker.kind === "event"
                    ? "Open event detail"
                    : "Open checkpoint detail"}
              </span>
            </button>
            );
          })}

          {activeTooltipGroup ? (
            <MarkerTooltip group={activeTooltipGroup} width={width} height={height} />
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SparklineChart({
  data,
  trend,
  className,
}: {
  data: PriceLineChartPoint[];
  trend: "up" | "down";
  className?: string;
}) {
  const width = 120;
  const height = 44;
  const { points, baseline } = getSparklineGeometry(data, width, height);
  const linePath = toLinePath(points);
  const areaPath = toAreaPath(points, baseline);
  const finalPoint = points[points.length - 1];
  const strokeColor =
    trend === "up" ? "rgba(142, 216, 208, 1)" : "rgba(201, 135, 122, 1)";
  const fillColor =
    trend === "up" ? "rgba(142, 216, 208, 0.12)" : "rgba(201, 135, 122, 0.1)";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn("h-11 w-28 shrink-0", className)}
      aria-hidden
    >
      <path d={areaPath} fill={fillColor} />
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {finalPoint ? (
        <g>
          <circle
            cx={finalPoint.x}
            cy={finalPoint.y}
            r="5"
            fill={trend === "up" ? "rgba(142, 216, 208, 0.14)" : "rgba(201, 135, 122, 0.14)"}
          />
          <circle
            cx={finalPoint.x}
            cy={finalPoint.y}
            r="2.5"
            fill={strokeColor}
          />
        </g>
      ) : null}
    </svg>
  );
}
