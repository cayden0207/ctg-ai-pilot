-- Execute this SQL in your Supabase project's SQL Editor

-- 1) Profiles table bound to auth.users
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text,
  role text check (role in ('admin','member')) default 'member',
  expiration_at timestamptz,
  revoked_at timestamptz,
  last_login_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_email_idx on public.profiles(email);

-- Row Level Security (RLS) rules (optional):
-- For simplicity of serverless checks, keep RLS permissive and gate via API.
alter table public.profiles enable row level security;
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'profiles' and policyname = 'allow_read_own'
  ) then
    create policy allow_read_own on public.profiles for select using (auth.uid() = user_id);
  end if;
end $$;

