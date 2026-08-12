-- Secure self-profile metadata update. The caller can only modify their own row.
create or replace function public.update_self_profile_metadata(
  p_display_name text default null,
  p_username text default null,
  p_bio text default null,
  p_country text default null,
  p_city text default null,
  p_location text default null,
  p_website_url text default null,
  p_profession text default null,
  p_education text default null,
  p_interests text default null,
  p_social_links jsonb default '{}'::jsonb,
  p_privacy_settings jsonb default '{}'::jsonb,
  p_contact_preferences jsonb default '{}'::jsonb
) returns public.profiles
language plpgsql
security invoker
set search_path = public
as $$
declare result public.profiles;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.profiles
  set display_name = coalesce(p_display_name, display_name),
      username = coalesce(nullif(lower(trim(p_username)), ''), username),
      bio = coalesce(p_bio, bio),
      country = coalesce(p_country, country),
      city = coalesce(p_city, city),
      location = coalesce(p_location, location),
      website_url = coalesce(p_website_url, website_url),
      profession = coalesce(p_profession, profession),
      education = coalesce(p_education, education),
      interests = coalesce(p_interests, interests),
      social_links = coalesce(p_social_links, social_links),
      privacy_settings = coalesce(p_privacy_settings, privacy_settings),
      contact_preferences = coalesce(p_contact_preferences, contact_preferences),
      updated_at = now()
  where id = auth.uid()
  returning * into result;
  if result.id is null then raise exception 'Profile not found'; end if;
  return result;
end;
$$;
revoke all on function public.update_self_profile_metadata(text,text,text,text,text,text,text,text,text,text,jsonb,jsonb,jsonb) from public;
grant execute on function public.update_self_profile_metadata(text,text,text,text,text,text,text,text,text,text,jsonb,jsonb,jsonb) to authenticated;
