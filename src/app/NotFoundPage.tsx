import { Link } from "react-router";
import { SearchX } from "lucide-react";
import { EmptyState } from "@/ui/EmptyState";
import { Button } from "@/ui/Button";

export function NotFoundPage() {
  return (
    <EmptyState
      icon={SearchX}
      title="Esta página no existe"
      description="Comprueba la dirección o vuelve al inicio."
      action={
        <Link to="/">
          <Button>Ir al inicio</Button>
        </Link>
      }
    />
  );
}
