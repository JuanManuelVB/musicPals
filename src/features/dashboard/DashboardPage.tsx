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
import type { ListeningSummary, SpotifyApiData, YouTubeMusicApiData } from "@/domain/types";
import { platformLabels, platforms } from "@/domain/history";
import { platformClasses, PlatformDot, PlatformLegend, PlatformSplitBar, SourceBadge } from "@/ui/platform";

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
      <PageHeader title="Inicio" description="Datos disponibles directamente desde Spotify." actions={<Badge variant="spotify">Spotify Web API</Badge>} />
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

function YouTubeDashboard({ data }: { data: YouTubeMusicApiData }) {
  const podiumEntries = data.likedArtists.slice(0, 3).map(({ artist, likedCount }, index) => ({
    kind: "affinity" as const,
    artist,
    rank: index + 1,
    timeRange: `${formatNumber(likedCount)} me gusta`,
  }));

  return (
    <>
      <PageHeader title="Inicio" description="Datos de tu cuenta de YouTube Music." actions={<Badge variant="ytmusic">{data.source.label}</Badge>} />
      <Podium entries={podiumEntries} />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Artistas con más «Me gusta»</CardTitle>
          <p className="mt-1 text-xs text-fog-500">Número de canciones que has marcado con «Me gusta», no reproducciones.</p>
          <ol className="mt-3 divide-y divide-ink-700">
            {data.likedArtists.slice(0, 8).map(({ artist, likedCount }, index) => (
              <RankedRow key={artist.id} rank={index + 1} name={artist.name} subtitle="YouTube Music" value={`${formatNumber(likedCount)} ♥`} />
            ))}
          </ol>
        </Card>
        <Card>
          <CardTitle>«Me gusta» recientes</CardTitle>
          <p className="mt-1 text-xs text-fog-500">Las últimas canciones que has marcado con «Me gusta».</p>
          {data.likedTracks.length ? (
            <ol className="mt-3 divide-y divide-ink-700">
              {data.likedTracks.slice(0, 8).map(({ track, artistName }, index) => (
                <RankedRow key={track.id} rank={index + 1} name={track.name} subtitle={artistName} value={track.durationMs ? formatMinutes(track.durationMs / 60_000) : "—"} />
              ))}
            </ol>
          ) : <p className="mt-4 text-sm text-fog-400">No hay canciones con «Me gusta» en tu cuenta.</p>}
        </Card>
      </div>
      <Card className="mt-6">
        <CardTitle>Tus listas</CardTitle>
        {data.playlists.length ? (
          <ul className="mt-3 divide-y divide-ink-700">
            {data.playlists.slice(0, 8).map((playlist) => (
              <RankedRow key={playlist.id} name={playlist.title} subtitle="Lista de reproducción" value={`${formatNumber(playlist.itemCount)} canciones`} />
            ))}
          </ul>
        ) : <p className="mt-4 text-sm text-fog-400">No tienes listas propias en esta cuenta.</p>}
      </Card>
    </>
  );
}

