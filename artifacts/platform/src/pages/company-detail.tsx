import { AppLayout } from "@/components/layout/app-layout";
import {
  useGetPlatformCompany,
  useGetPlatformCompanyReviews,
  useGetPlatformPaymentMethods,
  useActivatePlatformCompany,
  useRejectPlatformCompany,
  useBlockPlatformCompany,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/ui/star-rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

function initialsFromName(name: string | null | undefined): string {
  if (!name) return "··";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "··";
}
import {
  Mail,
  Phone,
  CheckCircle2,
  XCircle,
  ShieldOff,
  ShieldCheck,
  FileText,
  ImageIcon,
  ExternalLink,
  MessageSquare,
  Clock,
  Star,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

// ─── Status config ──────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:  { label: "Pendiente",  className: "bg-amber-100 text-amber-800 border-amber-200" },
  active:   { label: "Activa",     className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  blocked:  { label: "Bloqueada",  className: "bg-red-100 text-red-800 border-red-200" },
  rejected: { label: "Rechazada",  className: "bg-slate-100 text-slate-700 border-slate-200" },
} as const;

const DOC_ICON: Record<string, React.ReactNode> = {
  fiscal:  <FileText className="h-4 w-4 text-blue-500" />,
  id:      <FileText className="h-4 w-4 text-purple-500" />,
  address: <FileText className="h-4 w-4 text-emerald-500" />,
  image:   <ImageIcon className="h-4 w-4 text-orange-500" />,
};

// ─── Confirm sheet wrapper ──────────────────────────────────────────────────

function ConfirmSheet({
  open,
  title,
  description,
  requireReason,
  reasonLabel,
  confirmLabel,
  confirmVariant,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  requireReason?: boolean;
  reasonLabel?: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onCancel(); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl p-0 h-[80vh] overflow-y-auto"
      >
        <SheetHeader className="px-4 pt-4 pb-2 text-left">
          <SheetTitle>{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        {requireReason && (
          <div className="px-4 py-2 space-y-1.5">
            <Label className="text-xs font-semibold">{reasonLabel ?? "Motivo"}</Label>
            <Textarea
              placeholder="Escribe el motivo..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        )}
        <div className="sticky bottom-0 bg-background border-t p-3 flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            className={`flex-1 ${confirmVariant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}`}
            onClick={() => onConfirm(requireReason ? reason : undefined)}
            disabled={requireReason && !reason.trim()}
          >
            {confirmLabel}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function CompanyDetail() {
  const { companyId } = useParams();
  const queryClient = useQueryClient();

  const [dialog, setDialog] = useState<"activate" | "reject" | "block" | "payments" | null>(null);
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

  const { data: companyData, isLoading } = useGetPlatformCompany(
    companyId || "",
    { query: { enabled: !!companyId, queryKey: ["company", companyId] } }
  );

  const { data: paymentMethodsData } = useGetPlatformPaymentMethods({
    query: {
      queryKey: ["payment-methods"],
      staleTime: 0,
      refetchOnMount: "always",
    },
  });

  const { data: reviewsData } = useGetPlatformCompanyReviews(
    companyId || "",
    { query: { enabled: !!companyId, queryKey: ["company-reviews", companyId] } }
  );

  const activate = useActivatePlatformCompany({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["company", companyId] });
        setDialog(null);
      },
    },
  });

  const reject = useRejectPlatformCompany({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["company", companyId] });
        setDialog(null);
      },
    },
  });

  const block = useBlockPlatformCompany({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["company", companyId] });
        setDialog(null);
      },
    },
  });

  useEffect(() => {
    if (dialog === "activate" || dialog === "payments") {
      setSelectedMethods(companyData?.data?.paymentMethods ?? []);
    }
  }, [dialog, companyData?.data?.paymentMethods]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 pt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse"><CardContent className="h-20 p-4" /></Card>
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!companyData?.data) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <p className="text-sm font-medium text-muted-foreground">Empresa no encontrada</p>
        </div>
      </AppLayout>
    );
  }

  const company = companyData.data;
  const status = (company.status ?? "active") as keyof typeof STATUS_CONFIG;
  const allMethods = paymentMethodsData?.data ?? [];
  const statusConfig = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  const reviews = reviewsData?.data ?? [];

  const isPending  = status === "pending";
  const isActive   = status === "active";
  const isBlocked  = status === "blocked";
  const isRejected = status === "rejected";

  const toggleMethod = (id: string) =>
    setSelectedMethods((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );

  return (
    <AppLayout>
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-16 w-16 ring-2 ring-border shrink-0">
            {(company as any).logoUrl && (
              <AvatarImage
                src={(company as any).logoUrl}
                alt={company.name ?? "Logo"}
                className="object-cover"
              />
            )}
            <AvatarFallback className="text-lg font-semibold">
              {initialsFromName(company.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-bold text-xl leading-tight">{company.name}</h1>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusConfig.className}`}>
                {statusConfig.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">ID: {company.id}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-6 space-y-4 mt-4">

        {/* ── PENDING: review banner + action buttons ── */}
        {isPending && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">En espera de revisión</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Esta empresa está pendiente de aprobación. Revisa los documentos antes de activarla.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => setDialog("activate")}
                  disabled={activate.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1.5" /> Activar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                  onClick={() => setDialog("reject")}
                  disabled={reject.isPending}
                >
                  <XCircle className="h-4 w-4 mr-1.5" /> Rechazar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── REJECTED: reason + reactivate ── */}
        {isRejected && (
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <XCircle className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-slate-700">Empresa rechazada</p>
                  {company.rejectionReason && (
                    <p className="text-xs text-slate-600 mt-0.5 italic">"{company.rejectionReason}"</p>
                  )}
                </div>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setDialog("activate")}
                disabled={activate.isPending}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Reactivar empresa
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── BLOCKED: reason + unblock ── */}
        {isBlocked && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2">
                <ShieldOff className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Empresa bloqueada</p>
                  {company.rejectionReason && (
                    <p className="text-xs text-red-600 mt-0.5 italic">"{company.rejectionReason}"</p>
                  )}
                </div>
              </div>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => setDialog("activate")}
                disabled={activate.isPending}
              >
                <ShieldCheck className="h-4 w-4 mr-1.5" /> Desbloquear empresa
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── ACTIVE: block action ── */}
        {isActive && (
          <Button
            variant="outline"
            className="w-full border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => setDialog("block")}
            disabled={block.isPending}
          >
            <ShieldOff className="h-4 w-4 mr-1.5" /> Bloquear empresa
          </Button>
        )}

        {/* ── Payment Methods ── */}
        {isActive && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Métodos de pago aceptados
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialog("payments")}
                data-testid="button-edit-payment-methods"
              >
                Editar
              </Button>
            </div>
            {company.paymentMethods && company.paymentMethods.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {company.paymentMethods.map((methodId) => {
                  const m = allMethods.find((x) => x.id === methodId);
                  return (
                    <span
                      key={methodId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20"
                    >
                      <CheckCircle2 className="h-3 w-3 shrink-0" />
                      {m?.label ?? methodId}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Sin métodos de pago configurados.</p>
            )}
          </div>
        )}

        {/* ── Documents (shown when pending or rejected) ── */}
        {(isPending || isRejected) && company.documents && company.documents.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Documentos para revisión
            </p>
            <div className="space-y-2">
              {company.documents.map((doc, i) => (
                <Card key={i} className="border border-border/60">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    <CardContent className="p-3 flex items-center gap-3 cursor-pointer hover:bg-muted/40 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                        {DOC_ICON[doc.type] ?? <FileText className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{doc.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{doc.type}</p>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </a>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── Contact info ── */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contacto</p>
            {company.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="truncate">{company.email}</span>
              </div>
            )}
            {company.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <span>{company.phone}</span>
              </div>
            )}
            {company.rating != null && (
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-400 fill-amber-400 shrink-0" />
                <StarRating rating={company.rating} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-2">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{company.stats.totalBookings}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{company.stats.completedBookings}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Completadas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-red-600">{company.stats.rejectedBookings}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">Rechazadas</p>
            </CardContent>
          </Card>
        </div>

        {/* ── Reviews ── */}
        {!isPending && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Últimas reseñas
            </p>
            {reviews.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Sin reseñas aún</p>
                </CardContent>
              </Card>
            ) : (
              <div className="overflow-y-auto max-h-80 space-y-2 pr-0.5">
                {reviews.map((review) => {
                  const inner = (
                    <CardContent className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm">{review.clientName}</p>
                        <div className="flex items-center gap-1">
                          <StarRating rating={review.rating} />
                          {review.bookingId && (
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground leading-relaxed">"{review.comment}"</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString("es-MX", {
                          day: "numeric", month: "long", year: "numeric",
                        })}
                      </p>
                    </CardContent>
                  );

                  return review.bookingId ? (
                    <Link key={review.id} href={`/bookings/${review.bookingId}`}>
                      <Card className="overflow-hidden active:bg-muted/40 transition-colors cursor-pointer">
                        {inner}
                      </Card>
                    </Link>
                  ) : (
                    <Card key={review.id} className="overflow-hidden">
                      {inner}
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Sheets ── */}

      {/* Activate sheet with payment methods */}
      <Sheet open={dialog === "activate"} onOpenChange={(o) => !o && setDialog(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-0 h-[80vh] overflow-y-auto"
        >
          <SheetHeader className="px-4 pt-4 pb-2 text-left">
            <SheetTitle>
              {isBlocked ? "¿Desbloquear empresa?" : "¿Activar empresa?"}
            </SheetTitle>
            <SheetDescription>
              Selecciona los métodos de pago que esta empresa puede aceptar.
            </SheetDescription>
          </SheetHeader>

          {allMethods.length > 0 && (
            <div className="px-4 py-2 space-y-1">
              {allMethods.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-3 px-1 py-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedMethods.includes(m.id)}
                    onCheckedChange={() => toggleMethod(m.id)}
                  />
                  <span className="text-sm font-medium">{m.label}</span>
                </label>
              ))}
            </div>
          )}

          <div className="sticky bottom-0 bg-background border-t p-3 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDialog(null)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              disabled={activate.isPending}
              onClick={() =>
                activate.mutate({
                  companyId: companyId!,
                  data: { paymentMethods: selectedMethods },
                })
              }
            >
              {isBlocked ? "Desbloquear" : "Activar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit payment methods sheet (for already-active companies) */}
      <Sheet open={dialog === "payments"} onOpenChange={(o) => !o && setDialog(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-0 h-[80vh] overflow-y-auto"
        >
          <SheetHeader className="px-4 pt-4 pb-2 text-left">
            <SheetTitle>Editar métodos de pago</SheetTitle>
            <SheetDescription>
              Selecciona los métodos de pago que esta empresa puede aceptar.
            </SheetDescription>
          </SheetHeader>

          {allMethods.length > 0 && (
            <div className="px-4 py-2 space-y-1">
              {allMethods.map((m) => (
                <label
                  key={m.id}
                  className="flex items-center gap-3 px-1 py-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    checked={selectedMethods.includes(m.id)}
                    onCheckedChange={() => toggleMethod(m.id)}
                  />
                  <span className="text-sm font-medium">{m.label}</span>
                </label>
              ))}
            </div>
          )}

          <div className="sticky bottom-0 bg-background border-t p-3 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDialog(null)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              disabled={activate.isPending}
              onClick={() =>
                activate.mutate({
                  companyId: companyId!,
                  data: { paymentMethods: selectedMethods },
                })
              }
            >
              Guardar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmSheet
        open={dialog === "reject"}
        title="¿Rechazar empresa?"
        description="La empresa no podrá operar. Indica el motivo del rechazo."
        requireReason
        reasonLabel="Motivo del rechazo"
        confirmLabel="Rechazar"
        confirmVariant="destructive"
        onConfirm={(reason) => reject.mutate({ companyId: companyId!, data: { reason: reason! } })}
        onCancel={() => setDialog(null)}
      />

      <ConfirmSheet
        open={dialog === "block"}
        title="¿Bloquear empresa?"
        description="La empresa no recibirá nuevas citas mientras esté bloqueada. Indica el motivo."
        requireReason
        reasonLabel="Motivo del bloqueo"
        confirmLabel="Bloquear"
        confirmVariant="destructive"
        onConfirm={(reason) => block.mutate({ companyId: companyId!, data: { reason: reason! } })}
        onCancel={() => setDialog(null)}
      />
    </AppLayout>
  );
}
