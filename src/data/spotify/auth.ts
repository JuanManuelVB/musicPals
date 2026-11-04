const AUTHORIZATION_ENDPOINT = "https://accounts.spotify.com/authorize";
const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const TOKEN_STORAGE_KEY = "musicpals.spotify.session";
const TRANSACTION_STORAGE_KEY = "musicpals.spotify.oauth";

export const spotifyScopes = ["user-read-private", "user-top-read", "user-read-recently-played"] as const;

type OAuthTransaction = {
  state: string;
  codeVerifier: string;
};

export type SpotifyTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number;
};

export class SpotifyAuthError extends Error {
  constructor(
    message: string,
    public readonly code: "configuration" | "cancelled" | "invalid_callback" | "token_exchange" | "storage",
  ) {
    super(message);
    this.name = "SpotifyAuthError";
  }
}

function getClientId() {
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  if (!clientId) throw new SpotifyAuthError("Falta VITE_SPOTIFY_CLIENT_ID en la configuración.", "configuration");
  return clientId;
}

export function getRedirectUri() {
  return import.meta.env.VITE_SPOTIFY_REDIRECT_URI || `${window.location.origin}${import.meta.env.BASE_URL}callback`;
}

function randomString(length: number) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, length);
}

async function createCodeChallenge(codeVerifier: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function saveTransaction(transaction: OAuthTransaction) {
  try {
    sessionStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(transaction));
  } catch {
    throw new SpotifyAuthError("No se pudo guardar temporalmente la transacción OAuth.", "storage");
  }
}

function readTransaction(): OAuthTransaction | undefined {
  try {
    const raw = sessionStorage.getItem(TRANSACTION_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).state !== "string" ||
      typeof (parsed as Record<string, unknown>).codeVerifier !== "string"
    ) {
      return undefined;
    }
    return parsed as OAuthTransaction;
  } catch {
    throw new SpotifyAuthError("No se pudo leer la transacción OAuth.", "storage");
  }
}

function clearTransaction() {
  try {
    sessionStorage.removeItem(TRANSACTION_STORAGE_KEY);
  } catch {
    throw new SpotifyAuthError("No se pudo limpiar la transacción OAuth.", "storage");
  }
}

function saveTokens(tokens: SpotifyTokens) {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    throw new SpotifyAuthError("No se pudo guardar la sesión de Spotify.", "storage");
  }
}

function readTokens(): SpotifyTokens | undefined {
  try {
    const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).accessToken !== "string" ||
      typeof (parsed as Record<string, unknown>).expiresAt !== "number"
    ) {
      return undefined;
    }
    return parsed as SpotifyTokens;
  } catch {
    throw new SpotifyAuthError("No se pudo leer la sesión de Spotify.", "storage");
  }
}

export function clearSpotifySession() {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(TRANSACTION_STORAGE_KEY);
  } catch {
    throw new SpotifyAuthError("No se pudo eliminar la sesión de Spotify.", "storage");
  }
}

export async function beginSpotifyAuthorization() {
  const codeVerifier = randomString(64);
  const state = randomString(32);
  saveTransaction({ state, codeVerifier });
  const codeChallenge = await createCodeChallenge(codeVerifier);
  const params = new URLSearchParams({
    client_id: getClientId(),
    response_type: "code",
    redirect_uri: getRedirectUri(),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    state,
    scope: spotifyScopes.join(" "),
  });
  window.location.assign(`${AUTHORIZATION_ENDPOINT}?${params.toString()}`);
}

async function requestTokens(params: URLSearchParams) {
  let response: Response;
  try {
    response = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });
  } catch {
    throw new SpotifyAuthError("No se pudo contactar con Spotify para iniciar sesión.", "token_exchange");
  }

  if (!response.ok) {
    throw new SpotifyAuthError("Spotify rechazó la autorización o la sesión ha caducado.", "token_exchange");
  }

  const body: unknown = await response.json();
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).access_token !== "string" ||
    typeof (body as Record<string, unknown>).expires_in !== "number"
  ) {
    throw new SpotifyAuthError("Spotify devolvió una respuesta de token inválida.", "token_exchange");
  }

  const record = body as Record<string, unknown>;
  const current = readTokens();
  const tokens: SpotifyTokens = {
    accessToken: record.access_token as string,
    refreshToken: typeof record.refresh_token === "string" ? record.refresh_token : current?.refreshToken,
    expiresAt: Date.now() + (record.expires_in as number) * 1000,
  };
  saveTokens(tokens);
  return tokens;
}

export async function completeSpotifyAuthorization(search: string) {
  const params = new URLSearchParams(search);
  const error = params.get("error");
  if (error) {
    clearTransaction();
    throw new SpotifyAuthError(`Spotify canceló la autorización (${error}).`, "cancelled");
  }

  const code = params.get("code");
  const state = params.get("state");
  const transaction = readTransaction();
  if (!code || !state || !transaction || state !== transaction.state) {
    clearTransaction();
    throw new SpotifyAuthError("La respuesta OAuth no es válida o ha caducado.", "invalid_callback");
  }

  const tokens = await requestTokens(
    new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: getRedirectUri(),
      client_id: getClientId(),
      code_verifier: transaction.codeVerifier,
    }),
  );
  clearTransaction();
  return tokens;
}

let refreshPromise: Promise<SpotifyTokens> | undefined;

export async function getSpotifyAccessToken() {
  const tokens = readTokens();
  if (!tokens) return undefined;
  if (tokens.expiresAt > Date.now() + 60_000 || !tokens.refreshToken) return tokens.accessToken;
  if (!refreshPromise) {
    refreshPromise = requestTokens(
      new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: tokens.refreshToken,
        client_id: getClientId(),
      }),
    ).finally(() => {
      refreshPromise = undefined;
    });
  }
  return (await refreshPromise).accessToken;
}

export function hasSpotifySession() {
  return Boolean(readTokens());
}
