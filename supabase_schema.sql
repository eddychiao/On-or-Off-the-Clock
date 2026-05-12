-- Run this in the Supabase SQL editor to set up the database.

create table if not exists public.time_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  date          date not null,
  commute_start timestamptz,
  commute_end   timestamptz,
  work_start    timestamptz,
  work_end      timestamptz,
  commute_home_start timestamptz,
  commute_home_end   timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),

  unique (user_id, date)
);

-- Row-level security: each user only sees their own entries
alter table public.time_entries enable row level security;

create policy "Users can read own entries"
  on public.time_entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on public.time_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on public.time_entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on public.time_entries for delete
  using (auth.uid() = user_id);
