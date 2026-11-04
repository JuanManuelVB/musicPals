import type { Artist, Track } from "@/domain/types";
import { getSpotifyAccessToken, clearSpotifySession } from "./auth";

const API_BASE_URL = "https://api.spotify.com/v1";

type SpotifyArtistResponse = { id: string; name: string; genres?: string[]; images?: { url: string }[] };
type SpotifyTrackResponse = {
  id: string;
  name: string;
  duration_ms: number;
  artists: { id: string; name: string }[];
};

export type SpotifyProfile = { id: string; displayName: string; imageUrl?: string };
export type SpotifyAffinityArtistResponse = { item: Artist; rank: number; timeRange: "short_term" | "medium_term" | "long_term" };
export type SpotifyAffinityTrackResponse = { item: Track; artistName: string; rank: number; timeRange: "short_term" | "medium_term" | "long_term" };
export type SpotifyRecentlyPlayedResponse = { track: Track; artistName: string; playedAt: string };

export class SpotifyApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "SpotifyApiError";
  }
}

async function request<T>(path: string, searchParams?: Record<string, string>) {
  const accessToken = await getSpotifyAccessToken();
  if (!accessToken) throw new SpotifyApiError("Conecta Spotify para consultar tus datos.", 401);
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(searchParams ?? {})) url.searchParams.set(key, value);

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (response.status === 401) {
    clearSpotifySession();
    throw new SpotifyApiError("La sesión de Spotify ha caducado. Vuelve a conectar la cuenta.", 401);
  }
  if (response.status === 403) throw new SpotifyApiError("Spotify no ha concedido alguno de los permisos solicitados.", 403);
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("Retry-After"));
    throw new SpotifyApiError("Spotify ha limitado temporalmente las peticiones.", 429, Number.isFinite(retryAfter) ? retryAfter : undefined);
  }
  if (!response.ok) throw new SpotifyApiError(`Spotify devolvió un error (${response.status}).`, response.status);
  return (await response.json()) as T;
}

function mapArtist(artist: SpotifyArtistResponse): Artist {
  return { id: artist.id, name: artist.name, genres: artist.genres ?? [], imageUrl: artist.images?.[0]?.url };
}

function mapTrack(track: SpotifyTrackResponse): Track {
  return { id: track.id, name: track.name, artistId: track.artists[0]?.id ?? "", durationMs: track.duration_ms };
}

export async function getSpotifyProfile(): Promise<SpotifyProfile> {
  const profile = await request<{ id: string; display_name: string; images?: { url: string }[] }>("/me");
  return { id: profile.id, displayName: profile.display_name, imageUrl: profile.images?.[0]?.url };
}

export async function getSpotifyTopArtists(timeRange: SpotifyAffinityArtistResponse["timeRange"] = "medium_term") {
  const response = await request<{ items: SpotifyArtistResponse[] }>("/me/top/artists", { time_range: timeRange, limit: "50" });
  return response.items.map((artist, index) => ({ item: mapArtist(artist), rank: index + 1, timeRange }));
}

export async function getSpotifyTopTracks(timeRange: SpotifyAffinityTrackResponse["timeRange"] = "medium_term") {
  const response = await request<{ items: SpotifyTrackResponse[] }>("/me/top/tracks", { time_range: timeRange, limit: "50" });
  return response.items.map((track, index) => ({
    item: mapTrack(track),
    artistName: track.artists[0]?.name ?? "Artista desconocido",
    rank: index + 1,
    timeRange,
  }));
}

export async function getSpotifyRecentlyPlayed(limit = 50) {
  const response = await request<{ items: { track: SpotifyTrackResponse; played_at: string }[] }>("/me/player/recently-played", {
    limit: String(limit),
  });
  return response.items.map(({ track, played_at: playedAt }) => ({
    track: mapTrack(track),
    artistName: track.artists[0]?.name ?? "Artista desconocido",
    playedAt,
  }));
}
