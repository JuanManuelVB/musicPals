import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { ListeningPoint, ListeningSummary, MusicLibrary, SpotifyApiData, YouTubeMusicApiData } from "@/domain/types";
import { combinedSource, demoSource, spotifyApiSource, spotifyZipSource, ytmusicApiSource, ytmusicZipSource, type DataSource, type DataSourceInfo, type SpotifyTimeRange } from "@/domain/sources";
import { mockDailySeries } from "@/mocks/evolution";
import { mockLibrary } from "@/mocks/library";
import { mockSummary } from "@/mocks/summary";
import { analyzeHistory } from "@/engine/historyAnalytics";
import { useSpotifySession } from "./SpotifySessionProvider";
import { useZipHistory } from "./ZipHistoryProvider";
import { getSpotifyRecentlyPlayed, getSpotifyTopArtists, getSpotifyTopTracks } from "@/data/spotify/api";
import { getYouTubeLikedMusic, getYouTubePlaylists } from "@/data/ytmusic/api";
import { useYouTubeSession } from "./YouTubeSessionProvider";

type MusicDataContextValue = {
  source: DataSource;
  sourceInfo: DataSourceInfo;
  summary?: ListeningSummary;
  library?: MusicLibrary;
  series?: ListeningPoint[];
  apiData?: SpotifyApiData;
  youtubeData?: YouTubeMusicApiData;
  apiError?: string;
  isLoadingApi: boolean;
  setSource: (source: DataSource) => void;
  /** Indica si una fuente tiene datos para poder seleccionarse. */
  isAvailable: (source: DataSource) => boolean;
};

const MusicDataContext = createContext<MusicDataContextValue | undefined>(undefined);
const spotifyTimeRanges: SpotifyTimeRange[] = ["short_term", "medium_term", "long_term"];
const historicalSources: Partial<Record<DataSource, DataSourceInfo>> = {
  "spotify-zip": spotifyZipSource,
  "ytmusic-zip": ytmusicZipSource,
  combined: combinedSource,
};

function readPreferredSource(): DataSource {
  try {
    const value = localStorage.getItem("musicpals.source");
    return value === "spotify-api" || value === "ytmusic-api" || value === "demo" ? value : "demo";
  } catch {
    return "demo";
  }
}

function hasPreferredSource() {
  try {
    return localStorage.getItem("musicpals.source") !== null;
  } catch {
    return false;
  }
}

function persistSource(source: DataSource) {
  // Los historiales importados viven solo en memoria, así que no se recuerdan como preferencia.
  if (source !== "demo" && source !== "spotify-api" && source !== "ytmusic-api") return;
  try {
    localStorage.setItem("musicpals.source", source);
  } catch {
    // Preferences are optional; the application remains usable without storage.
  }
}

