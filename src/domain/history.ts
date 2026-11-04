export type NormalizedListeningEvent = {
  playedAt: string;
  trackId: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  durationMs: number;
};

export type ZipImportReport = {
  filesFound: number;
  filesProcessed: number;
  filesIgnored: number;
  imported: number;
  discarded: number;
  errors: string[];
};
