import { AppLayout } from "@/components/layout/app-layout";
import { useState, useMemo } from "react";
import { useGetPlatformFinance } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import {
  TrendingUp,
  Wallet,
  DollarSign,
  CheckCircle2,
  Building2,
  ChevronRight,
} from "lucide-react";
import { StarRating } from "@/components/ui/star-rating";
import { Link } from "wouter";

type Period = "hoy" | "semana" | "mes" | "todo";

function getDateRange(period: Period): { dateFrom?: string; dateTo?: string } {
  const today = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  if (period === "hoy") return { dateFrom: fmt(today), dateTo: fmt(today) };
  if (period === "semana") return { dateFrom: fmt(startOfWeek(today, { weekStartsOn: 1 })), dateTo: fmt(endOfWeek(today, { weekStartsOn: 1 })) };
  if (period === "mes") return { dateFrom: fmt(startOfMonth(today)), dateTo: fmt(endOfMonth(today)) };
  return {};
}

const PERIOD_LABELS: Record<Period, string> = {
  hoy: "Hoy",
  semana: "Semana",
  mes: "Mes",
  todo: "Todo",
};

const fmt$ = (n: number) =>
  `$${n.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default function Finanzas() {
  const [period, setPeriod] = useState<Period>("mes");

  const { dateFrom, dateTo } = useMemo(() => getDateRange(period), [period]);

  const { data, isLoading } = useGetPlatformFinance(
    { dateFrom, dateTo },
    { query: { queryKey: ["finance", period] } }
  );

  const summary = data?.data;
  const companies = summary?.companies ?? [];

  const periodLabel = useMemo(() => {
    if (period === "hoy") return format(new Date(), "EEEE d 'de' MMMM", { locale: es });
    if (period === "semana") {
      const s = startOfWeek(new Date(), { weekStartsOn: 1 });
      const e = endOfWeek(new Date(), { weekStartsOn: 1 });
      return `${format(s, "d MMM", { locale: es })} – ${format(e, "d MMM", { locale: es })}`;
    }
    if (period === "mes") return format(new Date(), "MMMM yyyy", { locale: es });
    return "Histórico completo";
  }, [period]);

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-6 space-y-4">

        {/* Period chips */}
        <div className="flex gap-2">
          {(["hoy", "semana", "mes", "todo"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                period === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>

        {/* Period label */}
        <p className="text-xs text-muted-foreground capitalize -mt-1">{periodLabel}</p>

        {/* Revenue hero card */}
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 opacity-80" />
              <p className="text-xs font-medium opacity-80">Ingresos de citas completadas</p>
            </div>
            <p className="text-3xl font-bold tracking-tight">
              {isLoading ? "—" : fmt$(summary?.totalRevenue ?? 0)}
            </p>
            <p className="text-xs opacity-60 mt-0.5">
              {isLoading ? "" : `${summary?.totalCompletedBookings ?? 0} cita${(summary?.totalCompletedBookings ?? 0) !== 1 ? "s" : ""} completada${(summary?.totalCompletedBookings ?? 0) !== 1 ? "s" : ""}`}
            </p>

            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/20">
              <div>
                <p className="text-[11px] opacity-70">Por pagar a empresas</p>
                <p className="text-lg font-bold">{isLoading ? "—" : fmt$(summary?.totalPayout ?? 0)}</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-[11px] opacity-70">Tu ganancia</p>
                <p className="text-lg font-bold">{isLoading ? "—" : fmt$(summary?.totalPlatformProfit ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Per-company breakdown */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Por empresa
          </p>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-28 p-4" />
                </Card>
              ))}
            </div>
          ) : companies.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <Building2 className="h-9 w-9 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-muted-foreground">Sin ingresos en este período</p>
              <p className="text-xs text-muted-foreground mt-1">No hay citas completadas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {companies.map((company) => (
                <Card key={company.companyId} className="border border-border/60 shadow-sm overflow-hidden">
                  <Link href={`/companies/${company.companyId}`}>
                    <CardContent className="p-4 space-y-3 cursor-pointer active:bg-muted/30 transition-colors">
                      {/* Header */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{company.companyName}</p>
                          <StarRating rating={company.rating} className="mt-0.5" />
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-muted-foreground">
                            {Math.round(company.commissionRate * 100)}%
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>

                      {/* Stats grid */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-50 rounded-xl px-2.5 py-2">
                          <div className="flex items-center gap-1 mb-0.5">
                            <CheckCircle2 className="h-3 w-3 text-slate-500" />
                            <p className="text-[10px] text-slate-600 font-medium">Citas</p>
                          </div>
                          <p className="text-sm font-bold text-slate-700">{company.completedBookings}</p>
                        </div>
                        <div className="bg-emerald-50 rounded-xl px-2.5 py-2">
                          <div className="flex items-center gap-1 mb-0.5">
                            <DollarSign className="h-3 w-3 text-emerald-600" />
                            <p className="text-[10px] text-emerald-700 font-medium">Generado</p>
                          </div>
                          <p className="text-sm font-bold text-emerald-700">{fmt$(company.revenue)}</p>
                        </div>
                        <div className="bg-orange-50 rounded-xl px-2.5 py-2">
                          <div className="flex items-center gap-1 mb-0.5">
                            <Wallet className="h-3 w-3 text-orange-600" />
                            <p className="text-[10px] text-orange-700 font-medium">Por pagar</p>
                          </div>
                          <p className="text-sm font-bold text-orange-700">{fmt$(company.payout)}</p>
                        </div>
                      </div>

                      {/* Platform profit bar */}
                      <div className="flex items-center justify-between pt-1 border-t border-border/40">
                        <p className="text-xs text-muted-foreground">Tu ganancia de esta empresa</p>
                        <p className="text-xs font-bold text-primary">{fmt$(company.platformProfit)}</p>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
