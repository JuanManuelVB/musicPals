import { useRef, useState } from "react";
import { FileArchive, Trash2 } from "lucide-react";
import { useZipHistory } from "@/app/ZipHistoryProvider";
import { Button } from "@/ui/Button";
import { Card, CardTitle } from "@/ui/Card";

export function ZipImportControl() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { importFile } = useZipHistory();

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsImporting(true);
    try {
      await importFile(file);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <>
      <input ref={inputRef} className="hidden" type="file" accept=".zip,application/zip" onChange={(event) => void handleFileChange(event)} />
      <Button onClick={() => inputRef.current?.click()} disabled={isImporting}>
        <FileArchive className="size-4" aria-hidden />
        {isImporting ? "Procesando..." : "Importar historial ZIP"}
      </Button>
    </>
  );
}

export function ZipImportCard() {
  const { report, error, clear } = useZipHistory();

  return (
    <Card>
      <CardTitle>Historial extendido de Spotify</CardTitle>
      <p className="mt-1 text-sm text-fog-400">Importa el ZIP directamente; se procesa localmente y no se sube a ningún servidor.</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <ZipImportControl />
        {report && (
          <Button variant="secondary" onClick={clear}>
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
