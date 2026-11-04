import { cn } from "./cn";

/** Barra decorativa: el valor siempre debe aparecer también como texto junto a ella. */
export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const percent = Math.min(100, Math.max(0, value * 100));
  return (
    <div aria-hidden className={cn("h-1.5 overflow-hidden rounded-full bg-ink-700", className)}>
      <div className="h-full rounded-full bg-linear-to-r from-flare-400 to-iris-500" style={{ width: `${percent}%` }} />
    </div>
  );
}
