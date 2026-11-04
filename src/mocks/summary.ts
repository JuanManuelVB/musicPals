import type { ListeningSummary } from "@/domain/types";
import { demoSource } from "@/domain/sources";
import { getArtistStat, mockLibrary } from "./library";

const byMinutes = <T extends { minutes: number }>(items: T[]) => [...items].sort((x, y) => y.minutes - x.minutes);

export const mockSummary: ListeningSummary = {
  source: demoSource,
  periodLabel: "Últimos 12 meses",
  totalMinutes: 48320,
  totalPlays: 14230,
  distinctArtists: 612,
  distinctTracks: 2941,
  topArtists: byMinutes(mockLibrary.artists).slice(0, 8),
  topTracks: byMinutes(mockLibrary.tracks).slice(0, 8),
  genres: [
    { genre: "Indie pop", share: 0.24 },
    { genre: "Synthwave", share: 0.19 },
    { genre: "Pop latino", share: 0.16 },
    { genre: "Rock alternativo", share: 0.15 },
    { genre: "Folk", share: 0.1 },
    { genre: "Electrónica", share: 0.08 },
    { genre: "Otros", share: 0.08 },
  ],
  // Más reciente primero.
  newArtists: ["a12", "a11", "a10", "a9"].map(getArtistStat),
};
