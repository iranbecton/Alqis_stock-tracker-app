import { cn } from "@/lib/utils";
import type { ChartPoint as StockDetailChartPoint } from "@/lib/stock-detail-demo-data";

type Coordinates = {
  x: number;
  y: number;
};

type SparklineChartPoint = StockDetailChartPoint;

function getSparklineGeometry(
  data: SparklineChartPoint[],
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

export function SparklineChart({
  data,
  trend,
  className,
}: {
  data: SparklineChartPoint[];
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
            fill={
              trend === "up"
                ? "rgba(142, 216, 208, 0.14)"
                : "rgba(201, 135, 122, 0.14)"
            }
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
