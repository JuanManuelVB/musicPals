import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { ListeningPoint, ListeningSummary, MusicLibrary, SpotifyApiData } from "@/domain/types";
import { demoSource, spotifyApiSource, type DataSource, type DataSourceInfo, type SpotifyTimeRange } from "@/domain/sources";
import { mockDailySeries } from "@/mocks/evolution";
import { mockLibrary } from "@/mocks/library";
import { mockSummary } from "@/mocks/summary";
import { analyzeHistory } from "@/engine/historyAnalytics";
import { useSpotifySession } from "./SpotifySessionProvider";
import { useZipHistory } from "./ZipHistoryProvider";
import { getSpotifyRecentlyPlayed, getSpotifyTopArtists, getSpotifyTopTracks } from "@/data/spotify/api";

type MusicDataContextValue = {
  source: DataSource;
  sourceInfo: DataSourceInfo;
  summary?: ListeningSummary;
  library?: MusicLibrary;
  series?: ListeningPoint[];
  apiData?: SpotifyApiData;
  apiError?: string;
  isLoadingApi: boolean;
  setSource: (source: DataSource) => void;
};

const MusicDataContext = createContext<MusicDataContextValue | undefined>(undefined);
const spotifyTimeRanges: SpotifyTimeRange[] = ["short_term", "medium_term", "long_term"];

function readPreferredSource(): DataSource {
  try {
    const value = localStorage.getItem("musicpals.source");
    return value === "spotify-api" || value === "demo" ? value : "demo";
  } catch {
    return "demo";
  }
}

function persistSource(source: DataSource) {
  if (source !== "demo" && source !== "spotify-api") return;
  try {
    localStorage.setItem("musicpals.source", source);
  } catch {
    // Preferences are optional; the application remains usable without storage.
  }
}

export function MusicDataProvider({ children }: PropsWithChildren) {
  const spotify = useSpotifySession();
  const zip = useZipHistory();
  const [source, setSourceState] = useState<DataSource>(readPreferredSource);
  const [apiData, setApiData] = useState<SpotifyApiData>();
  const [apiError, setApiError] = useState<string>();
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const historical = useMemo(() => analyzeHistory(zip.events), [zip.events]);
  const setSource = (nextSource: DataSource) => {
    setSourceState(nextSource);
    persistSource(nextSource);
  };

  useEffect(() => {
    if (source === "spotify-api" && spotify.status !== "connected" && spotify.status !== "connecting") setSource("demo");
    if (source === "spotify-zip" && !zip.events.length) setSource("demo");
  }, [source, spotify.status, zip.events.length]);

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
    if (source === "spotify-zip") return { source, sourceInfo: historical.summary.source, summary: historical.summary, library: historical.library, series: historical.series, apiData, apiError, isLoadingApi, setSource };
    if (source === "spotify-api") return { source, sourceInfo: spotifyApiSource, apiData, apiError, isLoadingApi, setSource };
    return { source, sourceInfo: demoSource, summary: mockSummary, library: mockLibrary, series: mockDailySeries, apiData, apiError, isLoadingApi, setSource };
  }, [apiData, apiError, historical, isLoadingApi, source]);

  return <MusicDataContext.Provider value={value}>{children}</MusicDataContext.Provider>;
}

export function useMusicData() {
  const context = useContext(MusicDataContext);
  if (!context) throw new Error("useMusicData debe usarse dentro de MusicDataProvider.");
  return context;
}
