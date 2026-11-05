import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from "react";
import type { NormalizedListeningEvent, Platform, ZipImportReport } from "@/domain/history";
import { importSpotifyHistoryZip, type ZipImportResult } from "@/data/spotify/zipHistory";
import { importYouTubeMusicTakeout } from "@/data/ytmusic/takeoutHistory";

export type PlatformHistory = {
  events: NormalizedListeningEvent[];
  report?: ZipImportReport;
  error?: string;
};

type ZipHistoryContextValue = {
  histories: Record<Platform, PlatformHistory>;
  importFile: (platform: Platform, file: File) => Promise<void>;
  clear: (platform: Platform) => void;
};

const importers: Record<Platform, (file: File) => Promise<ZipImportResult>> = {
  spotify: importSpotifyHistoryZip,
  ytmusic: importYouTubeMusicTakeout,
};

const empty: PlatformHistory = { events: [] };

const ZipHistoryContext = createContext<ZipHistoryContextValue | undefined>(undefined);

export function ZipHistoryProvider({ children }: PropsWithChildren) {
  const [histories, setHistories] = useState<Record<Platform, PlatformHistory>>({ spotify: empty, ytmusic: empty });

  const importFile = useCallback(async (platform: Platform, file: File) => {
    let next: PlatformHistory;
    try {
      const result = await importers[platform](file);
      next = { events: result.events, report: result.report };
    } catch (reason) {
      next = { events: [], error: reason instanceof Error ? reason.message : "No se pudo importar el historial." };
    }
    setHistories((current) => ({ ...current, [platform]: next }));
  }, []);

  const clear = useCallback((platform: Platform) => {
    setHistories((current) => ({ ...current, [platform]: empty }));
  }, []);

  const value = useMemo(() => ({ histories, importFile, clear }), [clear, histories, importFile]);
  return <ZipHistoryContext.Provider value={value}>{children}</ZipHistoryContext.Provider>;
}

export function useZipHistory() {
  const context = useContext(ZipHistoryContext);
  if (!context) throw new Error("useZipHistory debe usarse dentro de ZipHistoryProvider.");
  return context;
}
