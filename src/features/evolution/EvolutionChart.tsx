import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TimeBucket } from "@/domain/types";
import { chartColors } from "@/ui/chartTheme";

export type ChartDatum = TimeBucket & { value: number };

type EvolutionChartProps = {
  data: ChartDatum[];
  color: string;
  formatTick: (value: number) => string;
  formatTooltipValue: (datum: ChartDatum) => string;
};

type TooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: ChartDatum }>;
  formatTooltipValue: (datum: ChartDatum) => string;
};

function ChartTooltip({ active, payload, formatTooltipValue }: TooltipProps) {
  const datum = payload?.[0]?.payload;
  if (!active || !datum) return null;
  return (
    <div className="rounded-xl border border-ink-600 bg-ink-900 px-3 py-2 text-sm shadow-lg">
      <p className="text-fog-300">{datum.fullLabel}</p>
      <p className="font-semibold tabular-nums">{formatTooltipValue(datum)}</p>
      {datum.isPartial && <p className="text-xs text-fog-500">Periodo parcial ({datum.days} días)</p>}
    </div>
  );
}

export function EvolutionChart({ data, color, formatTick, formatTooltipValue }: EvolutionChartProps) {
  const gradientId = `fill-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={chartColors.grid} />
          <XAxis
            dataKey="label"
            interval="preserveStartEnd"
            minTickGap={28}
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartColors.tick, fontSize: 12 }}
          />
          <YAxis
            width={48}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatTick}
            tick={{ fill: chartColors.tick, fontSize: 12 }}
          />
          <Tooltip content={<ChartTooltip formatTooltipValue={formatTooltipValue} />} cursor={{ stroke: chartColors.cursor }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{ r: 4, fill: color, stroke: "none" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
