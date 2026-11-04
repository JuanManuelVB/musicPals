import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";

type StatCardProps = { label: string; value: string; hint?: string; icon?: LucideIcon };

export function StatCard({ label, value, hint, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-fog-300">{label}</p>
        {Icon && (
          <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-ink-800 text-iris-400">
            <Icon className="size-4" />
          </span>
        )}
      </div>
      <p className="mt-3 font-display text-3xl font-semibold tabular-nums sm:text-4xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-fog-500">{hint}</p>}
    </Card>
  );
}
