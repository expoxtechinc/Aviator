create table if not exists public.social_post_shares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel text not null default 'copy',
  created_at timestamptz not null default now()
);
create index if not exists social_post_shares_post_idx on public.social_post_shares(post_id, created_at desc);
alter table public.social_post_shares enable row level security;
drop policy if exists "BeatBox public post share counts" on public.social_post_shares;
create policy "BeatBox public post share counts" on public.social_post_shares for select using (true);
drop policy if exists "BeatBox users create own post shares" on public.social_post_shares;
create policy "BeatBox users create own post shares" on public.social_post_shares for insert to authenticated with check (user_id = auth.uid());
