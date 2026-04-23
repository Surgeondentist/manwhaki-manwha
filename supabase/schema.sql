-- =============================================================================
-- Manwaki / Webtoon-style reader — esquema PostgreSQL + RLS para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- =============================================================================

-- Extensiones útiles (gen_random_uuid viene de pgcrypto en PG14+; en Supabase ya está disponible)
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Tipos enumerados
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.comic_status as enum ('ongoing', 'completed');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.library_item_status as enum ('reading', 'dropped', 'completed');
exception
  when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- Tablas
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create table if not exists public.comics (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_url text,
  banner_url text,
  author_name text,
  status public.comic_status not null default 'ongoing',
  created_at timestamptz not null default now()
);

create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  comic_id uuid not null references public.comics (id) on delete cascade,
  chapter_number integer not null,
  title text,
  created_at timestamptz not null default now(),
  unique (comic_id, chapter_number)
);

create table if not exists public.chapter_pages (
  id uuid primary key default gen_random_uuid(),
  chapter_id uuid not null references public.chapters (id) on delete cascade,
  page_number integer not null,
  image_url text not null,
  unique (chapter_id, page_number)
);

create table if not exists public.library (
  user_id uuid not null references auth.users (id) on delete cascade,
  comic_id uuid not null references public.comics (id) on delete cascade,
  status public.library_item_status not null default 'reading',
  updated_at timestamptz not null default now(),
  primary key (user_id, comic_id)
);

create table if not exists public.comic_likes (
  comic_id uuid not null references public.comics (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comic_id, user_id)
);

create table if not exists public.comic_comments (
  id uuid primary key default gen_random_uuid(),
  comic_id uuid not null references public.comics (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint comic_comments_body_nonempty check (char_length(trim(body)) > 0),
  constraint comic_comments_body_len check (char_length(body) <= 2000)
);

-- -----------------------------------------------------------------------------
-- Índices (rendimiento en lectura del lector y listados)
-- -----------------------------------------------------------------------------
create index if not exists chapters_comic_id_idx on public.chapters (comic_id);
create index if not exists chapter_pages_chapter_id_page_number_idx
  on public.chapter_pages (chapter_id, page_number);

create index if not exists comic_likes_comic_id_idx on public.comic_likes (comic_id);
create index if not exists comic_comments_comic_id_created_idx
  on public.comic_comments (comic_id, created_at desc);

-- -----------------------------------------------------------------------------
-- updated_at automático en profiles
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists library_set_updated_at on public.library;
create trigger library_set_updated_at
  before update on public.library
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Perfil inicial al registrarse (username por defecto único)
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base_name text;
begin
  base_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'username'), ''),
    'lector'
  );

  insert into public.profiles (id, username)
  values (
    new.id,
    base_name || '_' || substr(replace(new.id::text, '-', ''), 1, 8)
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.comics enable row level security;
alter table public.chapters enable row level security;
alter table public.chapter_pages enable row level security;
alter table public.library enable row level security;
alter table public.comic_likes enable row level security;
alter table public.comic_comments enable row level security;

-- Limpieza idempotente de políticas (por si re-ejecutas el script)
do $$ declare r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles',
        'comics',
        'chapters',
        'chapter_pages',
        'library',
        'comic_likes',
        'comic_comments'
      )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- profiles: lectura pública de perfiles (UX tipo red social / autores)
create policy profiles_select_all
  on public.profiles for select
  using (true);

create policy profiles_insert_own
  on public.profiles for insert
  with check (auth.uid() = id);

create policy profiles_update_own
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- comics / chapters / pages: catálogo legible por todos; escritura solo usuarios autenticados
-- Nota: en producción conviene añadir owner_id o roles y restringir UPDATE/DELETE.
create policy comics_select_all
  on public.comics for select
  using (true);

create policy comics_insert_authenticated
  on public.comics for insert
  with check (auth.role() = 'authenticated');

create policy comics_update_authenticated
  on public.comics for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy comics_delete_authenticated
  on public.comics for delete
  using (auth.role() = 'authenticated');

create policy chapters_select_all
  on public.chapters for select
  using (true);

create policy chapters_insert_authenticated
  on public.chapters for insert
  with check (auth.role() = 'authenticated');

create policy chapters_update_authenticated
  on public.chapters for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy chapters_delete_authenticated
  on public.chapters for delete
  using (auth.role() = 'authenticated');

create policy chapter_pages_select_all
  on public.chapter_pages for select
  using (true);

create policy chapter_pages_insert_authenticated
  on public.chapter_pages for insert
  with check (auth.role() = 'authenticated');

create policy chapter_pages_update_authenticated
  on public.chapter_pages for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy chapter_pages_delete_authenticated
  on public.chapter_pages for delete
  using (auth.role() = 'authenticated');

-- library: cada usuario solo ve y modifica sus filas
create policy library_select_own
  on public.library for select
  using (auth.uid() = user_id);

create policy library_insert_own
  on public.library for insert
  with check (auth.uid() = user_id);

create policy library_update_own
  on public.library for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy library_delete_own
  on public.library for delete
  using (auth.uid() = user_id);

-- comic_likes: conteo público; cada usuario solo inserta/borra su propia fila
create policy comic_likes_select_all
  on public.comic_likes for select
  using (true);

create policy comic_likes_insert_own
  on public.comic_likes for insert
  with check (auth.uid() = user_id);

create policy comic_likes_delete_own
  on public.comic_likes for delete
  using (auth.uid() = user_id);

-- comic_comments: lectura pública; escribe/borra solo el autor
create policy comic_comments_select_all
  on public.comic_comments for select
  using (true);

create policy comic_comments_insert_own
  on public.comic_comments for insert
  with check (auth.uid() = user_id);

create policy comic_comments_delete_own
  on public.comic_comments for delete
  using (auth.uid() = user_id);
