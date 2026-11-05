/**
 * Autorización de YouTube con Google Identity Services (modelo de token en ventana emergente).
 * Funciona sin servidor ni client secret: Google devuelve directamente un access token de corta
 * duración (1 h) que se guarda en sessionStorage, igual que la sesión de Spotify.
 */

const GIS_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const TOKEN_STORAGE_KEY = "musicpals.youtube.session";

export const youtubeScopes = ["https://www.googleapis.com/auth/youtube.readonly"] as const;

type TokenResponse = { access_token?: string; expires_in?: number; error?: string; error_description?: string };

type TokenClient = { requestAccessToken: (overrides?: { prompt?: string }) => void };

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: TokenResponse) => void;
            error_callback?: (error: { type: string; message?: string }) => void;
          }) => TokenClient;
          revoke: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

type YouTubeTokens = { accessToken: string; expiresAt: number };

export class YouTubeAuthError extends Error {
  constructor(
    message: string,
    public readonly code: "configuration" | "cancelled" | "script" | "storage",
  ) {
    super(message);
    this.name = "YouTubeAuthError";
  }
}

function getClientId() {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new YouTubeAuthError("Falta VITE_GOOGLE_CLIENT_ID en la configuración.", "configuration");
  return clientId;
}

let scriptPromise: Promise<void> | undefined;

function loadGoogleIdentity() {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  scriptPromise ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = undefined;
      reject(new YouTubeAuthError("No se pudo cargar el inicio de sesión de Google.", "script"));
    };
    document.head.append(script);
  });
  return scriptPromise;
}

function readTokens(): YouTubeTokens | undefined {
  try {
    const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as YouTubeTokens) : undefined;
  } catch {
    return undefined;
  }
}

function saveTokens(tokens: YouTubeTokens) {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    throw new YouTubeAuthError("No se pudo guardar la sesión de YouTube.", "storage");
  }
}

/** Abre la ventana de Google y resuelve cuando el usuario concede el acceso. */
export async function beginYouTubeAuthorization() {
  const clientId = getClientId();
  await loadGoogleIdentity();
  await new Promise<void>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: youtubeScopes.join(" "),
      callback: (response) => {
        if (!response.access_token || response.error) {
          reject(new YouTubeAuthError(response.error_description ?? "Google no concedió el acceso a YouTube.", "cancelled"));
          return;
        }
        try {
          saveTokens({ accessToken: response.access_token, expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000 });
          resolve();
        } catch (reason) {
          reject(reason);
        }
      },
      error_callback: (error) => {
        reject(new YouTubeAuthError(error.type === "popup_closed" ? "Se cerró la ventana de Google antes de terminar." : "No se pudo abrir la ventana de Google.", "cancelled"));
      },
    });
    client.requestAccessToken();
  });
}

/** Devuelve el token si sigue vigente; Google no da refresh token a aplicaciones solo de navegador. */
export function getYouTubeAccessToken() {
  const tokens = readTokens();
  if (!tokens || tokens.expiresAt - 30_000 <= Date.now()) return undefined;
  return tokens.accessToken;
}

export function hasYouTubeSession() {
  return getYouTubeAccessToken() !== undefined;
}

export function clearYouTubeSession() {
  const token = readTokens()?.accessToken;
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Sin almacenamiento no hay sesión que borrar.
  }
  if (token) window.google?.accounts.oauth2.revoke(token);
}
