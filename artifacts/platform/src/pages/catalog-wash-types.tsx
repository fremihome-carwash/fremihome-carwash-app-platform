import { AppLayout } from "@/components/layout/app-layout";
import {
  useGetPlatformWashTypes,
  useUpdatePlatformWashType,
  useCreatePlatformWashType,
  useDeletePlatformWashType,
  useGetPlatformServices,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Droplets, X, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { SheetSelect } from "@/components/ui/sheet-select";

type WashTypeFormState = {
  name: string;
  description: string;
  color: string;
  active: boolean;
  basePrice: string;
  discountPct: string;
  discountAmount: string;
  services: string[]; // serviceIds
};

type EditingTarget = { mode: "create" } | { mode: "edit"; id: string };

const emptyForm = (): WashTypeFormState => ({
  name: "",
  description: "",
  color: "#3B82F6",
  active: true,
  basePrice: "",
  discountPct: "",
  discountAmount: "",
  services: [],
});

function computeTotalsBySize(
  basePrice: number,
  discountPct: number,
  discountAmount: number,
  serviceIds: string[],
  servicesById: Map<string, any>,
  sizeSlugs: string[],
): Record<string, { perVisit: number; subtotal: number; discount: number; total: number }> {
  const out: Record<string, { perVisit: number; subtotal: number; discount: number; total: number }> = {};
  for (const slug of sizeSlugs) {
    let perVisit = 0;
    for (const id of serviceIds) {
      const svc = servicesById.get(id);
      if (!svc) continue;
      const mod = (svc.sizeModifiers ?? {})[slug] ?? 0;
      perVisit += svc.price + mod;
    }
    const subtotal = basePrice + perVisit;
    const discount = Math.min(subtotal, subtotal * (discountPct / 100) + discountAmount);
    out[slug] = { perVisit, subtotal, discount, total: Math.max(0, subtotal - discount) };
  }
  return out;
}

export default function CatalogWashTypes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: washTypesData, isLoading } = useGetPlatformWashTypes({
    query: { queryKey: ["wash-types"] },
  });
  const { data: servicesData } = useGetPlatformServices({
    query: { queryKey: ["services"] },
  });
  const updateWT = useUpdatePlatformWashType();
  const createWT = useCreatePlatformWashType();
  const deleteWT = useDeletePlatformWashType();

  const washTypes: any[] = washTypesData?.data ?? [];
  const allServices: any[] = servicesData?.data?.services ?? [];
  const sizes: any[] = servicesData?.data?.vehicleSizes ?? [];
  const sizeSlugs = useMemo(() => sizes.map((s) => s.catalogRef.slug), [sizes]);
  const servicesById = useMemo(() => new Map(allServices.map((s) => [s.id, s])), [allServices]);

  const [target, setTarget] = useState<EditingTarget | null>(null);
  const [form, setForm] = useState<WashTypeFormState>(emptyForm);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleActive = (id: string, active: boolean) => {
    updateWT.mutate(
      { washTypeId: id, data: { active } },
      {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["wash-types"] }),
        onError: () =>
          toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" }),
      },
    );
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    deleteWT.mutate(
      { washTypeId: deletingId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["wash-types"] });
          toast({ title: "Tipo de lavado eliminado" });
          setDeletingId(null);
        },
        onError: () =>
          toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" }),
      },
    );
  };

  const deletingName = deletingId
    ? washTypes.find((w) => w.id === deletingId)?.name
    : undefined;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!target) return;
    if (target.mode === "create") {
      setForm(emptyForm());
      return;
    }
    const wt = washTypes.find((w) => w.id === target.id);
    if (!wt) return;
    const ids = ((wt.services ?? []) as Array<{ serviceId: string }>).map((it) => it.serviceId);
    setForm({
      name: wt.name,
      description: wt.description ?? "",
      color: wt.color ?? "#3B82F6",
      active: !!wt.active,
      basePrice: String(wt.basePrice ?? 0),
      discountPct: wt.discountPct ? String(wt.discountPct) : "",
      discountAmount: wt.discountAmount ? String(wt.discountAmount) : "",
      services: ids,
    });
  }, [target]);

  const parseForm = ():
    | {
        ok: true;
        data: {
          name: string;
          description?: string;
          color: string;
          active: boolean;
          basePrice: number;
          discountPct: number;
          discountAmount: number;
          services: Array<{ serviceId: string; slug: string }>;
        };
      }
    | { ok: false; reason: string } => {
    const name = form.name.trim();
    if (!name) return { ok: false, reason: "El nombre es obligatorio" };

    const basePrice = Number(form.basePrice);
    if (form.basePrice === "" || !Number.isFinite(basePrice) || basePrice < 0) {
      return { ok: false, reason: "Precio base inválido" };
    }
    const discountPct = form.discountPct === "" ? 0 : Number(form.discountPct);
    if (!Number.isFinite(discountPct) || discountPct < 0 || discountPct > 100) {
      return { ok: false, reason: "Descuento % inválido (0-100)" };
    }
    const discountAmount = form.discountAmount === "" ? 0 : Number(form.discountAmount);
    if (!Number.isFinite(discountAmount) || discountAmount < 0) {
      return { ok: false, reason: "Descuento $ inválido" };
    }

    const services: Array<{ serviceId: string; slug: string }> = [];
    for (const id of form.services) {
      const svc = servicesById.get(id);
      if (!svc) continue;
      services.push({ serviceId: id, slug: svc.slug });
    }
    if (services.length === 0) {
      return { ok: false, reason: "Agrega al menos un servicio" };
    }

    return {
      ok: true,
      data: {
        name,
        description: form.description.trim() || undefined,
        color: form.color,
        active: form.active,
        basePrice,
        discountPct,
        discountAmount,
        services,
      },
    };
  };

  const handleSave = () => {
    if (!target) return;
    const parsed = parseForm();
    if (!parsed.ok) {
      toast({ title: "Revisa los campos", description: parsed.reason, variant: "destructive" });
      return;
    }
    if (target.mode === "create") {
      createWT.mutate(
        { data: parsed.data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wash-types"] });
            toast({ title: "Tipo de lavado creado", description: parsed.data.name });
            setTarget(null);
          },
          onError: () =>
            toast({ title: "Error", description: "No se pudo crear", variant: "destructive" }),
        },
      );
    } else {
      updateWT.mutate(
        { washTypeId: target.id, data: parsed.data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wash-types"] });
            toast({ title: "Guardado", description: "Tipo de lavado actualizado" });
            setTarget(null);
          },
          onError: () =>
            toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" }),
        },
      );
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="px-4 pt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-28 p-4" />
            </Card>
          ))}
        </div>
      </AppLayout>
    );
  }

  const previewTotals = computeTotalsBySize(
    Number(form.basePrice) || 0,
    Number(form.discountPct) || 0,
    Number(form.discountAmount) || 0,
    form.services,
    servicesById,
    sizeSlugs,
  );

  const sheetTitle = target?.mode === "create" ? "Nuevo tipo de lavado" : "Editar tipo de lavado";
  const isSaving = createWT.isPending || updateWT.isPending;
  const canSave = target !== null
    && form.name.trim().length > 0
    && form.basePrice !== "" && Number(form.basePrice) >= 0
    && form.services.length >= 1;

  return (
    <AppLayout>
      <div className="px-4 pb-6 space-y-4 mt-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Tipos de lavado
          </p>
          <Button size="sm" onClick={() => setTarget({ mode: "create" })}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo
          </Button>
        </div>

        {washTypes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Droplets className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">Sin tipos de lavado configurados</p>
          </div>
        ) : (
          washTypes.map((wt) => {
            const items = (wt.services ?? []) as Array<{ serviceId: string; slug: string }>;
            const totals = computeTotalsBySize(
              wt.basePrice ?? 0,
              wt.discountPct ?? 0,
              wt.discountAmount ?? 0,
              items.map((it) => it.serviceId),
              servicesById,
              sizeSlugs,
            );
            return (
              <Card key={wt.id} className={!wt.active ? "opacity-60" : ""}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: wt.color }} />
                      <span className="font-semibold text-base truncate">{wt.name}</span>
                    </div>
                    <Switch
                      checked={wt.active}
                      onCheckedChange={(c) => toggleActive(wt.id, c)}
                      disabled={updateWT.isPending}
                    />
                  </div>

                  {wt.description && (
                    <p className="text-xs text-muted-foreground">{wt.description}</p>
                  )}

                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>
                      Base: <span className="font-medium text-foreground">${wt.basePrice ?? 0}</span>
                    </span>
                    {(wt.discountPct > 0 || wt.discountAmount > 0) && (
                      <span>
                        Descuento:{" "}
                        <span className="font-medium text-foreground">
                          {wt.discountPct > 0 ? `${wt.discountPct}%` : ""}
                          {wt.discountPct > 0 && wt.discountAmount > 0 ? " + " : ""}
                          {wt.discountAmount > 0 ? `$${wt.discountAmount}` : ""}
                        </span>
                      </span>
                    )}
                  </div>

                  {items.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Servicios incluidos
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {items.map((it) => {
                          const svc = servicesById.get(it.serviceId);
                          return (
                            <span
                              key={it.serviceId}
                              className="inline-flex items-center px-2 py-0.5 rounded bg-muted/50 text-[11px]"
                            >
                              {svc?.name ?? it.slug}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5">
                    {sizes.map((size) => {
                      const slug = size.catalogRef.slug;
                      const t = totals[slug];
                      return (
                        <span
                          key={size.catalogRef.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-[11px] font-mono"
                        >
                          <span className="uppercase text-muted-foreground">{slug}</span>
                          <span className="font-semibold">${t?.total ?? 0}</span>
                        </span>
                      );
                    })}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-red-200 text-red-700 hover:bg-red-50"
                      onClick={() => setDeletingId(wt.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Eliminar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setTarget({ mode: "edit", id: wt.id })}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Editar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* ── Sheet: crear / editar tipo de lavado ── */}
      <Sheet open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 h-[80vh] overflow-y-auto">
          <SheetHeader className="px-4 pt-4 pb-2 text-left">
            <SheetTitle>{sheetTitle}</SheetTitle>
            <SheetDescription>
              Total = <span className="font-mono">precio base + Σ servicios − descuento</span>.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 py-3 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Nombre</Label>
              <Input
                placeholder="Ej: Lavado básico, Lavado premium..."
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Descripción (opcional)</Label>
              <Input
                placeholder="Qué incluye este tipo de lavado"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Precio base</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className="pl-6"
                  placeholder="0"
                  value={form.basePrice}
                  onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Descuento %</Label>
                <div className="relative">
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">%</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={100}
                    className="pr-7"
                    placeholder="0"
                    value={form.discountPct}
                    onChange={(e) => setForm((f) => ({ ...f, discountPct: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Descuento $</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    className="pl-6"
                    placeholder="0"
                    value={form.discountAmount}
                    onChange={(e) => setForm((f) => ({ ...f, discountAmount: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold">Servicios incluidos</Label>

              {(() => {
                const availableServices = allServices.filter((s) => !form.services.includes(s.id));
                return (
                  <>
                    {form.services.length === 0 ? (
                      <p className="text-xs text-red-600 py-2 italic">Obligatorio: agrega al menos un servicio.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {form.services.map((id) => {
                          const svc = servicesById.get(id);
                          if (!svc) return null;
                          return (
                            <div key={id} className="flex items-center gap-2 bg-muted/40 px-3 py-2 rounded">
                              <span className="flex-1 text-sm truncate">{svc.name}</span>
                              <span className="text-[11px] text-muted-foreground font-mono">base ${svc.price}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 shrink-0"
                                onClick={() =>
                                  setForm((f) => ({ ...f, services: f.services.filter((sid) => sid !== id) }))
                                }
                                aria-label="Quitar servicio"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {availableServices.length > 0 ? (
                      <SheetSelect
                        value=""
                        onValueChange={(id) => {
                          if (!id) return;
                          setForm((f) => ({ ...f, services: [...f.services, id] }));
                        }}
                        options={availableServices.map((svc) => ({
                          value: svc.id,
                          label: svc.name,
                          subtitle: `Base $${svc.price}`,
                        }))}
                        placeholder="+ Agregar servicio"
                        title="Elegí un servicio"
                        searchPlaceholder="Buscar servicio..."
                        className="mt-1"
                        resetOnSelect
                      />
                    ) : allServices.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No hay servicios. Creá uno primero.</p>
                    ) : (
                      <p className="text-xs text-muted-foreground py-1">Todos los servicios ya están agregados.</p>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold">Total por tamaño (preview)</Label>
              <div className="grid grid-cols-1 gap-1.5">
                {sizes.map((size) => {
                  const slug = size.catalogRef.slug;
                  const t = previewTotals[slug];
                  if (!t) return null;
                  const basePrice = Number(form.basePrice) || 0;
                  return (
                    <div
                      key={size.catalogRef.id}
                      className="flex items-center justify-between bg-muted/50 px-3 py-1.5 rounded text-xs font-mono"
                    >
                      <span className="uppercase text-muted-foreground">{slug}</span>
                      <span>
                        <span className="text-muted-foreground">${basePrice} + ${t.perVisit}</span>
                        {t.discount > 0 && (
                          <span className="text-muted-foreground"> − ${t.discount}</span>
                        )}
                        <span className="font-semibold ml-1">= ${t.total}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <Label className="text-xs font-semibold">Activo</Label>
              <Switch
                checked={form.active}
                onCheckedChange={(c) => setForm((f) => ({ ...f, active: c }))}
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-background border-t p-3 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setTarget(null)}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button className="flex-1" onClick={handleSave} disabled={isSaving || !canSave}>
              {target?.mode === "create" ? "Crear" : "Guardar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Sheet: confirmar eliminación ── */}
      <Sheet open={deletingId !== null} onOpenChange={(o) => !o && setDeletingId(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl p-0 h-[80vh] overflow-y-auto">
          <SheetHeader className="px-4 pt-4 pb-2 text-left">
            <SheetTitle>¿Eliminar tipo de lavado?</SheetTitle>
            <SheetDescription>
              {deletingName ? `"${deletingName}" se eliminará permanentemente.` : "Esta acción no se puede deshacer."}
            </SheetDescription>
          </SheetHeader>
          <div className="sticky bottom-0 bg-background border-t p-3 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeletingId(null)}
              disabled={deleteWT.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteWT.isPending}
            >
              Eliminar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
