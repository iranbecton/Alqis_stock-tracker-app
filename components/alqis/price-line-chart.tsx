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

type PriceLineChartVariant = "full" | "compact";

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
    leftInset: 20,
    lineGap: 10,
    axisClearance: 20,
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
const AXIS_LABEL_MIN_DISTANCE_PX = 92;

function getChartGeometry(data: PriceLineChartPoint[], width: number, height: number) {
  if (data.length === 0) {
    const plotLeft = CHART_LAYOUT.bounds.left;
    const plotRight = width - CHART_LAYOUT.bounds.right;
    const plotTop = CHART_LAYOUT.bounds.top;
    const plotBottom = height - CHART_LAYOUT.bounds.bottom;

    return {
      points: [],
      baseline: plotBottom,
      plotLeft,
      plotRight,
      plotTop,
      plotWidth: plotRight - plotLeft,
      plotHeight: plotBottom - plotTop,
      markerGuideTop: plotTop + 4,
    };
  }

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

function getSafeChartData(data: PriceLineChartPoint[] | undefined | null) {
  return Array.isArray(data)
    ? data.filter(
        (point) =>
          point &&
          typeof point.label === "string" &&
          typeof point.value === "number" &&
          Number.isFinite(point.value)
      )
    : [];
}

function getSparklineGeometry(
  data: PriceLineChartPoint[],
  width: number,
  height: number
) {
  if (data.length === 0) {
    return {
      points: [],
      baseline: height - 5,
    };
  }

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
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

function getTooltipEvidenceTag(marker: InteractiveMarker) {
  if (marker.kind === "data") {
    return null;
  }

  return marker.title || getMarkerTypeLabel(marker);
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

function getAxisLabelIndices({
  data,
  points,
  renderedSize,
  viewBoxWidth,
}: {
  data: PriceLineChartPoint[];
  points: Coordinates[];
  renderedSize: RenderedChartSize;
  viewBoxWidth: number;
}) {
  if (data.length <= 1) {
    return [];
  }

  const maxLabels = renderedSize.width < 440 ? 3 : renderedSize.width < 680 ? 4 : 5;
  const candidateCount = Math.min(maxLabels, data.length);
  const rawIndices = Array.from({ length: candidateCount }, (_, index) =>
    Math.round((index * (data.length - 1)) / Math.max(candidateCount - 1, 1))
  );
  const indices = Array.from(new Set(rawIndices)).sort((a, b) => a - b);
  const scaleX = renderedSize.width / viewBoxWidth;
  const accepted: number[] = [];

  indices.forEach((index) => {
    const point = points[index];

    if (!point) {
      return;
    }

    const x = point.x * scaleX;
    const previousIndex = accepted[accepted.length - 1];
    const previousPoint =
      previousIndex === undefined ? undefined : points[previousIndex];
    const previousX = previousPoint ? previousPoint.x * scaleX : undefined;

    if (
      previousX !== undefined &&
      x - previousX < AXIS_LABEL_MIN_DISTANCE_PX
    ) {
      if (index === data.length - 1) {
        accepted[accepted.length - 1] = index;
      }
      return;
    }

    accepted.push(index);
  });

  return accepted;
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

function getPricePillPlacement({
  point,
  width,
  plotLeft,
  plotRight,
  plotTop,
  baseline,
}: {
  point: Coordinates;
  width: number;
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  baseline: number;
}) {
  const pillWidth = 70;
  const pillHeight = 20;
  const gap = 8;
  const placeLeft = point.x + gap + pillWidth > Math.min(plotRight, width - 10);
  const x = placeLeft ? point.x - gap - pillWidth : point.x + gap;
  const y = clamp(point.y - pillHeight / 2, plotTop + 4, baseline - pillHeight - 4);

  return {
    x: clamp(x, plotLeft + 2, width - pillWidth - 4),
    y,
    width: pillWidth,
    height: pillHeight,
  };
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
  const evidenceTag = getTooltipEvidenceTag(marker);

  return (
    <div
      className={cn(
        "pointer-events-none absolute z-20 rounded-[0.65rem] border border-[#72c7be]/28 bg-[#0D1B24] px-3 py-2.5 text-[#F4EEE2] shadow-[0_14px_34px_rgba(0,0,0,0.38),0_0_18px_rgba(114,199,190,0.08)] backdrop-blur-xl transition-all duration-150",
        group.members.length > 1
          ? "w-[min(16.125rem,calc(100vw-2.5rem))]"
          : "w-max max-w-[min(13rem,calc(100vw-2.5rem))]"
      )}
      style={{
        left: placement.left,
        top: placement.top,
        transform: `translate(${translateX}, ${translateY})`,
      }}
    >
      {evidenceTag || group.members.length > 1 ? (
        <p className="mb-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-[#72c7be]">
          {group.members.length > 1 ? "Grouped signals" : evidenceTag}
        </p>
      ) : null}
      <p className="text-sm font-semibold text-[#F4EEE2]">
        {currencyFormatter.format(marker.value)}
      </p>
      <p className="mt-0.5 text-[0.72rem] text-[#F4EEE2]/68">{marker.time}</p>
      {group.members.length > 1 ? (
        <div className="mt-2 space-y-1.5 border-t border-[#72c7be]/16 pt-2">
          {group.members.map((member) => (
            <div
              key={`tooltip-${member.key}`}
              className="rounded-[0.45rem] bg-white/[0.035] px-2 py-1.5"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[0.72rem] font-medium leading-4 text-[#F4EEE2]">
                  {getTooltipEvidenceTag(member) ?? member.time}
                </p>
                <p
                  className={cn(
                    "shrink-0 text-[0.68rem] font-medium",
                    member.changePct >= 0 ? "text-gain" : "text-loss"
                  )}
                >
                  {formatPercent(member.changePct)}
                </p>
              </div>
              <p className="mt-0.5 text-[0.68rem] leading-4 text-[#F4EEE2]/60">
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
  variant = "full",
}: {
  data: PriceLineChartPoint[];
  markers?: PriceLineChartMarker[];
  className?: string;
  markersDisabled?: boolean;
  onSelectedInsightChange?: (insight: ChartMarkerInsight | null) => void;
  variant?: PriceLineChartVariant;
}) {
  const width = 720;
  const height = variant === "compact" ? 230 : 320;
  const safeData = getSafeChartData(data);
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
  const lineGlowId = `${chartId}-line-glow`;
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
    getChartGeometry(safeData, width, height);
  const areaPath = toAreaPath(points, baseline);
  const linePath = toLinePath(points);
  const finalPoint = points[points.length - 1];
  const finalPointIndex = Math.max(points.length - 1, 0);
  const highPoint = points.length
    ? points.reduce((best, point) => (point.y < best.y ? point : best), points[0])
    : undefined;
  const lowPoint = points.length
    ? points.reduce((best, point) => (point.y > best.y ? point : best), points[0])
    : undefined;
  const highValue = safeData.length
    ? Math.max(...safeData.map((point) => point.value))
    : 0;
  const lowValue = safeData.length
    ? Math.min(...safeData.map((point) => point.value))
    : 0;
  const showRangeAnnotations =
    safeData.length >= 2 && renderedSvgSize.width >= (variant === "compact" ? 360 : 320);
  const highLabel = highPoint
    ? getPricePillPlacement({
        point: highPoint,
        width,
        plotLeft,
        plotRight,
        plotTop,
        baseline,
      })
    : null;
  const lowLabelBase = lowPoint
    ? getPricePillPlacement({
        point: lowPoint,
        width,
        plotLeft,
        plotRight,
        plotTop,
        baseline,
      })
    : null;
  const lowLabel =
    highLabel && lowLabelBase && Math.abs(highLabel.y - lowLabelBase.y) < 22
      ? {
          ...lowLabelBase,
          y: clamp(lowLabelBase.y + 24, plotTop + 12, baseline - 12),
        }
      : lowLabelBase;
  const axisLabelY = height - (variant === "compact" ? 5 : 4);
  const interactiveMarkers = useMemo(() => {
    const visibleMarkers = markersDisabled
      ? []
      : markers.filter((marker) => marker.index < finalPointIndex);
    const mappedMarkers = visibleMarkers
      .map<InteractiveMarker | null>((marker) => {
          const point = points[marker.index];
          const value = safeData[marker.index]?.value;
          const baseValue = safeData[0]?.value ?? value ?? 0;
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
            time: marker.time ?? safeData[marker.index]?.label ?? marker.label,
            point,
            value,
            changePct: baseValue === 0 ? 0 : ((value - baseValue) / baseValue) * 100,
          } satisfies InteractiveMarker;
        })
      .filter((marker): marker is InteractiveMarker => marker !== null);
    const finalValue = safeData[finalPointIndex]?.value;
    const baseValue = safeData[0]?.value ?? finalValue ?? 0;

    if (!markersDisabled && finalPoint && finalValue !== undefined) {
      mappedMarkers.push({
        index: finalPointIndex,
        label: "Current price",
        key: `current-${finalPointIndex}-${safeData[finalPointIndex]?.label ?? "latest"}`,
        kind: "current",
        time: safeData[finalPointIndex]?.label ?? "Latest",
        point: finalPoint,
        value: finalValue,
        changePct:
          baseValue === 0 ? 0 : ((finalValue - baseValue) / baseValue) * 100,
      });
    }

    return mappedMarkers;
  }, [finalPoint, finalPointIndex, markers, markersDisabled, points, safeData]);
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
    [height, hoveredMarkerKey, interactiveMarkers, renderedSvgSize, selectedMarkerKey]
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
    const value = safeData[index]?.value;
    const baseValue = safeData[0]?.value ?? value ?? 0;

    if (!point || value === undefined) {
      return null;
    }

    return {
      index,
      label: "",
      key: `data-${index}-${safeData[index]?.label ?? "point"}`,
      kind: "data",
      time: safeData[index]?.label ?? `Point ${index + 1}`,
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
  const axisLabelIndices = getAxisLabelIndices({
    data: safeData,
    points,
    renderedSize: renderedSvgSize,
    viewBoxWidth: width,
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
        "relative overflow-visible rounded-[1.35rem] border border-[#2f72d5]/22 bg-[#070F14]",
        variant === "compact"
          ? "p-2.5 sm:rounded-[1.35rem] sm:p-3"
          : "p-3 sm:rounded-[1.75rem] sm:p-6",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,rgba(114,199,190,0.13),transparent_36%),radial-gradient(circle_at_50%_0%,rgba(47,114,213,0.08),transparent_42%),linear-gradient(180deg,#08151d_0%,#070F14_58%,#050a0e_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.34)_0%,transparent_14%,transparent_86%,rgba(0,0,0,0.36)_100%)]" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_70px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(244,238,226,0.025)]" />

      <div className="relative">
        {safeData.length < 2 ? (
          <div className="grid h-40 place-items-center rounded-[var(--radius-lg)] border border-dashed border-border/70 bg-surface/35 px-5 text-center text-body-sm text-ink-muted sm:h-56">
            Chart data limited.
          </div>
        ) : (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className={cn(
            "relative w-full",
            variant === "compact"
              ? "h-[170px] sm:h-[205px]"
              : "h-[260px] sm:h-[360px]"
          )}
          role="img"
          aria-label="Price chart with interactive checkpoints and catalyst markers"
        >
          <defs>
            <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#72c7be" stopOpacity="0.3" />
              <stop offset="55%" stopColor="#72c7be" stopOpacity="0.11" />
              <stop offset="100%" stopColor="#72c7be" stopOpacity="0" />
            </linearGradient>
            <filter
              id={lineGlowId}
              x="-8%"
              y="-16%"
              width="116%"
              height="132%"
              colorInterpolationFilters="sRGB"
            >
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="3"
                floodColor="#72c7be"
                floodOpacity="0.6"
              />
            </filter>
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
              stroke="rgba(137,161,194,0.09)"
              strokeDasharray="5 8"
            />
          ))}

          {showRangeAnnotations && highPoint && highLabel ? (
            <g>
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={highPoint.y}
                y2={highPoint.y}
                stroke="rgba(114,199,190,0.08)"
              />
              <rect
                x={highLabel.x}
                y={highLabel.y}
                width={highLabel.width}
                height={highLabel.height}
                rx="10"
                fill="rgba(114,199,190,0.15)"
                stroke="rgba(114,199,190,0.3)"
              />
              <text
                x={highLabel.x + highLabel.width / 2}
                y={highLabel.y + 13.5}
                textAnchor="middle"
                fill="#F4EEE2"
                fontSize="11"
                fontWeight="700"
              >
                HIGH ${highValue.toFixed(0)}
              </text>
            </g>
          ) : null}

          {showRangeAnnotations && lowPoint && lowLabel ? (
            <g>
              <line
                x1={plotLeft}
                x2={plotRight}
                y1={lowPoint.y}
                y2={lowPoint.y}
                stroke="rgba(114,199,190,0.06)"
              />
              <rect
                x={lowLabel.x}
                y={lowLabel.y}
                width={lowLabel.width}
                height={lowLabel.height}
                rx="10"
                fill="rgba(114,199,190,0.15)"
                stroke="rgba(114,199,190,0.3)"
              />
              <text
                x={lowLabel.x + lowLabel.width / 2}
                y={lowLabel.y + 13.5}
                textAnchor="middle"
                fill="#F4EEE2"
                fontSize="11"
                fontWeight="700"
              >
                LOW ${lowValue.toFixed(0)}
              </text>
            </g>
          ) : null}

          <g clipPath={`url(#${clipPathId})`}>
            <path d={areaPath} fill={`url(#${areaGradientId})`} />
            <path
              d={linePath}
              fill="none"
              stroke="#72c7be"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${lineGlowId})`}
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
            const isCurrent = marker.kind === "current";
            const captionY =
              marker.point.y < height * 0.36
                ? marker.point.y + 19
                : marker.point.y - 12;

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
                    stroke="rgba(114,199,190,0.2)"
                    strokeWidth="1"
                  />
                ) : null}
                <circle
                  cx={marker.point.x}
                  cy={marker.point.y}
                  r={isSelected || isHovered ? 10 : isCurrent ? 9 : 8}
                  fill="rgba(114,199,190,0.16)"
                />
                <circle
                  cx={marker.point.x}
                  cy={marker.point.y}
                  r={isSelected || isHovered ? 5 : 4}
                  fill="#72c7be"
                  filter={`url(#${lineGlowId})`}
                />
                {!isCurrent ? (
                  <text
                    x={marker.point.x}
                    y={captionY}
                    textAnchor="middle"
                    fill="rgba(244,238,226,0.6)"
                    fontSize="10"
                    fontWeight="600"
                    aria-hidden
                  >
                    {marker.label}
                  </text>
                ) : null}
                {group.members.length > 1 ? (
                  <text
                    x={marker.point.x + 12}
                    y={captionY}
                    fill="rgba(244,238,226,0.52)"
                    fontSize="9"
                    fontWeight="600"
                    aria-hidden
                  >
                    +{group.members.length - 1}
                  </text>
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
                stroke="rgba(114,199,190,0.16)"
                strokeWidth="1"
              />
              {selectedDataMarker ? (
                <circle
                  cx={activeDataMarker.point.x}
                  cy={activeDataMarker.point.y}
                  r="9"
                  fill="rgba(114,199,190,0.12)"
                />
              ) : null}
              <circle
                cx={activeDataMarker.point.x}
                cy={activeDataMarker.point.y}
                r="3.5"
                fill="#72c7be"
                opacity="0.86"
                filter={`url(#${lineGlowId})`}
              />
            </g>
          ) : null}

          {axisLabelIndices.map((pointIndex) => {
            const labelPoint = safeData[pointIndex];
            const point = points[pointIndex];

            if (!point || !labelPoint) {
              return null;
            }

            return (
              <text
                key={`${labelPoint.label}-${pointIndex}`}
                x={point.x}
                y={axisLabelY}
                textAnchor="middle"
                fill="rgba(139,154,174,0.88)"
                fontSize={variant === "compact" ? "10" : "11"}
              >
                {labelPoint.label}
              </text>
            );
          })}
        </svg>
        )}

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
              className="absolute h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full outline-none transition-transform duration-150 hover:scale-105 focus-visible:scale-105 focus-visible:ring-2 focus-visible:ring-white/30"
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
  const safeData = getSafeChartData(data);
  const { points, baseline } = getSparklineGeometry(safeData, width, height);
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
