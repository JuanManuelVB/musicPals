import { cn } from "./cn";
import { gradientFor } from "./artwork";

type Size = "sm" | "md" | "lg";
type Shape = "circle" | "square";

const sizes: Record<Size, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
};

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

type AvatarProps = { name: string; size?: Size; shape?: Shape; className?: string };

/** Avatar con iniciales. Más adelante podrá aceptar una imagen sin cambiar su uso. */
export function Avatar({ name, size = "md", shape = "circle", className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-linear-to-br font-display font-semibold text-ink-950",
        gradientFor(name),
        sizes[size],
        shape === "circle" ? "rounded-full" : "rounded-lg",
        className,
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
