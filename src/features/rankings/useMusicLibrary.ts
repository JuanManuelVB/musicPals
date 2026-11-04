import type { MusicLibrary } from "@/domain/types";
import { useMusicData } from "@/app/MusicDataProvider";

/** Único punto de acceso a rankings históricos. */
export function useMusicLibrary(): MusicLibrary | undefined {
  return useMusicData().library;
}