export function MusicDataProvider({ children }: PropsWithChildren) {
  const spotify = useSpotifySession();
  const youtube = useYouTubeSession();
  const zip = useZipHistory();
  const [source, setSourceState] = useState<DataSource>(readPreferredSource);
  const [apiData, setApiData] = useState<SpotifyApiData>();
  const [youtubeData, setYoutubeData] = useState<YouTubeMusicApiData>();
  const [apiError, setApiError] = useState<string>();
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const spotifyEvents = zip.histories.spotify.events;
  const ytmusicEvents = zip.histories.ytmusic.events;
  const isAvailable = (candidate: DataSource) => {
    if (candidate === "spotify-api") return spotify.status === "connected" || spotify.status === "connecting";
    if (candidate === "spotify-zip") return spotifyEvents.length > 0;
    if (candidate === "ytmusic-api") return youtube.status === "connected" || youtube.status === "connecting";
    if (candidate === "ytmusic-zip") return ytmusicEvents.length > 0;
    if (candidate === "combined") return spotifyEvents.length > 0 && ytmusicEvents.length > 0;
    return true;
  };
  // Solo se analiza el historial de la fuente activa.
  const historical = useMemo(() => {
    const info = historicalSources[source];
    if (!info) return undefined;
    const events = source === "spotify-zip" ? spotifyEvents : source === "ytmusic-zip" ? ytmusicEvents : [...spotifyEvents, ...ytmusicEvents];
    return analyzeHistory(events, info);
  }, [source, spotifyEvents, ytmusicEvents]);
  const setSource = (nextSource: DataSource) => {
    setSourceState(nextSource);
    persistSource(nextSource);
  };

  useEffect(() => {
    if (spotify.status === "connected" && !hasPreferredSource() && source === "demo") setSource("spotify-api");
    if (youtube.status === "connected" && !hasPreferredSource() && source === "demo") setSource("ytmusic-api");
    if (!isAvailable(source)) setSource("demo");
  }, [source, spotify.status, youtube.status, spotifyEvents.length, ytmusicEvents.length]);

  useEffect(() => {
    if (source !== "ytmusic-api" || youtube.status !== "connected") return;
    let cancelled = false;
    setIsLoadingApi(true);
    setApiError(undefined);
    Promise.all([getYouTubeLikedMusic(), getYouTubePlaylists()])
      .then(([likedTracks, playlists]) => {
        if (cancelled) return;
        const artists = new Map<string, YouTubeMusicApiData["likedArtists"][number]>();
        for (const { track, artistName } of likedTracks) {
          const entry = artists.get(track.artistId) ?? { artist: { id: track.artistId, name: artistName, genres: [] }, likedCount: 0 };
          entry.likedCount += 1;
          artists.set(track.artistId, entry);
        }
        setYoutubeData({
          source: ytmusicApiSource,
          likedTracks,
          likedArtists: [...artists.values()].sort((a, b) => b.likedCount - a.likedCount || a.artist.name.localeCompare(b.artist.name, "es")),
          playlists,
        });
      })
      .catch((reason: unknown) => {
        if (!cancelled) setApiError(reason instanceof Error ? reason.message : "No se pudieron consultar los datos de YouTube.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingApi(false);
      });
    return () => {
      cancelled = true;
    };
  }, [source, youtube.status]);

  useEffect(() => {
    if (source !== "spotify-api" || spotify.status !== "connected") return;
    let cancelled = false;
    setIsLoadingApi(true);
    setApiError(undefined);
    Promise.all([
      Promise.all(spotifyTimeRanges.map((range) => getSpotifyTopArtists(range))),
      Promise.all(spotifyTimeRanges.map((range) => getSpotifyTopTracks(range))),
      getSpotifyRecentlyPlayed(),
    ])
      .then(([artistsByRange, tracksByRange, recentlyPlayed]) => {
        if (cancelled) return;
        setApiData({
          source: spotifyApiSource,
          affinityArtists: Object.fromEntries(spotifyTimeRanges.map((range, index) => [range, artistsByRange[index]])) as SpotifyApiData["affinityArtists"],
          affinityTracks: Object.fromEntries(spotifyTimeRanges.map((range, index) => [range, tracksByRange[index]])) as SpotifyApiData["affinityTracks"],
          recentlyPlayed,
        });
      })
      .catch((reason: unknown) => {
        if (!cancelled) setApiError(reason instanceof Error ? reason.message : "No se pudieron consultar los datos de Spotify.");
      })
      .finally(() => {
        if (!cancelled) setIsLoadingApi(false);
      });
    return () => {
      cancelled = true;
    };
  }, [source, spotify.status]);

  const value = useMemo<MusicDataContextValue>(() => {
    const common = { source, apiData, youtubeData, apiError, isLoadingApi, setSource, isAvailable };
    if (historical) return { ...common, sourceInfo: historical.summary.source, summary: historical.summary, library: historical.library, series: historical.series };
    if (source === "spotify-api") return { ...common, sourceInfo: spotifyApiSource };
    if (source === "ytmusic-api") return { ...common, sourceInfo: ytmusicApiSource };
    return { ...common, sourceInfo: demoSource, summary: mockSummary, library: mockLibrary, series: mockDailySeries };
  }, [apiData, apiError, historical, isLoadingApi, source, spotify.status, spotifyEvents.length, youtube.status, youtubeData, ytmusicEvents.length]);

  return <MusicDataContext.Provider value={value}>{children}</MusicDataContext.Provider>;
}

export function useMusicData() {
  const context = useContext(MusicDataContext);
  if (!context) throw new Error("useMusicData debe usarse dentro de MusicDataProvider.");
  return context;
}
