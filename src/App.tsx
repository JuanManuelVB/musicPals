import { BrowserRouter, Route, Routes } from "react-router";
import { AppLayout } from "@/app/AppLayout";
import { NotFoundPage } from "@/app/NotFoundPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { RankingsPage } from "@/features/rankings/RankingsPage";
import { EvolutionPage } from "@/features/evolution/EvolutionPage";
import { ComparePage } from "@/features/compare/ComparePage";
import { FriendsPage } from "@/features/friends/FriendsPage";
import { ReportsPage } from "@/features/reports/ReportsPage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { ExtraStatsPage } from "@/features/extra-stats/ExtraStatsPage";
import { SpotifySessionProvider } from "@/app/SpotifySessionProvider";
import { ZipHistoryProvider } from "@/app/ZipHistoryProvider";
import { MusicDataProvider } from "@/app/MusicDataProvider";
import { SpotifyCallbackPage } from "@/app/SpotifyCallbackPage";
import { YouTubeSessionProvider } from "@/app/YouTubeSessionProvider";
import { AccountProvider } from "@/app/AccountProvider";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { PrivacyPage } from "@/features/privacy/PrivacyPage";

export function App() {
  return (
    <AccountProvider>
      <SpotifySessionProvider>
        <YouTubeSessionProvider>
          <ZipHistoryProvider>
            <MusicDataProvider>
              <BrowserRouter basename={import.meta.env.BASE_URL}>
                <Routes>
                  <Route path="callback" element={<SpotifyCallbackPage />} />
                  <Route element={<AppLayout />}>
                    <Route index element={<DashboardPage />} />
                    <Route path="rankings" element={<RankingsPage />} />
                    <Route path="evolucion" element={<EvolutionPage />} />
                    <Route path="estadisticas-extra" element={<ExtraStatsPage />} />
                    <Route path="comparar" element={<ComparePage />} />
                    <Route path="amigos" element={<FriendsPage />} />
                    <Route path="amigos/:username" element={<ProfilePage />} />
                    <Route path="informes" element={<ReportsPage />} />
                    <Route path="ajustes" element={<SettingsPage />} />
                    <Route path="privacidad" element={<PrivacyPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </BrowserRouter>
            </MusicDataProvider>
          </ZipHistoryProvider>
        </YouTubeSessionProvider>
      </SpotifySessionProvider>
    </AccountProvider>
  );
}
