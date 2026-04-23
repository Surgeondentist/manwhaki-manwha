-- Imagen ancha opcional para el bloque "Destacado" en inicio (el catálogo sigue usando cover_url).
alter table public.comics
  add column if not exists banner_url text;

comment on column public.comics.banner_url is
  'Opcional: arte horizontal para el hero de inicio. Si es null, se usa cover_url con recorte tipo banner.';
