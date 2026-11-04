import type { AlbumStat, Artist, ArtistStat, ListeningPoint, ListeningSummary, MusicLibrary, TrackStat } from "@/domain/types";
import type { NormalizedListeningEvent } from "@/domain/history";
import { spotifyZipSource } from "@/domain/sources";

type ArtistAccumulator = ArtistStat & { firstPlayedAt: string };
type TrackAccumulator = TrackStat;
type AlbumAccumulator = AlbumStat;

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

export type HistoricalDataset = {
  library: MusicLibrary;
  summary: ListeningSummary;
  series: ListeningPoint[];
};

export function analyzeHistory(events: NormalizedListeningEvent[]): HistoricalDataset {
  const artists = new Map<string, ArtistAccumulator>();
  const tracks = new Map<string, TrackAccumulator>();
  const albums = new Map<string, AlbumAccumulator>();
  const daily = new Map<string, ListeningPoint>();

  for (const event of events) {
    const artistKey = event.artistName.toLocaleLowerCase();
    const artistId = stableId("artist", artistKey);
    const existingArtist = artists.get(artistKey);
    const artist: Artist = existingArtist?.artist ?? { id: artistId, name: event.artistName, genres: [] };
    const minutes = event.durationMs / 60_000;
    const date = event.playedAt.slice(0, 10);

    if (existingArtist) {
      existingArtist.minutes += minutes;
      existingArtist.plays += 1;
      existingArtist.firstPlayedAt = existingArtist.firstPlayedAt < date ? existingArtist.firstPlayedAt : date;
    } else {
      artists.set(artistKey, { artist, minutes, plays: 1, firstPlayedAt: date });
    }

    const trackKey = event.trackId;
    const existingTrack = tracks.get(trackKey);
    if (existingTrack) {
      existingTrack.minutes += minutes;
      existingTrack.plays += 1;
    } else {
      tracks.set(trackKey, {
        track: { id: event.trackId, name: event.trackName, artistId },
        artistName: event.artistName,
        minutes,
        plays: 1,
      });
    }

    if (event.albumName) {
      const albumKey = `${artistKey}\u0000${event.albumName.toLocaleLowerCase()}`;
      const existingAlbum = albums.get(albumKey);
      if (existingAlbum) {
        existingAlbum.minutes += minutes;
        existingAlbum.plays += 1;
      } else {
        albums.set(albumKey, {
          album: { id: stableId("album", albumKey), name: event.albumName, artistId },
          artistName: event.artistName,
          minutes,
          plays: 1,
        });
      }
    }

    const point = daily.get(date);
    if (point) {
      point.minutes += minutes;
      point.plays += 1;
    } else {
      daily.set(date, { date, minutes, plays: 1 });
    }
  }

  const artistStats = [...artists.values()].sort((a, b) => b.minutes - a.minutes);
  const trackStats = [...tracks.values()].sort((a, b) => b.minutes - a.minutes);
  const albumStats = [...albums.values()].sort((a, b) => b.minutes - a.minutes);
  const series = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
  const totalMinutes = series.reduce((total, point) => total + point.minutes, 0);

  return {
    library: { source: spotifyZipSource, artists: artistStats, tracks: trackStats, albums: albumStats },
    summary: {
      source: spotifyZipSource,
      periodLabel: periodLabel(events),
      totalMinutes,
      totalPlays: events.length,
      distinctArtists: artists.size,
      distinctTracks: tracks.size,
      topArtists: artistStats.slice(0, 8),
      topTracks: trackStats.slice(0, 8),
      genres: [],
      newArtists: [...artistStats].sort((a, b) => b.firstPlayedAt.localeCompare(a.firstPlayedAt)).slice(0, 4),
    },
    series,
  };
}
