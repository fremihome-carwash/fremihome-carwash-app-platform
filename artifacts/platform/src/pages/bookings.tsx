import { AppLayout } from "@/components/layout/app-layout";
import { useState, useMemo } from "react";
import { useGetPlatformBookings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SheetSelect } from "@/components/ui/sheet-select";
import { Link } from "wouter";
import {
  Calendar,
  Clock,
  ChevronRight,
  ChevronLeft,
  Building2,
  MapPin,
  Circle,
  ArrowLeft,
  Search,
} from "lucide-react";
import { useGetPlatformCompanies } from "@workspace/api-client-react";
import { StarRating } from "@/components/ui/star-rating";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

type Period = "hoy" | "semana" | "mes" | "todo";

const PERIOD_LABELS: Record<Period, string> = {
  hoy: "Hoy",
  semana: "Semana",
  mes: "Mes",
  todo: "Todo",
};

function getDateRange(period: Period) {
  const today = new Date();
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");
  if (period === "hoy") return { dateFrom: fmt(today), dateTo: fmt(today) };
  if (period === "semana") return { dateFrom: fmt(startOfWeek(today, { weekStartsOn: 1 })), dateTo: fmt(endOfWeek(today, { weekStartsOn: 1 })) };
  if (period === "mes") return { dateFrom: fmt(startOfMonth(today)), dateTo: fmt(endOfMonth(today)) };
  return {};
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  accepted: "Aceptada",
  in_progress: "En curso",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_CLASS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-blue-100 text-blue-800",
  in_progress: "bg-indigo-100 text-indigo-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-800",
};

// ─── Level 2: Bookings for a specific company ────────────────────────────────

