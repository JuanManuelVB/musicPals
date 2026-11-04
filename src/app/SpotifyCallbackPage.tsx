import { Link } from "react-router";
import { Music } from "lucide-react";
import { useSpotifySession } from "./SpotifySessionProvider";
import { EmptyState } from "@/ui/EmptyState";

export function SpotifyCallbackPage() {
  const { callbackStatus, callbackError } = useSpotifySession();

  if (callbackStatus === "processing") {
    return <EmptyState icon={Music} title="Conectando con Spotify" description="Estamos validando la autorización y preparando tu sesión." />;
  }

  if (callbackStatus === "error") {
    return (
      <EmptyState
        icon={Music}
        title="No se pudo completar la conexión"
        description={callbackError ?? "Spotify no pudo completar la autorización."}
        action={<Link className="rounded-xl bg-ink-700 px-4 py-2 text-sm font-medium hover:bg-ink-600" to="/">Volver al inicio</Link>}
      />
    );
  }

  return <EmptyState icon={Music} title="Callback de Spotify no válido" description="Vuelve al inicio y comienza de nuevo la conexión." action={<Link className="rounded-xl bg-ink-700 px-4 py-2 text-sm font-medium hover:bg-ink-600" to="/">Volver al inicio</Link>} />;
}
