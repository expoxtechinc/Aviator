-- Targeted production repair: profiles.role is a user_role enum, so the
-- seller-promotion CASE expression must return enum values rather than text.

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

revoke all on function public.register_as_seller(text) from public;
grant execute on function public.register_as_seller(text) to authenticated;
