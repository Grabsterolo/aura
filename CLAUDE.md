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
- @tanstack/react-query — infraestructura lista (`QueryClientProvider` en
  `App.tsx`, cliente en `src/lib/queryClient.ts`) pero sin queries reales
  todavía. Cuando se conecten campañas/prospectos reales de Supabase, usar
  este patrón de fetching en vez de inventar uno nuevo por página.
- Cloudflare Pages (frontend) + Cloudflare Pages Functions (backend, carpeta
  `functions/` en la raíz — todavía no creada)
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
  `useTheme.ts` y `useAuth.ts`)
- `src/lib/` — clientes e integraciones externas (Supabase, React Query)
- `src/types/` — tipos generados del esquema real de Supabase
  (`database.ts`, regenerado desde el proyecto — no editar a mano) y
  `index.ts`, que re-exporta los tipos de tabla (`Tables<'campaigns'>`, etc.)
  con nombres cómodos (`Campaign`, `Prospect`, ...) para el resto de la app
- `src/data/` — tipos y datos mock (`types.ts`, `mockData.ts`) hasta que se
  conecten datos reales de Supabase vía React Query. No confundir con
  `src/types/`: `data/types.ts` es para la UI mock actual, `types/` es el
  esquema real de la base de datos.

## Auth

No hay registro público. Los usuarios se crean manualmente en el dashboard
de Supabase. `ProtectedRoute` (`src/components/ProtectedRoute.tsx`) redirige
a `/login` si no hay sesión y muestra un estado de carga mientras se
resuelve — nunca debe haber un flash de contenido protegido sin sesión.

## Tests

Los tests van co-ubicados junto al archivo que prueban
(`ProtectedRoute.tsx` → `ProtectedRoute.test.tsx`). Mockear `@/hooks/useAuth`
en vez de depender de Supabase real en tests.
