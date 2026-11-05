import { useCallback, useEffect, useMemo, useState } from "react";
import { createLink, deleteLink, getProfileByUserId, listIncomingLinks, listOutgoingLinks, type UserProfile } from "@/data/account";

export type Relation = "friend" | "sent" | "received" | "none";

/** Amistades de la persona con sesión: amigos, solicitudes recibidas y enviadas. */
export function useFriends(myUserId: string) {
  const [outgoing, setOutgoing] = useState<string[]>([]);
  const [incoming, setIncoming] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  const reload = useCallback(async () => {
    try {
      setError(undefined);
      const [out, inc] = await Promise.all([listOutgoingLinks(myUserId), listIncomingLinks(myUserId)]);
      setOutgoing(out);
      setIncoming(inc);
      const ids = [...new Set([...out, ...inc])];
      const found: (UserProfile | undefined)[] = await Promise.all(ids.map((id) => getProfileByUserId(id).catch(() => undefined)));
      setProfiles(Object.fromEntries(found.filter((p): p is UserProfile => Boolean(p)).map((p) => [p.userId, p])));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudieron cargar tus amistades.");
    } finally {
      setLoading(false);
    }
  }, [myUserId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const groups = useMemo(() => {
    const out = new Set(outgoing);
    const inc = new Set(incoming);
    const pick = (ids: string[]) => ids.map((id) => profiles[id]).filter((p): p is UserProfile => Boolean(p));
    return {
      friends: pick(outgoing.filter((id) => inc.has(id))),
      sent: pick(outgoing.filter((id) => !inc.has(id))),
      received: pick(incoming.filter((id) => !out.has(id))),
      relationOf(userId: string): Relation {
        if (out.has(userId) && inc.has(userId)) return "friend";
        if (out.has(userId)) return "sent";
        if (inc.has(userId)) return "received";
        return "none";
      },
    };
  }, [incoming, outgoing, profiles]);

  const run = useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        setError(undefined);
        await action();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "No se pudo completar la operación.");
      }
      await reload();
    },
    [reload],
  );

  return {
    ...groups,
    loading,
    error,
    /** Enviar solicitud, o aceptarla si la otra persona ya te la había enviado. */
    add: (userId: string) => run(() => createLink(myUserId, userId)),
    /** Rechazar una solicitud recibida. */
    reject: (userId: string) => run(() => deleteLink(userId, myUserId)),
    /** Cancelar una solicitud enviada. */
    cancel: (userId: string) => run(() => deleteLink(myUserId, userId)),
    /** Eliminar una amistad (borra los dos sentidos). */
    remove: (userId: string) => run(() => Promise.all([deleteLink(myUserId, userId), deleteLink(userId, myUserId)])),
  };
}
