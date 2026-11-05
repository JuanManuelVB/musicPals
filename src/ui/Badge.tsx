import type { ComponentProps } from "react";
import { cn } from "./cn";

type Variant = "neutral" | "accent" | "iris" | "spotify" | "ytmusic" | "combined";

const variants: Record<Variant, string> = {
  neutral: "bg-ink-700 text-fog-300",
  accent: "bg-flare-500/15 text-flare-400",
  iris: "bg-iris-500/15 text-iris-400",
  spotify: "bg-spotify-400/15 text-spotify-400",
  ytmusic: "bg-ytmusic-400/15 text-ytmusic-400",
  combined: "bg-linear-to-r from-spotify-400/20 to-ytmusic-400/20 text-fog-100",
};

export function Badge({ variant = "neutral", className, ...props }: ComponentProps<"span"> & { variant?: Variant }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}
      {...props}
    />
  );
}
