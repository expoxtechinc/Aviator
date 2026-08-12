-- BeatBox public community media.
-- Only the social-media bucket becomes public; marketplace masters, payment proofs,
-- seller files, and administrative assets remain in their existing protected buckets.

update storage.buckets
set public = true
where id = 'social-media';

-- Keep uploads, updates, and deletes restricted to the owner's folder.
-- Public reads are served by the bucket's public URL and do not broaden write access.
drop policy if exists "BeatBox users manage own social media" on storage.objects;
create policy "BeatBox users manage own social media" on storage.objects
for all to authenticated
using (bucket_id = 'social-media' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'social-media' and (storage.foldername(name))[1] = auth.uid()::text);

comment on table storage.buckets is 'BeatBox social-media is public for normal published community posts; protected marketplace buckets remain private.';

alter table public.social_posts
  alter column status set default 'published';

comment on column public.social_posts.status is 'Normal community posts publish publicly by default; draft/removed remain non-public.';

create index if not exists social_posts_public_feed_idx
  on public.social_posts (created_at desc)
  where status = 'published';

notify pgrst, 'reload schema';
notify storage, 'reload config';

-- Verification queries for operators:
-- select id, public from storage.buckets where id in ('social-media','content-masters','payment-proofs');
-- select column_default from information_schema.columns where table_schema='public' and table_name='social_posts' and column_name='status';

