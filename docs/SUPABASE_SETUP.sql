-- Pixelmagi Supabase setup
-- Run this in the Supabase SQL editor for a new project.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

insert into public.categories (key, label)
values ('okategoriserad', 'Okategoriserad')
on conflict (key) do nothing;

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  storage_path text not null unique,
  category text not null default 'okategoriserad'
    references public.categories(key),
  title text,
  location text,
  date date,
  is_hero boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists photos_created_at_idx
  on public.photos (created_at desc);

create index if not exists photos_category_idx
  on public.photos (category);

create table if not exists public.site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.photos enable row level security;
alter table public.site_settings enable row level security;

create policy "Public categories are readable"
  on public.categories for select
  using (true);

create policy "Public photos are readable"
  on public.photos for select
  using (true);

create policy "Public site settings are readable"
  on public.site_settings for select
  using (true);

insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do update set public = true;

create policy "Public photo files are readable"
  on storage.objects for select
  using (bucket_id = 'photos');

create or replace function public.get_photos_storage_usage()
returns table (
  total_bytes bigint,
  total_mb numeric,
  file_count bigint
)
language sql
security definer
set search_path = public, storage
as $$
  select
    coalesce(sum((metadata ->> 'size')::bigint), 0)::bigint as total_bytes,
    round(
      coalesce(sum((metadata ->> 'size')::numeric), 0) / 1024 / 1024,
      2
    ) as total_mb,
    count(*)::bigint as file_count
  from storage.objects
  where bucket_id = 'photos';
$$;

grant execute on function public.get_photos_storage_usage() to anon, authenticated;
