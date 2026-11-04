import type { ListeningPoint } from "@/domain/types";
import { mockSummary } from "./summary";

// Serie diaria ficticia y reproducible: 1 nov 2025 – 31 oct 2026 (12 meses completos).
// Sus totales coinciden con los del resumen del Dashboard.
const DAYS = 365;
const DAY_MS = 86_400_000;
const START = Date.UTC(2025, 10, 1);

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Reescala valores a enteros cuya suma es exactamente `total`. */
function scaleToTotal(values: number[], total: number) {
  const sum = values.reduce((acc, v) => acc + v, 0);
  const scaled = values.map((v) => Math.round((v * total) / sum));
  scaled[scaled.length - 1] += total - scaled.reduce((acc, v) => acc + v, 0);
  return scaled;
}

const random = mulberry32(2026);
const dates = Array.from({ length: DAYS }, (_, i) => new Date(START + i * DAY_MS).toISOString().slice(0, 10));

const rawMinutes = dates.map((date, i) => {
  const weekday = new Date(date).getUTCDay();
  const weekend = weekday === 0 || weekday === 6 ? 1.25 : 1;
  const trend = 1 + 0.25 * Math.sin((2 * Math.PI * i) / DAYS - 1);
  return weekend * trend * (0.55 + random() * 0.9);
});
const rawPlays = rawMinutes.map((minutes) => minutes / (2.8 + random() * 1.2));

const minutes = scaleToTotal(rawMinutes, mockSummary.totalMinutes);
const plays = scaleToTotal(rawPlays, mockSummary.totalPlays);

export const mockDailySeries: ListeningPoint[] = dates.map((date, i) => ({ date, minutes: minutes[i], plays: plays[i] }));
