# Prospecta + Aura

Portal interno de generación de leads con IA para pequeños negocios en Costa
Rica/LATAM. Prospecta busca y audita negocios; Aura decide, redacta, y
gestiona el contacto con aprobación humana obligatoria en esta fase.

## Stack

- Vite + React 19 + TypeScript (`strict: true`)
- Tailwind v4 (`@tailwindcss/vite`). El tema vive en `src/index.css` vía
  `@theme`. Nunca hardcodear colores hex en componentes — siempre usar las
  clases semánticas ya definidas: `bg-page`, `bg-panel`, `text-primary`,
  `text-secondary`, `text-muted`, `bg-accent`, `bg-live`/`bg-live-soft`,
  `bg-warning`/`bg-warning-soft`, `bg-error`/`bg-error-soft`, `border-border`,
  `rounded-control`, `rounded-card`. El tema oscuro/claro se controla con
  `data-theme` en `<html>` (ver `src/hooks/useTheme.ts` y
  `src/components/ThemeProvider.tsx`).
- react-router-dom (rutas del lado del cliente, ver `src/App.tsx`)
- Supabase (auth + Postgres, RLS por `owner_id` en todas las tablas).
  Cliente tipado con el esquema real en `src/lib/supabaseClient.ts`
  (`createClient<Database>`, ver `src/types/database.ts`), auth en
  `src/components/AuthProvider.tsx` + `src/hooks/useAuth.ts`.
- @tanstack/react-query — capa de datos de servidor. Un hook por entidad en
  `src/hooks/queries/` (`useCampaigns`, `useProspects`, `useApprovalQueue`,
  `useConversations`, ...) envolviendo `supabase.from(...).select()` en
  `useQuery`, tipado con los alias de `src/types/index.ts`. Las mutaciones
  (`useCreateCampaign`, `useUpdateCampaign`) usan `useMutation` +
  `invalidateQueries` sobre la query key correspondiente (exportada desde el
  archivo de la query, ej. `campaignsKey`). Seguir este mismo patrón para
  cualquier entidad nueva — no inventar un patrón de fetching distinto por
  página.
- Cloudflare Pages (frontend) + Cloudflare Pages Functions (backend, carpeta
  `functions/api/` en la raíz, ruteada automáticamente a `/api/*` por
  Cloudflare — no corren con `npm run dev`, necesitan un deploy de Pages).
  Tienen su propio `functions/tsconfig.json` (referenciado desde el
  `tsconfig.json` raíz, así `npm run build` también las type-checkea).
  Nunca se llaman desde el cliente con claves privadas: usan
  `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` (sin prefijo `VITE_`,
  configuradas como env vars en el dashboard de Cloudflare Pages, nunca en
  `.env.local`) para crear un cliente admin, validan el usuario con
  `supabaseAdmin.auth.getUser(token)` a partir del header
  `Authorization: Bearer <token>` que manda el cliente (nunca confiar en un
  `owner_id` que venga en el body), y devuelven JSON con status codes
  explícitos (401 sin token, 403 si el recurso no es del usuario, 502 si
  falla un servicio externo). Ver `functions/api/search-overpass.ts`.
- Vitest + Testing Library para tests (`npm run test`)

## Alias de imports

`@/` apunta a `src/` (configurado en `tsconfig.app.json` y `vite.config.ts`).
Usar `@/` para cualquier import que cruce de directorio (ej.
`@/hooks/useAuth`, `@/components/ui/Button`). Los imports entre archivos
del mismo directorio (ej. un componente de `components/ui/` importando otro
de `components/ui/`) pueden seguir usando `./`.

## Convenciones de carpetas

- `src/pages/` — un componente por ruta
- `src/components/` — componentes compartidos entre páginas;
  `components/ui/` para primitivos genéricos (`Button`, `Input`, `Card`,
  `Badge`) que encapsulan clases de Tailwind repetidas. Antes de escribir
  clases de botón/input/card a mano, revisar si ya existe un primitivo en
  `components/ui/`.
- `src/hooks/` — un hook por archivo; si el hook expone un contexto, el
  `Context` y el hook van juntos en el mismo archivo (patrón usado en
  `useTheme.ts` y `useAuth.ts`). `src/hooks/queries/` es solo para hooks de
  React Query (ver arriba).
- `src/lib/` — clientes e integraciones externas (Supabase, React Query),
  utilidades chicas compartidas (ej. `formatDate.ts`) y catálogos estáticos
  (`searchCatalog.ts`: categorías de negocio con su tag de OSM y países/
  ciudades de LATAM con coordenadas — de acá sale `criterio_busqueda` al
  crear/editar una campaña en `CampaignForm`)
- `src/types/` — tipos generados del esquema real de Supabase
  (`database.ts`, regenerado desde el proyecto — no editar a mano) y
  `index.ts`, que re-exporta los tipos de tabla (`Tables<'campaigns'>`, etc.)
  con nombres cómodos (`Campaign`, `Prospect`, ...) para el resto de la app
- `functions/api/` — Cloudflare Pages Functions (backend). Un archivo por
  endpoint, exportando `onRequestGet`/`onRequestPost`/etc. Importan tipos de
  `src/types/database.ts` con ruta relativa (no usan el alias `@/`, que es
  solo para Vite/`src`).

## Auth

No hay registro público. Los usuarios se crean manualmente en el dashboard
de Supabase. `ProtectedRoute` (`src/components/ProtectedRoute.tsx`) redirige
a `/login` si no hay sesión y muestra un estado de carga mientras se
resuelve — nunca debe haber un flash de contenido protegido sin sesión.

## Reglas de negocio conocidas

- `campaigns.canal` siempre es `'email'` — hay un check constraint en la
  base que lo fuerza (primer contacto siempre por correo). En formularios,
  mostrarlo fijo/no editable, nunca como select.
- Estados vacíos: usar `EmptyState` (`src/components/ui/EmptyState.tsx`) en
  vez de mensajes de error o "no hay nada" cuando una tabla todavía no tiene
  filas — es el estado esperado en varias pantallas mientras no exista el
  backend de búsqueda/redacción.

## Tests

Los tests van co-ubicados junto al archivo que prueban
(`ProtectedRoute.tsx` → `ProtectedRoute.test.tsx`). Mockear `@/hooks/useAuth`
en vez de depender de Supabase real en tests.
