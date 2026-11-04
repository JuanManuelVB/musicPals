import type { MusicLibrary } from "@/domain/types";

export type RankingCategory = "artists" | "tracks" | "albums";
export type RankingSort = "plays" | "minutes";

/** Modelo común para pintar cualquier ranking. */
export type RankingItem = {
  id: string;
  name: string;
  subtitle: string;
  imageUrl?: string;
  plays: number;
  minutes: number;
};

export function toRankingItems(category: RankingCategory, library: MusicLibrary): RankingItem[] {
  switch (category) {
    case "artists":
      return library.artists.map(({ artist, plays, minutes }) => ({
        id: artist.id,
        name: artist.name,
        subtitle: artist.genres[0] ?? "Sin género",
        imageUrl: artist.imageUrl,
        plays,
        minutes,
      }));
    case "tracks":
      return library.tracks.map(({ track, artistName, plays, minutes }) => ({
        id: track.id,
        name: track.name,
        subtitle: artistName,
        plays,
        minutes,
      }));
    case "albums":
      return library.albums.map(({ album, artistName, plays, minutes }) => ({
        id: album.id,
        name: album.name,
        subtitle: artistName,
        imageUrl: album.imageUrl,
        plays,
        minutes,
      }));
  }
}

/** Orden descendente por el criterio elegido; desempata por la otra métrica y luego por nombre. */
export function sortRanking(items: RankingItem[], sort: RankingSort): RankingItem[] {
  const other: RankingSort = sort === "plays" ? "minutes" : "plays";
  return [...items].sort((x, y) => y[sort] - x[sort] || y[other] - x[other] || x.name.localeCompare(y.name, "es"));
}
