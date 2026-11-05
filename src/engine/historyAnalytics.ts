import type { AlbumStat, Artist, ArtistStat, ListeningPoint, ListeningSummary, MusicLibrary, PlatformBreakdown, TrackStat } from "@/domain/types";
import type { NormalizedListeningEvent, Platform } from "@/domain/history";
import type { DataSourceInfo } from "@/domain/sources";

type ArtistAccumulator = ArtistStat & { firstPlayedAt: string; byPlatform: PlatformBreakdown };
type TrackAccumulator = TrackStat & { byPlatform: PlatformBreakdown };
type AlbumAccumulator = AlbumStat & { byPlatform: PlatformBreakdown };

function stableId(prefix: string, value: string) {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) | 0;
  return `${prefix}-${Math.abs(hash).toString(36)}`;
}

function periodLabel(events: NormalizedListeningEvent[]) {
  if (!events.length) return "Sin datos";
  const dates = events.map((event) => event.playedAt.slice(0, 10)).sort();
  return `${dates[0]} — ${dates[dates.length - 1]}`;
}

function addToBreakdown(breakdown: PlatformBreakdown, platform: Platform, minutes: number) {
  const totals = breakdown[platform];
  if (totals) {
    totals.minutes += minutes;
    totals.plays += 1;
  } else {
    breakdown[platform] = { minutes, plays: 1 };
  }
}

export type HistoricalDataset = {
  library: MusicLibrary;
  summary: ListeningSummary;
  series: ListeningPoint[];
};

/**
 * Calcula estadísticas a partir de eventos de una o varias plataformas.
 * Artistas, canciones y álbumes se agrupan por nombre para que coincidan entre plataformas.
 */
export function analyzeHistory(events: NormalizedListeningEvent[], source: DataSourceInfo): HistoricalDataset {
  const artists = new Map<string, ArtistAccumulator>();
  const tracks = new Map<string, TrackAccumulator>();
  const albums = new Map<string, AlbumAccumulator>();
  const daily = new Map<string, ListeningPoint & { byPlatform: PlatformBreakdown }>();
  const totals: PlatformBreakdown = {};

  for (const event of events) {
    const artistKey = event.artistName.toLocaleLowerCase();
    const artistId = stableId("artist", artistKey);
    const existingArtist = artists.get(artistKey);
    const artist: Artist = existingArtist?.artist ?? { id: artistId, name: event.artistName, genres: [] };
    const minutes = event.durationMs / 60_000;
    const date = event.playedAt.slice(0, 10);
    addToBreakdown(totals, event.platform, minutes);

    if (existingArtist) {
      existingArtist.minutes += minutes;
      existingArtist.plays += 1;
      existingArtist.firstPlayedAt = existingArtist.firstPlayedAt < date ? existingArtist.firstPlayedAt : date;
      addToBreakdown(existingArtist.byPlatform, event.platform, minutes);
    } else {
      artists.set(artistKey, { artist, minutes, plays: 1, firstPlayedAt: date, byPlatform: { [event.platform]: { minutes, plays: 1 } } });
    }

    const trackKey = `${artistKey}\u0000${event.trackName.toLocaleLowerCase()}`;
    const existingTrack = tracks.get(trackKey);
    if (existingTrack) {
      existingTrack.minutes += minutes;
      existingTrack.plays += 1;
      addToBreakdown(existingTrack.byPlatform, event.platform, minutes);
    } else {
      tracks.set(trackKey, {
        track: { id: stableId("track", trackKey), name: event.trackName, artistId },
        artistName: event.artistName,
        minutes,
        plays: 1,
        byPlatform: { [event.platform]: { minutes, plays: 1 } },
      });
    }

    if (event.albumName) {
      const albumKey = `${artistKey}\u0000${event.albumName.toLocaleLowerCase()}`;
      const existingAlbum = albums.get(albumKey);
      if (existingAlbum) {
        existingAlbum.minutes += minutes;
        existingAlbum.plays += 1;
        addToBreakdown(existingAlbum.byPlatform, event.platform, minutes);
      } else {
        albums.set(albumKey, {
          album: { id: stableId("album", albumKey), name: event.albumName, artistId },
          artistName: event.artistName,
          minutes,
          plays: 1,
          byPlatform: { [event.platform]: { minutes, plays: 1 } },
        });
      }
    }

    const point = daily.get(date);
    if (point) {
      point.minutes += minutes;
      point.plays += 1;
      addToBreakdown(point.byPlatform, event.platform, minutes);
    } else {
      daily.set(date, { date, minutes, plays: 1, byPlatform: { [event.platform]: { minutes, plays: 1 } } });
    }
  }

  const artistStats = [...artists.values()].sort((a, b) => b.minutes - a.minutes);
  const trackStats = [...tracks.values()].sort((a, b) => b.minutes - a.minutes);
  const albumStats = [...albums.values()].sort((a, b) => b.minutes - a.minutes);
  const series = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
  const totalMinutes = series.reduce((total, point) => total + point.minutes, 0);

  return {
    library: { source, artists: artistStats, tracks: trackStats, albums: albumStats },
    summary: {
      source,
      periodLabel: periodLabel(events),
      totalMinutes,
      totalPlays: events.length,
      distinctArtists: artists.size,
      distinctTracks: tracks.size,
      topArtists: artistStats.slice(0, 8),
      topTracks: trackStats.slice(0, 8),
      genres: [],
      newArtists: [...artistStats].sort((a, b) => b.firstPlayedAt.localeCompare(a.firstPlayedAt)).slice(0, 4),
      byPlatform: totals,
    },
    series,
  };
}
