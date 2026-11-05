import { LogIn, LogOut } from "lucide-react";
import { PageHeader } from "@/ui/PageHeader";
import { Button } from "@/ui/Button";
import { Card, CardTitle } from "@/ui/Card";
import { Badge } from "@/ui/Badge";
import { useSpotifySession } from "@/app/SpotifySessionProvider";
import { useMusicData } from "@/app/MusicDataProvider";
import { SourceSwitcher } from "@/app/SourceSwitcher";
import { useYouTubeSession } from "@/app/YouTubeSessionProvider";
import { PlatformDot } from "@/ui/platform";
import { Link } from "react-router";
import { ZipImportCard } from "./ZipImportCard";

export function SettingsPage() {
  const { status, profile, error, connect, disconnect } = useSpotifySession();
  const { source, setSource, apiError } = useMusicData();
  const isConnected = status === "connected";

  return (
    <>
      <PageHeader title="Ajustes" description="Datos, privacidad y preferencias." />
      <Card>
        <CardTitle className="flex items-center gap-2"><PlatformDot platform="spotify" />Spotify</CardTitle>
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
        {source === "spotify-api" && apiError && (
          <div className="mt-4 rounded-xl border border-flare-500/30 bg-flare-500/10 p-4 text-sm text-flare-300" role="alert">
            <p>No se pudieron cargar los datos de Spotify API: {apiError}</p>
            <Button className="mt-3" size="sm" variant="secondary" onClick={() => setSource("demo")}>Usar datos demo</Button>
          </div>
        )}
        <p className="mt-5 text-xs text-fog-500">Los tokens se guardan solo durante esta sesión del navegador y se eliminan al desconectar.</p>
      </Card>
      <div className="mt-6">
        <YouTubeAccountCard />
      </div>
      <div className="mt-6 grid gap-6">
        <ZipImportCard platform="spotify" />
        <ZipImportCard platform="ytmusic" />
      </div>
      <Card className="mt-6">
        <CardTitle>Fuente activa</CardTitle>
        <p className="mt-1 text-sm text-fog-400">
          Consulta cada plataforma por separado o elige «Ambas» para mezclar los historiales importados de Spotify y YouTube Music. Si una
          plataforma tiene historial importado se usa ese; si no, los datos de la cuenta conectada.
        </p>
        <SourceSwitcher className="mt-4 w-fit" />
      </Card>
      <p className="mt-6 text-xs text-fog-500">
        <Link className="underline hover:text-fog-300" to="/privacidad">Política de privacidad</Link>
      </p>
    </>
  );
}

function YouTubeAccountCard() {
  const { status, profile, error, connect, disconnect } = useYouTubeSession();
  const { source, apiError } = useMusicData();
  const isConnected = status === "connected";

  return (
    <Card>
      <CardTitle className="flex items-center gap-2"><PlatformDot platform="ytmusic" />YouTube Music</CardTitle>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-medium text-fog-100">{isConnected ? `Conectado como ${profile?.displayName ?? "usuario de Google"}` : "Cuenta no conectada"}</p>
          <p className="mt-1 text-sm text-fog-400">
            {isConnected
              ? "La sesión permite consultar tus canciones con «Me gusta» y tus listas."
              : "Inicia sesión con Google para consultar tus canciones con «Me gusta» y tus listas de YouTube Music."}
          </p>
        </div>
        {isConnected ? (
          <Button variant="secondary" onClick={disconnect}>
            <LogOut className="size-4" aria-hidden />
            Desconectar
          </Button>
        ) : (
          <Button onClick={() => void connect()} disabled={status === "connecting"}>
            <LogIn className="size-4" aria-hidden />
            Conectar YouTube Music
          </Button>
        )}
      </div>
      {status === "connecting" && <Badge className="mt-4" variant="iris">Conectando...</Badge>}
      {error && <p className="mt-4 text-sm text-flare-400" role="alert">{error}</p>}
      {source === "ytmusic-api" && apiError && (
        <p className="mt-4 rounded-xl border border-flare-500/30 bg-flare-500/10 p-4 text-sm text-flare-300" role="alert">
          No se pudieron cargar los datos de YouTube: {apiError}
        </p>
      )}
      <p className="mt-5 text-xs text-fog-500">
        Google no ofrece el historial de reproducciones por API: para estadísticas de escucha importa también Google Takeout. El acceso caduca
        en una hora y se elimina al desconectar.
      </p>
    </Card>
  );
}
