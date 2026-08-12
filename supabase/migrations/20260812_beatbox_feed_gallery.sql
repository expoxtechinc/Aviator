alter table public.social_posts add column if not exists media_gallery jsonb not null default '[]'::jsonb;
create index if not exists social_posts_media_gallery_gin on public.social_posts using gin (media_gallery);
comment on column public.social_posts.media_gallery is 'Public Feed attachment metadata only; never contains private marketplace masters.';
