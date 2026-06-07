-- SpaceQ production schema
-- Jalankan di Supabase SQL Editor atau `supabase db push`.
-- Semua tabel public yang dipakai client mengaktifkan RLS.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;

create type public.user_role as enum ('user', 'moderator', 'admin');
create type public.post_status as enum ('draft', 'pending', 'published', 'hidden', 'deleted');
create type public.media_type as enum ('image', 'video', 'audio', 'file');
create type public.report_status as enum ('open', 'reviewing', 'resolved', 'rejected');
create type public.kajian_status as enum ('scheduled', 'live', 'ended', 'cancelled');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  username text unique,
  bio text default '',
  avatar_url text,
  role public.user_role not null default 'user',
  is_supporter boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_format check (username is null or username ~* '^[a-z0-9_\\.]{3,24}$')
);

create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade,
  following_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint no_self_follow check (follower_id <> following_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  caption text,
  media_path text not null,
  thumbnail_path text,
  media_type public.media_type not null,
  status public.post_status not null default 'published',
  moderation_score numeric default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_saves (
  post_id uuid references public.posts(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reason text not null,
  status public.report_status not null default 'open',
  created_at timestamptz not null default now(),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz
);

create table if not exists public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles(id),
  target_post_id uuid references public.posts(id) on delete cascade,
  target_comment_id uuid references public.comments(id) on delete cascade,
  action text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.prayer_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  city text,
  country text default 'Indonesia',
  latitude double precision,
  longitude double precision,
  calculation_method int default 20,
  reminder_before_30 boolean default true,
  reminder_before_10 boolean default true,
  reminder_adhan boolean default true,
  vibrate boolean default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.prayer_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  prayer_date date not null,
  prayer_key text not null,
  prayer_name text not null,
  completed_at timestamptz not null default now(),
  unique(user_id, prayer_date, prayer_key)
);

create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  mood text,
  tags text[] default '{}',
  entry_date date not null default current_date,
  is_private boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quran_bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  surah_number int not null,
  ayah_number int not null,
  ayah_number_global int not null,
  note text default '',
  created_at timestamptz not null default now(),
  unique(user_id, ayah_number_global)
);

create table if not exists public.quran_progress (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  surah_number int not null,
  ayah_number int not null,
  last_read_at timestamptz not null default now()
);

create table if not exists public.murajaah_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  surah_number int not null,
  ayah_number int not null,
  target_text text,
  transcript text,
  score int check (score between 0 and 100),
  feedback text,
  audio_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.kajian_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  scheduled_at timestamptz not null default now(),
  status public.kajian_status not null default 'scheduled',
  meeting_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.kajian_participants (
  room_id uuid references public.kajian_rooms(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'participant',
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create table if not exists public.kajian_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.kajian_rooms(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  media_path text,
  message_type text default 'text',
  created_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  bucket text not null,
  path text not null,
  media_type public.media_type not null,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  type text not null,
  title text not null,
  body text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  provider text not null default 'fcm',
  token text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(provider, token)
);

create table if not exists public.support_donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  provider text,
  amount numeric,
  currency text default 'IDR',
  status text default 'pending',
  external_reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['profiles','posts','comments','prayer_settings','journals','kajian_rooms','push_subscriptions','app_settings'] loop
    execute format('drop trigger if exists trg_%s_updated_at on public.%I', t, t);
    execute format('create trigger trg_%s_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
begin
  base_username := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)), '[^a-zA-Z0-9_\.]', '', 'g'));
  if char_length(base_username) < 3 then base_username := 'user_' || substr(new.id::text, 1, 8); end if;

  insert into public.profiles (id, display_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    base_username
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where id = uid and role in ('admin','moderator'));
$$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.follows enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_saves enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.prayer_settings enable row level security;
alter table public.prayer_checkins enable row level security;
alter table public.journals enable row level security;
alter table public.quran_bookmarks enable row level security;
alter table public.quran_progress enable row level security;
alter table public.murajaah_attempts enable row level security;
alter table public.kajian_rooms enable row level security;
alter table public.kajian_participants enable row level security;
alter table public.kajian_messages enable row level security;
alter table public.media_assets enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.support_donations enable row level security;
alter table public.app_settings enable row level security;

-- Profiles
create policy "public profiles are readable" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
create policy "admin updates profiles" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

-- SocialQ
create policy "published posts visible to authenticated" on public.posts for select using (auth.role() = 'authenticated' and (status in ('published','pending') or profile_id = auth.uid() or public.is_admin()));
create policy "users create own posts" on public.posts for insert with check (auth.uid() = profile_id);
create policy "users update own posts" on public.posts for update using (auth.uid() = profile_id or public.is_admin()) with check (auth.uid() = profile_id or public.is_admin());
create policy "users delete own posts" on public.posts for delete using (auth.uid() = profile_id or public.is_admin());

create policy "likes visible" on public.post_likes for select using (auth.role() = 'authenticated');
create policy "users like as self" on public.post_likes for insert with check (auth.uid() = user_id);
create policy "users unlike as self" on public.post_likes for delete using (auth.uid() = user_id);

create policy "saves visible to owner" on public.post_saves for select using (auth.uid() = user_id);
create policy "users save as self" on public.post_saves for insert with check (auth.uid() = user_id);
create policy "users unsave as self" on public.post_saves for delete using (auth.uid() = user_id);

