-- Ejecutar en Supabase → SQL Editor si tu proyecto ya tenía el esquema anterior
-- (likes + comentarios por cómic).

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

create index if not exists comic_likes_comic_id_idx on public.comic_likes (comic_id);
create index if not exists comic_comments_comic_id_created_idx
  on public.comic_comments (comic_id, created_at desc);

alter table public.comic_likes enable row level security;
alter table public.comic_comments enable row level security;

drop policy if exists comic_likes_select_all on public.comic_likes;
drop policy if exists comic_likes_insert_own on public.comic_likes;
drop policy if exists comic_likes_delete_own on public.comic_likes;
drop policy if exists comic_comments_select_all on public.comic_comments;
drop policy if exists comic_comments_insert_own on public.comic_comments;
drop policy if exists comic_comments_delete_own on public.comic_comments;

create policy comic_likes_select_all
  on public.comic_likes for select
  using (true);

create policy comic_likes_insert_own
  on public.comic_likes for insert
  with check (auth.uid() = user_id);

create policy comic_likes_delete_own
  on public.comic_likes for delete
  using (auth.uid() = user_id);

create policy comic_comments_select_all
  on public.comic_comments for select
  using (true);

create policy comic_comments_insert_own
  on public.comic_comments for insert
  with check (auth.uid() = user_id);

create policy comic_comments_delete_own
  on public.comic_comments for delete
  using (auth.uid() = user_id);
