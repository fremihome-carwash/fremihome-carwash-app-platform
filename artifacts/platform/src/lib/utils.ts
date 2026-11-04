import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Recarga la app completa en `path`, respetando el base desde el que se sirve.
 *
 * Login y logout necesitan un reload real (no navegacion del router) para que
 * el token recien escrito o borrado se tome desde cero. Pero `window.location`
 * no sabe nada del base de wouter: escribir "/dashboard" a mano manda el
 * browser a la raiz del dominio y se pierde el /carwash.
 */
export function hardRedirect(path: string) {
  const base = import.meta.env.BASE_URL; // Vite siempre lo entrega con "/" final
  window.location.href = `${base}${path.replace(/^\//, "")}`;
}
