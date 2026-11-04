const numberFormat = new Intl.NumberFormat("es-ES");
const dateFormat = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export const formatNumber = (value: number) => numberFormat.format(value);
export const formatHours = (minutes: number) => `${numberFormat.format(Math.round(minutes / 60))} h`;
export const formatMinutes = (minutes: number) => `${numberFormat.format(Math.round(minutes))} min`;
export const formatPercent = (share: number) => `${Math.round(share * 100)} %`;
/** Recibe una fecha ISO (AAAA-MM-DD). */
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

/** Minutos como «45 min», «52 h» o «3 h 20 min». */
export function formatDuration(minutes: number) {
  const total = Math.round(minutes);
  if (total < 60) return `${total} min`;
  const rest = total % 60;
  return `${numberFormat.format(Math.floor(total / 60))} h${rest ? ` ${rest} min` : ""}`;
}
