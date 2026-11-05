import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Music } from "lucide-react";
import type { PlatformTotals, TimeBucket, TimeGranularity } from "@/domain/types";
import type { DataSource, SpotifyAffinityTrack, SpotifyTimeRange } from "@/domain/sources";
import { aggregateSeries } from "@/engine/timeseries";
import { formatDuration, formatNumber } from "@/lib/format";
import { PageHeader } from "@/ui/PageHeader";
import { Card, CardTitle } from "@/ui/Card";
import { chartColors } from "@/ui/chartTheme";
import { SegmentedControl, type SegmentedOption } from "@/ui/SegmentedControl";
import { EvolutionChart, type ChartDatum } from "./EvolutionChart";
import { useEvolutionSeries } from "./useEvolutionSeries";
import { useMusicData } from "@/app/MusicDataProvider";
import { EmptyState } from "@/ui/EmptyState";
import { platforms, type Platform } from "@/domain/history";
import { PlatformLegend, SourceBadge } from "@/ui/platform";

const granularityOptions: SegmentedOption<TimeGranularity>[] = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

const unitNoun: Record<TimeGranularity, string> = { day: "día", week: "semana", month: "mes" };
const rangeLabels: Record<SpotifyTimeRange, string> = {
  short_term: "Corto plazo",
  medium_term: "Medio plazo",
  long_term: "Largo plazo",
};
const comparisonColors = ["#ff5c39", "#9b8cff", "#ffc857", "#6dd6c0", "#b9b3d6", "#7c6bff", "#ff8f70", "#c5bfff", "#e7ad45", "#85e0d0"];
const genreColors = ["#ff5c39", "#9b8cff", "#ffc857", "#6dd6c0", "#b9b3d6", "#7c6bff"];

