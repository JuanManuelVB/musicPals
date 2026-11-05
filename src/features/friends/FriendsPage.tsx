import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router";
import { Check, Clock, LogIn, LogOut, Search, UserMinus, UserPlus, UserRound, Users, X } from "lucide-react";
import { useAccount } from "@/app/AccountProvider";
import { searchProfiles, type UserProfile } from "@/data/account";
import { PageHeader } from "@/ui/PageHeader";
import { EmptyState } from "@/ui/EmptyState";
import { ProfileAvatar, profileName as nameOf } from "@/features/profile/ProfileAvatar";
import { Button } from "@/ui/Button";
import { Card, CardTitle } from "@/ui/Card";
import { useFriends, type Relation } from "./useFriends";

export function FriendsPage() {
  const { state, signIn, signOut } = useAccount();

  return (
    <>
      <PageHeader title="Amigos" description="Tus amistades y solicitudes pendientes." />
      {state.status === "unavailable" && (
        <EmptyState icon={Users} title="Sección en construcción" description="Las cuentas todavía no están activadas en esta versión." />
      )}
      {state.status === "loading" && <p className="text-sm text-fog-300">Cargando tu cuenta…</p>}
      {state.status === "error" && <p className="text-sm text-flare-400">{state.error}</p>}
      {(state.status === "signedOut" || state.status === "needsUsername") && (
        <EmptyState
          icon={Users}
          title="Inicia sesión para encontrar a tus amigos"
          description={state.status === "signedOut" && state.error ? state.error : "Crea tu perfil con tu cuenta de Google y busca a tus amigos por su nombre de usuario."}
          action={
            <Button onClick={() => void signIn()}>
              <LogIn className="size-4" aria-hidden />
              Iniciar sesión con Google
            </Button>
          }
        />
      )}
      {state.status === "ready" && (
        <div className="flex flex-col gap-6">
          <Card className="flex items-center gap-4">
            <ProfileAvatar profile={state.profile} size="lg" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{nameOf(state.profile)}</p>
              <p className="truncate text-sm text-fog-300">@{state.profile.username}</p>
            </div>
            <Link
              to={`/amigos/${state.profile.username}`}
              className="inline-flex h-8 items-center gap-2 rounded-xl bg-ink-700 px-3 text-sm font-medium text-fog-100 hover:bg-ink-600"
            >
              <UserRound className="size-4" aria-hidden />
              Mi perfil
            </Link>
            <Button variant="ghost" size="sm" aria-label="Cerrar sesión" onClick={() => void signOut()}>
              <LogOut className="size-4" aria-hidden />
            </Button>
          </Card>
          <FriendsSection myUserId={state.userId} />
        </div>
      )}
    </>
  );
}

function FriendsSection({ myUserId }: { myUserId: string }) {
  const friends = useFriends(myUserId);

  return (
    <>
      <SearchCard myUserId={myUserId} relationOf={friends.relationOf} onAdd={friends.add} />
      {friends.error && <p className="text-sm text-flare-400">{friends.error}</p>}

      {friends.received.length > 0 && (
        <ProfileList title="Solicitudes recibidas">
          {friends.received.map((p) => (
            <ProfileRow key={p.userId} profile={p}>
              <Button size="sm" onClick={() => void friends.add(p.userId)}>
                <Check className="size-4" aria-hidden />
                Aceptar
              </Button>
              <Button size="sm" variant="ghost" aria-label={`Rechazar a @${p.username}`} onClick={() => void friends.reject(p.userId)}>
                <X className="size-4" aria-hidden />
              </Button>
            </ProfileRow>
          ))}
        </ProfileList>
      )}

      <ProfileList title="Tus amigos">
        {friends.loading ? (
          <p className="text-sm text-fog-300">Cargando…</p>
        ) : friends.friends.length === 0 ? (
          <p className="text-sm text-fog-300">Todavía no tienes amigos. Búscalos arriba por su nombre de usuario.</p>
        ) : (
          friends.friends.map((p) => (
            <ProfileRow key={p.userId} profile={p}>
              <Button size="sm" variant="ghost" aria-label={`Eliminar a @${p.username}`} onClick={() => confirm(`¿Eliminar a @${p.username} de tus amigos?`) && void friends.remove(p.userId)}>
                <UserMinus className="size-4" aria-hidden />
              </Button>
            </ProfileRow>
          ))
        )}
      </ProfileList>

      {friends.sent.length > 0 && (
        <ProfileList title="Solicitudes enviadas">
          {friends.sent.map((p) => (
            <ProfileRow key={p.userId} profile={p}>
              <Button size="sm" variant="ghost" onClick={() => void friends.cancel(p.userId)}>
                Cancelar
              </Button>
            </ProfileRow>
          ))}
        </ProfileList>
      )}
    </>
  );
}

