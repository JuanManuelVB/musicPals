import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, Check, Clock, Pencil, Share2, UserMinus, UserPlus, X } from "lucide-react";
import { useAccount } from "@/app/AccountProvider";
import { getProfileByUsername, publishTops, readPublished, type PublishedItem, type UserProfile } from "@/data/account";
import { formatNumber } from "@/lib/format";
import { useFriends } from "@/features/friends/useFriends";
import { ArtistImage } from "@/ui/ArtistImage";
import { Button } from "@/ui/Button";
import { Card, CardTitle } from "@/ui/Card";
import { EmptyState } from "@/ui/EmptyState";
import { EditProfileDialog } from "./EditProfileDialog";
import { ProfileAvatar, profileName } from "./ProfileAvatar";
import { usePublishableTops } from "./usePublishableTops";

export function ProfilePage() {
  const { username = "" } = useParams();
  const { state } = useAccount();
  const [profile, setProfile] = useState<UserProfile | null>();
  const [error, setError] = useState<string>();

  const isMe = state.status === "ready" && state.profile.username === username;

  useEffect(() => {
    if (state.status !== "ready" || isMe) return;
    let cancelled = false;
    setProfile(undefined);
    getProfileByUsername(username)
      .then((p) => !cancelled && setProfile(p ?? null))
      .catch((reason) => !cancelled && setError(reason instanceof Error ? reason.message : "No se pudo cargar el perfil."));
    return () => {
      cancelled = true;
    };
  }, [isMe, state.status, username]);

  const back = (
    <Link to="/amigos" className="mb-6 inline-flex items-center gap-1.5 text-sm text-fog-300 hover:text-fog-100">
      <ArrowLeft className="size-4" aria-hidden />
      Amigos
    </Link>
  );

  if (state.status !== "ready") {
    return (
      <>
        {back}
        <EmptyState icon={UserPlus} title="Inicia sesión para ver perfiles" description="Los perfiles solo son visibles para personas con cuenta en musicPals." />
      </>
    );
  }

  const shown = isMe ? state.profile : profile;
  if (error) return (<>{back}<p className="text-sm text-flare-400">{error}</p></>);
  if (shown === undefined) return (<>{back}<p className="text-sm text-fog-300">Cargando perfil…</p></>);
  if (shown === null) return (<>{back}<EmptyState icon={UserPlus} title="Perfil no encontrado" description={`No existe nadie con el usuario @${username}.`} /></>);

  return (
    <>
      {back}
      <ProfileHeader profile={shown} isMe={isMe} myUserId={state.userId} />
      {isMe && <PublishTopsCard profile={shown} />}
      <PublishedTops profile={shown} isMe={isMe} />
    </>
  );
}

function ProfileHeader({ profile, isMe, myUserId }: { profile: UserProfile; isMe: boolean; myUserId: string }) {
  const [editing, setEditing] = useState(false);
  return (
    <header className="mb-8 flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
      <ProfileAvatar profile={profile} size="xl" />
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-3xl font-semibold">{profileName(profile)}</h1>
        <p className="text-fog-300">@{profile.username}</p>
        {profile.bio && <p className="mt-2 max-w-xl whitespace-pre-line text-sm text-fog-100">{profile.bio}</p>}
      </div>
      {isMe ? (
        <Button variant="secondary" onClick={() => setEditing(true)}>
          <Pencil className="size-4" aria-hidden />
          Editar perfil
        </Button>
      ) : (
        <RelationButtons myUserId={myUserId} userId={profile.userId} username={profile.username} />
      )}
      {editing && <EditProfileDialog profile={profile} onClose={() => setEditing(false)} />}
    </header>
  );
}

