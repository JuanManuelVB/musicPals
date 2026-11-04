import { Users } from "lucide-react";
import { PageHeader } from "@/ui/PageHeader";
import { EmptyState } from "@/ui/EmptyState";

export function FriendsPage() {
  return (
    <>
      <PageHeader title="Amigos" description="Tus amistades y solicitudes pendientes." />
      <EmptyState icon={Users} title="Sección en construcción" description="Se completará en los próximos incrementos de la fase 1." />
    </>
  );
}
