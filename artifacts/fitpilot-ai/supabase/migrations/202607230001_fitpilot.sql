create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  plan text not null check (plan in ('Core', 'Pro', 'Elite')),
  status text not null default 'active' check (status in ('active', 'paused', 'at_risk')),
  joined_at date not null default current_date,
  last_visit timestamptz,
  visits_this_month integer not null default 0 check (visits_this_month >= 0),
  goal text not null,
  avatar_color text not null default '#F0A15C',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null,
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  weeks integer not null check (weeks > 0),
  sessions_per_week integer not null check (sessions_per_week > 0),
  active_members integer not null default 0 check (active_members >= 0),
  color text not null default '#7F8CF2',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  coach text not null,
  date date not null,
  start_time time not null,
  duration_minutes integer not null check (duration_minutes >= 15),
  attendees integer not null default 0 check (attendees >= 0),
  capacity integer not null check (capacity > 0),
  category text not null,
  color text not null default '#54B59A',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  member_name text not null,
  checked_in_at timestamptz not null default now(),
  class_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.activity (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('checkin', 'signup', 'payment', 'class', 'program')),
  title text not null,
  detail text not null,
  timestamp text not null,
  member_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  priority text not null check (priority in ('high', 'medium', 'low')),
  title text not null,
  summary text not null,
  action text not null,
  metric text,
  created_at timestamptz not null default now()
);

create index if not exists members_owner_created_idx on public.members(owner_id, created_at desc);
create index if not exists classes_owner_date_idx on public.classes(owner_id, date, start_time);
create index if not exists checkins_owner_time_idx on public.checkins(owner_id, checked_in_at desc);
create index if not exists activity_owner_created_idx on public.activity(owner_id, created_at desc);
create index if not exists insights_owner_created_idx on public.insights(owner_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists members_updated_at on public.members;
create trigger members_updated_at before update on public.members for each row execute function public.set_updated_at();
drop trigger if exists programs_updated_at on public.programs;
create trigger programs_updated_at before update on public.programs for each row execute function public.set_updated_at();
drop trigger if exists classes_updated_at on public.classes;
create trigger classes_updated_at before update on public.classes for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name')
  on conflict (id) do update set full_name = excluded.full_name;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

do $$
declare
  table_name text;
begin
  foreach table_name in array array['profiles', 'members', 'programs', 'classes', 'checkins', 'activity', 'insights']
  loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

do $$
declare
  table_name text;
begin
  foreach table_name in array array['members', 'programs', 'classes', 'checkins', 'activity', 'insights']
  loop
    execute format('drop policy if exists "authenticated owners can read %1$s" on public.%1$I', table_name);
    execute format('create policy "authenticated owners can read %1$s" on public.%1$I for select to authenticated using (owner_id = auth.uid())', table_name);
    execute format('drop policy if exists "authenticated owners can insert %1$s" on public.%1$I', table_name);
    execute format('create policy "authenticated owners can insert %1$s" on public.%1$I for insert to authenticated with check (owner_id = auth.uid())', table_name);
    execute format('drop policy if exists "authenticated owners can update %1$s" on public.%1$I', table_name);
    execute format('create policy "authenticated owners can update %1$s" on public.%1$I for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())', table_name);
    execute format('drop policy if exists "authenticated owners can delete %1$s" on public.%1$I', table_name);
    execute format('create policy "authenticated owners can delete %1$s" on public.%1$I for delete to authenticated using (owner_id = auth.uid())', table_name);
  end loop;
end $$;

insert into storage.buckets (id, name, public)
values ('member-avatars', 'member-avatars', false)
on conflict (id) do update set public = false;

drop policy if exists "owners can read member avatars" on storage.objects;
create policy "owners can read member avatars" on storage.objects for select to authenticated
using (bucket_id = 'member-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "owners can upload member avatars" on storage.objects;
create policy "owners can upload member avatars" on storage.objects for insert to authenticated
with check (bucket_id = 'member-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "owners can update member avatars" on storage.objects;
create policy "owners can update member avatars" on storage.objects for update to authenticated
using (bucket_id = 'member-avatars' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'member-avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "owners can delete member avatars" on storage.objects;
create policy "owners can delete member avatars" on storage.objects for delete to authenticated
using (bucket_id = 'member-avatars' and (storage.foldername(name))[1] = auth.uid()::text);