function RelationButtons({ myUserId, userId, username }: { myUserId: string; userId: string; username: string }) {
  const friends = useFriends(myUserId);
  if (friends.loading) return null;
  const relation = friends.relationOf(userId);
  if (relation === "friend")
    return (
      <Button variant="ghost" onClick={() => confirm(`¿Eliminar a @${username} de tus amigos?`) && void friends.remove(userId)}>
        <UserMinus className="size-4" aria-hidden />
        Eliminar amigo
      </Button>
    );
  if (relation === "sent")
    return (
      <Button variant="ghost" onClick={() => void friends.cancel(userId)}>
        <Clock className="size-4" aria-hidden />
        Cancelar solicitud
      </Button>
    );
  if (relation === "received")
    return (
      <div className="flex gap-2">
        <Button onClick={() => void friends.add(userId)}>
          <Check className="size-4" aria-hidden />
          Aceptar
        </Button>
        <Button variant="ghost" aria-label="Rechazar" onClick={() => void friends.reject(userId)}>
          <X className="size-4" aria-hidden />
        </Button>
      </div>
    );
  return (
    <Button onClick={() => void friends.add(userId)}>
      <UserPlus className="size-4" aria-hidden />
      Añadir amigo
    </Button>
  );
}

function PublishTopsCard({ profile }: { profile: UserProfile }) {
  const { setProfile } = useAccount();
  const tops = usePublishableTops();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string>();

  async function onPublish() {
    if ("unavailable" in tops) return;
    setPublishing(true);
    setError(undefined);
    try {
      setProfile(await publishTops(profile.username, tops));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo publicar tu top.");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <Card className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex-1">
        <CardTitle>Comparte tu top con tus amigos</CardTitle>
        <p className="mt-1 text-sm text-fog-300">
          {"unavailable" in tops
            ? tops.unavailable
            : `Se publicarán tus 10 artistas y 10 canciones más escuchados (${tops.source}). Solo eso: tu historial completo no sale de tu navegador.`}
        </p>
      </div>
      <Button onClick={() => void onPublish()} disabled={"unavailable" in tops || publishing}>
        <Share2 className="size-4" aria-hidden />
        {publishing ? "Publicando…" : profile.topsUpdatedAt ? "Actualizar" : "Publicar"}
      </Button>
      {error && <p className="text-sm text-flare-400">{error}</p>}
    </Card>
  );
}

function PublishedTops({ profile, isMe }: { profile: UserProfile; isMe: boolean }) {
  const artists = readPublished(profile.topArtists);
  const tracks = readPublished(profile.topTracks);

  if (!artists.length && !tracks.length) {
    return <EmptyState icon={Share2} title="Sin top publicado" description={isMe ? "Publica tu top para que tus amigos vean qué escuchas." : `@${profile.username} todavía no ha compartido su top.`} />;
  }

  return (
    <>
      {profile.topsSource && (
        <p className="mb-4 text-xs text-fog-500">
          {profile.topsSource}
          {profile.topsUpdatedAt && ` · actualizado el ${new Date(profile.topsUpdatedAt).toLocaleDateString("es-ES")}`}
        </p>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <TopList title="Artistas más escuchados" items={artists} />
        <TopList title="Canciones más escuchadas" items={tracks} />
      </div>
    </>
  );
}

function TopList({ title, items }: { title: string; items: PublishedItem[] }) {
  return (
    <Card>
      <CardTitle>{title}</CardTitle>
      <ol className="mt-3 flex flex-col">
        {items.map((item, index) => (
          <li key={`${item.name}-${item.artistName ?? ""}`} className="flex items-center gap-3 border-b border-ink-700 py-2.5 last:border-b-0">
            <span className="w-5 text-right text-sm text-fog-500">{index + 1}</span>
            <ArtistImage name={item.name} imageUrl={item.imageUrl} rounded="rounded-lg" className="size-10 w-10" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{item.name}</p>
              {item.artistName && <p className="truncate text-xs text-fog-300">{item.artistName}</p>}
            </div>
            {item.plays !== undefined && <span className="shrink-0 text-xs text-fog-300">{formatNumber(item.plays)} repr.</span>}
          </li>
        ))}
      </ol>
    </Card>
  );
}
