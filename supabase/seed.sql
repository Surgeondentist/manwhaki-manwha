-- =============================================================================
-- Datos de prueba (Manwaki) — ejecutar en Supabase → SQL Editor
-- Requisito: haber aplicado antes `supabase/schema.sql`
-- Es idempotente: borra y vuelve a crear el cómic demo fijo.
-- =============================================================================

begin;

-- UUID fijos para poder re-ejecutar el script sin duplicar filas
-- (los ON DELETE CASCADE limpian capítulos y páginas al borrar el cómic)
delete from public.comics
where id = 'a0000000-0000-4000-8000-000000000001'::uuid;

insert into public.comics (
  id,
  title,
  description,
  cover_url,
  author_name,
  status
)
values (
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'Luz de ciudad (demo)',
  'Cómic de ejemplo para probar el catálogo, la ficha y el lector vertical. Puedes borrarlo cuando subas contenido real.',
  'https://picsum.photos/seed/manwaki-cover/400/600',
  'Estudio Manwaki',
  'ongoing'
);

insert into public.chapters (
  id,
  comic_id,
  chapter_number,
  title
)
values (
  'a0000000-0000-4000-8000-000000000002'::uuid,
  'a0000000-0000-4000-8000-000000000001'::uuid,
  1,
  'Primer encuentro'
);

insert into public.chapter_pages (chapter_id, page_number, image_url)
select
  'a0000000-0000-4000-8000-000000000002'::uuid,
  gs,
  'https://picsum.photos/seed/manwaki-ch1-p' || lpad(gs::text, 2, '0') || '/800/1400'
from generate_series(1, 10) as gs;

commit;
