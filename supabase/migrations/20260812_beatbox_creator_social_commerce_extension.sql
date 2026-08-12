-- BeatBox creator, social, commerce, advertising, and earnings extension.
-- Additive only: no production data reset and no existing table replacement.

alter table public.seller_payment_methods
  add column if not exists country text,
  add column if not exists currency text not null default 'USD',
  add column if not exists account_holder_name text,
  add column if not exists contact_value text;

alter table public.beats
  add column if not exists content_type text not null default 'audio',
  add column if not exists access_mode text not null default 'paid_download',
  add column if not exists currency text not null default 'USD',
  add column if not exists download_enabled boolean not null default true;

alter table public.beats
  drop constraint if exists beats_content_type_check,
  drop constraint if exists beats_access_mode_check;
alter table public.beats
  add constraint beats_content_type_check check (content_type in ('audio','video','software')),
  add constraint beats_access_mode_check check (access_mode in ('free_download','paid_download','stream_only'));

alter table public.orders
  add column if not exists platform_fee_amount numeric(12,2) not null default 0,
  add column if not exists seller_amount numeric(12,2) not null default 0;

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null unique,
  description text,
  content_type text not null check (content_type in ('audio','video','software')),
  cover_path text,
  preview_path text,
  original_path text not null,
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'USD',
  access_mode text not null check (access_mode in ('free_download','paid_download','stream_only')),
  download_enabled boolean not null default true,
  genre text,
  tags text[] not null default '{}',
  status text not null default 'published' check (status in ('draft','published','archived','removed')),
  view_count integer not null default 0 check (view_count >= 0),
  like_count integer not null default 0 check (like_count >= 0),
  comment_count integer not null default 0 check (comment_count >= 0),
  share_count integer not null default 0 check (share_count >= 0),
  download_count integer not null default 0 check (download_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists content_items_discovery_idx on public.content_items (status, created_at desc);
create index if not exists content_items_seller_idx on public.content_items (seller_id, updated_at desc);

create table if not exists public.content_likes (
  content_id uuid not null references public.content_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (content_id, user_id)
);
create table if not exists public.content_bookmarks (
  content_id uuid not null references public.content_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (content_id, user_id)
);
create table if not exists public.content_comments (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.content_comments(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.content_shares (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  channel text not null default 'copy_link',
  created_at timestamptz not null default now()
);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  content_id uuid references public.content_items(id) on delete set null,
  media_path text,
  media_type text check (media_type in ('image','audio','video')),
  link_url text,
  status text not null default 'published' check (status in ('draft','published','removed')),
  like_count integer not null default 0,
  comment_count integer not null default 0,
  share_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_posts_has_content check (coalesce(length(trim(body)),0) > 0 or media_path is not null or link_url is not null or content_id is not null)
);
create index if not exists social_posts_feed_idx on public.social_posts (status, created_at desc);
create table if not exists public.social_post_likes (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table if not exists public.social_post_bookmarks (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table if not exists public.social_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.social_post_comments(id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create table if not exists public.social_reposts (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table if not exists public.social_friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sender_id, receiver_id),
  check (sender_id <> receiver_id)
);
create table if not exists public.social_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);
create table if not exists public.social_mutes (
  muter_id uuid not null references public.profiles(id) on delete cascade,
  muted_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (muter_id, muted_id),
  check (muter_id <> muted_id)
);

alter table public.reports
  add column if not exists reported_content_id uuid references public.content_items(id) on delete set null,
  add column if not exists reported_post_id uuid references public.social_posts(id) on delete set null;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id) on delete cascade,
  product_type text not null check (product_type in ('physical','digital','service')),
  title text not null,
  slug text not null unique,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  currency text not null default 'USD',
  stock integer check (stock is null or stock >= 0),
  location text,
  delivery_information text,
  file_path text,
  status text not null default 'published' check (status in ('draft','published','archived','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create table if not exists public.product_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending','payment_submitted','payment_verified','fulfilled','cancelled','rejected')),
  payment_method text,
  payment_reference text,
  delivery_status text not null default 'not_started' check (delivery_status in ('not_started','processing','shipped','delivered','digital_ready')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  objective text not null default 'profile',
  budget numeric(12,2) not null default 0 check (budget >= 0),
  currency text not null default 'USD',
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft','pending_review','approved','rejected','paused','completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_at > start_at)
);
create table if not exists public.ad_creatives (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.ad_campaigns(id) on delete cascade,
  headline text not null,
  body text,
  image_path text,
  target_url text,
  promoted_product_id uuid references public.products(id) on delete set null,
  promoted_content_id uuid references public.content_items(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.ad_events (
  id uuid primary key default gen_random_uuid(),
  creative_id uuid not null references public.ad_creatives(id) on delete cascade,
  viewer_id uuid references public.profiles(id) on delete set null,
  event_type text not null check (event_type in ('impression','click')),
  created_at timestamptz not null default now()
);

create or replace view public.seller_earnings as
select
  o.seller_id,
  o.id as order_id,
  o.beat_id,
  o.amount,
  coalesce(o.platform_fee_amount, 0) as platform_fee_amount,
  greatest(o.amount - coalesce(o.platform_fee_amount, 0), 0) as seller_amount,
  o.currency,
  o.status,
  o.verified_at,
  o.created_at
from public.orders o
where o.status in ('payment_verified','delivered');

-- Ownership and visibility policies.
alter table public.content_items enable row level security;
alter table public.content_likes enable row level security;
alter table public.content_bookmarks enable row level security;
alter table public.content_comments enable row level security;
alter table public.content_shares enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_post_likes enable row level security;
alter table public.social_post_bookmarks enable row level security;
alter table public.social_post_comments enable row level security;
alter table public.social_reposts enable row level security;
alter table public.social_friend_requests enable row level security;
alter table public.social_blocks enable row level security;
alter table public.social_mutes enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_orders enable row level security;
alter table public.ad_campaigns enable row level security;
alter table public.ad_creatives enable row level security;
alter table public.ad_events enable row level security;

create policy "BeatBox published content is public" on public.content_items for select using (status = 'published' or seller_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox sellers create content" on public.content_items for insert to authenticated with check (seller_id = auth.uid() and public.is_beatbox_seller());
create policy "BeatBox sellers update content" on public.content_items for update using (seller_id = auth.uid() or public.is_beatbox_admin()) with check (seller_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox sellers delete content" on public.content_items for delete using (seller_id = auth.uid() or public.is_beatbox_admin());

create policy "BeatBox users read content likes" on public.content_likes for select using (true);
create policy "BeatBox users create own content likes" on public.content_likes for insert to authenticated with check (user_id = auth.uid());
create policy "BeatBox users delete own content likes" on public.content_likes for delete using (user_id = auth.uid());
create policy "BeatBox users read content bookmarks" on public.content_bookmarks for select using (user_id = auth.uid());
create policy "BeatBox users create own content bookmarks" on public.content_bookmarks for insert to authenticated with check (user_id = auth.uid());
create policy "BeatBox users delete own content bookmarks" on public.content_bookmarks for delete using (user_id = auth.uid());
create policy "BeatBox users read content comments" on public.content_comments for select using (true);
create policy "BeatBox users create own content comments" on public.content_comments for insert to authenticated with check (user_id = auth.uid());
create policy "BeatBox users update own content comments" on public.content_comments for update using (user_id = auth.uid() or public.is_beatbox_admin()) with check (user_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox users delete own content comments" on public.content_comments for delete using (user_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox users create content shares" on public.content_shares for insert to authenticated with check (user_id = auth.uid() or user_id is null);
create policy "BeatBox users read content shares" on public.content_shares for select using (true);

create policy "BeatBox published posts are public" on public.social_posts for select using (status = 'published' or author_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox users create own posts" on public.social_posts for insert to authenticated with check (author_id = auth.uid());
create policy "BeatBox users update own posts" on public.social_posts for update using (author_id = auth.uid() or public.is_beatbox_admin()) with check (author_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox users delete own posts" on public.social_posts for delete using (author_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox users read post likes" on public.social_post_likes for select using (true);
create policy "BeatBox users create own post likes" on public.social_post_likes for insert to authenticated with check (user_id = auth.uid());
create policy "BeatBox users delete own post likes" on public.social_post_likes for delete using (user_id = auth.uid());
create policy "BeatBox users read post bookmarks" on public.social_post_bookmarks for select using (user_id = auth.uid());
create policy "BeatBox users create own post bookmarks" on public.social_post_bookmarks for insert to authenticated with check (user_id = auth.uid());
create policy "BeatBox users delete own post bookmarks" on public.social_post_bookmarks for delete using (user_id = auth.uid());
create policy "BeatBox users read post comments" on public.social_post_comments for select using (true);
create policy "BeatBox users create own post comments" on public.social_post_comments for insert to authenticated with check (user_id = auth.uid());
create policy "BeatBox users delete own post comments" on public.social_post_comments for delete using (user_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox users read reposts" on public.social_reposts for select using (true);
create policy "BeatBox users create own reposts" on public.social_reposts for insert to authenticated with check (user_id = auth.uid());
create policy "BeatBox users delete own reposts" on public.social_reposts for delete using (user_id = auth.uid());
create policy "BeatBox users manage own friend requests" on public.social_friend_requests for all to authenticated using (sender_id = auth.uid() or receiver_id = auth.uid()) with check (sender_id = auth.uid());
create policy "BeatBox users manage own blocks" on public.social_blocks for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid() and blocked_id <> auth.uid());
create policy "BeatBox users manage own mutes" on public.social_mutes for all to authenticated using (muter_id = auth.uid()) with check (muter_id = auth.uid() and muted_id <> auth.uid());

create policy "BeatBox published products are public" on public.products for select using (status = 'published' or seller_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox sellers create products" on public.products for insert to authenticated with check (seller_id = auth.uid() and public.is_beatbox_seller());
create policy "BeatBox sellers update products" on public.products for update using (seller_id = auth.uid() or public.is_beatbox_admin()) with check (seller_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox sellers delete products" on public.products for delete using (seller_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox product images are public for published products" on public.product_images for select using (exists (select 1 from public.products p where p.id = product_id and (p.status = 'published' or p.seller_id = auth.uid() or public.is_beatbox_admin())));
create policy "BeatBox sellers manage product images" on public.product_images for all to authenticated using (exists (select 1 from public.products p where p.id = product_id and (p.seller_id = auth.uid() or public.is_beatbox_admin()))) with check (exists (select 1 from public.products p where p.id = product_id and (p.seller_id = auth.uid() or public.is_beatbox_admin())));
create policy "BeatBox parties view product orders" on public.product_orders for select using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox buyers create product orders" on public.product_orders for insert to authenticated with check (buyer_id = auth.uid());
create policy "BeatBox sellers review product orders" on public.product_orders for update using (seller_id = auth.uid() or public.is_beatbox_admin()) with check (seller_id = auth.uid() or public.is_beatbox_admin());

create policy "BeatBox advertisers manage campaigns" on public.ad_campaigns for all to authenticated using (advertiser_id = auth.uid() or public.is_beatbox_admin()) with check (advertiser_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox advertisers manage creatives" on public.ad_creatives for all to authenticated using (exists (select 1 from public.ad_campaigns c where c.id = campaign_id and (c.advertiser_id = auth.uid() or public.is_beatbox_admin()))) with check (exists (select 1 from public.ad_campaigns c where c.id = campaign_id and (c.advertiser_id = auth.uid() or public.is_beatbox_admin())));
create policy "BeatBox approved creatives are public" on public.ad_creatives for select using (exists (select 1 from public.ad_campaigns c where c.id = campaign_id and (c.status = 'approved' or c.advertiser_id = auth.uid() or public.is_beatbox_admin())));
create policy "BeatBox admins manage ad events" on public.ad_events for select using (public.is_beatbox_admin());
create policy "BeatBox users record ad events" on public.ad_events for insert to authenticated with check (viewer_id = auth.uid() or viewer_id is null);

-- Extend seller-owned buyer-visible payment metadata without changing existing rows.
drop policy if exists "BeatBox buyers view payment instructions on orders" on public.seller_payment_methods;
create policy "BeatBox buyers view seller payment instructions on orders" on public.seller_payment_methods for select to authenticated using (
  exists (
    select 1 from public.orders o
    where o.seller_id = seller_payment_methods.seller_id
      and (o.buyer_id = auth.uid() or public.is_beatbox_admin())
      and o.status in ('pending','payment_submitted','under_review','payment_verified','delivered')
  )
);

-- Private generic content buckets; public previews remain controlled by the application via signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('content-covers', 'content-covers', false, 10485760, array['image/jpeg','image/png','image/webp']),
  ('content-previews', 'content-previews', false, 524288000, array['audio/mpeg','audio/wav','audio/mp4','audio/aac','video/mp4','video/webm']),
  ('content-masters', 'content-masters', false, 2147483648, array['audio/mpeg','audio/wav','audio/flac','audio/mp4','video/mp4','video/webm','application/zip','application/vnd.android.package-archive','application/octet-stream'])
on conflict (id) do nothing;

create policy "BeatBox sellers manage content covers" on storage.objects for all to authenticated using (bucket_id = 'content-covers' and (storage.foldername(name))[1] = auth.uid()::text and public.is_beatbox_seller()) with check (bucket_id = 'content-covers' and (storage.foldername(name))[1] = auth.uid()::text and public.is_beatbox_seller());
create policy "BeatBox sellers manage content previews" on storage.objects for all to authenticated using (bucket_id = 'content-previews' and (storage.foldername(name))[1] = auth.uid()::text and public.is_beatbox_seller()) with check (bucket_id = 'content-previews' and (storage.foldername(name))[1] = auth.uid()::text and public.is_beatbox_seller());
create policy "BeatBox sellers manage content masters" on storage.objects for all to authenticated using (bucket_id = 'content-masters' and (storage.foldername(name))[1] = auth.uid()::text and public.is_beatbox_seller()) with check (bucket_id = 'content-masters' and (storage.foldername(name))[1] = auth.uid()::text and public.is_beatbox_seller());

revoke all on public.seller_earnings from anon;
grant select on public.seller_earnings to authenticated;
