import { AppLayout } from "@/components/layout/app-layout";
import {
  useGetPlatformBooking,
  useGetPlatformBookingReview,
  useAcceptPlatformBooking,
  useCompletePlatformBooking,
  useStartPlatformBooking,
  useRejectPlatformBooking,
  useCancelPlatformBooking,
} from "@workspace/api-client-react";
import { StarRating } from "@/components/ui/star-rating";
import { useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Car,
  MapPin,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  Play,
  XCircle,
  Building2,
  MessageSquare,
  Wallet,
  PlayCircle,
  StopCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

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

const VEHICLE_SIZE_LABEL: Record<string, string> = {
  small: "Pequeño",
  suv: "SUV",
  large: "Grande",
};

const CLEANLINESS_LABEL: Record<string, string> = {
  excelente: "Excelente",
  buena: "Buena",
  regular: "Regular",
  mala: "Mala",
};

const PUNCTUALITY_LABEL: Record<string, string> = {
  a_tiempo: "A tiempo",
  leve_retraso: "Leve retraso",
  retraso: "Con retraso",
};

const EXTRA_LABEL: Record<string, string> = {
  amabilidad: "Amabilidad",
  productos: "Buenos productos",
  rapidez: "Rapidez",
  detallado: "Trabajo detallado",
  recomendaria: "Lo recomendaría",
};

function formatTime(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });
}

