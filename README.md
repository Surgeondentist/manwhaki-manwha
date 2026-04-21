# Manwaki

PWA / lector mobile-first para manhwa en formato “long strip”, con Next.js (App Router), Tailwind CSS y Supabase.

## Requisitos

- Node.js 18.18 o superior (recomendado 20 LTS)
- npm 9+

## Instalación

```bash
cd "Manwaki"
npm install
```

Crea `.env.local` a partir de `.env.example` y pega la URL del proyecto y la clave anónima de Supabase.

## Scripts

- `npm run dev` — servidor de desarrollo en `http://localhost:3000`
- `npm run build` — compilación de producción
- `npm run start` — sirve la build
- `npm run lint` — ESLint (reglas Next.js)

## Base de datos (Supabase)

1. Crea un proyecto en [Supabase](https://supabase.com).
2. En **SQL Editor**, pega y ejecuta `supabase/schema.sql`.
3. Opcional: crea un bucket de Storage (por ejemplo `comic-pages`) y guarda ahí las imágenes; en `chapter_pages.image_url` almacena la URL pública.

## Estructura principal

- `app/(main)` — experiencia principal (home).
- `app/(auth)` — flujos de autenticación (placeholder en `/login`).
- `app/comic/[id]` — ficha del cómic.
- `app/read/[chapterId]` — lector vertical (demo con imágenes de prueba).
- `components/lector` — componentes del lector.
- `lib/supabase.ts` — cliente de navegador; `lib/supabase/server.ts` — cliente de servidor.
- `types/database.ts` — tipos alineados con el esquema SQL.

## Notas

- Las imágenes remotas de Storage se permiten dinámicamente en `next.config.mjs` según `NEXT_PUBLIC_SUPABASE_URL`.
- Para sesión estable en todas las rutas, el siguiente paso habitual es añadir **middleware** de refresco de tokens siguiendo la guía oficial de Supabase + Next.js App Router.
