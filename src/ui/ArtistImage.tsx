import { cn } from "./cn";
import { gradientFor, hashString } from "./artwork";

type ArtistImageProps = { name: string; imageUrl?: string; rounded?: string; className?: string };

/**
 * Imagen cuadrada de un artista, canción o álbum. Con `imageUrl` muestra esa imagen; sin ella
 * genera una ilustración local (degradado + formas) determinista a partir del nombre.
 * No hace ninguna petición externa por sí misma.
 */
export function ArtistImage({ name, imageUrl, rounded = "rounded-2xl", className }: ArtistImageProps) {
  const base = cn("aspect-square w-full overflow-hidden", rounded);

  if (imageUrl) {
    return <img src={imageUrl} alt="" className={cn(base, "object-cover", className)} />;
  }

  const h = hashString(name);
  const pick = (shift: number, range: number, min = 0) => min + ((h >>> shift) % range);

  return (
    <div aria-hidden className={cn(base, "bg-linear-to-br", gradientFor(name), className)}>
      <svg viewBox="0 0 100 100" className="size-full">
        <circle cx={pick(0, 60, 20)} cy={pick(5, 50, 15)} r={pick(10, 22, 22)} className="fill-fog-100/25" />
        <circle cx={pick(15, 70, 15)} cy={pick(20, 40, 55)} r={pick(3, 18, 12)} className="fill-ink-950/25" />
        <circle cx={pick(8, 50, 25)} cy={pick(13, 50, 25)} r={pick(18, 20, 26)} className="fill-none stroke-fog-100/40 stroke-2" />
        <circle cx={pick(23, 30, 70)} cy={pick(2, 30, 10)} r={pick(7, 6, 4)} className="fill-fog-100/60" />
      </svg>
    </div>
  );
}
