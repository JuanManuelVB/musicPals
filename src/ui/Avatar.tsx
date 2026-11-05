import { cn } from "./cn";
import { gradientFor } from "./artwork";

type Size = "sm" | "md" | "lg" | "xl";
type Shape = "circle" | "square";

const sizes: Record<Size, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-14 text-lg",
  xl: "size-24 text-3xl",
};

function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

type AvatarProps = { name: string; imageUrl?: string; size?: Size; shape?: Shape; className?: string };

/** Avatar con foto o, si no hay, con iniciales. */
export function Avatar({ name, imageUrl, size = "md", shape = "circle", className }: AvatarProps) {
  if (imageUrl) {
    return <img src={imageUrl} alt="" className={cn("shrink-0 object-cover", sizes[size], shape === "circle" ? "rounded-full" : "rounded-lg", className)} />;
  }
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