export function DashboardPage() {
  const { source, sourceInfo, apiData, youtubeData, apiError, isLoadingApi } = useMusicData();
  const summary = useDashboardSummary();
  if (source === "ytmusic-api") {
    if (youtubeData) return <YouTubeDashboard data={youtubeData} />;
    return (
      <>
        <PageHeader title="Inicio" description="Datos de tu cuenta de YouTube Music." actions={<Badge variant="ytmusic">{sourceInfo.label}</Badge>} />
        <EmptyState
          icon={Music}
          title={apiError ? "No se pudo cargar YouTube Music" : isLoadingApi ? "Consultando YouTube Music" : "Sin datos disponibles"}
          description={apiError ?? (isLoadingApi ? "Estamos obteniendo tus canciones con «Me gusta» y tus listas." : "YouTube no ha devuelto datos para esta cuenta.")}
        />
      </>
    );
  }
  if (source === "spotify-api") {
    if (apiData) return <SpotifyDashboard data={apiData} />;
    if (apiError) {
      return (
        <>
          <PageHeader title="Inicio" description="Datos disponibles directamente desde Spotify." actions={<Badge variant="spotify">Spotify Web API</Badge>} />
          <EmptyState icon={Music} title="No se pudo cargar Spotify" description={apiError} />
        </>
      );
    }
    return (
      <>
        <PageHeader title="Inicio" description="Datos disponibles directamente desde Spotify." actions={<Badge variant="spotify">Spotify Web API</Badge>} />
        <EmptyState icon={Music} title={isLoadingApi ? "Consultando Spotify" : "Sin datos disponibles"} description={isLoadingApi ? "Estamos obteniendo tu afinidad y actividad reciente." : "Spotify no ha devuelto datos para esta fuente."} />
      </>
    );
  }
  if (!summary) return <EmptyState icon={Music} title="Sin datos" description="No hay estadísticas históricas disponibles." />;
  const dominantGenre = [...summary.genres].sort((a, b) => b.share - a.share)[0];
  // En la vista combinada cada fila muestra cuánto viene de cada plataforma.
  const isCombined = source === "combined";

  return (
    <>
      <PageHeader
        title="Inicio"
        description={`Tu actividad musical: ${summary.periodLabel.toLowerCase()}.`}
        actions={<SourceBadge source={source} label={sourceInfo.label} />}
      />

      {source !== "demo" && sourceInfo.limitations.length > 0 && (
        <ul className="-mt-4 mb-6 space-y-1 text-xs text-fog-500">
          {sourceInfo.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
        </ul>
      )}

      <Podium entries={summary.topArtists.slice(0, 3)} />

      <section aria-label="Resumen" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Clock} label="Tiempo escuchado" value={formatHours(summary.totalMinutes)} />
        <StatCard icon={Play} label="Reproducciones" value={formatNumber(summary.totalPlays)} />
        <StatCard icon={Mic} label="Artistas distintos" value={formatNumber(summary.distinctArtists)} />
        <StatCard icon={Music} label="Canciones distintas" value={formatNumber(summary.distinctTracks)} />
      </section>

      {isCombined && summary.byPlatform && <PlatformShareCard summary={summary} />}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle>Artistas más escuchados</CardTitle>
          <ol className="mt-3 divide-y divide-ink-700">
            {summary.topArtists.map(({ artist, minutes, byPlatform }, index) => (
              <RankedRow
                key={artist.id}
                rank={index + 1}
                name={artist.name}
                subtitle={artist.genres[0] ?? "Sin género"}
                value={formatMinutes(minutes)}
                breakdown={isCombined ? byPlatform : undefined}
              />
            ))}
          </ol>
        </Card>

        <Card>
          <CardTitle>Canciones más escuchadas</CardTitle>
          <ol className="mt-3 divide-y divide-ink-700">
            {summary.topTracks.map(({ track, artistName, minutes, byPlatform }, index) => (
              <RankedRow
                key={track.id}
                rank={index + 1}
                name={track.name}
                subtitle={artistName}
                value={formatMinutes(minutes)}
                breakdown={isCombined ? byPlatform : undefined}
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

function PlatformShareCard({ summary }: { summary: ListeningSummary }) {
  const breakdown = summary.byPlatform ?? {};
  return (
    <Card className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CardTitle>Reparto por plataforma</CardTitle>
        <PlatformLegend />
      </div>
      <div className="mt-4 space-y-4">
        <div>
          <p className="mb-1.5 text-xs text-fog-500">Tiempo escuchado</p>
          <PlatformSplitBar className="h-3" breakdown={breakdown} metric="minutes" />
        </div>
        <div>
          <p className="mb-1.5 text-xs text-fog-500">Reproducciones</p>
          <PlatformSplitBar className="h-3" breakdown={breakdown} metric="plays" />
        </div>
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        {platforms.map((platform) => {
          const totals = breakdown[platform];
          return (
            <div key={platform} className="rounded-xl bg-ink-800 p-4">
              <dt className={`flex items-center gap-2 text-sm font-medium ${platformClasses[platform].text}`}>
                <PlatformDot platform={platform} />
                {platformLabels[platform]}
              </dt>
              <dd className="mt-2 text-sm text-fog-300">
                <span className="font-semibold tabular-nums text-fog-100">{formatHours(totals?.minutes ?? 0)}</span> ·{" "}
                {formatNumber(totals?.plays ?? 0)} reproducciones ·{" "}
                {formatPercent(summary.totalPlays ? (totals?.plays ?? 0) / summary.totalPlays : 0)}
              </dd>
            </div>
          );
        })}
      </dl>
    </Card>
  );
}
