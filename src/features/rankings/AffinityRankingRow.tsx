import { ArtistImage } from "@/ui/ArtistImage";

type AffinityRankingRowProps = {
  rank: number;
  name: string;
  subtitle: string;
  timeRange: string;
};

export function AffinityRankingRow({ rank, name, subtitle, timeRange }: AffinityRankingRowProps) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="w-6 shrink-0 text-right text-sm tabular-nums text-fog-500">{rank}</span>
      <div className="size-11 shrink-0">
        <ArtistImage name={name} rounded="rounded-lg" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-fog-300">{subtitle}</p>
      </div>
      <span className="shrink-0 text-xs text-fog-500">{timeRange}</span>
    </li>
  );
}
