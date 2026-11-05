/** Plataforma de la que procede una escucha. */
export type Platform = "spotify" | "ytmusic";

export const platforms: Platform[] = ["spotify", "ytmusic"];

export const platformLabels: Record<Platform, string> = {
  spotify: "Spotify",
  ytmusic: "YouTube Music",
};

export type NormalizedListeningEvent = {
  platform: Platform;
  playedAt: string;
  trackId: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  durationMs: number;
  /** true si la duración no viene en el historial y se ha estimado (YouTube Music). */
  durationEstimated?: boolean;
};

export type ZipImportReport = {
  filesFound: number;
  filesProcessed: number;
  filesIgnored: number;
  imported: number;
  discarded: number;
  errors: string[];
};
