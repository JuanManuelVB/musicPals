import { ArrowLeftRight, ChartNoAxesCombined, LayoutDashboard, Settings, Share2, TrendingUp, Trophy, Users, type LucideIcon } from "lucide-react";

export type NavItem = { to: string; label: string; icon: LucideIcon };

export const navItems: NavItem[] = [
  { to: "/", label: "Inicio", icon: LayoutDashboard },
  { to: "/rankings", label: "Rankings", icon: Trophy },
  { to: "/evolucion", label: "Evolución", icon: TrendingUp },
  { to: "/estadisticas-extra", label: "Estadísticas extra", icon: ChartNoAxesCombined },
  { to: "/comparar", label: "Comparar", icon: ArrowLeftRight },
  { to: "/amigos", label: "Amigos", icon: Users },
  { to: "/informes", label: "Informes", icon: Share2 },
  { to: "/ajustes", label: "Ajustes", icon: Settings },
];
