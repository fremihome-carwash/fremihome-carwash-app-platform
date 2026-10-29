import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGetPlatformAgenda } from "@workspace/api-client-react";
import { format } from "date-fns";
import { useState } from "react";
import { CalendarIcon, MapPin, Car, Phone, Clock, Search, ChevronRight, Building2 } from "lucide-react";
import { Link } from "wouter";

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

export default function Agenda() {
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [search, setSearch] = useState("");

  const { data: agenda, isLoading } = useGetPlatformAgenda(
    { date },
    { query: { queryKey: ["agenda", date] } }
  );

  const bookings = (agenda?.data?.bookings ?? []).filter((b) => {
    const q = search.toLowerCase();
    return (
      !q ||
      b.clientName.toLowerCase().includes(q) ||
      b.id.toLowerCase().includes(q) ||
      (b.addressFull ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <AppLayout>
      {/* Toolbar */}
      <div className="px-4 pt-4 pb-3 space-y-2">
        {/* Date picker */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 flex-1"
          />
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cliente, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Summary pills */}
      {agenda?.data?.summary && (
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
          {[
            { label: "Total", val: agenda.data.summary.total, color: "bg-muted" },
            { label: "Pendientes", val: agenda.data.summary.pending, color: "bg-amber-100 text-amber-800" },
            { label: "En curso", val: agenda.data.summary.inProgress, color: "bg-indigo-100 text-indigo-800" },
            { label: "Completadas", val: agenda.data.summary.completed, color: "bg-emerald-100 text-emerald-800" },
          ].map((s) => (
            <span key={s.label} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${s.color}`}>
              <span className="font-bold">{s.val}</span> {s.label}
            </span>
          ))}
        </div>
      )}

      {/* List */}
      <div className="px-4 pb-6 space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="h-28 p-4" />
              </Card>
            ))}
          </>
        ) : bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarIcon className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">Sin citas</p>
            <p className="text-xs text-muted-foreground mt-1">
              {search ? "Prueba con otro criterio" : "No hay citas para esta fecha"}
            </p>
          </div>
        ) : (
          bookings.map((booking) => (
            <Card key={booking.id} className="overflow-hidden hover:bg-muted/30 transition-colors">
              <Link href={`/bookings/${booking.id}`}>
                <CardContent className="p-4 space-y-3 cursor-pointer">
                  {/* Row 1: time + status + arrow */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-bold text-base">{booking.time}</span>
                      <span
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          STATUS_CLASS[booking.status] ?? "bg-muted text-muted-foreground"
                        }`}
                      >
                        {STATUS_LABEL[booking.status] ?? booking.status}
                      </span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Row 2: client name */}
                  <p className="font-semibold text-sm leading-tight">{booking.clientName}</p>

                  {/* Row 3: vehicle + wash */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Car className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      {[booking.vehicleBrand, booking.vehicleModel, booking.vehicleColor]
                        .filter(Boolean)
                        .join(" · ")}
                    </span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {booking.vehicleSize?.slug}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {booking.washType?.slug}
                    </Badge>
                  </div>

                  {/* Row 4: phone + address */}
                  <div className="flex flex-col gap-1">
                    {booking.clientPhone && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{booking.clientPhone}</span>
                      </div>
                    )}
                    {booking.addressFull && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{booking.addressFull}</span>
                      </div>
                    )}
                  </div>

                  {/* Row 5: assigned company */}
                  {booking.assignedCompanyName && (
                    <div className="flex items-center gap-2 pt-1 border-t border-border/60">
                      <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="text-xs font-medium text-primary">{booking.assignedCompanyName}</span>
                    </div>
                  )}
                </CardContent>
              </Link>
            </Card>
          ))
        )}
      </div>
    </AppLayout>
  );
}
