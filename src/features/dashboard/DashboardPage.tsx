import { Clock, Mic, Music, Play } from "lucide-react";
import { PageHeader } from "@/ui/PageHeader";
import { Badge } from "@/ui/Badge";
import { Card, CardTitle } from "@/ui/Card";
import { DonutChart } from "@/ui/DonutChart";
import { StatCard } from "@/ui/StatCard";
import { formatDate, formatHours, formatMinutes, formatNumber, formatPercent } from "@/lib/format";
import { Podium } from "./Podium";
import { RankedRow } from "./RankedRow";
import { useDashboardSummary } from "./useDashboardSummary";
import { useMusicData } from "@/app/MusicDataProvider";
import { EmptyState } from "@/ui/EmptyState";
import type { SpotifyApiData } from "@/domain/types";

function SpotifyDashboard({ data }: { data: SpotifyApiData }) {
  const mediumTermArtists = data.affinityArtists.medium_term;
  const mediumTermTracks = data.affinityTracks.medium_term;
  const podiumEntries = mediumTermArtists.slice(0, 3).map(({ item, rank, timeRange }) => ({
    kind: "affinity" as const,
    artist: item,
    rank,
    timeRange,
  }));

  return (
    <>
      <PageHeader title="Inicio" description="Datos disponibles directamente desde Spotify." actions={<Badge variant="iris">Spotify Web API</Badge>} />
      <Podium entries={podiumEntries} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Afinidad de artistas</CardTitle>
          <p className="mt-1 text-xs text-fog-500">Ranking de afinidad de Spotify, no reproducciones exactas.</p>
          <ol className="mt-3 divide-y divide-ink-700">
            {mediumTermArtists.slice(0, 8).map(({ item, rank }) => (
              <RankedRow key={item.id} rank={rank} name={item.name} subtitle={item.genres[0] ?? "Sin género"} value={`#${rank}`} />
            ))}
          </ol>
        </Card>
        <Card>
          <CardTitle>Afinidad de canciones</CardTitle>
          <p className="mt-1 text-xs text-fog-500">Ranking de afinidad de Spotify, no reproducciones exactas.</p>
          <ol className="mt-3 divide-y divide-ink-700">
            {mediumTermTracks.slice(0, 8).map(({ item, artistName, rank }) => (
              <RankedRow key={item.id} rank={rank} name={item.name} subtitle={artistName} value={`#${rank}`} />
            ))}
          </ol>
        </Card>
      </div>
      <Card className="mt-6">
        <CardTitle>Actividad reciente</CardTitle>
        <p className="mt-1 text-xs text-fog-500">Solo los eventos recientes devueltos por Spotify; no es tu historial completo.</p>
        {data.recentlyPlayed.length ? (
          <ol className="mt-3 divide-y divide-ink-700">
            {data.recentlyPlayed.slice(0, 8).map(({ track, artistName, playedAt }, index) => (
              <RankedRow key={`${track.id}-${playedAt}`} rank={index + 1} name={track.name} subtitle={artistName} value={new Date(playedAt).toLocaleString("es-ES")} />
            ))}
          </ol>
        ) : <p className="mt-4 text-sm text-fog-400">Spotify no ha devuelto reproducciones recientes.</p>}
      </Card>
    </>
  );
}

export function DashboardPage() {
  const { source, sourceInfo, apiData, apiError, isLoadingApi } = useMusicData();
  const summary = useDashboardSummary();
  if (source === "spotify-api") {
    if (apiData) return <SpotifyDashboard data={apiData} />;
    if (apiError) {
      return (
        <>
          <PageHeader title="Inicio" description="Datos disponibles directamente desde Spotify." actions={<Badge variant="iris">Spotify Web API</Badge>} />
          <EmptyState icon={Music} title="No se pudo cargar Spotify" description={apiError} />
        </>
      );
    }
    return (
      <>
        <PageHeader title="Inicio" description="Datos disponibles directamente desde Spotify." actions={<Badge variant="iris">Spotify Web API</Badge>} />
        <EmptyState icon={Music} title={isLoadingApi ? "Consultando Spotify" : "Sin datos disponibles"} description={isLoadingApi ? "Estamos obteniendo tu afinidad y actividad reciente." : "Spotify no ha devuelto datos para esta fuente."} />
      </>
    );
  }
  if (!summary) return <EmptyState icon={Music} title="Sin datos" description="No hay estadísticas históricas disponibles." />;
  const dominantGenre = [...summary.genres].sort((a, b) => b.share - a.share)[0];

  return (
    <>
      <PageHeader
        title="Inicio"
        description={`Tu actividad musical: ${summary.periodLabel.toLowerCase()}.`}
        actions={<Badge variant={source === "spotify-zip" ? "accent" : "iris"}>{sourceInfo.label}</Badge>}
      />

      <Podium entries={summary.topArtists.slice(0, 3)} />

      <section aria-label="Resumen" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Clock} label="Tiempo escuchado" value={formatHours(summary.totalMinutes)} />
        <StatCard icon={Play} label="Reproducciones" value={formatNumber(summary.totalPlays)} />
        <StatCard icon={Mic} label="Artistas distintos" value={formatNumber(summary.distinctArtists)} />
        <StatCard icon={Music} label="Canciones distintas" value={formatNumber(summary.distinctTracks)} />
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Artistas más escuchados</CardTitle>
          <ol className="mt-3 divide-y divide-ink-700">
            {summary.topArtists.map(({ artist, minutes }, index) => (
              <RankedRow
                key={artist.id}
                rank={index + 1}
                name={artist.name}
                subtitle={artist.genres[0] ?? "Sin género"}
                value={formatMinutes(minutes)}
              />
            ))}
          </ol>
        </Card>

        <Card>
          <CardTitle>Canciones más escuchadas</CardTitle>
          <ol className="mt-3 divide-y divide-ink-700">
            {summary.topTracks.map(({ track, artistName, minutes }, index) => (
              <RankedRow
                key={track.id}
                rank={index + 1}
                name={track.name}
                subtitle={artistName}
                value={formatMinutes(minutes)}
              />
            ))}
          </ol>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Géneros</CardTitle>
          <DonutChart
            className="mt-4"
            segments={summary.genres.map(({ genre, share }) => ({ label: genre, value: share }))}
            centerValue={dominantGenre ? formatPercent(dominantGenre.share) : "—"}
            centerLabel={dominantGenre?.genre ?? "Sin datos"}
          />
        </Card>

        <Card>
          <CardTitle>Artistas nuevos</CardTitle>
          <p className="mt-1 text-xs text-fog-500">
            Según su primera escucha registrada en tu historial. No indica cuándo los descubriste realmente.
          </p>
          <ul className="mt-3 divide-y divide-ink-700">
            {summary.newArtists.map(({ artist, firstPlayedAt }) => (
              <RankedRow
                key={artist.id}
                name={artist.name}
                subtitle={artist.genres[0] ?? "Sin género"}
                value={formatDate(firstPlayedAt)}
              />
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
