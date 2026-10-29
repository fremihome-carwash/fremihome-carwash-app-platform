import { AppLayout } from "@/components/layout/app-layout";
import {
  useGetPlatformZones,
  useCreatePlatformZone,
  useDeletePlatformZone,
  useGetPlatformAsentamientos,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { SheetSelect } from "@/components/ui/sheet-select";
import { ChevronDown, ChevronRight, MapPin, Plus, Trash2 } from "lucide-react";

type ZoneNode      = { id: string; name: string; kind: string; cp?: string | null };
type MunicipioNode = { id: string; name: string; zones: ZoneNode[] };
type CityNode      = { id: string; name: string; municipios: MunicipioNode[] };
type StateNode     = { id: string; name: string; cities: CityNode[] };

type FormState = {
  stateId: string;
  cityId: string;
  municipioId: string;
  asentamientoId: string;
};

const emptyForm: FormState = {
  stateId: "",
  cityId: "",
  municipioId: "",
  asentamientoId: "",
};

function kindBadgeClass(kind: string): string {
  const k = kind.toLowerCase();
  if (k === "fraccionamiento") return "bg-blue-100 text-blue-700";
  if (k === "colonia") return "bg-emerald-100 text-emerald-700";
  if (k === "ranchería" || k === "rancheria" || k === "rancho") return "bg-amber-100 text-amber-700";
  if (k === "pueblo" || k === "poblado comunal") return "bg-purple-100 text-purple-700";
  if (k === "ejido") return "bg-yellow-100 text-yellow-700";
  return "bg-slate-100 text-slate-700";
}

export default function CatalogZones() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: zonesData, isLoading } = useGetPlatformZones({
    query: { queryKey: ["zones"] },
  });
  const createZone = useCreatePlatformZone();
  const deleteZone = useDeletePlatformZone();

  const states: StateNode[] = (zonesData?.data?.states as any) ?? [];

  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [expandedCities, setExpandedCities] = useState<Set<string>>(new Set());
  const [expandedMunicipios, setExpandedMunicipios] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const selectedState     = useMemo(() => states.find((s) => s.id === form.stateId), [states, form.stateId]);
  const citiesForState    = selectedState?.cities ?? [];
  const selectedCity      = useMemo(() => citiesForState.find((c) => c.id === form.cityId), [citiesForState, form.cityId]);
  const municipiosForCity = selectedCity?.municipios ?? [];

  // Asentamientos SEPOMEX del municipio seleccionado.
  const { data: asentamientosData, isFetching: loadingAsentamientos } = useGetPlatformAsentamientos({
    municipioId: form.municipioId,
    enabled: !!form.municipioId,
  });
  const asentamientos = asentamientosData?.data ?? [];
  const selectedAsent = useMemo(
    () => asentamientos.find((a: any) => a.id === form.asentamientoId),
    [asentamientos, form.asentamientoId],
  );

  const openCreate = () => {
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const handleCreate = () => {
    if (!form.municipioId) return toast({ title: "Selecciona un municipio", variant: "destructive" });
    if (!form.asentamientoId) return toast({ title: "Selecciona un asentamiento", variant: "destructive" });

    createZone.mutate(
      { data: { municipioId: form.municipioId, asentamientoCatalogId: form.asentamientoId } as any },
      {
        onSuccess: (res: any) => {
          queryClient.invalidateQueries({ queryKey: ["zones"] });
          const already = res?.data?.alreadyExists;
          toast({
            title: already ? "Ya existía" : "Zona agregada",
            description: selectedAsent?.name ?? "",
          });
          setSheetOpen(false);
        },
        onError: () =>
          toast({ title: "Error", description: "No se pudo agregar", variant: "destructive" }),
      },
    );
  };

  const confirmDelete = () => {
    if (!deletingId) return;
    deleteZone.mutate(
      { zoneId: deletingId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["zones"] });
          toast({ title: "Zona eliminada" });
          setDeletingId(null);
        },
        onError: () =>
          toast({ title: "Error", description: "No se pudo eliminar", variant: "destructive" }),
      },
    );
  };

  const toggle = (set: Set<string>, setFn: (s: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setFn(next);
  };

  // Solo mostramos estados que tienen al menos una zona configurada (para no ahogar al admin con los 32 vacíos).
  const statesWithZones = states.filter((s) =>
    s.cities.some((c) => c.municipios.some((m) => m.zones.length > 0)),
  );

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

  return (
    <AppLayout>
      <div className="px-4 pb-6 space-y-4 mt-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Zonas
          </p>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Nueva
          </Button>
        </div>

        {statesWithZones.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              Aún no hay zonas. Toca "Nueva" para agregar la primera.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {statesWithZones.map((s) => {
              const stateOpen = expandedStates.has(s.id);
              const visibleCities = s.cities.filter((c) => c.municipios.some((m) => m.zones.length > 0));
              return (
                <Card key={s.id}>
                  <CardContent className="p-0">
                    <button
                      type="button"
                      onClick={() => toggle(expandedStates, setExpandedStates, s.id)}
                      className="w-full px-4 py-3 flex items-center gap-2 hover:bg-muted/40 transition-colors"
                    >
                      {stateOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      <MapPin className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-sm flex-1 text-left truncate">{s.name}</span>
                      <span className="text-[11px] text-muted-foreground">{visibleCities.length} ciudades</span>
                    </button>

                    {stateOpen && visibleCities.map((c) => {
                      const cityOpen = expandedCities.has(c.id);
                      const visibleMunicipios = c.municipios.filter((m) => m.zones.length > 0);
                      return (
                        <div key={c.id} className="border-t border-border/40">
                          <button
                            type="button"
                            onClick={() => toggle(expandedCities, setExpandedCities, c.id)}
                            className="w-full px-4 py-2.5 pl-10 flex items-center gap-2 hover:bg-muted/40 transition-colors"
                          >
                            {cityOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                            <span className="text-sm flex-1 text-left truncate">{c.name}</span>
                            <span className="text-[11px] text-muted-foreground">{visibleMunicipios.length} municipios</span>
                          </button>

                          {cityOpen && visibleMunicipios.map((m) => {
                            const muniOpen = expandedMunicipios.has(m.id);
                            return (
                              <div key={m.id} className="border-t border-border/40">
                                <button
                                  type="button"
                                  onClick={() => toggle(expandedMunicipios, setExpandedMunicipios, m.id)}
                                  className="w-full px-4 py-2 pl-16 flex items-center gap-2 hover:bg-muted/40 transition-colors"
                                >
                                  {muniOpen ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
                                  <span className="text-xs flex-1 text-left truncate">{m.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{m.zones.length} zonas</span>
                                </button>

                                {muniOpen && m.zones.length > 0 && (
                                  <div className="px-4 pl-20 pb-2 space-y-1">
                                    {m.zones.map((z) => (
                                      <div
                                        key={z.id}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/40 transition-colors"
                                      >
                                        <Badge
                                          variant="secondary"
                                          className={`text-[10px] px-1.5 py-0 h-4 ${kindBadgeClass(z.kind)}`}
                                        >
                                          {z.kind}
                                        </Badge>
                                        <span className="text-sm flex-1 truncate">
                                          {z.name}
                                          {z.cp && (
                                            <span className="text-muted-foreground text-[11px] ml-1">CP {z.cp}</span>
                                          )}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setDeletingId(z.id)}
                                          className="p-1 rounded hover:bg-red-50 hover:text-destructive text-muted-foreground"
                                          aria-label="Eliminar zona"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Sheet: crear zona ── */}
      <Sheet open={sheetOpen} onOpenChange={(o) => { if (!o) setSheetOpen(false); }}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-0 h-[80vh] overflow-y-auto"
        >
          <SheetHeader className="px-4 pt-4 pb-2 text-left">
            <SheetTitle>Nueva zona</SheetTitle>
            <SheetDescription>
              Estado → ciudad → municipio → asentamiento (catálogo SEPOMEX).
            </SheetDescription>
          </SheetHeader>

          <div className="px-4 py-3 space-y-3">
            {/* Estado */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Estado</Label>
              <SheetSelect
                value={form.stateId}
                onValueChange={(v) => setForm((f) => ({ ...f, stateId: v, cityId: "", municipioId: "" }))}
                options={states.map((s) => ({ value: s.id, label: s.name }))}
                placeholder="Selecciona un estado"
                title="Estado"
                searchPlaceholder="Buscar estado..."
              />
            </div>

            {/* Ciudad */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ciudad</Label>
              <SheetSelect
                value={form.cityId}
                onValueChange={(v) => setForm((f) => ({ ...f, cityId: v, municipioId: "" }))}
                options={citiesForState.map((c) => ({ value: c.id, label: c.name }))}
                placeholder={
                  !form.stateId ? "Primero el estado" :
                  citiesForState.length === 0 ? "Este estado no tiene ciudades configuradas" :
                  "Selecciona una ciudad"
                }
                title="Ciudad"
                searchPlaceholder="Buscar ciudad..."
                disabled={!form.stateId || citiesForState.length === 0}
              />
            </div>

            {/* Municipio */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Municipio</Label>
              <SheetSelect
                value={form.municipioId}
                onValueChange={(v) => setForm((f) => ({ ...f, municipioId: v }))}
                options={municipiosForCity.map((m) => ({ value: m.id, label: m.name }))}
                placeholder={
                  !form.cityId ? "Primero la ciudad" :
                  municipiosForCity.length === 0 ? "Esta ciudad no tiene municipios configurados" :
                  "Selecciona un municipio"
                }
                title="Municipio"
                searchPlaceholder="Buscar municipio..."
                disabled={!form.cityId || municipiosForCity.length === 0}
              />
            </div>

            {/* Asentamiento (colonia / fraccionamiento / etc) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Asentamiento</Label>
              <SheetSelect
                value={form.asentamientoId}
                onValueChange={(v) => setForm((f) => ({ ...f, asentamientoId: v }))}
                options={asentamientos.map((a: any) => ({
                  value: a.id,
                  label: a.name,
                  subtitle: a.cp ? `${a.kind} · CP ${a.cp}` : a.kind,
                }))}
                placeholder={
                  !form.municipioId ? "Primero el municipio" :
                  loadingAsentamientos ? "Cargando asentamientos..." :
                  asentamientos.length === 0 ? "Sin asentamientos en este municipio" :
                  `Selecciona uno (${asentamientos.length} disponibles)`
                }
                title="Asentamiento"
                searchPlaceholder="Buscar colonia, fraccionamiento..."
                disabled={!form.municipioId || loadingAsentamientos || asentamientos.length === 0}
                search={asentamientos.length >= 6}
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-background border-t p-3 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSheetOpen(false)}
              disabled={createZone.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={createZone.isPending}
            >
              Crear
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
            <SheetTitle>¿Eliminar zona?</SheetTitle>
            <SheetDescription>Esta acción no se puede deshacer.</SheetDescription>
          </SheetHeader>
          <div className="sticky bottom-0 bg-background border-t p-3 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setDeletingId(null)}
              disabled={deleteZone.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
              disabled={deleteZone.isPending}
            >
              Eliminar
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppLayout>
  );
}
