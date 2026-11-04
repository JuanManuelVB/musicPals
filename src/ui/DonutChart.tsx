import { formatPercent } from "@/lib/format";
import { cn } from "./cn";

type Segment = { label: string; value: number };

type DonutChartProps = {
  segments: Segment[];
  /** Texto grande del centro (por ejemplo, el porcentaje dominante). */
  centerValue: string;
  /** Texto pequeño bajo el valor central. */
  centerLabel: string;
  className?: string;
};

// El último color es neutro (pensado para «Otros»).
const palette = [
  { stroke: "stroke-flare-500", bg: "bg-flare-500" },
  { stroke: "stroke-iris-500", bg: "bg-iris-500" },
  { stroke: "stroke-sun-400", bg: "bg-sun-400" },
  { stroke: "stroke-iris-400", bg: "bg-iris-400" },
  { stroke: "stroke-flare-400", bg: "bg-flare-400" },
  { stroke: "stroke-fog-300", bg: "bg-fog-300" },
  { stroke: "stroke-fog-500", bg: "bg-fog-500" },
];

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 1.2;

export function DonutChart({ segments, centerValue, centerLabel, className }: DonutChartProps) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  let consumed = 0;
  const arcs = segments.map((segment, index) => {
    const length = total > 0 ? (segment.value / total) * CIRCUMFERENCE : 0;
    const arc = {
      dash: Math.max(0, length - GAP),
      offset: consumed,
      color: palette[index % palette.length]!,
      segment,
    };
    consumed += length;
    return arc;
  });

  return (
    <div className={cn("flex flex-col items-center gap-6 sm:flex-row", className)}>
      <div className="relative size-44 shrink-0">
        <svg viewBox="0 0 100 100" role="img" aria-label="Reparto de géneros por tiempo escuchado" className="size-full">
          <g transform="rotate(-90 50 50)" fill="none" strokeWidth={12}>
            <circle cx={50} cy={50} r={RADIUS} className="stroke-ink-800" />
            {arcs.map(({ dash, offset, color, segment }) => (
              <circle
                key={segment.label}
                cx={50}
                cy={50}
                r={RADIUS}
                className={color.stroke}
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={-offset}
              />
            ))}
          </g>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <span className="font-display text-3xl font-semibold tabular-nums">{centerValue}</span>
          <span className="text-xs leading-tight text-fog-300">{centerLabel}</span>
        </div>
      </div>

      <ul className="w-full flex-1 space-y-2">
        {arcs.map(({ color, segment }) => (
          <li key={segment.label} className="flex items-center gap-3 text-sm">
            <span aria-hidden className={cn("size-3 shrink-0 rounded-full", color.bg)} />
            <span className="flex-1 truncate">{segment.label}</span>
            <span className="tabular-nums text-fog-300">{formatPercent(total > 0 ? segment.value / total : 0)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
