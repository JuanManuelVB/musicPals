import { platformLabels, platforms, type Platform } from "@/domain/history";
import type { DataSource } from "@/domain/sources";
import type { PlatformBreakdown } from "@/domain/types";
import { formatDuration, formatNumber } from "@/lib/format";
import { Badge } from "./Badge";
import { cn } from "./cn";

/** Clases de color de cada plataforma (tokens definidos en index.css). */
export const platformClasses: Record<Platform, { bg: string; text: string }> = {
  spotify: { bg: "bg-spotify-400", text: "text-spotify-400" },
  ytmusic: { bg: "bg-ytmusic-400", text: "text-ytmusic-400" },
};

const sourceBadgeVariant: Record<DataSource, "iris" | "accent" | "spotify" | "ytmusic" | "combined"> = {
  demo: "iris",
  "spotify-api": "spotify",
  "spotify-zip": "spotify",
  "ytmusic-api": "ytmusic",
  "ytmusic-zip": "ytmusic",
  combined: "combined",
};

export function SourceBadge({ source, label }: { source: DataSource; label: string }) {
  return <Badge variant={sourceBadgeVariant[source]}>{label}</Badge>;
}

export function PlatformDot({ platform, className }: { platform: Platform; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-full", platformClasses[platform].bg, className)} />;
}

export function PlatformLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-4 text-xs text-fog-300", className)}>
      {platforms.map((platform) => (
        <li key={platform} className="flex items-center gap-1.5">
          <PlatformDot platform={platform} />
          {platformLabels[platform]}
        </li>
      ))}
    </ul>
  );
}

type PlatformSplitBarProps = {
  breakdown: PlatformBreakdown;
  metric: "minutes" | "plays";
  className?: string;
};

/** Barra horizontal con la proporción de cada plataforma. */
export function PlatformSplitBar({ breakdown, metric, className }: PlatformSplitBarProps) {
  const total = platforms.reduce((sum, platform) => sum + (breakdown[platform]?.[metric] ?? 0), 0);
  if (total <= 0) return null;
  const description = platforms
    .filter((platform) => breakdown[platform])
    .map((platform) => {
      const value = breakdown[platform]![metric];
      return `${platformLabels[platform]}: ${metric === "minutes" ? formatDuration(value) : `${formatNumber(value)} reproducciones`}`;
    })
    .join(" · ");

  return (
    <div role="img" aria-label={description} title={description} className={cn("flex h-1.5 w-full overflow-hidden rounded-full bg-ink-800", className)}>
      {platforms.map((platform) => {
        const value = breakdown[platform]?.[metric] ?? 0;
        return value > 0 ? <span key={platform} className={platformClasses[platform].bg} style={{ width: `${(value / total) * 100}%` }} /> : null;
      })}
    </div>
  );
}
