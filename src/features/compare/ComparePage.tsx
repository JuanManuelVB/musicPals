import { ArrowLeftRight } from "lucide-react";
import { PageHeader } from "@/ui/PageHeader";
import { EmptyState } from "@/ui/EmptyState";

export function ComparePage() {
  return (
    <>
      <PageHeader title="Comparar" description="Tu música frente a la de tus amigos." />
      <EmptyState icon={ArrowLeftRight} title="Sección en construcción" description="Se completará en los próximos incrementos de la fase 1." />
    </>
  );
}
