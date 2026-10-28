-- Vateko.fun database (Supabase project ypppwuwlexgiikbaapbf). Restored 2026-10-28 from the live database
-- and earlier session notes after the project folder was lost. Everything below already exists in the database;
-- run it only on a fresh project: SQL Editor > New query > paste > Run.

-- accounts ------------------------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text unique not null check (handle ~ '^[a-z0-9_]{3,30}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "own profile readable" on public.profiles;
create policy "own profile readable" on public.profiles for select using (auth.uid() = id);

-- copy handle + display name from the sign-up into profiles
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (new.id,
          new.raw_user_meta_data->>'handle',
          coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'handle'));
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- lets the app check "@handle taken?" without exposing the profiles table
create or replace function public.handle_available(h text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where handle = lower(h));
$$;
grant execute on function public.handle_available(text) to anon, authenticated;

-- listening streak + devices ------------------------------------------------------------------------
create table if not exists public.listening (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  seconds int not null default 0 check (seconds >= 0),
  primary key (user_id, day)
);
alter table public.listening enable row level security;
drop policy if exists "own listening readable" on public.listening;
create policy "own listening readable" on public.listening for select using (auth.uid() = user_id);

create table if not exists public.devices (
  user_id uuid not null references auth.users on delete cascade,
  device text not null check (char_length(device) between 1 and 120),
  ip text,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  primary key (user_id, device)
);
alter table public.devices enable row level security;
drop policy if exists "own devices readable" on public.devices;
create policy "own devices readable" on public.devices for select using (auth.uid() = user_id);
drop policy if exists "own devices removable" on public.devices;
create policy "own devices removable" on public.devices for delete using (auth.uid() = user_id);

-- founders and bans (read only through the security definer functions; RLS on, no policies) ---------
create table if not exists public.founders (user_id uuid primary key references auth.users on delete cascade);
alter table public.founders enable row level security;
insert into public.founders (user_id)
  select id from auth.users where email in ('founder@example.com')
  on conflict do nothing;

create table if not exists public.bans (
  user_id uuid primary key references auth.users on delete cascade,
  reason text not null check (char_length(reason) between 1 and 300),
  banned_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  lifted_at timestamptz
);
alter table public.bans enable row level security;

create or replace function public.is_founder() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from founders where user_id = auth.uid());
$$;

create or replace function public.is_banned(u uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from bans where user_id = u and lifted_at is null);
$$;

create or replace function public.my_status() returns json
language sql stable security definer set search_path = public as $$
  select json_build_object(
    'founder', exists (select 1 from founders where user_id = auth.uid()),
    'ban', (select json_build_object('reason', b.reason, 'by', coalesce(p.display_name, p.handle, 'Vateko.fun'), 'at', b.created_at)
            from bans b left join profiles p on p.id = b.banned_by
            where b.user_id = auth.uid() and b.lifted_at is null));
$$;

-- banned accounts stop counting listening time and devices
create or replace function public.add_listening(sec int, d date) returns void
language sql security definer set search_path = public as $$
  insert into public.listening (user_id, day, seconds)
  select auth.uid(), d, least(greatest(sec, 0), 900)
  where not public.is_banned(auth.uid())
  on conflict (user_id, day) do update set seconds = least(public.listening.seconds + excluded.seconds, 86400);
$$;

create or replace function public.touch_device(device text) returns void
language sql security definer set search_path = public as $$
  insert into public.devices (user_id, device, ip)
  select auth.uid(), left(device, 120),
         split_part(coalesce(current_setting('request.headers', true)::json->>'x-forwarded-for', ''), ',', 1)
  where not public.is_banned(auth.uid())
  on conflict (user_id, device) do update set ip = excluded.ip, last_seen = now();
$$;

-- top listeners (public profile fields only)
create or replace function public.leaderboard2(lim int default 20)
returns table (handle text, name text, avatar text, color text, seconds bigint, days bigint, founder boolean, me boolean)
language sql stable security definer set search_path = public as $$
  select p.handle, p.display_name, u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'color',
         sum(l.seconds)::bigint, count(*) filter (where l.seconds > 0),
         exists (select 1 from founders f where f.user_id = l.user_id), l.user_id = auth.uid()
  from listening l
  join profiles p on p.id = l.user_id
  join auth.users u on u.id = l.user_id
  where not public.is_banned(l.user_id)
  group by l.user_id, p.handle, p.display_name, u.raw_user_meta_data
  order by 5 desc
  limit least(greatest(lim, 1), 100);
$$;

-- Founder Panel: refuses anyone who is not a founder
create or replace function public.admin_users2()
returns table (id uuid, email text, handle text, name text, avatar text, color text, joined timestamptz, last_sign_in timestamptz,
               seconds bigint, days bigint, last_day date, devices bigint, founder boolean, ban_reason text, banned_by text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_founder() then raise exception 'founders only' using errcode = '42501'; end if;
  return query
  select u.id, u.email::text, p.handle, p.display_name, u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'color', u.created_at, u.last_sign_in_at,
         coalesce((select sum(l.seconds) from listening l where l.user_id = u.id), 0)::bigint,
         (select count(*) from listening l where l.user_id = u.id and l.seconds > 0),
         (select max(l.day) from listening l where l.user_id = u.id),
         (select count(*) from devices d where d.user_id = u.id),
         exists (select 1 from founders f where f.user_id = u.id),
         b.reason, coalesce(bp.display_name, bp.handle)
  from auth.users u
  left join profiles p on p.id = u.id
  left join bans b on b.user_id = u.id and b.lifted_at is null
  left join profiles bp on bp.id = b.banned_by
  order by u.created_at desc;
end $$;

create or replace function public.admin_user_days(uid uuid) returns table (day date, seconds int)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_founder() then raise exception 'founders only' using errcode = '42501'; end if;
  return query select l.day, l.seconds from listening l where l.user_id = uid order by l.day;
end $$;

create or replace function public.admin_ban(uid uuid, why text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_founder() then raise exception 'founders only' using errcode = '42501'; end if;
  if exists (select 1 from founders where user_id = uid) then raise exception 'founders cannot be banned'; end if;
  insert into bans (user_id, reason, banned_by) values (uid, left(trim(why), 300), auth.uid())
  on conflict (user_id) do update set reason = excluded.reason, banned_by = excluded.banned_by, created_at = now(), lifted_at = null;
end $$;

create or replace function public.admin_unban(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_founder() then raise exception 'founders only' using errcode = '42501'; end if;
  update bans set lifted_at = now() where user_id = uid and lifted_at is null;
end $$;

revoke execute on function public.add_listening(int, date), public.touch_device(text), public.is_founder(), public.is_banned(uuid),
  public.my_status(), public.leaderboard2(int), public.admin_users2(), public.admin_user_days(uuid),
  public.admin_ban(uuid, text), public.admin_unban(uuid) from public, anon;
grant execute on function public.add_listening(int, date), public.touch_device(text), public.is_founder(), public.my_status(),
  public.leaderboard2(int), public.admin_users2(), public.admin_user_days(uuid), public.admin_ban(uuid, text), public.admin_unban(uuid) to authenticated;

-- profile pictures: public bucket, each user writes only avatars/<own id>/... ------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy "avatars: own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: own update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: own select" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

notify pgrst, 'reload schema';
