import { strFromU8 } from "fflate";
import type { NormalizedListeningEvent } from "@/domain/history";
import { isRecord, nonEmptyString, readZip, ZipHistoryError, type ZipImportResult } from "@/data/spotify/zipHistory";

/** Takeout no exporta la duración escuchada; se usa una duración media de canción. */
export const ESTIMATED_TRACK_MS = 210_000;

// Prefijos que Google añade al título según el idioma de la cuenta.
const TITLE_PREFIX = /^(?:watched|listened to|has visto|ha visto|viste|has escuchado|escuchaste)\s+/i;
// Canales autogenerados de artista: «Artista - Topic» / «Artista - Tema».
const TOPIC_SUFFIX = /\s+-\s+(?:topic|tema)$/i;

function videoId(url: string | undefined) {
  if (!url) return undefined;
  try {
    return new URL(url).searchParams.get("v") ?? undefined;
  } catch {
    return undefined;
  }
}

function isYouTubeMusicRecord(record: Record<string, unknown>) {
  return record.header === "YouTube Music" || nonEmptyString(record.titleUrl)?.includes("music.youtube.com") === true;
}

function normalizeRecord(record: Record<string, unknown>): NormalizedListeningEvent | undefined {
  const playedAt = nonEmptyString(record.time);
  const trackName = nonEmptyString(record.title)?.replace(TITLE_PREFIX, "").trim();
  const subtitles = Array.isArray(record.subtitles) ? record.subtitles : [];
  const artistName = nonEmptyString(isRecord(subtitles[0]) ? subtitles[0].name : undefined)?.replace(TOPIC_SUFFIX, "").trim();

  if (!playedAt || Number.isNaN(Date.parse(playedAt)) || !trackName || !artistName) return undefined;

  return {
    platform: "ytmusic",
    playedAt: new Date(playedAt).toISOString(),
    trackId: `yt:${videoId(nonEmptyString(record.titleUrl)) ?? `${artistName}\u0000${trackName}`.toLocaleLowerCase()}`,
    trackName,
    artistName,
    durationMs: ESTIMATED_TRACK_MS,
    durationEstimated: true,
  };
}

function isHistoryFile(name: string) {
  return /(?:watch-history|historial[\s_-]*de[\s_-]*reproducciones)/i.test(name);
}

/** Importa el historial de YouTube Music desde un ZIP de Google Takeout o desde el JSON suelto. */
export async function importYouTubeMusicTakeout(file: File): Promise<ZipImportResult> {
  let entries: [string, string][];
  let filesFound: number;

  if (file.name.toLowerCase().endsWith(".json")) {
    entries = [[file.name, await file.text()]];
    filesFound = 1;
  } else {
    const archive = await readZip(file);
    const names = Object.keys(archive);
    const jsonNames = names.filter((name) => name.toLowerCase().endsWith(".json"));
    const historyNames = jsonNames.filter(isHistoryFile);
    if (!historyNames.length) {
      const hasHtml = names.some((name) => isHistoryFile(name) && name.toLowerCase().endsWith(".html"));
      throw new ZipHistoryError(
        hasHtml
          ? "El historial está en formato HTML. Vuelve a exportarlo en Google Takeout eligiendo el formato JSON para el historial de YouTube."
          : "El ZIP no contiene el historial de reproducciones de YouTube (watch-history.json).",
      );
    }
    entries = historyNames.map((name) => [name, strFromU8(archive[name]!)]);
    filesFound = jsonNames.length;
  }

  const events: NormalizedListeningEvent[] = [];
  const errors: string[] = [];
  let discarded = 0;

  for (const [name, text] of entries) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      errors.push(`${name}: JSON no válido.`);
      continue;
    }
    if (!Array.isArray(parsed)) {
      errors.push(`${name}: se esperaba una lista de registros.`);
      continue;
    }
    for (const item of parsed) {
      // Los vídeos normales de YouTube no cuentan como escuchas ni como descartes.
      if (!isRecord(item) || !isYouTubeMusicRecord(item)) continue;
      const event = normalizeRecord(item);
      if (event) events.push(event);
      else discarded += 1;
    }
  }

  if (!events.length && !errors.length) {
    throw new ZipHistoryError("El historial no contiene reproducciones de YouTube Music.");
  }

  return {
    events,
    report: {
      filesFound,
      filesProcessed: entries.length,
      filesIgnored: filesFound - entries.length,
      imported: events.length,
      discarded,
      errors,
    },
  };
}
