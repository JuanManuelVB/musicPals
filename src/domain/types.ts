/**
 * Tipos del dominio. No dependen de la interfaz ni de ninguna fuente de datos.
 * Los tipos de estadísticas describen lo que producirá el motor de análisis;
 * en la fase 1 se rellenan con datos ficticios.
 */

import type { DataSourceInfo, RecentlyPlayedTrack, SpotifyAffinityArtist, SpotifyAffinityTrack, SpotifyTimeRange } from "./sources";

export type Artist = {
  id: string;
  name: string;
  genres: string[];
  /**
   * Imagen del artista (opcional). Aún no se rellena desde ninguna fuente externa;
   * si falta, la interfaz genera una ilustración local a partir del nombre.
   */
  imageUrl?: string;
};

export type Track = {
  id: string;
  name: string;
  artistId: string;
  durationMs?: number;
};

export type ArtistStat = {
  artist: Artist;
  minutes: number;
  plays: number;
  /**
   * Fecha ISO (AAAA-MM-DD) de la primera escucha REGISTRADA en el historial.
   * Es una aproximación: no garantiza cuándo se descubrió realmente al artista
   * (pudo escucharse antes en otra cuenta, fuera de Spotify o antes del periodo exportado).
   */
  firstPlayedAt: string;
};

export type TrackStat = {
  track: Track;
  artistName: string;
  minutes: number;
  plays: number;
};

export type GenreShare = {
  genre: string;
  /** Proporción entre 0 y 1 del tiempo total escuchado. */
  share: number;
};

export type ListeningSummary = {
  source: DataSourceInfo;
  periodLabel: string;
  totalMinutes: number;
  totalPlays: number;
  distinctArtists: number;
  distinctTracks: number;
  topArtists: ArtistStat[];
  topTracks: TrackStat[];
  genres: GenreShare[];
  /** Artistas con primera escucha registrada reciente, del más nuevo al más antiguo. */
  newArtists: ArtistStat[];
};

export type Album = {
  id: string;
  name: string;
  artistId: string;
  imageUrl?: string;
};

export type AlbumStat = {
  album: Album;
  artistName: string;
  minutes: number;
  plays: number;
};

/** Estadísticas por entidad, base de los rankings. */
export type MusicLibrary = {
  source: DataSourceInfo;
  artists: ArtistStat[];
  tracks: TrackStat[];
  albums: AlbumStat[];
};

/** Datos que Spotify proporciona sin convertir afinidad en reproducciones exactas. */
export type SpotifyApiData = {
  source: DataSourceInfo;
  affinityArtists: Record<SpotifyTimeRange, SpotifyAffinityArtist[]>;
  affinityTracks: Record<SpotifyTimeRange, SpotifyAffinityTrack[]>;
  recentlyPlayed: RecentlyPlayedTrack[];
};

/** Actividad de un día (fecha ISO AAAA-MM-DD). Es la unidad mínima de la serie temporal. */
export type ListeningPoint = {
  date: string;
  minutes: number;
  plays: number;
};

export type TimeGranularity = "day" | "week" | "month";

/** Resultado de agrupar una serie diaria por día, semana (lunes) o mes. */
export type TimeBucket = {
  /** Fecha ISO de inicio del periodo. */
  key: string;
  label: string;
  fullLabel: string;
  minutes: number;
  plays: number;
  /** Días con datos dentro del periodo. */
  days: number;
  /** true si el periodo no está completo (por ejemplo, semanas en los extremos de la serie). */
  isPartial: boolean;
};
