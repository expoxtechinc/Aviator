-- BeatBox security hardening: public profile projection and least-privilege RPC execution.

-- Replace the SECURITY DEFINER public profile view with a deliberately public, RLS-protected projection table.
drop view if exists public.public_profiles;

create table if not exists public.public_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  username text,
  display_name text,
  avatar_url text,
  bio text,
  country text,
  role public.user_role not null,
  created_at timestamptz not null
);

alter table public.public_profiles enable row level security;
drop policy if exists "BeatBox public profile projection is readable" on public.public_profiles;
create policy "BeatBox public profile projection is readable" on public.public_profiles
  for select using (true);

insert into public.public_profiles (id, username, display_name, avatar_url, bio, country, role, created_at)
select id, username, display_name, avatar_url, bio, country, role, created_at
from public.profiles
where account_status = 'active'
on conflict (id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  avatar_url = excluded.avatar_url,
  bio = excluded.bio,
  country = excluded.country,
  role = excluded.role,
  created_at = excluded.created_at;

create or replace function public.sync_public_profile_projection()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' or new.account_status <> 'active' then
    delete from public.public_profiles where id = coalesce(old.id, new.id);
    return coalesce(new, old);
  end if;

  insert into public.public_profiles (id, username, display_name, avatar_url, bio, country, role, created_at)
  values (new.id, new.username, new.display_name, new.avatar_url, new.bio, new.country, new.role, new.created_at)
  on conflict (id) do update set
    username = excluded.username,
    display_name = excluded.display_name,
    avatar_url = excluded.avatar_url,
    bio = excluded.bio,
    country = excluded.country,
    role = excluded.role,
    created_at = excluded.created_at;
  return new;
end;
$$;

drop trigger if exists beatbox_sync_public_profile_projection on public.profiles;
create trigger beatbox_sync_public_profile_projection
after insert or update or delete on public.profiles
for each row execute function public.sync_public_profile_projection();

-- PostgreSQL grants EXECUTE to PUBLIC by default. Trigger helpers must never be directly callable.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_privileges() from public, anon, authenticated;
revoke execute on function public.protect_seller_verification() from public, anon, authenticated;
revoke execute on function public.sync_follower_count() from public, anon, authenticated;
revoke execute on function public.notify_download_activity() from public, anon, authenticated;
revoke execute on function public.notify_moderation_activity() from public, anon, authenticated;
revoke execute on function public.notify_report_activity() from public, anon, authenticated;
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.sync_public_profile_projection() from public, anon, authenticated;

-- The following authenticated workflow RPCs are intentionally callable from BeatBox’s browser client.
revoke execute on function public.attach_tags_to_beat(uuid, text[]) from public, anon;
revoke execute on function public.create_payment_request(uuid, text, text, text) from public, anon;
revoke execute on function public.review_payment_request(uuid, public.order_status) from public, anon;
grant execute on function public.attach_tags_to_beat(uuid, text[]) to authenticated;
grant execute on function public.create_payment_request(uuid, text, text, text) to authenticated;
grant execute on function public.review_payment_request(uuid, public.order_status) to authenticated;

-- RLS helper functions remain callable by query roles because BeatBox policies use them.
-- Each is no-argument, pinned to the public search path, and derives the caller from auth.uid().
revoke execute on function public.is_beatbox_admin() from public;
revoke execute on function public.is_beatbox_seller() from public;
grant execute on function public.is_beatbox_admin() to anon, authenticated;
grant execute on function public.is_beatbox_seller() to anon, authenticated;
