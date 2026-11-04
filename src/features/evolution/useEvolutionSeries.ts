import type { ListeningPoint } from "@/domain/types";
import { useMusicData } from "@/app/MusicDataProvider";

/** Único punto de acceso a la serie temporal histórica. */
export function useEvolutionSeries(): ListeningPoint[] | undefined {
  return useMusicData().series;
}
