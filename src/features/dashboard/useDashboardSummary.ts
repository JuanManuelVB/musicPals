import type { ListeningSummary } from "@/domain/types";
import { useMusicData } from "@/app/MusicDataProvider";

/** Único punto de acceso a estadísticas históricas del Dashboard. */
export function useDashboardSummary(): ListeningSummary | undefined {
  return useMusicData().summary;
}
