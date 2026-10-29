import { AppLayout } from "@/components/layout/app-layout";
import {
  useGetPlatformServices,
  useUpdatePlatformService,
  useCreatePlatformService,
  useDeletePlatformService,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

type VehicleSize = { catalogRef: { id: string; slug: string }; basePrice: number };

type ServiceFormState = {
  name: string;
  description: string;
  price: string;
  minMinutes: string;
  maxMinutes: string;
  sizeModifiers: Record<string, string>;
};

type EditingTarget =
  | { mode: "create" }
  | { mode: "edit"; id: string };

const emptyForm = (sizes: VehicleSize[]): ServiceFormState => ({
  name: "",
  description: "",
  price: "",
  minMinutes: "",
  maxMinutes: "",
  sizeModifiers: Object.fromEntries(sizes.map((s) => [s.catalogRef.slug, ""])),
});

export default function CatalogServices() {
  const { data: catalogData, isLoading } = useGetPlatformServices({
    query: { queryKey: ["services"] },
  });
  const queryClient = useQueryClient();
  const updateService = useUpdatePlatformService();
  const createService = useCreatePlatformService();
  const deleteService = useDeletePlatformService();
  const { toast } = useToast();

  const sizes: VehicleSize[] = catalogData?.data?.vehicleSizes ?? [];
  const services: any[] = catalogData?.data?.services ?? [];

  const [target, setTarget] = useState<EditingTarget | null>(null);
  const [form, setForm] = useState<ServiceFormState>(() => emptyForm(sizes));
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!target) {
      setForm(emptyForm(sizes));
      return;
    }
    if (target.mode === "create") {
      setForm(emptyForm(sizes));
      return;
    }
    const svc = services.find((s) => s.id === target.id);
    if (!svc) return;
    const mods = (svc.sizeModifiers ?? {}) as Record<string, number>;
    setForm({
      name: svc.name,
      description: svc.description ?? "",
      price: String(svc.price),
      minMinutes: String(svc.minMinutes),
      maxMinutes: String(svc.maxMinutes),
      sizeModifiers: Object.fromEntries(
        sizes.map((s) => {
          const v = mods[s.catalogRef.slug];
          return [s.catalogRef.slug, v != null ? String(v) : ""];
        }),
      ),
    });
  // Sólo correr cuando cambia `target` (mismo fix del bug de catalog-packages):
  // refetch del query reinicia el form mientras el usuario está editándolo.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  const confirmDelete = () => {
    if (!deletingId) return;
    deleteService.mutate(
      { serviceId: deletingId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["services"] });
          toast({ title: "Servicio eliminado" });
          setDeletingId(null);
        },
        onError: () =>
          toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" }),
      },
    );
  };

  const deletingName = deletingId
    ? services.find((s) => s.id === deletingId)?.name
    : undefined;

  const toggleService = (id: string, active: boolean) => {
    updateService.mutate(
      { serviceId: id, data: { active } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["services"] });
          toast({ title: "Guardado", description: "Estado actualizado" });
        },
        onError: () =>
          toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" }),
      },
    );
  };

  const parseForm = ():
    | { ok: true; data: { name: string; description?: string; price: number; minMinutes: number; maxMinutes: number; sizeModifiers: Record<string, number> } }
    | { ok: false; reason: string } => {
    const name = form.name.trim();
    const description = form.description.trim();
    const price = Number(form.price);
    const minMinutes = Number(form.minMinutes);
    const maxMinutes = Number(form.maxMinutes);

    if (!name) return { ok: false, reason: "El nombre es obligatorio" };
    if (form.price === "" || !Number.isFinite(price) || price < 0) return { ok: false, reason: "Precio base inválido" };
    if (!Number.isInteger(minMinutes) || minMinutes < 1) return { ok: false, reason: "Minutos mínimos inválidos" };
    if (!Number.isInteger(maxMinutes) || maxMinutes < minMinutes) return { ok: false, reason: "Minutos máximos inválidos" };

    const sizeModifiers: Record<string, number> = {};
    for (const size of sizes) {
      const slug = size.catalogRef.slug;
      const raw = form.sizeModifiers[slug];
      const n = Number(raw);
      if (raw === "" || !Number.isFinite(n) || n < 0) {
        return { ok: false, reason: `Modificador inválido para ${slug}` };
      }
      sizeModifiers[slug] = n;
    }

    return { ok: true, data: { name, description: description || undefined, price, minMinutes, maxMinutes, sizeModifiers } };
  };

  const handleSave = () => {
    if (!target) return;
    const parsed = parseForm();
    if (!parsed.ok) {
      toast({ title: "Revisa los campos", description: parsed.reason, variant: "destructive" });
      return;
    }

    if (target.mode === "create") {
      createService.mutate(
        { data: parsed.data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services"] });
            toast({ title: "Servicio creado", description: parsed.data.name });
            setTarget(null);
          },
          onError: () =>
            toast({ title: "Error", description: "No se pudo crear el servicio", variant: "destructive" }),
        },
      );
    } else {
      updateService.mutate(
        { serviceId: target.id, data: parsed.data },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["services"] });
            toast({ title: "Guardado", description: "Servicio actualizado" });
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
              <CardContent className="h-16 p-4" />
            </Card>
          ))}
        </div>
      </AppLayout>
    );
  }

  if (!catalogData?.data) return null;

  const sheetTitle = target?.mode === "create" ? "Nuevo servicio" : "Editar servicio";
  const isSaving = createService.isPending || updateService.isPending;
  const previewPrice = Number(form.price) || 0;

  return (
    <AppLayout>
      <div className="px-4 pb-6 space-y-4 mt-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Servicios
          </p>
          <Button size="sm" onClick={() => setTarget({ mode: "create" })}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo
          </Button>
        </div>

        {services.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Sin servicios. Toca "Nuevo" para crear el primero.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {services.map((service) => {
              const mods = (service.sizeModifiers ?? {}) as Record<string, number>;
              return (
                <Card key={service.id} className={!service.active ? "opacity-60" : ""}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-sm">{service.name}</p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground italic mt-0.5 line-clamp-2">{service.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {service.minMinutes}–{service.maxMinutes} min · base ${service.price}
                        </p>
                      </div>
                      <Switch
                        checked={service.active}
                        onCheckedChange={(c) => toggleService(service.id, c)}
                        disabled={updateService.isPending}
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {sizes.map((size) => {
                        const m = mods[size.catalogRef.slug];
                        const total = m != null ? service.price + m : null;
                        return (
                          <span
                            key={size.catalogRef.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-[11px] font-mono"
                          >
                            <span className="uppercase text-muted-foreground">{size.catalogRef.slug}</span>
                            <span className="font-semibold">
                              {total != null ? `$${total}` : "—"}
                            </span>
                            {m != null && m > 0 && (
                              <span className="text-muted-foreground">(+${m})</span>
                            )}
                          </span>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => setDeletingId(service.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setTarget({ mode: "edit", id: service.id })}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Sheet: crear / editar servicio ── */}
      <Sheet open={target !== null} onOpenChange={(o) => !o && setTarget(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-0 h-[80vh] overflow-y-auto"
        >
          <SheetHeader className="px-4 pt-4 pb-2 text-left">
            <SheetTitle>{sheetTitle}</SheetTitle>
            <SheetDescription>
              Precio final = <span className="font-mono">precio base + modificador del tamaño</span>.
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 py-3 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="service-name" className="text-xs font-semibold">Nombre</Label>
              <Input
                id="service-name"
                placeholder="Ej: Lavado de rines"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="service-desc" className="text-xs font-semibold">Descripción (opcional)</Label>
              <Input
                id="service-desc"
                placeholder="Breve descripción de qué incluye"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="service-price" className="text-xs font-semibold">Precio base</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                <Input
                  id="service-price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  className="pl-6"
                  placeholder="50"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="service-min" className="text-xs font-semibold">Min (minutos)</Label>
                <Input
                  id="service-min"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="15"
                  value={form.minMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, minMinutes: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="service-max" className="text-xs font-semibold">Max (minutos)</Label>
                <Input
                  id="service-max"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  placeholder="25"
                  value={form.maxMinutes}
                  onChange={(e) => setForm((f) => ({ ...f, maxMinutes: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <Label className="text-xs font-semibold">Modificadores por tamaño</Label>
              <p className="text-[11px] text-muted-foreground">
                Cuánto se le suma al precio base para cada tamaño.
              </p>
              <div className="space-y-2">
                {sizes.map((size) => {
                  const slug = size.catalogRef.slug;
                  const modN = Number(form.sizeModifiers[slug]);
                  const total =
                    Number.isFinite(modN) && form.sizeModifiers[slug] !== ""
                      ? previewPrice + modN
                      : null;
                  return (
                    <div key={size.catalogRef.id} className="flex items-center gap-2">
                      <span className="w-16 text-sm uppercase text-muted-foreground">{slug}</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+$</span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          className="pl-8"
                          placeholder="0"
                          value={form.sizeModifiers[slug] ?? ""}
                          onChange={(e) =>
                            setForm((f) => ({
                              ...f,
                              sizeModifiers: { ...f.sizeModifiers, [slug]: e.target.value },
                            }))
                          }
                        />
                      </div>
                      <span className="w-20 text-right text-xs font-mono text-muted-foreground">
                        {total != null ? `= $${total}` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
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
            <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
              {target?.mode === "create" ? "Crear" : "Guardar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Sheet: confirmar eliminación ── */}
      <Sheet open={deletingId !== null} onOpenChange={(o) => !o && setDeletingId(null)}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-0 h-[80vh] overflow-y-auto"
        >
          <SheetHeader className="px-4 pt-4 pb-2 text-left">
            <SheetTitle>¿Eliminar servicio?</SheetTitle>
            <SheetDescription>
              {deletingName ? `"${deletingName}" se eliminará permanentemente.` : "Esta acción no se puede deshacer."}
            </SheetDescription>
          </SheetHeader>
          <div className="sticky bottom-0 bg-background border-t p-3 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeletingId(null)}
              disabled={deleteService.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteService.isPending}
            >
              Eliminar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
