import { useMemo, useState } from "react";
import { Music } from "lucide-react";
import { PageHeader } from "@/ui/PageHeader";
import { Badge } from "@/ui/Badge";
import { Card, CardTitle } from "@/ui/Card";
import { SegmentedControl, type SegmentedOption } from "@/ui/SegmentedControl";
import { RankingRow } from "./RankingRow";
import { sortRanking, toRankingItems, type RankingCategory, type RankingSort } from "./rankingItems";
import { useMusicLibrary } from "./useMusicLibrary";
import { useMusicData } from "@/app/MusicDataProvider";
import { EmptyState } from "@/ui/EmptyState";
import { AffinityRankingRow } from "./AffinityRankingRow";
import type { SpotifyTimeRange } from "@/domain/sources";

const categoryOptions: SegmentedOption<RankingCategory>[] = [
  { value: "artists", label: "Artistas" },
  { value: "tracks", label: "Canciones" },
  { value: "albums", label: "Álbumes" },
];

const sortOptions: SegmentedOption<RankingSort>[] = [
  { value: "plays", label: "Reproducciones" },
  { value: "minutes", label: "Tiempo" },
];

const timeRangeOptions: SegmentedOption<SpotifyTimeRange>[] = [
  { value: "short_term", label: "Corto plazo" },
  { value: "medium_term", label: "Medio plazo" },
  { value: "long_term", label: "Largo plazo" },
];

export function RankingsPage() {
  const { source, sourceInfo, apiData, apiError, isLoadingApi } = useMusicData();
  const library = useMusicLibrary();
  const [category, setCategory] = useState<RankingCategory>("artists");
  const [sort, setSort] = useState<RankingSort>("minutes");
  const [timeRange, setTimeRange] = useState<SpotifyTimeRange>("medium_term");

  const items = useMemo(() => (library ? sortRanking(toRankingItems(category, library), sort) : []), [category, library, sort]);
  const categoryLabel = categoryOptions.find((option) => option.value === category)?.label ?? "";
  const sortLabel = sort === "plays" ? "reproducciones" : "tiempo escuchado";

  if (source === "spotify-api") {
    const affinity = category === "artists" ? apiData?.affinityArtists[timeRange] : category === "tracks" ? apiData?.affinityTracks[timeRange] : undefined;
    return (
      <>
        <PageHeader title="Rankings" description="Afinidad calculada por Spotify, separada del historial de reproducciones." actions={<Badge variant="iris">{sourceInfo.label}</Badge>} />
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <SegmentedControl label="Categoría" options={categoryOptions} value={category} onChange={setCategory} />
          <SegmentedControl label="Periodo Spotify" options={timeRangeOptions} value={timeRange} onChange={setTimeRange} />
        </div>
        <Card>
          <CardTitle>{`${categoryLabel} por afinidad`}</CardTitle>
          {category === "albums" ? (
            <EmptyState icon={Music} title="Álbumes no disponibles" description="Esta integración usa los rankings de afinidad de artistas y canciones que proporciona Spotify." />
          ) : affinity?.length ? (
            <>
              <p className="mt-1 text-xs text-fog-500">No son recuentos exactos de reproducciones. Rango consultado: {affinity[0].timeRange}.</p>
              <ol className="mt-2 divide-y divide-ink-700">
                {affinity.map((item) => (
                  <AffinityRankingRow
                    key={item.item.id}
                    rank={item.rank}
                    name={item.item.name}
                    subtitle={"artistName" in item ? item.artistName : item.item.genres[0] ?? "Sin género"}
                    timeRange={item.timeRange}
                  />
                ))}
              </ol>
            </>
          ) : <EmptyState icon={Music} title={isLoadingApi ? "Cargando rankings" : "Datos no disponibles"} description={apiError ?? "Conecta Spotify o vuelve a intentarlo más tarde."} />}
        </Card>
      </>
    );
  }

  if (!library) return <EmptyState icon={Music} title="Sin datos" description="No hay estadísticas históricas disponibles." />;

  return (
    <>
      <PageHeader
        title="Rankings"
        description="Tus artistas, canciones y álbumes más escuchados."
        actions={<Badge variant={source === "spotify-zip" ? "accent" : "iris"}>{sourceInfo.label}</Badge>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <SegmentedControl label="Categoría" options={categoryOptions} value={category} onChange={setCategory} />
        <SegmentedControl label="Ordenar por" options={sortOptions} value={sort} onChange={setSort} />
      </div>

      <Card>
        <CardTitle>{`${categoryLabel} por ${sortLabel}`}</CardTitle>
        <div className="mt-3 hidden justify-end gap-6 text-xs text-fog-500 sm:flex">
          <span className="w-32 text-right">Reproducciones</span>
          <span className="w-32 text-right">Tiempo escuchado</span>
        </div>
        <ol className="mt-2 divide-y divide-ink-700">
          {items.map((item, index) => (
            <RankingRow key={item.id} rank={index + 1} item={item} sort={sort} />
          ))}
        </ol>
      </Card>
    </>
  );
}
