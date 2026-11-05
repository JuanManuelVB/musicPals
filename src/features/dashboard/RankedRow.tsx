import type { PlatformBreakdown } from "@/domain/types";
import { Avatar } from "@/ui/Avatar";
import { PlatformSplitBar } from "@/ui/platform";

type RankedRowProps = {
  name: string;
  subtitle: string;
  value: string;
  rank?: number;
  /** Si se indica, muestra el reparto por plataforma bajo el nombre. */
  breakdown?: PlatformBreakdown;
};

export function RankedRow({ name, subtitle, value, rank, breakdown }: RankedRowProps) {
  return (
    <li className="flex items-center gap-3 py-2">
      {rank !== undefined && <span className="w-5 text-sm tabular-nums text-fog-500">{rank}</span>}
      <Avatar name={name} shape="square" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-fog-300">{subtitle}</p>
        {breakdown && <PlatformSplitBar className="mt-1.5 max-w-40" breakdown={breakdown} metric="minutes" />}
      </div>
      <span className="text-sm tabular-nums text-fog-300">{value}</span>
    </li>
  );
}