create policy "comments visible" on public.comments for select using (auth.role() = 'authenticated');
create policy "users comment as self" on public.comments for insert with check (auth.uid() = profile_id);
create policy "users update own comments" on public.comments for update using (auth.uid() = profile_id or public.is_admin()) with check (auth.uid() = profile_id or public.is_admin());
create policy "users delete own comments" on public.comments for delete using (auth.uid() = profile_id or public.is_admin());

create policy "follow rows visible" on public.follows for select using (auth.role() = 'authenticated');
create policy "follow as self" on public.follows for insert with check (auth.uid() = follower_id);
create policy "unfollow as self" on public.follows for delete using (auth.uid() = follower_id);

create policy "report own visible or admin" on public.reports for select using (reporter_id = auth.uid() or public.is_admin());
create policy "authenticated can report" on public.reports for insert with check (auth.uid() = reporter_id);
create policy "admin update reports" on public.reports for update using (public.is_admin()) with check (public.is_admin());

create policy "admin moderation actions only" on public.moderation_actions for all using (public.is_admin()) with check (public.is_admin());

-- Private user feature data
create policy "own prayer settings" on public.prayer_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own prayer checkins" on public.prayer_checkins for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own journals" on public.journals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own quran bookmarks" on public.quran_bookmarks for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own quran progress" on public.quran_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own murajaah attempts" on public.murajaah_attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own media assets" on public.media_assets for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Kajian rooms public to authenticated, writes constrained
create policy "kajian rooms visible" on public.kajian_rooms for select using (auth.role() = 'authenticated');
create policy "host creates rooms" on public.kajian_rooms for insert with check (auth.uid() = host_id);
create policy "host or admin updates rooms" on public.kajian_rooms for update using (auth.uid() = host_id or public.is_admin()) with check (auth.uid() = host_id or public.is_admin());
create policy "host or admin deletes rooms" on public.kajian_rooms for delete using (auth.uid() = host_id or public.is_admin());

create policy "participants visible" on public.kajian_participants for select using (auth.role() = 'authenticated');
create policy "join as self" on public.kajian_participants for insert with check (auth.uid() = user_id);
create policy "leave as self" on public.kajian_participants for delete using (auth.uid() = user_id or public.is_admin());

create policy "messages visible" on public.kajian_messages for select using (auth.role() = 'authenticated');
create policy "send own messages" on public.kajian_messages for insert with check (auth.uid() = profile_id);
create policy "delete own messages or admin" on public.kajian_messages for delete using (auth.uid() = profile_id or public.is_admin());

-- Notifications / push
create policy "own notifications" on public.notifications for select using (auth.uid() = user_id);
create policy "users can create notifications" on public.notifications for insert with check (auth.role() = 'authenticated');
create policy "own notification update" on public.notifications for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own push subscriptions" on public.push_subscriptions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Support
create policy "own donations visible" on public.support_donations for select using (user_id = auth.uid() or public.is_admin());
create policy "users create donation intent" on public.support_donations for insert with check (user_id = auth.uid() or user_id is null);
create policy "admin donation update" on public.support_donations for update using (public.is_admin()) with check (public.is_admin());

create policy "settings public read" on public.app_settings for select using (auth.role() = 'authenticated');
create policy "admin settings write" on public.app_settings for all using (public.is_admin()) with check (public.is_admin());

-- Storage buckets
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('social-media', 'social-media', true, 104857600, array['image/jpeg','image/png','image/webp','video/mp4','video/webm']),
  ('camera-media', 'camera-media', true, 104857600, array['image/jpeg','image/png','image/webp','video/mp4','video/webm']),
  ('journal-exports', 'journal-exports', false, 10485760, array['application/json','text/plain','application/pdf']),
  ('kajian-files', 'kajian-files', false, 104857600, array['image/jpeg','image/png','image/webp','audio/mpeg','audio/webm','video/mp4','application/pdf'])
on conflict (id) do nothing;

-- Storage object policies. Convention: first path segment must equal auth.uid()
create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
create policy "users upload own avatars" on storage.objects for insert with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users update own avatars" on storage.objects for update using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own avatars" on storage.objects for delete using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "social media public read" on storage.objects for select using (bucket_id = 'social-media');
create policy "users upload own social media" on storage.objects for insert with check (bucket_id = 'social-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users manage own social media" on storage.objects for update using (bucket_id = 'social-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own social media" on storage.objects for delete using (bucket_id = 'social-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "camera media public read" on storage.objects for select using (bucket_id = 'camera-media');
create policy "users upload own camera media" on storage.objects for insert with check (bucket_id = 'camera-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users manage own camera media" on storage.objects for update using (bucket_id = 'camera-media' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "users delete own camera media" on storage.objects for delete using (bucket_id = 'camera-media' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "private user files read own" on storage.objects for select using (bucket_id in ('journal-exports','kajian-files') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "private user files upload own" on storage.objects for insert with check (bucket_id in ('journal-exports','kajian-files') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "private user files manage own" on storage.objects for update using (bucket_id in ('journal-exports','kajian-files') and (storage.foldername(name))[1] = auth.uid()::text);
create policy "private user files delete own" on storage.objects for delete using (bucket_id in ('journal-exports','kajian-files') and (storage.foldername(name))[1] = auth.uid()::text);

-- Seed app setting only. Tidak menjadi data utama aplikasi.
insert into public.app_settings(key, value)
values ('support', '{"message":"Muhsinin adalah dukungan opsional. Semua fitur SpaceQ terbuka."}'::jsonb)
on conflict (key) do nothing;
