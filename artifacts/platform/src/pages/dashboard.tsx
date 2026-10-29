import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import {
  useGetPlatformAgenda,
  useGetPlatformCompanies,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DollarSign,
  CheckCircle2,
  Clock,
  Building2,
  ChevronRight,
  Circle,
  Wallet,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: agenda, isLoading: loadingAgenda } = useGetPlatformAgenda(
    { date: today },
    { query: { queryKey: ["agenda", today] } }
  );
  const { data: companiesData, isLoading: loadingCompanies } = useGetPlatformCompanies(
    { page: 1, limit: 50 },
    { query: { queryKey: ["companies-dashboard"] } }
  );

  const summary = agenda?.data?.summary;
  const bookings = agenda?.data?.bookings ?? [];
  const companies = companiesData?.data ?? [];

  // Total revenue & payout across all companies (historical, completed bookings)
  const totalRevenue = companies.reduce((s, c) => s + (c.totalRevenue ?? 0), 0);
  const totalPayout = companies.reduce((s, c) => s + (c.companyPayout ?? 0), 0);
  const platformProfit = totalRevenue - totalPayout;

  // Group today's bookings by company for the activity section
  const companyActivity = new Map<
    string,
    { id: string; name: string; total: number; completed: number; inProgress: number; pending: number }
  >();

  for (const b of bookings) {
    if (!b.assignedCompanyId || !b.assignedCompanyName) continue;
    if (!companyActivity.has(b.assignedCompanyId)) {
      companyActivity.set(b.assignedCompanyId, {
        id: b.assignedCompanyId,
        name: b.assignedCompanyName,
        total: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
      });
    }
    const stat = companyActivity.get(b.assignedCompanyId)!;
    stat.total++;
    if (b.status === "completed") stat.completed++;
    else if (b.status === "in_progress") stat.inProgress++;
    else if (b.status === "pending" || b.status === "accepted") stat.pending++;
  }

  // Build company rows merging all-time financials + today's activity
  const companyRows = companies.map((c) => ({
    id: c.id,
    name: c.name,
    active: c.active,
    totalRevenue: c.totalRevenue ?? 0,
    companyPayout: c.companyPayout ?? 0,
    commissionRate: c.commissionRate,
    activity: companyActivity.get(c.id),
  }));

  // Sort: highest revenue first
  companyRows.sort((a, b) => b.totalRevenue - a.totalRevenue);

  const isLoading = loadingAgenda || loadingCompanies;

  return (
    <AppLayout>
      {/* Date */}
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs text-muted-foreground capitalize">
          {format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Revenue hero card */}
      <div className="px-4 pb-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 opacity-80" />
              <p className="text-xs font-medium opacity-80">Ingresos totales (citas completadas)</p>
            </div>
            <p className="text-3xl font-bold tracking-tight">
              {isLoading ? "—" : `$${totalRevenue.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            </p>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/20">
              <div>
                <p className="text-[11px] opacity-70">Por pagar a empresas</p>
                <p className="text-base font-bold">
                  {isLoading ? "—" : `$${totalPayout.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                </p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div>
                <p className="text-[11px] opacity-70">Ganancia plataforma</p>
                <p className="text-base font-bold">
                  {isLoading ? "—" : `$${platformProfit.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's quick stats — 3 pills */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-4">
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold leading-tight">
              {loadingAgenda ? "—" : String(summary?.total ?? 0)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Citas hoy</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold leading-tight text-emerald-600">
              {loadingAgenda ? "—" : String(summary?.completed ?? 0)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Completadas</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-3 text-center">
            <p className="text-lg font-bold leading-tight text-amber-600">
              {loadingAgenda ? "—" : String((summary?.pending ?? 0) + (summary?.inProgress ?? 0))}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Companies financial section */}
      <div className="px-4 pb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Empresas — finanzas
          </p>
          <Link href="/companies" className="text-xs text-primary font-medium">
            Ver todas
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-24 p-4" />
              </Card>
            ))}
          </div>
        ) : companyRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Sin empresas registradas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {companyRows.map((company) => (
              <Card key={company.id} className="border border-border/60 shadow-sm overflow-hidden">
                <Link href={`/companies/${company.id}`}>
                  <CardContent className="p-4 space-y-3 cursor-pointer active:bg-muted/30 transition-colors">
                    {/* Company name row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Circle
                          className={`h-2.5 w-2.5 shrink-0 fill-current ${
                            company.active ? "text-emerald-500" : "text-muted-foreground/30"
                          }`}
                        />
                        <p className="font-semibold text-sm truncate">{company.name}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-[10px] text-muted-foreground">
                          {Math.round(company.commissionRate * 100)}% empresa
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    {/* Financial pills */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-emerald-50 rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <DollarSign className="h-3 w-3 text-emerald-600" />
                          <p className="text-[10px] text-emerald-700 font-medium">Generado</p>
                        </div>
                        <p className="text-base font-bold text-emerald-700">
                          ${company.totalRevenue.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Wallet className="h-3 w-3 text-orange-600" />
                          <p className="text-[10px] text-orange-700 font-medium">Por pagar</p>
                        </div>
                        <p className="text-base font-bold text-orange-700">
                          ${company.companyPayout.toLocaleString("es-MX", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>

                    {/* Today's activity (if any) */}
                    {company.activity && company.activity.total > 0 && (
                      <div className="flex items-center gap-2 pt-1 border-t border-border/40">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <p className="text-xs text-muted-foreground">
                          Hoy: {company.activity.total} cita{company.activity.total !== 1 ? "s" : ""}
                          {company.activity.completed > 0 && ` · ${company.activity.completed} ✓`}
                          {company.activity.inProgress > 0 && ` · ${company.activity.inProgress} en curso`}
                          {company.activity.pending > 0 && ` · ${company.activity.pending} pendiente${company.activity.pending !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
