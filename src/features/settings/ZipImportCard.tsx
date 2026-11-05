import { useRef, useState } from "react";
import { FileArchive, Trash2 } from "lucide-react";
import { useZipHistory } from "@/app/ZipHistoryProvider";
import type { Platform } from "@/domain/history";
import { Button } from "@/ui/Button";
import { Card, CardTitle } from "@/ui/Card";
import { PlatformDot } from "@/ui/platform";

const copy: Record<Platform, { title: string; description: string; button: string; accept: string }> = {
  spotify: {
    title: "Historial extendido de Spotify",
    description: "Importa el ZIP directamente; se procesa localmente y no se sube a ningún servidor.",
    button: "Importar historial ZIP",
    accept: ".zip,application/zip",
  },
  ytmusic: {
    title: "Historial de YouTube Music",
    description:
      "Exporta «YouTube y YouTube Music → historial» en Google Takeout con formato JSON e importa el ZIP o el archivo watch-history.json. Se procesa localmente.",
    button: "Importar Google Takeout",
    accept: ".zip,application/zip,.json,application/json",
  },
};

export function ZipImportControl({ platform }: { platform: Platform }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { importFile } = useZipHistory();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsImporting(true);
    try {
      await importFile(platform, file);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <>
      <input ref={inputRef} className="hidden" type="file" accept={copy[platform].accept} onChange={(event) => void handleFileChange(event)} />
      <Button onClick={() => inputRef.current?.click()} disabled={isImporting}>
        <FileArchive className="size-4" aria-hidden />
        {isImporting ? "Procesando..." : copy[platform].button}
      </Button>
    </>
  );
}

export function ZipImportCard({ platform }: { platform: Platform }) {
  const { histories, clear } = useZipHistory();
  const { report, error } = histories[platform];

  return (
    <Card>
      <CardTitle className="flex items-center gap-2">
        <PlatformDot platform={platform} />
        {copy[platform].title}
      </CardTitle>
      <p className="mt-1 text-sm text-fog-400">{copy[platform].description}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <ZipImportControl platform={platform} />
        {report && (
          <Button variant="secondary" onClick={() => clear(platform)}>
            <Trash2 className="size-4" aria-hidden />
            Borrar importación
          </Button>
        )}
      </div>
      {error && <p className="mt-4 text-sm text-flare-400" role="alert">{error}</p>}
      {report && (
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <div><dt className="text-fog-500">Importados</dt><dd className="font-medium text-fog-100">{report.imported}</dd></div>
          <div><dt className="text-fog-500">Descartados</dt><dd className="font-medium text-fog-100">{report.discarded}</dd></div>
          <div><dt className="text-fog-500">Archivos procesados</dt><dd className="font-medium text-fog-100">{report.filesProcessed}</dd></div>
          <div><dt className="text-fog-500">Ignorados</dt><dd className="font-medium text-fog-100">{report.filesIgnored}</dd></div>
        </dl>
      )}
      {report?.errors.length ? <ul className="mt-3 space-y-1 text-xs text-fog-500">{report.errors.map((item) => <li key={item}>{item}</li>)}</ul> : null}
    </Card>
  );
}
