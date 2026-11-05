import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { Hub } from "aws-amplify/utils";
import { deleteUser, fetchUserAttributes, getCurrentUser, signInWithRedirect, signOut as amplifySignOut } from "aws-amplify/auth";
import { isBackendConfigured } from "@/lib/amplify";
import { createProfile, deleteProfileData, getProfileByUserId, type UserProfile } from "@/data/account";

/**
 * Cuenta de la red social (inicio de sesión con Google vía Cognito).
 * Es independiente de las conexiones con Spotify y YouTube: la app se puede usar sin cuenta.
 */
type AccountState =
  | { status: "unavailable" }
  | { status: "loading" }
  | { status: "signedOut"; error?: string }
  | { status: "needsUsername"; userId: string; suggestedName?: string }
  | { status: "ready"; userId: string; profile: UserProfile }
  | { status: "error"; error: string };

type AccountContextValue = {
  state: AccountState;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  claimUsername: (username: string, displayName: string) => Promise<void>;
  /** Sustituye el perfil en memoria tras editarlo o publicar el top. */
  setProfile: (profile: UserProfile) => void;
  /** Borra perfil, foto, amistades y la cuenta de inicio de sesión. */
  deleteAccount: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue | undefined>(undefined);

function describeError(error: unknown) {
  return error instanceof Error ? error.message : "No se pudo completar la operación con tu cuenta.";
}

export function AccountProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AccountState>(() => (isBackendConfigured ? { status: "loading" } : { status: "unavailable" }));

  const load = useCallback(async () => {
    let userId: string;
    try {
      userId = (await getCurrentUser()).userId;
    } catch {
      setState({ status: "signedOut" });
      return;
    }
    try {
      const profile = await getProfileByUserId(userId);
      if (profile) {
        setState({ status: "ready", userId, profile });
      } else {
        const attributes = await fetchUserAttributes().catch(() => ({}) as Record<string, string | undefined>);
        setState({ status: "needsUsername", userId, suggestedName: attributes.name });
      }
    } catch (reason) {
      setState({ status: "error", error: describeError(reason) });
    }
  }, []);

  useEffect(() => {
    if (!isBackendConfigured) return;
    void load();
    return Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signInWithRedirect") void load();
      if (payload.event === "signInWithRedirect_failure") setState({ status: "signedOut", error: "No se pudo iniciar sesión con Google." });
      if (payload.event === "signedOut") setState({ status: "signedOut" });
    });
  }, [load]);

  const signIn = useCallback(async () => {
    try {
      await signInWithRedirect({ provider: "Google" });
    } catch (reason) {
      setState({ status: "signedOut", error: `No se pudo abrir el inicio de sesión: ${describeError(reason)}` });
    }
  }, []);
  const signOut = useCallback(() => amplifySignOut(), []);

  const claimUsername = useCallback(
    async (username: string, displayName: string) => {
      if (state.status !== "needsUsername") return;
      const profile = await createProfile({ username, userId: state.userId, displayName: displayName || undefined });
      setState({ status: "ready", userId: state.userId, profile });
    },
    [state],
  );

  const setProfile = useCallback((profile: UserProfile) => {
    setState((current) => (current.status === "ready" ? { ...current, profile } : current));
  }, []);

  const deleteAccount = useCallback(async () => {
    if (state.status === "ready") await deleteProfileData(state.profile);
    await deleteUser();
    setState({ status: "signedOut" });
  }, [state]);

  const value = useMemo(
    () => ({ state, signIn, signOut, claimUsername, setProfile, deleteAccount }),
    [claimUsername, deleteAccount, setProfile, signIn, signOut, state],
  );
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) throw new Error("useAccount debe usarse dentro de AccountProvider.");
  return context;
}
