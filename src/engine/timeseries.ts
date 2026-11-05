import type { ListeningPoint, PlatformBreakdown, TimeBucket, TimeGranularity } from "@/domain/types";
import type { Platform } from "@/domain/history";

// Función pura: agrupa una serie diaria. Todas las fechas se tratan en UTC para evitar desfases horarios.
const DAY_MS = 86_400_000;
const utcFormat = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-ES", { timeZone: "UTC", ...options });
const dayShort = utcFormat({ day: "numeric", month: "short" });
const dayLong = utcFormat({ day: "numeric", month: "long", year: "numeric" });
const monthShort = utcFormat({ month: "short", year: "2-digit" });
const monthLong = utcFormat({ month: "long", year: "numeric" });

const parse = (iso: string) => new Date(`${iso}T00:00:00Z`);
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

function startOf(iso: string, granularity: TimeGranularity) {
  const date = parse(iso);
  if (granularity === "week") return new Date(date.getTime() - ((date.getUTCDay() + 6) % 7) * DAY_MS);
  if (granularity === "month") return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  return date;
}

function expectedDays(start: Date, granularity: TimeGranularity) {
  if (granularity === "week") return 7;
  if (granularity === "month") return new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  return 1;
}

function labelsFor(start: Date, granularity: TimeGranularity) {
  if (granularity === "week") return { label: dayShort.format(start), fullLabel: `Semana del ${dayLong.format(start)}` };
  if (granularity === "month") return { label: monthShort.format(start), fullLabel: capitalize(monthLong.format(start)) };
  return { label: dayShort.format(start), fullLabel: dayLong.format(start) };
}

/** Suma dos repartos por plataforma sin mutar `addition`. */
function mergeBreakdown(base: PlatformBreakdown | undefined, addition: PlatformBreakdown): PlatformBreakdown {
  const result: PlatformBreakdown = { ...base };
  for (const platform of Object.keys(addition) as Platform[]) {
    const current = result[platform];
    const extra = addition[platform]!;
    result[platform] = { minutes: (current?.minutes ?? 0) + extra.minutes, plays: (current?.plays ?? 0) + extra.plays };
  }
  return result;
}

/** Agrupa puntos diarios (ordenados por fecha) por día, semana (lunes) o mes. */
export function aggregateSeries(points: ListeningPoint[], granularity: TimeGranularity): TimeBucket[] {
  const buckets = new Map<string, TimeBucket>();

  for (const point of points) {
    const start = startOf(point.date, granularity);
    const key = start.toISOString().slice(0, 10);
    const existing = buckets.get(key);
    if (existing) {
      existing.minutes += point.minutes;
      existing.plays += point.plays;
      existing.days += 1;
      if (point.byPlatform) existing.byPlatform = mergeBreakdown(existing.byPlatform, point.byPlatform);
    } else {
      buckets.set(key, {
        key,
        ...labelsFor(start, granularity),
        minutes: point.minutes,
        plays: point.plays,
        days: 1,
        isPartial: false,
        byPlatform: point.byPlatform && mergeBreakdown(undefined, point.byPlatform),
      });
    }
  }

  return [...buckets.values()].map((bucket) => ({
    ...bucket,
    isPartial: bucket.days < expectedDays(parse(bucket.key), granularity),
  }));
}
