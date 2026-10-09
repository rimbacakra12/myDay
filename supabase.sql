-- Jalankan di Supabase SQL Editor
create table if not exists public.myday_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.myday_data enable row level security;

create policy "Users can read own My Day data"
on public.myday_data for select
using (auth.uid() = user_id);

create policy "Users can insert own My Day data"
on public.myday_data for insert
with check (auth.uid() = user_id);

create policy "Users can update own My Day data"
on public.myday_data for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