function formatDateTime(iso?: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function BookingDetail() {
  const { bookingId } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bookingData, isLoading } = useGetPlatformBooking(
    bookingId || "",
    { query: { enabled: !!bookingId, queryKey: ["booking", bookingId] } }
  );

  const { data: reviewData } = useGetPlatformBookingReview(
    bookingId || "",
    { query: { enabled: !!bookingId, queryKey: ["booking-review", bookingId] } }
  );

  const accept = useAcceptPlatformBooking();
  const start = useStartPlatformBooking();
  const complete = useCompletePlatformBooking();
  const reject = useRejectPlatformBooking();
  const cancel = useCancelPlatformBooking();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
    queryClient.invalidateQueries({ queryKey: ["booking-review", bookingId] });
    queryClient.invalidateQueries({ queryKey: ["bookings"] });
    queryClient.invalidateQueries({ queryKey: ["agenda"] });
  };

  const handleAction = (mutation: any, data?: any, successMessage?: string) => {
    mutation.mutate(
      { bookingId: bookingId!, data },
      {
        onSuccess: () => {
          toast({ title: "Listo", description: successMessage || "Acción completada" });
          invalidate();
        },
        onError: (err: any) => {
          toast({
            title: "Error",
            description: err.response?.data?.message || "No se pudo completar la acción",
            variant: "destructive",
          });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 pt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-20 p-4" />
            </Card>
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!bookingData?.data) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <p className="text-sm text-muted-foreground">Cita no encontrada</p>
        </div>
      </AppLayout>
    );
  }

  const booking = bookingData.data as any;
  const review = reviewData?.data as any;
  const statusClass = STATUS_CLASS[booking.status] ?? "bg-muted text-muted-foreground";
  const statusLabel = STATUS_LABEL[booking.status] ?? booking.status;
  const vehicleSizeName =
    VEHICLE_SIZE_LABEL[booking.vehicleSize?.slug] ??
    booking.vehicleSize?.name ??
    booking.vehicleSize?.slug ??
    "—";
  const washTypeName = booking.washType?.name ?? booking.washType?.slug ?? "—";
  const usedPackage = !!booking.usedMembershipId;
  const showTimings =
    booking.status === "in_progress" ||
    booking.status === "completed" ||
    booking.startedAt ||
    booking.completedAt;

  return (
    <AppLayout>
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="font-bold text-lg leading-tight">Detalle de cita</h1>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusClass}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">ID: {booking.id}</p>
      </div>

      <div className="px-4 pb-6 space-y-4 mt-3">
        {["pending", "accepted", "in_progress"].includes(booking.status) && (
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Acciones</p>
              {booking.status === "pending" && (
                <Button
                  className="w-full"
                  onClick={() => handleAction(accept, undefined, "Cita aceptada")}
                  disabled={accept.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Aceptar cita
                </Button>
              )}
              {booking.status === "accepted" && (
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={() => handleAction(start, undefined, "Servicio iniciado")}
                  disabled={start.isPending}
                >
                  <Play className="h-4 w-4 mr-2" /> Iniciar servicio
                </Button>
              )}
              {booking.status === "in_progress" && (
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleAction(complete, undefined, "Servicio completado")}
                  disabled={complete.isPending}
                >
                  <CheckCircle className="h-4 w-4 mr-2" /> Completar servicio
                </Button>
              )}
              {["pending", "accepted"].includes(booking.status) && (
                <Button
                  variant="outline"
                  className="w-full text-destructive border-destructive/30"
                  onClick={() => {
                    const reason = prompt("Motivo de cancelación:");
                    if (reason) handleAction(cancel, { reason }, "Cita cancelada");
                  }}
                  disabled={cancel.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" /> Cancelar cita
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Programación</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Fecha
              </span>
              <span className="font-medium">{booking.date}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" /> Hora agendada
              </span>
              <span className="font-medium">{booking.time}</span>
            </div>
            {showTimings && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <PlayCircle className="h-4 w-4" /> Hora de inicio
                  </span>
                  <span className="font-medium">{formatTime(booking.startedAt)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <StopCircle className="h-4 w-4" /> Hora de finalización
                  </span>
                  <span className="font-medium">{formatTime(booking.completedAt)}</span>
                </div>
              </>
            )}
            {booking.assignedCompanyName && (
              <div className="flex items-center gap-3 text-sm pt-1 border-t border-border/60 mt-1">
                <Building2 className="h-4 w-4 text-primary shrink-0" />
                <span className="font-medium text-primary">{booking.assignedCompanyName}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente</p>
            <div className="flex items-center gap-3 text-sm">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium truncate">{booking.clientName}</span>
            </div>
            {booking.clientPhone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{booking.clientPhone}</span>
              </div>
            )}
            {booking.clientEmail && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{booking.clientEmail}</span>
              </div>
            )}
            {booking.addressFull && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{booking.addressFull}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Servicio</p>
            <div className="flex items-center gap-3 text-sm">
              <Car className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">
                {[booking.vehicleBrand, booking.vehicleModel].filter(Boolean).join(" ") || "—"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Tamaño</p>
                <p className="font-medium">{vehicleSizeName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Color</p>
                <p className="font-medium">{booking.vehicleColor ?? "—"}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Placas</p>
                <p className="font-medium">{booking.vehiclePlate ?? "—"}</p>
              </div>
            </div>
            <div className="border-t border-border/60 pt-3">
              <p className="text-xs text-muted-foreground">Tipo de lavado</p>
              <p className="text-sm font-medium">{washTypeName}</p>
            </div>
            {booking.addOns?.length > 0 && (
              <div className="border-t border-border/60 pt-3">
                <p className="text-xs text-muted-foreground mb-1">Adicionales</p>
                <ul className="text-sm space-y-0.5">
                  {booking.addOns.map((a: any) => (
                    <li key={a.id}>· {a.name ?? a.slug}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <span className="text-sm text-muted-foreground flex items-center gap-2">
                <Wallet className="h-4 w-4" /> Método de pago
              </span>
              <span className={`text-sm font-semibold ${usedPackage ? "text-emerald-600" : ""}`}>
                {usedPackage ? "Pago con paquete" : "Pago directo"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-bold text-lg">${Number(booking.totalPrice ?? 0).toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        {booking.status === "completed" && (
          <Card className={review ? "border-amber-200 bg-amber-50/40" : ""}>
            <CardContent className="p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reseña del cliente</p>
              {review ? (
                <>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <span className="text-sm font-medium truncate">{review.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StarRating rating={review.rating} />
                      <span className="text-sm font-semibold text-amber-700">
                        {Number(review.rating).toFixed(1)}
                      </span>
                    </div>
                  </div>
                  {review.comment ? (
                    <p className="text-sm text-foreground/90 italic leading-relaxed border-l-2 border-amber-300 pl-3">
                      “{review.comment}”
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">El cliente no dejó comentario.</p>
                  )}
                  {(review.cleanliness || review.punctuality) && (
                    <div className="flex flex-wrap gap-3 text-xs text-foreground/80 pt-1">
                      {review.cleanliness && (
                        <span>
                          <span className="text-muted-foreground">Limpieza: </span>
                          <span className="font-semibold">
                            {CLEANLINESS_LABEL[review.cleanliness] ?? review.cleanliness}
                          </span>
                        </span>
                      )}
                      {review.punctuality && (
                        <span>
                          <span className="text-muted-foreground">Puntualidad: </span>
                          <span className="font-semibold">
                            {PUNCTUALITY_LABEL[review.punctuality] ?? review.punctuality}
                          </span>
                        </span>
                      )}
                    </div>
                  )}
                  {Array.isArray(review.extras) && review.extras.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {review.extras.map((tag: string) => (
                        <span
                          key={tag}
                          className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium"
                        >
                          {EXTRA_LABEL[tag] ?? tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-muted-foreground pt-1 border-t border-amber-200/60">
                    Enviada el {formatDateTime(review.createdAt)}
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-3 py-2 text-muted-foreground">
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <p className="text-sm">El cliente aún no ha dejado una reseña</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
