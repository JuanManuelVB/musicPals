import { useEffect, useState } from "react";
import { avatarUrl, type UserProfile } from "@/data/account";
import { Avatar } from "@/ui/Avatar";

export function profileName(profile: Pick<UserProfile, "displayName" | "username">) {
  return profile.displayName || profile.username;
}

/** Avatar de un perfil: carga su foto si la tiene. */
export function ProfileAvatar({ profile, size, className }: { profile: UserProfile; size?: "sm" | "md" | "lg" | "xl"; className?: string }) {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    setUrl(undefined);
    if (!profile.avatarPath) return;
    let cancelled = false;
    avatarUrl(profile.avatarPath)
      .then((u) => !cancelled && setUrl(u))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [profile.avatarPath]);
  return <Avatar name={profileName(profile)} imageUrl={url} size={size} className={className} />;
}
