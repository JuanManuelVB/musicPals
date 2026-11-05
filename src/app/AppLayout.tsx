import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { ChevronDown } from "lucide-react";
import { APP_NAME } from "@/config";
import { cn } from "@/ui/cn";
import { navItems } from "./navigation";
import { SourceSwitcher } from "./SourceSwitcher";
import { UsernameDialog } from "@/features/account/UsernameDialog";

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

function MobileHeader() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const { pathname } = useLocation();

  // Cierra el menú al cambiar de página
  useEffect(() => setOpen(false), [pathname]);

  // Cierra el menú al tocar fuera o pulsar Escape
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!headerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header ref={headerRef} className="sticky top-0 z-10 border-b border-ink-700 bg-ink-950/90 backdrop-blur lg:hidden">
      <div className="px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          className="-mx-2 flex items-center gap-1.5 rounded-xl px-2 py-1 focus-visible:outline-2 focus-visible:outline-iris-400"
        >
          <Brand />
          <ChevronDown className={cn("size-5 text-fog-300 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      </div>
      {open && (
        <nav id="mobile-nav" aria-label="Principal" className="flex flex-col gap-1 border-t border-ink-700 px-3 py-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className={linkClass}>
              <Icon className="size-4.5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

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

      {/* Móvil: cabecera con menú desplegable desde el logo */}
      <MobileHeader />

      <main className="lg:pl-64">
        <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10">
          <SourceSwitcher className="mb-8 w-fit" />
          <Outlet />
          <footer className="mt-12 border-t border-ink-700 pt-6 text-xs text-fog-500">
            <p>
              {APP_NAME} calcula estadísticas de tu música de Spotify y YouTube Music en tu navegador: artistas, canciones, evolución y
              comparativas entre plataformas.
            </p>
            <p className="mt-2">
              <Link className="underline hover:text-fog-300" to="/privacidad">Política de privacidad</Link>
              {" · "}
              <a className="underline hover:text-fog-300" href="mailto:musicpals@nebrisys.com">Contacto</a>
            </p>
          </footer>
        </div>
      </main>

      <UsernameDialog />
    </div>
  );
}