function CompanyBookings({
  companyId,
  companyName,
  dateFrom,
  dateTo,
  onBack,
}: {
  companyId: string;
  companyName: string;
  dateFrom?: string;
  dateTo?: string;
  onBack: () => void;
}) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const { data: bookingsData, isLoading } = useGetPlatformBookings(
    {
      companyId,
      page,
      limit: 20,
      search: search || undefined,
      status: status !== "all" ? status : undefined,
      dateFrom,
      dateTo,
    },
    { query: { queryKey: ["bookings", companyId, page, search, status, dateFrom, dateTo] } }
  );

  const bookings = bookingsData?.data ?? [];
  const pagination = bookingsData?.pagination;

  return (
    <>
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <p className="font-bold text-base leading-tight truncate">{companyName}</p>
          <p className="text-xs text-muted-foreground">Citas de esta empresa</p>
        </div>
      </div>

      <div className="px-4 pb-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente, ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-10"
          />
        </div>
        <SheetSelect
          value={status}
          onValueChange={(v) => { setStatus(v); setPage(1); }}
          options={[
            { value: "all", label: "Todos los estados" },
            { value: "pending", label: "Pendiente" },
            { value: "accepted", label: "Aceptada" },
            { value: "in_progress", label: "En curso" },
            { value: "completed", label: "Completada" },
            { value: "cancelled", label: "Cancelada" },
          ]}
          placeholder="Estado"
          title="Filtrar por estado"
        />
      </div>

      <div className="px-4 pb-6 space-y-3">
        {isLoading ? (
          [1, 2, 3].map((i) => <Card key={i} className="animate-pulse"><CardContent className="h-24 p-4" /></Card>)
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Calendar className="h-9 w-9 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Sin citas</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search || status !== "all" ? "Prueba con otro filtro" : "No hay citas para esta empresa"}
            </p>
          </div>
        ) : (
          <>
            {bookings.map((booking) => (
              <Card key={booking.id} className="overflow-hidden hover:bg-muted/30 transition-colors">
                <Link href={`/bookings/${booking.id}`}>
                  <CardContent className="p-4 space-y-2.5 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_CLASS[booking.status] ?? "bg-muted text-muted-foreground"}`}>
                        {STATUS_LABEL[booking.status] ?? booking.status}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base">${booking.totalPrice.toLocaleString()}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="font-semibold text-sm leading-tight">{booking.clientName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {booking.date} · {booking.time}
                      </span>
                      <span className="bg-muted px-1.5 py-0.5 rounded text-[10px] font-medium">
                        {booking.washType?.slug}
                      </span>
                    </div>
                    {booking.addressLabel && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1">{booking.addressLabel}</span>
                      </div>
                    )}
                  </CardContent>
                </Link>
              </Card>
            ))}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-1">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <span className="text-xs text-muted-foreground">{page} / {pagination.totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={page === pagination.totalPages}>
                  Siguiente <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ─── Level 1: Company list with booking summary ───────────────────────────────

function CompanyList({
  period,
  onPeriodChange,
  onSelect,
}: {
  period: Period;
  onPeriodChange: (p: Period) => void;
  onSelect: (id: string, name: string) => void;
}) {
  const { dateFrom, dateTo } = useMemo(() => getDateRange(period), [period]);

  // Fetch bookings for the period to aggregate stats
  const { data: bookingsData, isLoading } = useGetPlatformBookings(
    { dateFrom, dateTo, limit: 500 },
    { query: { queryKey: ["bookings-list-overview", period] } }
  );
  const { data: companiesData } = useGetPlatformCompanies();

  const allBookings = bookingsData?.data ?? [];
  const companiesRatingMap = useMemo(() => {
    const m = new Map<string, number | null>();
    for (const c of companiesData?.data ?? []) m.set(c.id, c.rating ?? null);
    return m;
  }, [companiesData]);

  // Aggregate summary totals
  const summary = useMemo(() => {
    const total = allBookings.length;
    const completed = allBookings.filter((b) => b.status === "completed").length;
    const pending = allBookings.filter((b) => b.status === "pending").length;
    const accepted = allBookings.filter((b) => b.status === "accepted").length;
    const inProgress = allBookings.filter((b) => b.status === "in_progress").length;
    const cancelled = allBookings.filter((b) => b.status === "cancelled").length;
    return { total, completed, pending, accepted, inProgress, cancelled };
  }, [allBookings]);

  // Group by company
  const companies = useMemo(() => {
    const map = new Map<string, {
      id: string; name: string; rating: number | null;
      totalBookings: number; completedBookings: number;
      pendingBookings: number; acceptedBookings: number;
      inProgressBookings: number; cancelledBookings: number;
    }>();

    for (const b of allBookings) {
      const cId = b.assignedCompanyId ?? "__none__";
      const cName = b.assignedCompanyName ?? "Sin empresa";
      if (!map.has(cId)) {
        map.set(cId, {
          id: cId, name: cName,
          rating: companiesRatingMap.get(cId) ?? null,
          totalBookings: 0, completedBookings: 0, pendingBookings: 0,
          acceptedBookings: 0, inProgressBookings: 0, cancelledBookings: 0,
        });
      }
      const entry = map.get(cId)!;
      entry.totalBookings++;
      if (b.status === "completed") entry.completedBookings++;
      else if (b.status === "pending") entry.pendingBookings++;
      else if (b.status === "accepted") entry.acceptedBookings++;
      else if (b.status === "in_progress") entry.inProgressBookings++;
      else if (b.status === "cancelled") entry.cancelledBookings++;
    }

    return Array.from(map.values()).sort((a, b) => b.totalBookings - a.totalBookings);
  }, [allBookings, companiesRatingMap]);

  const skeletons = [1, 2, 3];

  return (
    <>
      {/* Period chips */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex gap-2">
          {(["hoy", "semana", "mes", "todo"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
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
      </div>

      {/* Summary stat grid */}
      <div className="px-4 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="animate-pulse"><CardContent className="h-16 p-4" /></Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-slate-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-none">{summary.total}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Total citas</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                  <span className="text-emerald-600 text-xs font-bold">✓</span>
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-none text-emerald-600">{summary.completed}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Completadas</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <Clock className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-none text-amber-600">{summary.pending + summary.accepted}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Pendientes</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                  <span className="text-red-500 text-xs font-bold">✕</span>
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold leading-none text-red-500">{summary.cancelled}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Canceladas</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Company cards */}
      <div className="px-4 pb-6 space-y-2">
        {isLoading ? (
          skeletons.map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32 p-4" />
            </Card>
          ))
        ) : companies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <Building2 className="h-9 w-9 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Sin citas en este período</p>
          </div>
        ) : (
          companies.map((company) => (
            <Card
              key={company.id}
              className="overflow-hidden hover:bg-muted/30 active:bg-muted/50 transition-colors cursor-pointer shadow-sm"
              onClick={() => onSelect(company.id, company.name)}
            >
              <CardContent className="p-4 space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Circle className="h-2.5 w-2.5 shrink-0 fill-current text-emerald-500 mt-0.5" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm leading-tight truncate">{company.name}</p>
                      <StarRating rating={company.rating} className="mt-0.5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground font-medium">{company.totalBookings} citas</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                {/* Status grid */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex items-center justify-between bg-emerald-50 rounded-lg px-3 py-2">
                    <span className="text-[11px] text-emerald-700 font-medium">Completadas</span>
                    <span className="text-sm font-bold text-emerald-700">{company.completedBookings}</span>
                  </div>
                  <div className="flex items-center justify-between bg-amber-50 rounded-lg px-3 py-2">
                    <span className="text-[11px] text-amber-700 font-medium">Pendientes</span>
                    <span className="text-sm font-bold text-amber-700">{company.pendingBookings}</span>
                  </div>
                  <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                    <span className="text-[11px] text-blue-700 font-medium">Aceptadas</span>
                    <span className="text-sm font-bold text-blue-700">{company.acceptedBookings}</span>
                  </div>
                  <div className="flex items-center justify-between bg-indigo-50 rounded-lg px-3 py-2">
                    <span className="text-[11px] text-indigo-700 font-medium">En curso</span>
                    <span className="text-sm font-bold text-indigo-700">{company.inProgressBookings}</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between bg-red-50 rounded-lg px-3 py-2">
                    <span className="text-[11px] text-red-700 font-medium">Canceladas</span>
                    <span className="text-sm font-bold text-red-700">{company.cancelledBookings}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────

export default function Bookings() {
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(null);
  const [period, setPeriod] = useState<Period>("mes");

  const { dateFrom, dateTo } = useMemo(() => getDateRange(period), [period]);

  return (
    <AppLayout>
      {selected ? (
        <CompanyBookings
          companyId={selected.id}
          companyName={selected.name}
          dateFrom={dateFrom}
          dateTo={dateTo}
          onBack={() => setSelected(null)}
        />
      ) : (
        <CompanyList
          period={period}
          onPeriodChange={setPeriod}
          onSelect={(id, name) => setSelected({ id, name })}
        />
      )}
    </AppLayout>
  );
}
