import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react";
import type { NormalizedListeningEvent, ZipImportReport } from "@/domain/history";
import { importSpotifyHistoryZip } from "@/data/spotify/zipHistory";

type ZipHistoryContextValue = {
  events: NormalizedListeningEvent[];
  report?: ZipImportReport;
  error?: string;
  importFile: (file: File) => Promise<void>;
  clear: () => void;
};

const ZipHistoryContext = createContext<ZipHistoryContextValue | undefined>(undefined);

export function ZipHistoryProvider({ children }: PropsWithChildren) {
  const [events, setEvents] = useState<NormalizedListeningEvent[]>([]);
  const [report, setReport] = useState<ZipImportReport>();
  const [error, setError] = useState<string>();

  const importFile = useCallback(async (file: File) => {
    setError(undefined);
    try {
      const result = await importSpotifyHistoryZip(file);
      setEvents(result.events);
      setReport(result.report);
    } catch (reason) {
      setEvents([]);
      setReport(undefined);
      setError(reason instanceof Error ? reason.message : "No se pudo importar el historial ZIP.");
    }
  }, []);

  const clear = useCallback(() => {
    setEvents([]);
    setReport(undefined);
    setError(undefined);
  }, []);

  const value = useMemo(() => ({ events, report, error, importFile, clear }), [clear, error, events, importFile, report]);
  return <ZipHistoryContext.Provider value={value}>{children}</ZipHistoryContext.Provider>;
}

export function useZipHistory() {
  const context = useContext(ZipHistoryContext);
  if (!context) throw new Error("useZipHistory debe usarse dentro de ZipHistoryProvider.");
  return context;
}
