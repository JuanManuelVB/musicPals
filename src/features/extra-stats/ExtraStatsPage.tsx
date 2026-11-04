import { Archive, CalendarRange, Clock3, Sparkles } from "lucide-react";
import { useZipHistory } from "@/app/ZipHistoryProvider";
import { PageHeader } from "@/ui/PageHeader";
import { Badge } from "@/ui/Badge";
import { Card, CardTitle } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { ZipImportControl } from "@/features/settings/ZipImportCard";

export function ExtraStatsPage() {
  const { events, report } = useZipHistory();

  return (
    <>
      <PageHeader
        title="Estadísticas extra"
        description="Análisis avanzados calculados a partir de tu historial completo."
        actions={<Badge variant="accent">Historial ZIP</Badge>}
      />

      {!events.length ? (
        <EmptyState
          icon={Archive}
          title="Desbloquea tus estadísticas históricas"
          description="Importa tu Extended Streaming History para calcular reproducciones, tiempo escuchado, evolución y otros análisis que Spotify API no proporciona."
          action={
            <div className="space-y-4">
              <ZipImportControl />
              <p className="max-w-md text-xs text-fog-500">
                El ZIP es opcional y se procesa localmente. Puedes solicitarlo desde Spotify en tu cuenta, en
                Privacidad y configuración, seleccionando la descarga de tu historial extendido.
              </p>
            </div>
          }
        />
      ) : (
        <Card>
          <CardTitle>Historial disponible</CardTitle>
          <p className="mt-1 text-sm text-fog-400">Tu historial está listo para las próximas métricas avanzadas. Los datos permanecen en memoria del navegador.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoItem icon={Sparkles} label="Registros importados" value={String(report?.imported ?? events.length)} />
            <InfoItem icon={CalendarRange} label="Fuente" value="Extended Streaming History" />
            <InfoItem icon={Clock3} label="Estado" value="Listo para analizar" />
          </div>
        </Card>
      )}
    </>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: typeof Archive; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink-800 p-4">
      <Icon className="size-5 text-iris-400" aria-hidden />
      <p className="mt-3 text-xs text-fog-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-fog-100">{value}</p>
    </div>
  );
}
