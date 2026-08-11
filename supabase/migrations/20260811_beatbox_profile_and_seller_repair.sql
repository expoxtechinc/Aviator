-- BeatBox profile persistence and self-service seller-registration repair.
-- This migration preserves auth-provider behavior and limits elevated database work
-- to narrowly scoped functions that always verify auth.uid().

create or replace function public.ensure_self_profile()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  auth_email text;
  auth_metadata jsonb;
begin
  if current_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  select email, raw_user_meta_data
  into auth_email, auth_metadata
  from auth.users
  where id = current_user_id;

  if not found then
    raise exception 'Authenticated account was not found';
  end if;

  insert into public.profiles (id, email, display_name, avatar_url, role, account_status)
  values (
    current_user_id,
    auth_email,
    coalesce(
      nullif(trim(auth_metadata ->> 'full_name'), ''),
      nullif(trim(auth_metadata ->> 'name'), ''),
      nullif(split_part(coalesce(auth_email, ''), '@', 1), ''),
      'BeatBox listener'
    ),
    nullif(trim(auth_metadata ->> 'avatar_url'), ''),
    'buyer',
    'active'
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(nullif(public.profiles.display_name, ''), excluded.display_name),
    avatar_url = coalesce(nullif(public.profiles.avatar_url, ''), excluded.avatar_url),
    updated_at = now();
end;
$$;

create or replace function public.update_self_profile(
  p_display_name text,
  p_username text,
  p_bio text,
  p_country text
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  normalized_display_name text := nullif(trim(coalesce(p_display_name, '')), '');
  normalized_username text := nullif(lower(trim(coalesce(p_username, ''))), '');
  normalized_bio text := nullif(trim(coalesce(p_bio, '')), '');
  normalized_country text := nullif(trim(coalesce(p_country, '')), '');
begin
  if current_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  perform public.ensure_self_profile();

  if normalized_display_name is null or char_length(normalized_display_name) > 80 then
    raise exception 'Display name is required and must be 80 characters or fewer';
  end if;

  if normalized_username is not null and normalized_username !~ '^[a-z0-9][a-z0-9-]{1,29}$' then
    raise exception 'Username must use 2–30 lowercase letters, numbers, or hyphens';
  end if;

  if normalized_bio is not null and char_length(normalized_bio) > 1000 then
    raise exception 'Bio must be 1000 characters or fewer';
  end if;

  if normalized_country is not null and char_length(normalized_country) > 80 then
    raise exception 'Country must be 80 characters or fewer';
  end if;

  update public.profiles
  set display_name = normalized_display_name,
      username = normalized_username,
      bio = normalized_bio,
      country = normalized_country,
      updated_at = now()
  where id = current_user_id;
end;
$$;

create or replace function public.register_as_seller(producer_name_input text default null)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
  requested_name text := nullif(trim(producer_name_input), '');
begin
  if current_user_id is null then
    raise exception 'Authentication is required' using errcode = '28000';
  end if;

  perform public.ensure_self_profile();

  if requested_name is not null and char_length(requested_name) > 100 then
    raise exception 'Producer name must be 100 characters or fewer';
  end if;

  perform set_config('beatbox.allow_seller_registration', 'on', true);

  update public.profiles
  set role = case
        when role = 'admin'::public.user_role then 'admin'::public.user_role
        else 'seller'::public.user_role
      end,
      updated_at = now()
  where id = current_user_id
    and account_status = 'active';

  if not found then
    raise exception 'An active profile is required to become a seller';
  end if;

  insert into public.seller_profiles (id, producer_name)
  select
    id,
    coalesce(requested_name, nullif(display_name, ''), nullif(username, ''), 'BeatBox producer')
  from public.profiles
  where id = current_user_id
  on conflict (id) do update set
    producer_name = coalesce(requested_name, public.seller_profiles.producer_name),
    updated_at = now();
end;
$$;

-- Preserve the earlier public routine name for any already-open BeatBox client.
create or replace function public.promote_self_to_seller(producer_name_input text default null)
returns void
language plpgsql
security invoker
set search_path = public, auth
as $$
begin
  perform public.register_as_seller(producer_name_input);
end;
$$;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() = old.id and not public.is_beatbox_admin() then
    new.id := old.id;
    new.account_status := old.account_status;
    if current_setting('beatbox.allow_seller_registration', true) = 'on'
       and old.role = 'buyer'
       and new.role = 'seller' then
      null;
    else
      new.role := old.role;
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Private profile data is available only to the account owner or an authenticated owner/admin.
drop policy if exists profiles_read on public.profiles;
drop policy if exists profiles_read_own_or_admin on public.profiles;
create policy profiles_read_own_or_admin on public.profiles
  for select using (id = auth.uid() or public.is_beatbox_admin());

drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid() or public.is_beatbox_admin())
  with check (id = auth.uid() or public.is_beatbox_admin());

drop policy if exists seller_profiles_read on public.seller_profiles;
drop policy if exists seller_profiles_read_own_or_admin on public.seller_profiles;
create policy seller_profiles_read_own_or_admin on public.seller_profiles
  for select using (id = auth.uid() or public.is_beatbox_admin());

drop policy if exists seller_profiles_manage_own on public.seller_profiles;
drop policy if exists seller_profiles_insert_own on public.seller_profiles;
drop policy if exists seller_profiles_update_own on public.seller_profiles;
create policy seller_profiles_insert_own on public.seller_profiles
  for insert with check (id = auth.uid() and public.is_beatbox_seller());
create policy seller_profiles_update_own on public.seller_profiles
  for update using (id = auth.uid() or public.is_beatbox_admin())
  with check (id = auth.uid() or public.is_beatbox_admin());

-- Public producer data is exposed only through this constrained projection.
create or replace function public.get_public_sellers(p_seller_id uuid default null)
returns table (
  id uuid,
  display_name text,
  username text,
  bio text,
  avatar_url text,
  country text,
  producer_name text,
  whatsapp text,
  follower_count integer,
  instagram_url text,
  youtube_url text,
  soundcloud_url text
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    p.id,
    p.display_name,
    p.username,
    p.bio,
    p.avatar_url,
    p.country,
    sp.producer_name,
    sp.whatsapp,
    sp.follower_count,
    sp.instagram_url,
    sp.youtube_url,
    sp.soundcloud_url
  from public.profiles p
  join public.seller_profiles sp on sp.id = p.id
  where p.account_status = 'active'
    and p.role in ('seller', 'admin')
    and (p_seller_id is null or p.id = p_seller_id)
  order by coalesce(sp.producer_name, p.display_name, p.username), p.created_at
  limit case when p_seller_id is null then 50 else 1 end;
$$;

grant execute on function public.ensure_self_profile() to authenticated;
grant execute on function public.update_self_profile(text, text, text, text) to authenticated;
grant execute on function public.register_as_seller(text) to authenticated;
grant execute on function public.promote_self_to_seller(text) to authenticated;
grant execute on function public.get_public_sellers(uuid) to anon, authenticated;
