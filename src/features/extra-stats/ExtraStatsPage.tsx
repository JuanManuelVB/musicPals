import { Archive, CalendarRange, Clock3, Sparkles } from "lucide-react";
import { useZipHistory } from "@/app/ZipHistoryProvider";
import { PageHeader } from "@/ui/PageHeader";
import { Badge } from "@/ui/Badge";
import { Card, CardTitle } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { ZipImportControl } from "@/features/settings/ZipImportCard";
import { platformLabels, platforms } from "@/domain/history";
import { PlatformDot } from "@/ui/platform";

export function ExtraStatsPage() {
  const { histories } = useZipHistory();
  const imported = platforms.filter((platform) => histories[platform].events.length > 0);

  return (
    <>
      <PageHeader
        title="Estadísticas extra"
        description="Análisis avanzados calculados a partir de tu historial completo."
        actions={<Badge variant="accent">Historiales importados</Badge>}
      />

      {!imported.length ? (
        <EmptyState
          icon={Archive}
          title="Desbloquea tus estadísticas históricas"
          description="Importa tu Extended Streaming History de Spotify o tu historial de YouTube Music (Google Takeout) para calcular reproducciones, tiempo escuchado, evolución y otros análisis."
          action={
            <div className="space-y-4">
              <div className="flex flex-wrap justify-center gap-3">
                <ZipImportControl platform="spotify" />
                <ZipImportControl platform="ytmusic" />
              </div>
              <p className="max-w-md text-xs text-fog-500">
                Los archivos son opcionales y se procesan localmente. Spotify: Privacidad y configuración → historial
                extendido. YouTube Music: Google Takeout → YouTube y YouTube Music → historial, en formato JSON.
              </p>
            </div>
          }
        />
      ) : (
        <Card>
          <CardTitle>Historial disponible</CardTitle>
          <p className="mt-1 text-sm text-fog-400">Tu historial está listo para las próximas métricas avanzadas. Los datos permanecen en memoria del navegador.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoItem icon={Sparkles} label="Registros importados" value={String(imported.reduce((total, platform) => total + histories[platform].events.length, 0))} />
            <InfoItem
              icon={CalendarRange}
              label="Fuentes"
              value={
                <span className="flex flex-wrap gap-3">
                  {imported.map((platform) => (
                    <span key={platform} className="flex items-center gap-1.5"><PlatformDot platform={platform} />{platformLabels[platform]}</span>
                  ))}
                </span>
              }
            />
            <InfoItem icon={Clock3} label="Estado" value="Listo para analizar" />
          </div>
        </Card>
      )}
    </>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof Archive; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-ink-800 p-4">
      <Icon className="size-5 text-iris-400" aria-hidden />
      <p className="mt-3 text-xs text-fog-500">{label}</p>
      <div className="mt-1 text-sm font-medium text-fog-100">{value}</div>
    </div>
  );
}
