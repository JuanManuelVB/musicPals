import { useMemo } from "react";
import { useMusicData } from "@/app/MusicDataProvider";
import type { PublishedItem } from "@/data/account";

const TOP_SIZE = 10;

/**
 * Top de artistas y canciones que se puede publicar con la fuente seleccionada ahora.
 * Los datos de ejemplo no se publican; YouTube Music conectado no ofrece un top real (solo "me gusta").
 */
export function usePublishableTops(): { source: string; artists: PublishedItem[]; tracks: PublishedItem[] } | { unavailable: string } {
  const { source, sourceInfo, summary, apiData } = useMusicData();

  return useMemo(() => {
    if (source === "demo") return { unavailable: "Conecta Spotify o importa tu historial para publicar tu top real." };
    if (source === "ytmusic-api") return { unavailable: "YouTube Music conectado no ofrece un top. Importa tu historial de Google Takeout o elige otra fuente." };
    if (source === "spotify-api") {
      if (!apiData) return { unavailable: "Cargando tus datos de Spotify…" };
      return {
        source: `${sourceInfo.label} · últimos 6 meses`,
        artists: apiData.affinityArtists.medium_term.slice(0, TOP_SIZE).map(({ item }) => ({ name: item.name, imageUrl: item.imageUrl })),
        tracks: apiData.affinityTracks.medium_term.slice(0, TOP_SIZE).map(({ item, artistName }) => ({ name: item.name, artistName })),
      };
    }
    if (!summary) return { unavailable: "No hay datos para publicar." };
    return {
      source: `${sourceInfo.label} · ${summary.periodLabel}`,
      artists: summary.topArtists.slice(0, TOP_SIZE).map(({ artist, minutes, plays }) => ({ name: artist.name, imageUrl: artist.imageUrl, minutes: Math.round(minutes), plays })),
      tracks: summary.topTracks.slice(0, TOP_SIZE).map(({ track, artistName, minutes, plays }) => ({ name: track.name, artistName, minutes: Math.round(minutes), plays })),
    };
  }, [apiData, source, sourceInfo.label, summary]);
}
