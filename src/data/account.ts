import { generateClient } from "aws-amplify/data";
import { getUrl, remove, uploadData } from "aws-amplify/storage";
import type { Schema } from "../../amplify/data/resource";

/** Campos del perfil que usa la interfaz (los distintos métodos del cliente devuelven tipos ligeramente distintos). */
export type UserProfile = Pick<Schema["UserProfile"]["type"], "username" | "userId"> & {
  displayName?: string | null;
  bio?: string | null;
  avatarPath?: string | null;
  topArtists?: unknown;
  topTracks?: unknown;
  topsSource?: string | null;
  topsUpdatedAt?: string | null;
};

/** Artista o canción publicados en el perfil. Las cifras faltan cuando la fuente no las da (API de Spotify). */
export type PublishedItem = { name: string; artistName?: string; imageUrl?: string; minutes?: number; plays?: number };

export type ProfileUpdate = { displayName?: string | null; bio?: string | null; avatarPath?: string | null };

let client: ReturnType<typeof generateClient<Schema>> | undefined;
const db = () => (client ??= generateClient<Schema>());

/** Minúsculas, números, punto y guion bajo; de 3 a 20 caracteres. */
export const USERNAME_PATTERN = /^[a-z0-9._]{3,20}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export async function getProfileByUserId(userId: string) {
  const { data, errors } = await db().models.UserProfile.listUserProfileByUserId({ userId });
  if (errors?.length) throw new Error(errors[0].message);
  return data[0];
}

export async function isUsernameAvailable(username: string) {
  const { data, errors } = await db().models.UserProfile.get({ username }, { selectionSet: ["username"] });
  if (errors?.length) throw new Error(errors[0].message);
  return !data;
}

export class UsernameTakenError extends Error {
  constructor() {
    super("Ese nombre de usuario ya está cogido.");
  }
}

export async function createProfile(input: { username: string; userId: string; displayName?: string }) {
  const { data, errors } = await db().models.UserProfile.create(input);
  if (errors?.length) {
    // El nombre es la clave: si ya existe, DynamoDB rechaza la escritura condicional.
    if (errors.some((e) => /conditional/i.test(e.errorType ?? "") || /conditional/i.test(e.message))) throw new UsernameTakenError();
    throw new Error(errors[0].message);
  }
  if (!data) throw new Error("No se pudo crear el perfil.");
  return data;
}

/** Busca perfiles cuyo nombre de usuario empiece por el texto o cuyo nombre visible lo contenga. */
export async function searchProfiles(query: string, max = 10) {
  const text = query.trim();
  const username = normalizeUsername(text);
  const results: UserProfile[] = [];
  let nextToken: string | null | undefined;
  // El filtro se aplica después de leer cada página, así que se recorren varias hasta tener resultados.
  for (let page = 0; page < 5 && results.length < max; page++) {
    const { data, errors, nextToken: next } = await db().models.UserProfile.list({
      filter: { or: [{ username: { beginsWith: username } }, { displayName: { contains: text } }] },
      limit: 500,
      nextToken,
    });
    if (errors?.length) throw new Error(errors[0].message);
    results.push(...data);
    nextToken = next;
    if (!nextToken) break;
  }
  return results.slice(0, max);
}

export async function listOutgoingLinks(userId: string) {
  const { data, errors } = await db().models.FriendLink.list({ fromUserId: userId, limit: 1000 });
  if (errors?.length) throw new Error(errors[0].message);
  return data.map((link) => link.toUserId);
}

export async function listIncomingLinks(userId: string) {
  const { data, errors } = await db().models.FriendLink.listFriendLinkByToUserId({ toUserId: userId }, { limit: 1000 });
  if (errors?.length) throw new Error(errors[0].message);
  return data.map((link) => link.fromUserId);
}

export async function createLink(fromUserId: string, toUserId: string) {
  const { errors } = await db().models.FriendLink.create({ fromUserId, toUserId });
  if (errors?.length && !errors.some((e) => /conditional/i.test(`${e.errorType} ${e.message}`))) throw new Error(errors[0].message);
}

export async function deleteLink(fromUserId: string, toUserId: string) {
  const { errors } = await db().models.FriendLink.delete({ fromUserId, toUserId });
  if (errors?.length && !errors.some((e) => /conditional/i.test(`${e.errorType} ${e.message}`))) throw new Error(errors[0].message);
}

export async function getProfileByUsername(username: string) {
  const { data, errors } = await db().models.UserProfile.get({ username });
  if (errors?.length) throw new Error(errors[0].message);
  return data ?? undefined;
}

export async function updateProfile(username: string, changes: ProfileUpdate) {
  const { data, errors } = await db().models.UserProfile.update({ username, ...changes });
  if (errors?.length) throw new Error(errors[0].message);
  if (!data) throw new Error("No se pudo guardar tu perfil.");
  return data;
}

export async function publishTops(username: string, tops: { source: string; artists: PublishedItem[]; tracks: PublishedItem[] }) {
  const { data, errors } = await db().models.UserProfile.update({
    username,
    // Los campos AWSJSON viajan como texto.
    topArtists: JSON.stringify(tops.artists),
    topTracks: JSON.stringify(tops.tracks),
    topsSource: tops.source,
    topsUpdatedAt: new Date().toISOString(),
  });
  if (errors?.length) throw new Error(errors[0].message);
  if (!data) throw new Error("No se pudo publicar tu top.");
  return data;
}

/** Lee un campo AWSJSON publicado, venga como texto o ya convertido. */
export function readPublished(value: unknown): PublishedItem[] {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed) ? (parsed as PublishedItem[]) : [];
  } catch {
    return [];
  }
}

/** Reduce la foto a 256×256 (recorte cuadrado centrado) y la guarda como JPEG en la carpeta del usuario. */
export async function uploadAvatar(file: File) {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 256, 256);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo procesar la imagen."))), "image/jpeg", 0.85));
  const { path } = await uploadData({
    path: ({ identityId }) => `profile-pictures/${identityId}/avatar-${Date.now()}.jpg`,
    data: blob,
    options: { contentType: "image/jpeg" },
  }).result;
  return path;
}

export async function removeAvatar(path: string) {
  await remove({ path }).catch(() => undefined);
}

const avatarUrls = new Map<string, Promise<string>>();

/** URL temporal (1 h) de una foto de perfil; se reutiliza mientras la página siga abierta. */
export function avatarUrl(path: string) {
  let url = avatarUrls.get(path);
  if (!url) {
    url = getUrl({ path, options: { expiresIn: 3600 } }).then(({ url }) => url.toString());
    url.catch(() => avatarUrls.delete(path));
    avatarUrls.set(path, url);
  }
  return url;
}

/** Borra el perfil, la foto y todas las amistades de la persona. La cuenta de Cognito se borra aparte. */
export async function deleteProfileData(profile: UserProfile) {
  const [outgoing, incoming] = await Promise.all([listOutgoingLinks(profile.userId), listIncomingLinks(profile.userId)]);
  await Promise.all([
    ...outgoing.map((to) => deleteLink(profile.userId, to)),
    ...incoming.map((from) => deleteLink(from, profile.userId)),
  ]);
  if (profile.avatarPath) await removeAvatar(profile.avatarPath);
  const { errors } = await db().models.UserProfile.delete({ username: profile.username });
  if (errors?.length) throw new Error(errors[0].message);
}
