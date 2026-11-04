/** Identificador estable de la procedencia de un conjunto de datos. */
export type DataSource = "demo" | "spotify-api" | "spotify-zip";

export type DataSourceInfo = {
  id: DataSource;
  label: string;
  description: string;
  limitations: string[];
};

export const demoSource: DataSourceInfo = {
  id: "demo",
  label: "Datos de ejemplo",
  description: "Datos ficticios incluidos para probar la aplicación.",
  limitations: [],
};

export const spotifyApiSource: DataSourceInfo = {
  id: "spotify-api",
  label: "Spotify Web API",
  description: "Afinidad y actividad reciente devueltas por Spotify.",
  limitations: [
    "Top Artists y Top Tracks son rankings de afinidad, no recuentos de reproducciones.",
    "Recently Played no representa el historial completo.",
  ],
};

export const spotifyZipSource: DataSourceInfo = {
  id: "spotify-zip",
  label: "Spotify Extended Streaming History",
  description: "Estadísticas calculadas localmente a partir del ZIP exportado.",
  limitations: ["El periodo depende de los archivos incluidos en el ZIP exportado."],
};

export type SpotifyTimeRange = "short_term" | "medium_term" | "long_term";

export type SpotifyAffinityArtist = {
  item: import("./types").Artist;
  rank: number;
  timeRange: SpotifyTimeRange;
};

export type SpotifyAffinityTrack = {
  item: import("./types").Track;
  artistName: string;
  rank: number;
  timeRange: SpotifyTimeRange;
};

export type RecentlyPlayedTrack = {
  track: import("./types").Track;
  artistName: string;
  playedAt: string;
  durationMs?: number;
};
