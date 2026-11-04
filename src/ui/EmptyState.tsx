import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-600 px-6 py-16 text-center">
      <Icon className="size-8 text-iris-400" aria-hidden />
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      {description && <p className="mt-1 max-w-sm text-sm text-fog-300">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
