import { useRef, useState, type FormEvent } from "react";
import { Camera, Trash2 } from "lucide-react";
import { useAccount } from "@/app/AccountProvider";
import { removeAvatar, updateProfile, uploadAvatar, type UserProfile } from "@/data/account";
import { Avatar } from "@/ui/Avatar";
import { Button } from "@/ui/Button";
import { Card, CardTitle } from "@/ui/Card";
import { ProfileAvatar, profileName } from "./ProfileAvatar";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

export function EditProfileDialog({ profile, onClose }: { profile: UserProfile; onClose: () => void }) {
  const { setProfile, deleteAccount } = useAccount();
  const [displayName, setDisplayName] = useState(profile.displayName ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [photo, setPhoto] = useState<{ file: File; preview: string }>();
  const [removePhoto, setRemovePhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const fileInput = useRef<HTMLInputElement>(null);

  function onPickPhoto(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Elige un archivo de imagen.");
    if (file.size > MAX_PHOTO_BYTES) return setError("La imagen no puede pasar de 10 MB.");
    setError(undefined);
    setRemovePhoto(false);
    setPhoto({ file, preview: URL.createObjectURL(file) });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(undefined);
    try {
      let avatarPath = profile.avatarPath ?? null;
      if (photo) avatarPath = await uploadAvatar(photo.file);
      else if (removePhoto) avatarPath = null;
      const updated = await updateProfile(profile.username, { displayName: displayName.trim() || null, bio: bio.trim() || null, avatarPath });
      // La foto anterior ya no se usa.
      if (profile.avatarPath && profile.avatarPath !== avatarPath) await removeAvatar(profile.avatarPath);
      setProfile(updated);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo guardar tu perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function onDeleteAccount() {
    if (!confirm("Se borrarán tu perfil, tu foto, tus amistades y tu cuenta. No se puede deshacer. ¿Continuar?")) return;
    setSaving(true);
    try {
      await deleteAccount();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No se pudo borrar tu cuenta.");
      setSaving(false);
    }
  }

  const previewName = displayName.trim() || profile.username;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="edit-profile-title" className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink-950/80 p-4 backdrop-blur">
      <Card className="w-full max-w-md">
        <CardTitle id="edit-profile-title">Editar perfil</CardTitle>
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            {photo ? (
              <Avatar name={previewName} imageUrl={photo.preview} size="xl" />
            ) : removePhoto || !profile.avatarPath ? (
              <Avatar name={previewName} size="xl" />
            ) : (
              <ProfileAvatar profile={{ ...profile, displayName: previewName }} size="xl" />
            )}
            <div className="flex flex-col items-start gap-2">
              <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => onPickPhoto(e.target.files?.[0])} />
              <Button size="sm" variant="secondary" onClick={() => fileInput.current?.click()}>
                <Camera className="size-4" aria-hidden />
                Cambiar foto
              </Button>
              {(photo || (profile.avatarPath && !removePhoto)) && (
                <Button size="sm" variant="ghost" onClick={() => (setPhoto(undefined), setRemovePhoto(true))}>
                  Quitar foto
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-fog-300">@{profile.username}</p>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Nombre visible
            <input
              maxLength={40}
              value={displayName}
              placeholder={profileName({ username: profile.username })}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-10 rounded-xl border border-ink-600 bg-ink-950 px-3 outline-none placeholder:text-fog-500 focus:border-iris-400"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Sobre ti
            <textarea
              maxLength={160}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="resize-none rounded-xl border border-ink-600 bg-ink-950 px-3 py-2 outline-none focus:border-iris-400"
            />
            <span className="text-xs font-normal text-fog-500">{bio.length}/160</span>
          </label>
          {error && <p className="text-sm text-flare-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
          <div className="border-t border-ink-700 pt-4">
            <Button size="sm" variant="ghost" className="text-flare-400" onClick={() => void onDeleteAccount()} disabled={saving}>
              <Trash2 className="size-4" aria-hidden />
              Borrar mi cuenta
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
