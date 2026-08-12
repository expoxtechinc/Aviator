-- BeatBox media-first social upgrade: additive tables only.
-- Public social media remains separate from private marketplace masters and proofs.

create table if not exists public.social_post_comment_likes (
  comment_id uuid not null references public.social_post_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

create table if not exists public.social_post_mentions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  mentioned_user_id uuid not null references auth.users(id) on delete cascade,
  mentioned_by uuid not null references auth.users(id) on delete cascade,
  comment_id uuid references public.social_post_comments(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, mentioned_user_id, comment_id)
);

create table if not exists public.social_hashtags (
  id uuid primary key default gen_random_uuid(),
  tag text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.social_post_hashtags (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  hashtag_id uuid not null references public.social_hashtags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, hashtag_id)
);

create table if not exists public.social_reels (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.social_posts(id) on delete cascade,
  creator_id uuid not null references auth.users(id) on delete cascade,
  caption text,
  duration_seconds numeric(8,2),
  status text not null default 'published' check (status in ('draft','published','removed')),
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists social_post_mentions_user_idx on public.social_post_mentions(mentioned_user_id, created_at desc);
create index if not exists social_post_hashtags_tag_idx on public.social_post_hashtags(hashtag_id, created_at desc);
create index if not exists social_reels_creator_idx on public.social_reels(creator_id, created_at desc);
create index if not exists social_reels_published_idx on public.social_reels(status, created_at desc);

alter table public.social_post_comment_likes enable row level security;
alter table public.social_post_mentions enable row level security;
alter table public.social_hashtags enable row level security;
alter table public.social_post_hashtags enable row level security;
alter table public.social_reels enable row level security;

drop policy if exists "BeatBox users view comment likes" on public.social_post_comment_likes;
create policy "BeatBox users view comment likes" on public.social_post_comment_likes for select using (true);
drop policy if exists "BeatBox users manage own comment likes" on public.social_post_comment_likes;
create policy "BeatBox users manage own comment likes" on public.social_post_comment_likes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "BeatBox users view public mentions" on public.social_post_mentions;
create policy "BeatBox users view public mentions" on public.social_post_mentions for select using (exists (select 1 from public.social_posts p where p.id = post_id and p.status = 'published'));
drop policy if exists "BeatBox users create own mentions" on public.social_post_mentions;
create policy "BeatBox users create own mentions" on public.social_post_mentions for insert to authenticated with check (mentioned_by = auth.uid());

drop policy if exists "BeatBox public hashtags" on public.social_hashtags;
create policy "BeatBox public hashtags" on public.social_hashtags for select using (true);
drop policy if exists "BeatBox authenticated hashtags" on public.social_hashtags;
create policy "BeatBox authenticated hashtags" on public.social_hashtags for insert to authenticated with check (length(trim(tag)) between 1 and 64);

drop policy if exists "BeatBox public post hashtags" on public.social_post_hashtags;
create policy "BeatBox public post hashtags" on public.social_post_hashtags for select using (exists (select 1 from public.social_posts p where p.id = post_id and p.status = 'published'));
drop policy if exists "BeatBox users manage post hashtags" on public.social_post_hashtags;
create policy "BeatBox users manage post hashtags" on public.social_post_hashtags for all to authenticated using (exists (select 1 from public.social_posts p where p.id = post_id and p.author_id = auth.uid())) with check (exists (select 1 from public.social_posts p where p.id = post_id and p.author_id = auth.uid()));

drop policy if exists "BeatBox public reels" on public.social_reels;
create policy "BeatBox public reels" on public.social_reels for select using (status = 'published');
drop policy if exists "BeatBox creators manage own reels" on public.social_reels;
create policy "BeatBox creators manage own reels" on public.social_reels for all to authenticated using (creator_id = auth.uid()) with check (creator_id = auth.uid());

-- Reels are always public social media posts; this does not grant access to content_items.original_path.
comment on table public.social_reels is 'Short-form public social posts. Never store or expose paid marketplace masters here.';
