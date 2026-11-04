import { Share2 } from "lucide-react";
import { PageHeader } from "@/ui/PageHeader";
import { EmptyState } from "@/ui/EmptyState";

export function ReportsPage() {
  return (
    <>
      <PageHeader title="Informes" description="Resúmenes visuales para compartir." />
      <EmptyState icon={Share2} title="Sección en construcción" description="Se completará en los próximos incrementos de la fase 1." />
    </>
  );
}
