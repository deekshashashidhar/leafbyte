-- LeafByte: Green Code Movement signups.
-- Run this once in the Supabase SQL editor (Project > SQL Editor > New query).

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) <= 200 and email ~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'),
  role text not null check (role in ('student', 'educator', 'volunteer', 'organisation')),
  country text check (char_length(country) <= 80),
  interest text not null check (interest in ('updates', 'games', 'teaching', 'volunteering', 'partnering', 'nominate', 'contact')),
  volunteer_role text check (volunteer_role in ('content-writer', 'translator', 'developer', 'designer', 'campus-ambassador')),
  contribution text check (char_length(contribution) <= 1000),
  consent boolean not null check (consent = true),
  confirmed boolean not null default false,
  source_page text check (char_length(source_page) <= 60),
  created_at timestamptz not null default now()
);

-- One signup per email address (case-insensitive). A repeat returns HTTP 409.
create unique index if not exists members_email_unique on public.members (lower(email));

-- Row-level security: the public website may only INSERT. Nobody can read,
-- change or delete rows with the public anon key.
alter table public.members enable row level security;

drop policy if exists "Public can sign up" on public.members;
create policy "Public can sign up"
  on public.members
  for insert
  to anon
  with check (consent = true and confirmed = false);

-- The team reads and exports entries from the Supabase dashboard
-- (Table Editor > members > Export to CSV), which uses your own login.
