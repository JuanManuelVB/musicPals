/** Identificador estable de la procedencia de un conjunto de datos. */
export type DataSource = "demo" | "spotify-api" | "spotify-zip" | "ytmusic-api" | "ytmusic-zip" | "combined";

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

export const ytmusicApiSource: DataSourceInfo = {
  id: "ytmusic-api",
  label: "YouTube Music (cuenta de Google)",
  description: "Canciones con «Me gusta» y listas de tu cuenta, obtenidas con YouTube Data API.",
  limitations: [
    "Google no ofrece el historial de reproducciones por API; para estadísticas de escucha importa Google Takeout.",
    "Los artistas se ordenan por número de canciones con «Me gusta», no por reproducciones.",
  ],
};

export const ytmusicZipSource: DataSourceInfo = {
  id: "ytmusic-zip",
  label: "YouTube Music (Google Takeout)",
  description: "Estadísticas calculadas localmente a partir del historial exportado con Google Takeout.",
  limitations: [
    "Google Takeout no incluye la duración escuchada: el tiempo se estima en 3,5 minutos por reproducción.",
    "YouTube Music no ofrece álbumes en el historial exportado.",
  ],
};

export const combinedSource: DataSourceInfo = {
  id: "combined",
  label: "Spotify + YouTube Music",
  description: "Historiales de Spotify y YouTube Music combinados; los artistas y canciones se unen por nombre.",
  limitations: [
    "El tiempo de YouTube Music es estimado.",
    "Las coincidencias entre plataformas dependen de que el nombre del artista y la canción sea idéntico.",
  ],
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
