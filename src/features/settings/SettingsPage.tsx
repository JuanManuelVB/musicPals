import { LogIn, LogOut } from "lucide-react";
import { PageHeader } from "@/ui/PageHeader";
import { Button } from "@/ui/Button";
import { Card, CardTitle } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { useSpotifySession } from "@/app/SpotifySessionProvider";
import { useMusicData } from "@/app/MusicDataProvider";
import { useZipHistory } from "@/app/ZipHistoryProvider";
import { ZipImportCard } from "./ZipImportCard";

export function SettingsPage() {
  const { status, profile, error, connect, disconnect } = useSpotifySession();
  const { source, setSource } = useMusicData();
  const { events } = useZipHistory();
  const isConnected = status === "connected";

  return (
    <>
      <PageHeader title="Ajustes" description="Datos, privacidad y preferencias." />
      <Card>
        <CardTitle>Spotify</CardTitle>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-medium text-fog-100">{isConnected ? `Conectado como ${profile?.displayName ?? "usuario Spotify"}` : "Cuenta no conectada"}</p>
            <p className="mt-1 text-sm text-fog-400">
              {isConnected ? "La sesión permite consultar afinidad y actividad reciente." : "Conecta tu cuenta para consultar datos autorizados por Spotify."}
            </p>
          </div>
          {isConnected ? (
            <Button variant="secondary" onClick={disconnect}>
              <LogOut className="size-4" aria-hidden />
              Desconectar
            </Button>
          ) : (
            <Button onClick={() => void connect()}>
              <LogIn className="size-4" aria-hidden />
              Conectar Spotify
            </Button>
          )}
        </div>
        {status === "connecting" && <Badge className="mt-4" variant="iris">Conectando...</Badge>}
        {error && <p className="mt-4 text-sm text-flare-400" role="alert">{error}</p>}
        <p className="mt-5 text-xs text-fog-500">Los tokens se guardan solo durante esta sesión del navegador y se eliminan al desconectar.</p>
      </Card>
      <div className="mt-6">
        <ZipImportCard />
      </div>
      <Card className="mt-6">
        <CardTitle>Fuente activa</CardTitle>
        <p className="mt-1 text-sm text-fog-400">Las estadísticas usan una sola fuente cada vez; no se combinan datos demo, API y ZIP.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant={source === "demo" ? "primary" : "secondary"} onClick={() => setSource("demo")}>Demo</Button>
          <Button size="sm" variant={source === "spotify-api" ? "primary" : "secondary"} disabled={!isConnected} onClick={() => setSource("spotify-api")}>Spotify API</Button>
          <Button size="sm" variant={source === "spotify-zip" ? "primary" : "secondary"} disabled={!events.length} onClick={() => setSource("spotify-zip")}>Historial ZIP</Button>
        </div>
      </Card>
    </>
  );
}
