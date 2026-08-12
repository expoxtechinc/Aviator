-- BeatBox seller download summary without exposing other buyers' download rows.

create or replace function public.get_seller_download_summary(seller_id_input uuid default auth.uid())
returns table (download_count bigint, beat_count bigint)
language plpgsql
security definer
stable
set search_path = public, auth
as $$
begin
  if seller_id_input is distinct from auth.uid() and not public.is_beatbox_admin() then
    raise exception 'Seller download summary is owner-scoped';
  end if;
  return query
    select count(*)::bigint, count(distinct d.beat_id)::bigint
    from public.downloads d
    join public.beats b on b.id = d.beat_id
    where b.seller_id = seller_id_input;
end;
$$;

revoke all on function public.get_seller_download_summary(uuid) from public;
grant execute on function public.get_seller_download_summary(uuid) to authenticated;
