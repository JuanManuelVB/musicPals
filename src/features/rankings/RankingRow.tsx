import { ArtistImage } from "@/ui/ArtistImage";
import { cn } from "@/ui/cn";
import { formatDuration, formatNumber } from "@/lib/format";
import { PlatformSplitBar } from "@/ui/platform";
import type { RankingItem, RankingSort } from "./rankingItems";

type RankingRowProps = { rank: number; item: RankingItem; sort: RankingSort; showPlatforms?: boolean };

const valueClass = (active: boolean) => cn("sm:w-32 sm:text-right", active ? "font-semibold text-fog-100" : "text-fog-300");

export function RankingRow({ rank, item, sort, showPlatforms = false }: RankingRowProps) {
  return (
    <li className="flex items-center gap-3 py-2.5">
      <span className="w-6 shrink-0 text-right text-sm tabular-nums text-fog-500">{rank}</span>
      <div className="size-11 shrink-0">
        <ArtistImage name={item.name} imageUrl={item.imageUrl} rounded="rounded-lg" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.name}</p>
        <p className="truncate text-xs text-fog-300">{item.subtitle}</p>
        {showPlatforms && item.byPlatform && <PlatformSplitBar className="mt-1.5 max-w-48" breakdown={item.byPlatform} metric={sort} />}
      </div>
      <div className="flex shrink-0 flex-col items-end text-sm tabular-nums sm:flex-row sm:gap-6">
        <span className={valueClass(sort === "plays")}>
          {formatNumber(item.plays)}
          <span className="text-xs font-normal sm:hidden"> repr.</span>
        </span>
        <span className={valueClass(sort === "minutes")}>{formatDuration(item.minutes)}</span>
      </div>
    </li>
  );
}
