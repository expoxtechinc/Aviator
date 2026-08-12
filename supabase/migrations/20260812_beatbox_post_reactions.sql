create table if not exists public.social_post_reactions (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('like','love','haha','wow','sad','angry')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.social_post_reactions enable row level security;
create policy social_post_reactions_select on public.social_post_reactions for select using (true);
create policy social_post_reactions_insert on public.social_post_reactions for insert with check (user_id = auth.uid());
create policy social_post_reactions_update on public.social_post_reactions for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy social_post_reactions_delete on public.social_post_reactions for delete using (user_id = auth.uid());
create index if not exists social_post_reactions_post_idx on public.social_post_reactions(post_id, reaction);