function ApiEvolution({ onRetry }: { onRetry: () => void }) {
  const { apiData } = useMusicData();

  if (!apiData) {
    return (
      <EmptyState
        icon={Music}
        title="Consultando Spotify"
        description="Estamos obteniendo tus rankings y actividad reciente."
        action={<button className="rounded-xl bg-ink-700 px-4 py-2 text-sm font-medium hover:bg-ink-600" onClick={onRetry}>Reintentar</button>}
      />
    );
  }

  const artistComparison = useMemo(() => buildComparisonData(apiData.affinityArtists, (item) => item.item.name, 5), [apiData.affinityArtists]);
  const trackComparison = useMemo(() => buildComparisonData(apiData.affinityTracks, (item) => item.item.name), [apiData.affinityTracks]);
  const activityByDay = useMemo(() => groupRecent(apiData.recentlyPlayed, "day"), [apiData.recentlyPlayed]);
  const activityByHour = useMemo(() => groupRecent(apiData.recentlyPlayed, "hour"), [apiData.recentlyPlayed]);
  const genres = useMemo(() => buildGenreData(apiData.affinityArtists.medium_term), [apiData.affinityArtists.medium_term]);
  const highlights = useMemo(() => buildHighlights(apiData.affinityArtists), [apiData.affinityArtists]);

  return (
    <div className="space-y-6">
      <Card>
        <CardTitle>Resumen de tendencias</CardTitle>
        <p className="mt-1 text-sm text-fog-400">La API de Spotify ofrece afinidad por periodos y una ventana limitada de actividad reciente, no un historial completo.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <TrendStat label="Artistas comparados" value={String(artistComparison.series.length)} />
          <TrendStat label="Canciones comparadas" value={String(trackComparison.series.length)} />
          <TrendStat label="Eventos recientes recibidos" value={formatNumber(apiData.recentlyPlayed.length)} />
        </div>
      </Card>

      <Card>
        <CardTitle>Comparativa de Top Artists</CardTitle>
        <p className="mt-1 text-xs text-fog-500">Top 5 de la unión de los tres rankings. Cada línea representa un artista y su posición en cada periodo; la ausencia indica que Spotify no lo devolvió.</p>
        <ComparisonChart comparison={artistComparison} />
      </Card>

      <Card>
        <CardTitle>Comparativa de Top Tracks</CardTitle>
        <p className="mt-1 text-xs text-fog-500">Posiciones de afinidad de Spotify, no cantidades de reproducciones. Las ausencias se muestran como —.</p>
        <TrackComparisonTable ranges={apiData.affinityTracks} />
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Actividad reciente por día</CardTitle>
          <p className="mt-1 text-xs text-fog-500">Eventos incluidos en la respuesta limitada de Spotify Recently Played; no representa el historial completo de escucha.</p>
          <DailyActivity data={activityByDay} />
        </Card>
        <Card>
          <CardTitle>Actividad reciente por hora</CardTitle>
          <p className="mt-1 text-xs text-fog-500">Distribución horaria de esos mismos eventos recientes; no representa hábitos generales o históricos.</p>
          <ActivityChart data={activityByHour} label="Eventos" />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Distribución aproximada de géneros</CardTitle>
          <p className="mt-1 text-xs text-fog-500">Basada en géneros asociados a los artistas del Top Artists de medio plazo; no son minutos ni reproducciones por género.</p>
          {genres.length ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={genres} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
                    {genres.map((genre, index) => <Cell key={genre.name} fill={genreColors[index % genreColors.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: unknown) => [`${value ?? "—"} artistas`, "Asociación"]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="mt-5 text-sm text-fog-400">No hay géneros disponibles para este ranking.</p>}
        </Card>

        <Card>
          <CardTitle>Artistas destacados recientemente</CardTitle>
          <p className="mt-1 text-xs text-fog-500">Comparación de presencia entre corto y largo plazo; no representa primeras escuchas.</p>
          <div className="mt-4 space-y-3">
            <HighlightGroup title="Destacados recientes" items={highlights.shortOnly} empty="Ninguno exclusivo del corto plazo." />
            <HighlightGroup title="Favoritos a largo plazo" items={highlights.longOnly} empty="Ninguno exclusivo del largo plazo." />
            <HighlightGroup title="Presentes en ambos periodos" items={highlights.both} empty="No hay coincidencias." />
          </div>
        </Card>
      </div>
    </div>
  );
}

function TrendStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl bg-ink-800 p-4"><p className="text-xs text-fog-500">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{value}</p></div>;
}

type ComparisonItem = { period: string; [id: string]: string | number | null };
type ComparisonSeries = { id: string; name: string };
type ComparisonData = { data: ComparisonItem[]; series: ComparisonSeries[] };

function buildComparisonData<T extends { rank: number; item: { id: string; name: string } }>(
  ranges: Record<SpotifyTimeRange, T[]>,
  name = (item: T) => item.item.name,
  limit = 10,
): ComparisonData {
  const entries = new Map<string, { name: string; ranks: Partial<Record<SpotifyTimeRange, number>>; bestRank: number }>();
  for (const range of Object.keys(ranges) as SpotifyTimeRange[]) {
    for (const item of ranges[range]) {
      const key = item.item.id;
      const current = entries.get(key) ?? { name: name(item), ranks: {}, bestRank: Number.POSITIVE_INFINITY };
      current.ranks[range] = item.rank;
      current.bestRank = Math.min(current.bestRank, item.rank);
      entries.set(key, current);
    }
  }
  const series = [...entries.entries()]
    .sort(([, a], [, b]) => a.bestRank - b.bestRank)
    .slice(0, limit)
    .map(([id, entry]) => ({ id, name: entry.name }));
  const selectedIds = new Set(series.map((entry) => entry.id));
  const data = (["long_term", "medium_term", "short_term"] as SpotifyTimeRange[]).map((range) => {
    const point: ComparisonItem = { period: rangeLabels[range] };
    for (const [id, entry] of entries) {
      if (selectedIds.has(id)) point[id] = entry.ranks[range] ?? null;
    }
    return point;
  });
  return { data, series };
}

function ComparisonChart({ comparison }: { comparison: ComparisonData }) {
  if (!comparison.series.length) return <p className="mt-5 text-sm text-fog-400">No hay resultados suficientes para comparar.</p>;
  return (
    <div className="mt-4 h-80 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={comparison.data} margin={{ top: 8, right: 12, bottom: 8, left: 0 }}>
          <CartesianGrid vertical={false} stroke={chartColors.grid} />
          <XAxis dataKey="period" tick={{ fill: chartColors.tick, fontSize: 11 }} />
          <YAxis reversed domain={[1, "dataMax"]} allowDecimals={false} tick={{ fill: chartColors.tick, fontSize: 12 }} />
          <Tooltip labelFormatter={(label) => `Periodo: ${String(label)}`} formatter={(value: unknown, name) => value === undefined || value === null ? ["Ausente", String(name ?? "Posición")] : [`#${value}`, String(name ?? "Posición")]} />
          <Legend />
          {comparison.series.map((entry, index) => <Line key={entry.id} type="monotone" dataKey={entry.id} name={entry.name} stroke={comparisonColors[index % comparisonColors.length]} strokeWidth={2} connectNulls={false} dot={{ r: 3 }} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

type TrackRow = {
  id: string;
  name: string;
  artistName: string;
  ranks: Partial<Record<SpotifyTimeRange, number>>;
};

function TrackComparisonTable({ ranges }: { ranges: Record<SpotifyTimeRange, SpotifyAffinityTrack[]> }) {
  const [sortRange, setSortRange] = useState<SpotifyTimeRange>("short_term");
  const rows = useMemo(() => {
    const entries = new Map<string, TrackRow>();
    for (const range of ["long_term", "medium_term", "short_term"] as SpotifyTimeRange[]) {
      for (const entry of ranges[range]) {
        const row = entries.get(entry.item.id) ?? {
          id: entry.item.id,
          name: entry.item.name,
          artistName: entry.artistName,
          ranks: {},
        };
        row.ranks[range] = entry.rank;
        entries.set(entry.item.id, row);
      }
    }
    return [...entries.values()]
      .sort((a, b) => (a.ranks[sortRange] ?? Number.POSITIVE_INFINITY) - (b.ranks[sortRange] ?? Number.POSITIVE_INFINITY))
      .slice(0, 10);
  }, [ranges, sortRange]);

  if (!rows.length) return <p className="mt-5 text-sm text-fog-400">No hay canciones disponibles para comparar.</p>;
  return (
    <div className="mt-4 min-w-0 overflow-x-auto">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="border-b border-ink-700 text-xs text-fog-500">
          <tr>
            <th className="px-3 py-3 font-medium">Canción</th>
            <th className="px-3 py-3 font-medium">Artista</th>
            {(["long_term", "medium_term", "short_term"] as SpotifyTimeRange[]).map((range) => (
              <th key={range} className="px-3 py-3 font-medium">
                <button className="rounded-md px-1 py-1 text-left hover:bg-ink-800" title="Ordenar por posición de afinidad de Spotify" onClick={() => setSortRange(range)}>
                  {rangeLabels[range]} {sortRange === range ? "↑" : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-ink-800 last:border-0">
              <td className="max-w-[220px] truncate px-3 py-3 font-medium text-fog-100" title={row.name}>{row.name}</td>
              <td className="max-w-[180px] truncate px-3 py-3 text-fog-400" title={row.artistName}>{row.artistName}</td>
              {(["long_term", "medium_term", "short_term"] as SpotifyTimeRange[]).map((range) => (
                <td key={range} className="px-3 py-3 tabular-nums text-fog-300">{row.ranks[range] === undefined ? "—" : `#${row.ranks[range]}`}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ActivityPoint = { key: string; name: string; value: number };

function groupRecent(events: { playedAt: string }[], by: "day" | "hour"): ActivityPoint[] {
  const groups = new Map<string, ActivityPoint>();
  for (const event of events) {
    const date = new Date(event.playedAt);
    if (Number.isNaN(date.getTime())) continue;
    const key = by === "day"
      ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
      : String(date.getHours()).padStart(2, "0");
    const name = by === "day"
      ? date.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
      : `${key}:00`;
    const current = groups.get(key) ?? { key, name, value: 0 };
    current.value += 1;
    groups.set(key, current);
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

function DailyActivity({ data }: { data: ActivityPoint[] }) {
  if (!data.length) return <p className="mt-5 text-sm text-fog-400">Spotify no devolvió eventos recientes.</p>;
  if (data.length === 1) {
    return <div className="mt-4 rounded-xl bg-ink-800 p-4"><p className="text-2xl font-semibold tabular-nums">{data[0].value}</p><p className="mt-1 text-sm text-fog-400">eventos devueltos el {data[0].name}. La respuesta disponible solo cubre ese día.</p></div>;
  }
  return <ActivityChart data={data} label="Eventos devueltos" />;
}

function ActivityChart({ data, label }: { data: ActivityPoint[]; label: string }) {
  if (!data.length) return <p className="mt-5 text-sm text-fog-400">No hay actividad reciente disponible.</p>;
  return <div className="mt-4 h-56 min-w-0"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid vertical={false} stroke={chartColors.grid} /><XAxis dataKey="name" tick={{ fill: chartColors.tick, fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fill: chartColors.tick, fontSize: 12 }} /><Tooltip formatter={(value: unknown) => [String(value ?? "—"), label]} /><Bar dataKey="value" fill={chartColors.plays} radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}

function buildGenreData(artists: { item: { genres: string[] } }[]) {
  const counts = new Map<string, number>();
  for (const artist of artists) for (const genre of new Set(artist.item.genres)) counts.set(genre, (counts.get(genre) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
}

function buildHighlights(artists: Record<SpotifyTimeRange, { item: { id: string; name: string } }[]>) {
  const short = new Map(artists.short_term.map((entry) => [entry.item.id, entry.item.name]));
  const long = new Map(artists.long_term.map((entry) => [entry.item.id, entry.item.name]));
  return {
    shortOnly: [...short].filter(([id]) => !long.has(id)).map(([, name]) => name).slice(0, 5),
    longOnly: [...long].filter(([id]) => !short.has(id)).map(([, name]) => name).slice(0, 5),
    both: [...short].filter(([id]) => long.has(id)).map(([, name]) => name).slice(0, 5),
  };
}

function HighlightGroup({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return <div><p className="text-sm font-medium text-fog-100">{title}</p>{items.length ? <ul className="mt-1 flex flex-wrap gap-2">{items.map((item) => <li key={item} className="rounded-full bg-ink-800 px-3 py-1 text-xs text-fog-300">{item}</li>)}</ul> : <p className="mt-1 text-xs text-fog-500">{empty}</p>}</div>;
}

/** Valores de cada plataforma para las áreas apiladas. */
function perPlatform(bucket: TimeBucket, pick: (totals: PlatformTotals) => number): Partial<Record<Platform, number>> {
  return Object.fromEntries(platforms.map((platform) => [platform, pick(bucket.byPlatform?.[platform] ?? { minutes: 0, plays: 0 })]));
}

/** Con una sola plataforma, el gráfico usa su color; en demo se mantienen los colores por métrica. */
function singleColor(source: DataSource, fallback: string) {
  if (source === "spotify-zip") return chartColors.spotify;
  if (source === "ytmusic-zip") return chartColors.ytmusic;
  return fallback;
}

export function EvolutionPage() {
  const { source, sourceInfo, apiError, isLoadingApi } = useMusicData();
  const series = useEvolutionSeries();
  const [granularity, setGranularity] = useState<TimeGranularity>("week");
  const buckets = useMemo(() => (series ? aggregateSeries(series, granularity) : []), [series, granularity]);
  const isCombined = source === "combined";
  const timeData: ChartDatum[] = useMemo(
    () => buckets.map((bucket) => ({ ...bucket, value: bucket.minutes / 60, ...perPlatform(bucket, (totals) => totals.minutes / 60) })),
    [buckets],
  );
  const playsData: ChartDatum[] = useMemo(
    () => buckets.map((bucket) => ({ ...bucket, value: bucket.plays, ...perPlatform(bucket, (totals) => totals.plays) })),
    [buckets],
  );
  const stacks = isCombined ? platforms : undefined;

  if (source === "spotify-api") {
    if (isLoadingApi) return <><PageHeader title="Evolución" description="Panel de análisis con datos actuales de Spotify." actions={<SourceBadge source={source} label={sourceInfo.label} />} /><EmptyState icon={Music} title="Cargando análisis" description="Consultando los tres periodos de afinidad y tu actividad reciente." /></>;
    if (apiError) return <><PageHeader title="Evolución" description="Panel de análisis con datos actuales de Spotify." actions={<SourceBadge source={source} label={sourceInfo.label} />} /><EmptyState icon={Music} title="No se pudo cargar Evolución" description={apiError} /></>;
    return <><PageHeader title="Evolución" description="Comparativas de afinidad y actividad reciente disponible en Spotify." actions={<SourceBadge source={source} label={sourceInfo.label} />} /><ApiEvolution onRetry={() => window.location.reload()} /></>;
  }

  if (source === "ytmusic-api") {
    return (
      <>
        <PageHeader title="Evolución" description="Google no proporciona el historial de reproducciones por API." actions={<SourceBadge source={source} label={sourceInfo.label} />} />
        <EmptyState icon={Music} title="Historial no disponible con la cuenta conectada" description="Importa tu historial de YouTube Music desde Google Takeout en Ajustes para ver la evolución temporal." />
      </>
    );
  }

  if (!series) return <><PageHeader title="Evolución" description="Spotify no proporciona el historial completo de reproducciones." actions={<SourceBadge source={source} label={sourceInfo.label} />} /><EmptyState icon={Music} title="Historial no disponible en esta fuente" description="Importa el ZIP Extended Streaming History para calcular la evolución temporal." /></>;
  const noun = unitNoun[granularity];
  return (
    <>
      <PageHeader title="Evolución" description="Cómo ha cambiado tu escucha a lo largo de los últimos 12 meses." actions={<SourceBadge source={source} label={sourceInfo.label} />} />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SegmentedControl label="Agrupar por" options={granularityOptions} value={granularity} onChange={setGranularity} />
        {isCombined && <PlatformLegend />}
      </div>
      <div className="space-y-6">
        <Card><CardTitle>{`Tiempo escuchado por ${noun}`}</CardTitle><div className="mt-4"><EvolutionChart data={timeData} color={singleColor(source, chartColors.time)} stacks={stacks} formatTick={(value) => `${Number(value.toFixed(1))} h`} formatTooltipValue={(datum) => formatDuration(datum.minutes)} /></div></Card>
        <Card><CardTitle>{`Reproducciones por ${noun}`}</CardTitle><div className="mt-4"><EvolutionChart data={playsData} color={singleColor(source, chartColors.plays)} stacks={stacks} formatTick={formatNumber} formatTooltipValue={(datum) => `${formatNumber(datum.plays)} reproducciones`} /></div></Card>
      </div>
    </>
  );
}
