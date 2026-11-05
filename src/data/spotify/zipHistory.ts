import { strFromU8, unzipSync } from "fflate";
import type { NormalizedListeningEvent, ZipImportReport } from "@/domain/history";

type RawHistoryRecord = Record<string, unknown>;

export type ZipImportResult = {
  events: NormalizedListeningEvent[];
  report: ZipImportReport;
};

export class ZipHistoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ZipHistoryError";
  }
}

export function isRecord(value: unknown): value is RawHistoryRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function nonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

function trackIdFromUri(value: unknown, artistName: string, trackName: string) {
  const uri = nonEmptyString(value);
  if (uri?.startsWith("spotify:track:")) return uri.slice("spotify:track:".length);
  return `${artistName}\u0000${trackName}`.toLocaleLowerCase();
}

function normalizeRecord(record: RawHistoryRecord): NormalizedListeningEvent | undefined {
  const playedAt = nonEmptyString(record.ts) ?? nonEmptyString(record.endTime);
  const trackName = nonEmptyString(record.master_metadata_track_name) ?? nonEmptyString(record.trackName);
  const artistName = nonEmptyString(record.master_metadata_album_artist_name) ?? nonEmptyString(record.artistName);
  const albumName = nonEmptyString(record.master_metadata_album_album_name) ?? nonEmptyString(record.albumName);
  const durationMs = numberValue(record.ms_played) ?? numberValue(record.msPlayed);

  if (!playedAt || Number.isNaN(Date.parse(playedAt)) || !trackName || !artistName || durationMs === undefined) return undefined;

  return {
    platform: "spotify",
    playedAt: new Date(playedAt).toISOString(),
    trackId: trackIdFromUri(record.spotify_track_uri, artistName, trackName),
    trackName,
    artistName,
    albumName,
    durationMs,
  };
}

function isHistoryFile(name: string) {
  return /(?:streaminghistory|endsong|history)/i.test(name);
}

export async function readZip(file: File): Promise<Record<string, Uint8Array>> {
  try {
    return unzipSync(new Uint8Array(await file.arrayBuffer()));
  } catch {
    throw new ZipHistoryError("El archivo no es un ZIP válido o está dañado.");
  }
}

export async function importSpotifyHistoryZip(file: File): Promise<ZipImportResult> {
  const archive = await readZip(file);

  const jsonEntries = Object.entries(archive).filter(([name]) => name.toLowerCase().endsWith(".json"));
  const historyEntries = jsonEntries.filter(([name]) => isHistoryFile(name));
  if (historyEntries.length === 0) {
    throw new ZipHistoryError("El ZIP no contiene archivos JSON de historial de Spotify.");
  }

  const events: NormalizedListeningEvent[] = [];
  const errors: string[] = [];
  let discarded = 0;

  for (const [name, bytes] of historyEntries) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(strFromU8(bytes)) as unknown;
    } catch {
      errors.push(`${name}: JSON no válido.`);
      continue;
    }

    if (!Array.isArray(parsed)) {
      errors.push(`${name}: se esperaba una lista de registros.`);
      continue;
    }

    for (const item of parsed) {
      if (!isRecord(item)) {
        discarded += 1;
        continue;
      }
      const event = normalizeRecord(item);
      if (event) events.push(event);
      else discarded += 1;
    }
  }

  return {
    events,
    report: {
      filesFound: jsonEntries.length,
      filesProcessed: historyEntries.length,
      filesIgnored: jsonEntries.length - historyEntries.length,
      imported: events.length,
      discarded,
      errors,
    },
  };
}
