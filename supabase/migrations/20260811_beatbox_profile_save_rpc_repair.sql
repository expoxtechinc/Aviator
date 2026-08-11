-- Targeted production repair: the prior migration applied the seller routine but
-- the profile-save RPC was not present in the live schema. This migration is
-- intentionally narrow and can be safely applied after the original repair.

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

revoke all on function public.update_self_profile(text, text, text, text) from public;
grant execute on function public.update_self_profile(text, text, text, text) to authenticated;