function SearchCard({ myUserId, relationOf, onAdd }: { myUserId: string; relationOf: (id: string) => Relation; onAdd: (id: string) => Promise<void> }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserProfile[]>();
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const text = query.trim();
    if (text.length < 2) {
      setResults(undefined);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(() => {
      searchProfiles(text)
        .then((found) => !cancelled && (setResults(found.filter((p) => p.userId !== myUserId)), setError(undefined)))
        .catch((reason) => !cancelled && setError(reason instanceof Error ? reason.message : "No se pudo buscar."))
        .finally(() => !cancelled && setSearching(false));
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [myUserId, query]);

  return (
    <Card>
      <CardTitle>Buscar amigos</CardTitle>
      <label className="mt-4 flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-950 px-3 focus-within:border-iris-400">
        <Search className="size-4 text-fog-500" aria-hidden />
        <span className="sr-only">Nombre de usuario</span>
        <input
          type="search"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="Nombre de usuario o nombre"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-10 flex-1 bg-transparent outline-none placeholder:text-fog-500"
        />
      </label>
      {error && <p className="mt-3 text-sm text-flare-400">{error}</p>}
      {searching && <p className="mt-3 text-sm text-fog-300">Buscando…</p>}
      {!searching && results && results.length === 0 && <p className="mt-3 text-sm text-fog-300">No hay nadie con ese nombre.</p>}
      {!searching && results && results.length > 0 && (
        <div className="mt-3 flex flex-col">
          {results.map((p) => (
            <ProfileRow key={p.userId} profile={p}>
              <RelationAction relation={relationOf(p.userId)} onAdd={() => void onAdd(p.userId)} />
            </ProfileRow>
          ))}
        </div>
      )}
    </Card>
  );
}

function RelationAction({ relation, onAdd }: { relation: Relation; onAdd: () => void }) {
  if (relation === "friend")
    return (
      <span className="flex items-center gap-1 text-sm text-fog-300">
        <Check className="size-4" aria-hidden /> Amigos
      </span>
    );
  if (relation === "sent")
    return (
      <span className="flex items-center gap-1 text-sm text-fog-300">
        <Clock className="size-4" aria-hidden /> Enviada
      </span>
    );
  return (
    <Button size="sm" onClick={onAdd}>
      {relation === "received" ? <Check className="size-4" aria-hidden /> : <UserPlus className="size-4" aria-hidden />}
      {relation === "received" ? "Aceptar" : "Añadir"}
    </Button>
  );
}

function ProfileList({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <div className="mt-3 flex flex-col">{children}</div>
    </Card>
  );
}

function ProfileRow({ profile, children }: { profile: UserProfile; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-ink-700 py-3 last:border-b-0">
      <Link to={`/amigos/${profile.username}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-xl hover:text-fog-100">
        <ProfileAvatar profile={profile} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{nameOf(profile)}</p>
          <p className="truncate text-xs text-fog-300">@{profile.username}</p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-1">{children}</div>
    </div>
  );
}
