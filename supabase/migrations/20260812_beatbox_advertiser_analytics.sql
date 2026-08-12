-- BeatBox advertiser creatives and analytics visibility.
-- Creative media remains private; ad events remain real records written by the delivery surface.

insert into storage.buckets (id, name, public)
values ('ad-creatives', 'ad-creatives', false)
on conflict (id) do nothing;

-- Supabase-managed storage.objects already has RLS enabled; project migrations may add policies without altering ownership.
drop policy if exists "BeatBox advertisers upload ad creatives" on storage.objects;
create policy "BeatBox advertisers upload ad creatives" on storage.objects for insert to authenticated with check (
  bucket_id = 'ad-creatives' and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "BeatBox advertisers read ad creatives" on storage.objects;
create policy "BeatBox advertisers read ad creatives" on storage.objects for select to authenticated using (
  bucket_id = 'ad-creatives' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_beatbox_admin())
);
drop policy if exists "BeatBox advertisers update ad creatives" on storage.objects;
create policy "BeatBox advertisers update ad creatives" on storage.objects for update to authenticated using (
  bucket_id = 'ad-creatives' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_beatbox_admin())
) with check (
  bucket_id = 'ad-creatives' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_beatbox_admin())
);
drop policy if exists "BeatBox advertisers delete ad creatives" on storage.objects;
create policy "BeatBox advertisers delete ad creatives" on storage.objects for delete to authenticated using (
  bucket_id = 'ad-creatives' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_beatbox_admin())
);

-- Advertisers may inspect only events belonging to their own campaigns; admins retain full visibility.
drop policy if exists "BeatBox admins manage ad events" on public.ad_events;
create policy "BeatBox advertisers view own ad events" on public.ad_events for select to authenticated using (
  viewer_id = auth.uid() or public.is_beatbox_admin() or exists (
    select 1 from public.ad_creatives creative
    join public.ad_campaigns campaign on campaign.id = creative.campaign_id
    where creative.id = ad_events.creative_id and campaign.advertiser_id = auth.uid()
  )
);
drop policy if exists "BeatBox users record ad events" on public.ad_events;
create policy "BeatBox users record ad events" on public.ad_events for insert to authenticated with check (viewer_id = auth.uid() or viewer_id is null);
