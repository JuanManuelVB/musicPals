import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type PropsWithChildren } from "react";
import { beginSpotifyAuthorization, clearSpotifySession, completeSpotifyAuthorization, hasSpotifySession } from "@/data/spotify/auth";
import { getSpotifyProfile, type SpotifyProfile } from "@/data/spotify/api";

type SpotifySessionStatus = "disconnected" | "connecting" | "connected" | "error";

type SpotifySessionContextValue = {
  status: SpotifySessionStatus;
  profile?: SpotifyProfile;
  error?: string;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const SpotifySessionContext = createContext<SpotifySessionContextValue | undefined>(undefined);

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operación con Spotify.";
}

export function SpotifySessionProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<SpotifySessionStatus>(() => (hasSpotifySession() ? "connecting" : "disconnected"));
  const [profile, setProfile] = useState<SpotifyProfile>();
  const [error, setError] = useState<string>();
  const callbackHandled = useRef(false);

  const loadProfile = useCallback(async () => {
    try {
      setError(undefined);
      setProfile(await getSpotifyProfile());
      setStatus("connected");
    } catch (reason) {
      setProfile(undefined);
      setStatus("error");
      setError(describeError(reason));
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("code") || params.has("error")) {
      if (callbackHandled.current) return;
      callbackHandled.current = true;
      void completeSpotifyAuthorization(window.location.search)
        .then(() => {
          window.history.replaceState({}, document.title, window.location.pathname);
          return loadProfile();
        })
        .catch((reason: unknown) => {
          window.history.replaceState({}, document.title, window.location.pathname);
          setStatus("error");
          setError(describeError(reason));
        });
    } else if (hasSpotifySession()) {
      void loadProfile();
    }
  }, [loadProfile]);

  const connect = useCallback(async () => {
    setStatus("connecting");
    setError(undefined);
    try {
      await beginSpotifyAuthorization();
    } catch (reason) {
      setStatus("error");
      setError(describeError(reason));
    }
  }, []);

  const disconnect = useCallback(() => {
    clearSpotifySession();
    setProfile(undefined);
    setError(undefined);
    setStatus("disconnected");
  }, []);

  const value = useMemo(() => ({ status, profile, error, connect, disconnect }), [connect, disconnect, error, profile, status]);
  return <SpotifySessionContext.Provider value={value}>{children}</SpotifySessionContext.Provider>;
}

export function useSpotifySession() {
  const context = useContext(SpotifySessionContext);
  if (!context) throw new Error("useSpotifySession debe usarse dentro de SpotifySessionProvider.");
  return context;
}
