-- Adds editable service cards to an existing Pixelmagi Supabase project.
-- Run this once in the Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price text not null,
  image_path text not null,
  button_label text not null default 'Boka eller fråga',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists services_sort_order_idx
  on public.services (sort_order asc, created_at asc);

alter table public.services enable row level security;

drop policy if exists "Public services are readable" on public.services;

create policy "Public services are readable"
  on public.services for select
  using (true);

-- Seed the three existing cards so they immediately become editable.
-- Their images continue to use the local files in /public/demo until replaced.
insert into public.services (
  title,
  description,
  price,
  image_path,
  button_label,
  sort_order
)
select
  seed.title,
  seed.description,
  seed.price,
  seed.image_path,
  seed.button_label,
  seed.sort_order
from (
  values
    (
      'Bröllopsfotografering',
      'Från förberedelser till fest – jag fångar er kärlek och alla viktiga ögonblick på ett naturligt och personligt sätt.',
      'Paket från 12 900 kr',
      '/demo/bouquet.webp',
      'Boka eller fråga',
      0
    ),
    (
      'Baby & barnfotografering',
      'Naturliga och lekfulla bilder som speglar barnets personlighet och familjens närhet.',
      'Session från 2 900 kr',
      '/demo/baby-service.webp',
      'Boka eller fråga',
      1
    ),
    (
      'Porträttfotografering',
      'Porträtt för dig själv, familjen eller företaget. Fotograferingen kan ske utomhus eller i studio.',
      'Session från 2 500 kr',
      '/demo/portrait-service.webp',
      'Boka eller fråga',
      2
    )
) as seed(title, description, price, image_path, button_label, sort_order)
where not exists (
  select 1
  from public.services
  where services.title = seed.title
);
