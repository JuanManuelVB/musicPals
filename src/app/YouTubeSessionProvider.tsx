import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { beginYouTubeAuthorization, clearYouTubeSession, hasYouTubeSession } from "@/data/ytmusic/auth";
import { getYouTubeProfile, type YouTubeProfile } from "@/data/ytmusic/api";

type YouTubeSessionStatus = "disconnected" | "connecting" | "connected" | "error";

type YouTubeSessionContextValue = {
  status: YouTubeSessionStatus;
  profile?: YouTubeProfile;
  error?: string;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const YouTubeSessionContext = createContext<YouTubeSessionContextValue | undefined>(undefined);

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operación con YouTube.";
}

export function YouTubeSessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<YouTubeSessionStatus>(() => (hasYouTubeSession() ? "connecting" : "disconnected"));
  const [profile, setProfile] = useState<YouTubeProfile>();
  const [error, setError] = useState<string>();

  const loadProfile = useCallback(async () => {
    try {
      setError(undefined);
      setProfile(await getYouTubeProfile());
      setStatus("connected");
    } catch (reason) {
      setProfile(undefined);
      setStatus("error");
      setError(describeError(reason));
    }
  }, []);

  useEffect(() => {
    if (hasYouTubeSession()) void loadProfile();
  }, [loadProfile]);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(undefined);
    try {
      await beginYouTubeAuthorization();
      await loadProfile();
    } catch (reason) {
      setStatus("error");
      setError(describeError(reason));
    }
  }, [loadProfile]);

  const disconnect = useCallback(() => {
    clearYouTubeSession();
    setProfile(undefined);
    setError(undefined);
    setStatus("disconnected");
  }, []);

  const value = useMemo(() => ({ status, profile, error, connect, disconnect }), [connect, disconnect, error, profile, status]);
  return <YouTubeSessionContext.Provider value={value}>{children}</YouTubeSessionContext.Provider>;
}

export function useYouTubeSession() {
  const context = useContext(YouTubeSessionContext);
  if (!context) throw new Error("useYouTubeSession debe usarse dentro de YouTubeSessionProvider.");
  return context;
}
