import type { DataSource } from "@/domain/sources";
import type { Platform } from "@/domain/history";
import { PlatformDot } from "@/ui/platform";
import { cn } from "@/ui/cn";
import { useMusicData } from "./MusicDataProvider";

type PlatformView = "spotify" | "ytmusic" | "combined";

type ViewOption = {
  value: PlatformView;
  label: string;
  dots: Platform[];
  /** Fuentes que representa, por orden de preferencia: el historial importado es más completo que la API. */
  sources: DataSource[];
  unavailableHint: string;
};

const options: ViewOption[] = [
  {
    value: "spotify",
    label: "Spotify",
    dots: ["spotify"],
    sources: ["spotify-zip", "spotify-api"],
    unavailableHint: "Conecta Spotify o importa tu historial en Ajustes.",
  },
  {
    value: "ytmusic",
    label: "YouTube Music",
    dots: ["ytmusic"],
    sources: ["ytmusic-zip", "ytmusic-api"],
    unavailableHint: "Conecta YouTube Music o importa tu historial en Ajustes.",
  },
  {
    value: "combined",
    label: "Ambas",
    dots: ["spotify", "ytmusic"],
    sources: ["combined"],
    unavailableHint: "Importa los historiales de Spotify y YouTube Music en Ajustes para mezclarlos.",
  },
];

/** Selector de plataforma: Spotify, YouTube Music o ambas mezcladas. */
export function SourceSwitcher({ className }: { className?: string }) {
  const { source, setSource, isAvailable } = useMusicData();

  return (
    <div role="group" aria-label="Plataforma" className={cn("flex flex-wrap gap-1 rounded-xl bg-ink-800 p-1", className)}>
      {options.map((option) => {
        const target = option.sources.find(isAvailable);
        const active = option.sources.includes(source);
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            disabled={!target}
            title={target ? undefined : option.unavailableHint}
            onClick={() => target && setSource(target)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-iris-400",
              "disabled:cursor-not-allowed disabled:opacity-40",
              active ? "bg-ink-600 text-fog-100" : "text-fog-300 hover:text-fog-100",
            )}
          >
            <span className="flex -space-x-1">
              {option.dots.map((platform) => <PlatformDot key={platform} platform={platform} className="ring-2 ring-ink-800" />)}
            </span>
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
