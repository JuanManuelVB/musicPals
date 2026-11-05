import { useEffect, useState, type FormEvent } from "react";
import { AtSign, Check, LoaderCircle, X } from "lucide-react";
import { useAccount } from "@/app/AccountProvider";
import { isUsernameAvailable, normalizeUsername, USERNAME_PATTERN, UsernameTakenError } from "@/data/account";
import { Button } from "@/ui/Button";
import { Card, CardTitle } from "@/ui/Card";

type Availability = "idle" | "invalid" | "checking" | "available" | "taken";

/** Se muestra en el primer inicio de sesión hasta que la persona elige su nombre de usuario. */
export function UsernameDialog() {
  const { state } = useAccount();
  return state.status === "needsUsername" ? <UsernameForm /> : null;
}

function UsernameForm() {
  const { state, claimUsername, signOut } = useAccount();
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState(state.status === "needsUsername" ? (state.suggestedName ?? "") : "");
  const [availability, setAvailability] = useState<Availability>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const normalized = normalizeUsername(username);

  useEffect(() => {
    if (!normalized) return setAvailability("idle");
    if (!USERNAME_PATTERN.test(normalized)) return setAvailability("invalid");
    setAvailability("checking");
    let cancelled = false;
    const timer = setTimeout(() => {
      isUsernameAvailable(normalized)
        .then((free) => !cancelled && setAvailability(free ? "available" : "taken"))
        .catch(() => !cancelled && setAvailability("idle"));
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [normalized]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (availability !== "available") return;
    setSubmitting(true);
    setError(undefined);
    try {
      await claimUsername(normalized, displayName.trim());
    } catch (reason) {
      if (reason instanceof UsernameTakenError) setAvailability("taken");
      setError(reason instanceof Error ? reason.message : "No se pudo guardar tu perfil.");
    } finally {
      setSubmitting(false);
    }
  }

  const hint: Record<Availability, string> = {
    idle: "De 3 a 20 caracteres: letras minúsculas, números, punto o guion bajo.",
    invalid: "Solo minúsculas, números, punto o guion bajo, de 3 a 20 caracteres.",
    checking: "Comprobando…",
    available: "¡Disponible!",
    taken: "Ese nombre ya está cogido.",
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="username-title" className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur">
      <Card className="w-full max-w-md">
        <CardTitle id="username-title">Elige tu nombre de usuario</CardTitle>
        <p className="mt-1 text-sm text-fog-300">Es cómo te encontrarán tus amigos. No podrás cambiarlo más adelante.</p>
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Nombre de usuario
            <span className="flex items-center gap-2 rounded-xl border border-ink-600 bg-ink-950 px-3 focus-within:border-iris-400">
              <AtSign className="size-4 text-fog-500" aria-hidden />
              <input
                autoFocus
                autoCapitalize="none"
                autoComplete="username"
                spellCheck={false}
                maxLength={20}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-10 flex-1 bg-transparent outline-none"
              />
              {availability === "checking" && <LoaderCircle className="size-4 animate-spin text-fog-500" aria-hidden />}
              {availability === "available" && <Check className="size-4 text-emerald-400" aria-hidden />}
              {(availability === "taken" || availability === "invalid") && <X className="size-4 text-flare-400" aria-hidden />}
            </span>
            <span aria-live="polite" className={availability === "taken" || availability === "invalid" ? "text-xs text-flare-400" : "text-xs text-fog-500"}>
              {hint[availability]}
            </span>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            Nombre visible <span className="font-normal text-fog-500">(opcional)</span>
            <input
              maxLength={40}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-10 rounded-xl border border-ink-600 bg-ink-950 px-3 outline-none focus:border-iris-400"
            />
          </label>
          {error && <p className="text-sm text-flare-400">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => void signOut()}>
              Cerrar sesión
            </Button>
            <Button type="submit" disabled={availability !== "available" || submitting}>
              {submitting ? "Guardando…" : "Continuar"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
