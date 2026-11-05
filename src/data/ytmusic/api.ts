import type { Track } from "@/domain/types";
import { clearYouTubeSession, getYouTubeAccessToken } from "./auth";

const API_BASE_URL = "https://www.googleapis.com/youtube/v3";
/** Categoría «Música» de YouTube; las canciones de YouTube Music la usan. */
const MUSIC_CATEGORY_ID = "10";
const TOPIC_SUFFIX = /\s+-\s+(?:topic|tema)$/i;

type Thumbnails = Partial<Record<"default" | "medium" | "high", { url: string }>>;
type VideoResponse = {
  id: string;
  snippet: { title: string; channelId: string; channelTitle: string; categoryId?: string; thumbnails?: Thumbnails };
  contentDetails?: { duration?: string };
};
type PlaylistResponse = { id: string; snippet: { title: string; thumbnails?: Thumbnails }; contentDetails?: { itemCount?: number } };
type Page<T> = { items: T[]; nextPageToken?: string };

export type YouTubeProfile = { displayName: string; imageUrl?: string };
export type YouTubeLikedTrack = { track: Track; artistName: string; imageUrl?: string };
export type YouTubePlaylist = { id: string; title: string; itemCount: number; imageUrl?: string };

export class YouTubeApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "YouTubeApiError";
  }
}

async function request<T>(path: string, searchParams: Record<string, string>) {
  const accessToken = getYouTubeAccessToken();
  if (!accessToken) throw new YouTubeApiError("Conecta YouTube Music para consultar tus datos.", 401);
  const url = new URL(`${API_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(searchParams)) url.searchParams.set(key, value);

  const response = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (response.status === 401) {
    clearYouTubeSession();
    throw new YouTubeApiError("La sesión de YouTube ha caducado. Vuelve a conectar la cuenta.", 401);
  }
  if (response.status === 403) throw new YouTubeApiError("Google ha denegado el acceso (permisos o cuota de YouTube Data API).", 403);
  if (!response.ok) throw new YouTubeApiError(`YouTube devolvió un error (${response.status}).`, response.status);
  return (await response.json()) as T;
}

/** Recorre páginas de 50 resultados hasta `max` elementos. */
async function paginate<T>(path: string, searchParams: Record<string, string>, max: number) {
  const items: T[] = [];
  let pageToken: string | undefined;
  do {
    const page = await request<Page<T>>(path, { ...searchParams, maxResults: "50", ...(pageToken ? { pageToken } : {}) });
    items.push(...page.items);
    pageToken = page.nextPageToken;
  } while (pageToken && items.length < max);
  return items.slice(0, max);
}

/** Convierte una duración ISO 8601 (PT3M25S) a milisegundos. */
function parseDuration(value: string | undefined) {
  const match = value?.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return undefined;
  const [, hours = "0", minutes = "0", seconds = "0"] = match;
  return ((Number(hours) * 60 + Number(minutes)) * 60 + Number(seconds)) * 1000;
}

const thumbnail = (thumbnails?: Thumbnails) => thumbnails?.medium?.url ?? thumbnails?.high?.url ?? thumbnails?.default?.url;

export async function getYouTubeProfile(): Promise<YouTubeProfile> {
  const response = await request<Page<{ snippet: { title: string; thumbnails?: Thumbnails } }>>("/channels", { part: "snippet", mine: "true" });
  const channel = response.items[0];
  return { displayName: channel?.snippet.title ?? "Cuenta de Google", imageUrl: thumbnail(channel?.snippet.thumbnails) };
}

/** Canciones marcadas con «Me gusta», de la más reciente a la más antigua. */
export async function getYouTubeLikedMusic(max = 250): Promise<YouTubeLikedTrack[]> {
  const videos = await paginate<VideoResponse>("/videos", { part: "snippet,contentDetails", myRating: "like" }, max);
  return videos
    .filter((video) => video.snippet.categoryId === MUSIC_CATEGORY_ID)
    .map((video) => ({
      track: { id: video.id, name: video.snippet.title, artistId: video.snippet.channelId, durationMs: parseDuration(video.contentDetails?.duration) },
      artistName: video.snippet.channelTitle.replace(TOPIC_SUFFIX, ""),
      imageUrl: thumbnail(video.snippet.thumbnails),
    }));
}

export async function getYouTubePlaylists(max = 100): Promise<YouTubePlaylist[]> {
  const playlists = await paginate<PlaylistResponse>("/playlists", { part: "snippet,contentDetails", mine: "true" }, max);
  return playlists.map((playlist) => ({
    id: playlist.id,
    title: playlist.snippet.title,
    itemCount: playlist.contentDetails?.itemCount ?? 0,
    imageUrl: thumbnail(playlist.snippet.thumbnails),
  }));
}
