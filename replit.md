# Car Wash Platform — Super Admin

Panel de control web (mobile-first) para el super administrador de la plataforma de lavado de autos a domicilio.

> **Atención**: el backend (`artifacts/api-server`, `lib/db`, `lib/api-zod`, `lib/api-spec`) fue migrado a `../new-server/` y eliminado de este repo. Este folder ahora **sólo contiene el frontend**.

## Run & Operate

- Backend único: ver `../new-server/` (puerto 8080). Comandos de stack completo: `../scripts/start-all.sh` / `../scripts/stop-all.sh`.
- Frontend platform (este repo): `pnpm --filter @workspace/platform run dev` (puerto 23633)
- `pnpm run typecheck` — typecheck del frontend
- `pnpm run build` — build del frontend
- El proxy `/api → http://localhost:8080` está en `artifacts/platform/vite.config.ts` (override con `API_PROXY_TARGET`).

## Stack

- pnpm workspace mini (sólo frontend + api-client-react), Node.js 24, TypeScript 5.9
- Frontend: React + Vite + shadcn/ui + Recharts + Framer Motion + Wouter
- API client: react-query hooks generados con Orval

## Where things live

- `lib/api-client-react/src/generated/` — generated React Query hooks (cliente HTTP)
- `artifacts/platform/src/` — React frontend (pages, components, hooks)
- (Backend movido a `../new-server/src/routes/platform/` y `../new-server/src/db/schema/`)

## Architecture decisions

- JWT bearer en `Authorization: Bearer <token>` (también acepta header `token` legado).
- Frontend guarda el JWT en `localStorage` bajo `platform_token`; el cliente generado lo añade vía `setAuthTokenGetter`.
- Todas las rutas admin requieren `requireAdmin` (role `admin`) — ver `../new-server/src/lib/auth.ts`.
- DB tables usan UUID-like string IDs y JSONB para data anidada (addOns, perks, durations, prices).

## Product

- **Login** — Admin authentication with JWT stored in localStorage
- **Dashboard** — Today's agenda summary + revenue at a glance
- **Agenda** — Daily booking view with quick action buttons
- **Bookings** — Paginated list with filters; detail view with full lifecycle actions (accept/reject/reassign/start/complete/cancel)
- **Companies** — List, create, detail with stats + availability config
- **Clients** — List, detail with vehicles, addresses, memberships, booking history
- **Catalog** — Packages (with pricing), services/prices, zones
- **Availability** — Global time slots + blocked dates management
- **Reports** — Revenue, bookings, services breakdown, memberships analytics

## Admin credentials (dev)

- Usuario: `admin`
- Password: `admin`

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The bcrypt hash in the seed uses `SESSION_SECRET` for JWT — make sure this env var is set
- The admin password hash is seeded as a bcrypt hash of `Admin1234!`; to change it, run a new seed
- Always run `pnpm --filter @workspace/api-spec run codegen` after changing `openapi.yaml`
- Always run `pnpm run typecheck:libs` after changing `lib/db/src/schema/` before typechecking the api-server

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
