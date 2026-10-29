import { AppLayout } from "@/components/layout/app-layout";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { Link, useLocation } from "wouter";
import {
  PackageSearch,
  Wrench,
  MapPin,
  TrendingUp,
  BarChart3,
  CreditCard,
  ChevronRight,
  LogOut,
  Droplets,
} from "lucide-react";

const sections = [
  { href: "/catalog/packages",   label: "Paquetes",         icon: PackageSearch, desc: "Catálogo de paquetes" },
  { href: "/catalog/wash-types", label: "Tipos de lavado",  icon: Droplets,      desc: "Servicios agrupados sin duración" },
  { href: "/catalog/services",   label: "Servicios",        icon: Wrench,        desc: "Precios por servicio" },
  { href: "/catalog/zones",     label: "Zonas",              icon: MapPin,        desc: "Zonas de cobertura" },
  { href: "/payment-methods",   label: "Métodos de pago",    icon: CreditCard,    desc: "Métodos aceptados en la plataforma" },
  { href: "/reports/revenue",   label: "Ingresos",           icon: TrendingUp,    desc: "Reportes de ingresos" },
  { href: "/reports/bookings",  label: "Reportes",           icon: BarChart3,     desc: "Estadísticas de citas" },
];

export default function More() {
  const [location] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => {
        localStorage.removeItem("platform_token");
        window.location.href = "/login";
      },
    });
  };

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-6 space-y-2">
        {/* User info card */}
        <div className="bg-muted/50 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">
              {(user?.data?.name ?? "A").charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm leading-tight">{user?.data?.name ?? "Admin"}</p>
            <p className="text-xs text-muted-foreground">Super Administrador</p>
          </div>
        </div>

        {/* Section list */}
        <div className="rounded-2xl border border-border/60 overflow-hidden bg-card shadow-sm divide-y divide-border/60">
          {sections.map((item) => {
            const active = location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-muted/50 ${
                  active ? "bg-primary/5" : ""
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-none mb-0.5 ${active ? "text-primary" : ""}`}>
                    {item.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </Link>
            );
          })}
        </div>

        {/* Logout */}
        <div className="rounded-2xl border border-border/60 overflow-hidden bg-card shadow-sm">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3.5 w-full text-left transition-colors active:bg-muted/50"
          >
            <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <LogOut className="h-4 w-4 text-destructive" />
            </div>
            <span className="text-sm font-medium text-destructive">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </AppLayout>
  );
}
