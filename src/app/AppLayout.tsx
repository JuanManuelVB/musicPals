import { NavLink, Outlet } from "react-router";
import { APP_NAME } from "@/config";
import { cn } from "@/ui/cn";
import { navItems } from "./navigation";

function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span aria-hidden className="size-6 rounded-full bg-linear-to-br from-flare-400 to-iris-500" />
      <span className="font-display text-xl font-semibold">{APP_NAME}</span>
    </div>
  );
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
    "focus-visible:outline-2 focus-visible:outline-iris-400",
    isActive ? "bg-ink-700 text-fog-100" : "text-fog-300 hover:bg-ink-800 hover:text-fog-100",
  );

export function AppLayout() {
  return (
    <div className="min-h-dvh">
      {/* Escritorio: barra lateral */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-8 border-r border-ink-700 bg-ink-900/60 p-5 lg:flex">
        <Brand />
        <nav aria-label="Principal" className="flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={linkClass}>
              <Icon className="size-4.5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Móvil: cabecera con navegación desplazable */}
      <header className="sticky top-0 z-10 border-b border-ink-700 bg-ink-950/90 backdrop-blur lg:hidden">
        <div className="px-4 pt-3">
          <Brand />
        </div>
        <nav aria-label="Principal" className="flex gap-1 overflow-x-auto px-3 py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={linkClass}>
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
