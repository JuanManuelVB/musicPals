import { Crown } from "lucide-react";
import type { ArtistStat } from "@/domain/types";
import { ArtistImage } from "@/ui/ArtistImage";
import { cn } from "@/ui/cn";
import { formatMinutes, formatNumber } from "@/lib/format";

type PodiumEntry =
  | { kind: "historical"; entry: ArtistStat }
  | { kind: "affinity"; artist: ArtistStat["artist"]; rank: number; timeRange: string };

type PodiumProps = { entries: PodiumEntry[] | ArtistStat[] };

// `order` reordena solo visualmente (2 · 1 · 3); el orden del DOM sigue siendo 1, 2, 3 para lectores de pantalla.
const styles = {
  1: {
    order: "order-2",
    pedestal: "h-20 sm:h-28 bg-linear-to-b from-[#f4d98a] via-[#b98a35] to-[#f1d27b] text-ink-950",
    image: "shadow-xl shadow-[#b98a35]/25 ring-2 ring-[#e6bd62]",
  },
  2: {
    order: "order-1",
    pedestal: "h-14 sm:h-20 bg-linear-to-b from-[#eef1f5] via-[#9ca6b5] to-[#d9dee6] text-ink-950",
    image: "shadow-lg shadow-[#9ca6b5]/20 ring-2 ring-[#c6ccd5]",
  },
  3: {
    order: "order-3",
    pedestal: "h-10 sm:h-14 bg-linear-to-b from-[#d9a574] via-[#98603d] to-[#c88b60] text-ink-950",
    image: "shadow-lg shadow-[#98603d]/20 ring-2 ring-[#bd8059]",
  },
} as const;

export function Podium({ entries }: PodiumProps) {
  const normalizedEntries: PodiumEntry[] = entries.map((entry) => ("kind" in entry ? entry : { kind: "historical", entry }));
  if (!normalizedEntries.length) return null;

  return (
    <section aria-label="Podio de artistas más escuchados" className="mb-8">
      <ol className="grid grid-cols-[1fr_1.3fr_1fr] items-end gap-2 sm:gap-5">
        {normalizedEntries.slice(0, 3).map((entry, index) => {
          const rank = (index + 1) as 1 | 2 | 3;
          const artist = entry.kind === "historical" ? entry.entry.artist : entry.artist;
          const isFirst = rank === 1;
          return (
            <li
              key={artist.id}
              className={cn(
                "flex flex-col transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.015] motion-reduce:transition-none",
                styles[rank].order,
              )}
            >
              <div className="relative">
                {isFirst && (
                  <Crown aria-hidden className="absolute -top-3 left-1/2 z-10 size-6 -translate-x-1/2 text-sun-400 sm:-top-4 sm:size-8" />
                )}
                <ArtistImage
                  name={artist.name}
                  imageUrl={artist.imageUrl}
                  className={cn(styles[rank].image, isFirst && "shadow-iris-500/30")}
                />
              </div>

              <div className="mt-3 text-center">
                <p className={cn("line-clamp-2 font-semibold leading-tight", isFirst ? "text-base sm:text-xl" : "text-sm sm:text-base")}>
                  {artist.name}
                </p>
                {entry.kind === "historical" ? (
                  <>
                    <p className="mt-1 text-xs tabular-nums text-fog-100 sm:text-sm">{formatMinutes(entry.entry.minutes)}</p>
                    <p className="text-xs tabular-nums text-fog-500">{formatNumber(entry.entry.plays)} reproducciones</p>
                  </>
                ) : (
                  <p className="mt-1 text-xs tabular-nums text-fog-500">Afinidad #{entry.rank} · {entry.timeRange}</p>
                )}
              </div>

              <div
                className={cn(
                  "mt-3 flex items-start justify-center rounded-t-2xl pt-2 font-display text-2xl font-semibold sm:text-4xl",
                  styles[rank].pedestal,
                )}
              >
                {rank}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
