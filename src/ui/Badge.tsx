import type { ComponentProps } from "react";
import { cn } from "./cn";

type Variant = "neutral" | "accent" | "iris";

const variants: Record<Variant, string> = {
  neutral: "bg-ink-700 text-fog-300",
  accent: "bg-flare-500/15 text-flare-400",
  iris: "bg-iris-500/15 text-iris-400",
};

export function Badge({ variant = "neutral", className, ...props }: ComponentProps<"span"> & { variant?: Variant }) {
  return (
    <span
      className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}
      {...props}
    />
  );
}
