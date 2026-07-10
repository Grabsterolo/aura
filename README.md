# Prospecta + Aura

Portal interno de generación de leads con IA para pequeños negocios en Costa
Rica/LATAM. Prospecta busca y audita negocios; Aura decide, redacta, y
gestiona el contacto con aprobación humana obligatoria en esta fase.

## Correr el proyecto local

```bash
npm install
```

Creá un archivo `.env.local` en la raíz (no se sube al repo) con las
variables de Supabase, usando `.env.example` como referencia:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Luego levantá el servidor de desarrollo:

```bash
npm run dev
```

## Comandos disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Levanta el servidor de desarrollo con hot reload |
| `npm run build` | Type-checks el proyecto y genera el build de producción |
| `npm run lint` | Corre el linter (oxlint) sobre el código |
| `npm run test` | Corre la suite de tests con Vitest |
| `npm run preview` | Sirve el build de producción localmente |
