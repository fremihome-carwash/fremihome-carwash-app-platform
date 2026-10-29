import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Wallet,
  ListOrdered,
  Building2,
  Menu as MenuIcon,
  ChevronLeft,
} from "lucide-react";
import { useGetMe } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MobileFrame } from "@/layouts/MobileFrame";
import type { ReactNode } from "react";

export { MobileFrame };

const tabs = [
  { path: "/dashboard", label: "Inicio", icon: LayoutDashboard },
  { path: "/finanzas", label: "Finanzas", icon: Wallet },
  { path: "/bookings", label: "Citas", icon: ListOrdered },
  { path: "/companies", label: "Empresas", icon: Building2 },
  { path: "/more", label: "Menú", icon: MenuIcon },
];

const moreRoutes = ["/catalog", "/reports", "/more", "/payment-methods"];

export function AppHeader({
  title,
  right,
  subtitle,
  back,
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  back?: string;
}) {
  const [, navigate] = useLocation();
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
    } else if (back) {
      navigate(back);
    }
  };
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-2 py-3 flex items-center justify-between gap-2">
      <div className="flex items-center gap-1 min-w-0 flex-1">
        {back && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 -ml-1"
            data-testid="button-back"
            aria-label="Volver"
            onClick={handleBack}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <div className={cn("min-w-0", !back && "pl-2")}>
          <h1
            className="text-lg font-semibold leading-tight truncate"
            data-testid="app-header-title"
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 pr-2">{right}</div>
    </header>
  );
}

function BottomNav() {
  const [location] = useLocation();
  const isActive = (p: string) => {
    if (p === "/dashboard") return location === "/dashboard" || location === "/";
    if (p === "/more") return moreRoutes.some((r) => location.startsWith(r));
    return location.startsWith(p);
  };
  return (
    <nav className="sticky bottom-0 z-30 bg-background border-t">
      <ul className="grid grid-cols-5">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = isActive(t.path);
          return (
            <li key={t.path}>
              <Link
                href={t.path}
                data-testid={`nav-${t.path.slice(1) || "home"}`}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium hover-elevate active-elevate-2",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

const ROOT_TABS = new Set(["/", "/dashboard", "/finanzas", "/bookings", "/companies", "/more"]);

export function AppLayout({
  children,
  title,
  back,
}: {
  children: ReactNode;
  title?: string;
  /** Path para fallback si no hay historial. Si se omite, se infiere por defecto. */
  back?: string;
}) {
  const [location] = useLocation();
  const { data: me } = useGetMe();

  const headerTitle = title ?? getPageTitle(location);
  const userName = (me as any)?.data?.name ?? "Admin";

  // Auto-detect: si NO estamos en una tab root (match exacto), mostrar back.
  const isRootTab = ROOT_TABS.has(location);
  const backPath = back ?? (isRootTab ? undefined : "/more");

  return (
    <MobileFrame>
      <AppHeader
        title={headerTitle}
        subtitle={userName}
        back={isRootTab ? undefined : backPath}
      />
      <main className="flex-1 overflow-y-auto pb-4">{children}</main>
      <BottomNav />
    </MobileFrame>
  );
}

function getPageTitle(location: string): string {
  if (location === "/" || location === "/dashboard") return "Dashboard";
  if (location.startsWith("/finanzas")) return "Finanzas";
  if (location.startsWith("/agenda")) return "Agenda";
  if (location.startsWith("/bookings")) return "Citas";
  if (location.startsWith("/companies")) return "Empresas";
  if (location.startsWith("/catalog/packages")) return "Paquetes";
  if (location.startsWith("/catalog/wash-types")) return "Tipos de lavado";
  if (location.startsWith("/catalog/services")) return "Servicios";
  if (location.startsWith("/catalog/zones")) return "Zonas";
  if (location.startsWith("/reports/revenue")) return "Ingresos";
  if (location.startsWith("/reports/bookings")) return "Reportes";
  if (location.startsWith("/reports/services")) return "Servicios";
  if (location.startsWith("/reports/memberships")) return "Membresías";
  if (location.startsWith("/payment-methods")) return "Pagos";
  if (location.startsWith("/more")) return "Menú";
  return "Super Admin";
}
