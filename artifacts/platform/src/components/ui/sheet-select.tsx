import { useState, useMemo, type ReactNode } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "./sheet";
import { Input } from "./input";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SheetSelectOption {
  value: string;
  label: string;
  subtitle?: string;
}

export interface SheetSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SheetSelectOption[];
  placeholder?: string;
  /** Título del sheet. Si no se pasa, usa `placeholder`. */
  title?: string;
  description?: string;
  disabled?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  /** Mostrar la barra de búsqueda. Default: true cuando hay >= 6 opciones. */
  search?: boolean;
  className?: string;
  /** Texto/elemento alternativo a mostrar en el trigger (override del label). */
  triggerLabel?: ReactNode;
  /** Si true, resetea el valor a "" después de seleccionar (uso como picker "agregar"). */
  resetOnSelect?: boolean;
}

/**
 * Reemplazo del Select estándar: el trigger se ve como un select, pero al click abre un
 * bottom sheet con una lista scroleable y un campo de búsqueda. Regla del repo: cualquier
 * select en mobile se implementa así, no como dropdown nativo / Radix Popover.
 */
export function SheetSelect({
  value,
  onValueChange,
  options,
  placeholder = "Selecciona...",
  title,
  description,
  disabled = false,
  searchPlaceholder = "Buscar...",
  emptyMessage = "Sin resultados",
  search,
  className,
  triggerLabel,
  resetOnSelect = false,
}: SheetSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const showSearch = search ?? options.length >= 6;
  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle?.toLowerCase().includes(q) ?? false),
    );
  }, [options, query]);

  const handleSelect = (next: string) => {
    // Siempre devolvemos el valor real al parent. `resetOnSelect` solo controla cosmética
    // del trigger (no muestra el label como "seleccionado" porque el parent vacía el value).
    onValueChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "hover:bg-accent/30",
          !selected && !triggerLabel && "text-muted-foreground",
          className,
        )}
      >
        <span className="truncate text-left flex-1">
          {triggerLabel ?? selected?.label ?? placeholder}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
      </button>

      <Sheet
        open={open}
        onOpenChange={(o) => {
          setOpen(o);
          if (!o) setQuery("");
        }}
      >
        <SheetContent
          side="bottom"
          className="rounded-t-2xl p-0 h-[80vh] flex flex-col"
        >
          <SheetHeader className="px-4 pt-4 pb-2 text-left shrink-0">
            <SheetTitle>{title ?? placeholder}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>

          {showSearch && (
            <div className="px-4 pb-2 shrink-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-2 pb-4">
            {filtered.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            ) : (
              <div className="space-y-0.5">
                {filtered.map((o) => {
                  const isSelected = o.value === value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => handleSelect(o.value)}
                      className={cn(
                        "w-full text-left px-3 py-2.5 rounded-md flex items-center gap-2 transition-colors",
                        "hover:bg-accent/50",
                        isSelected && "bg-primary/10",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm truncate",
                            isSelected && "font-semibold text-primary",
                          )}
                        >
                          {o.label}
                        </p>
                        {o.subtitle && (
                          <p className="text-xs text-muted-foreground truncate">
                            {o.subtitle}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
