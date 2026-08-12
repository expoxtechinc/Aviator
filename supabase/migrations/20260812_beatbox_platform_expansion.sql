-- BeatBox platform expansion: additive only; preserves existing marketplace/social tables and RLS.

alter table public.profiles
  add column if not exists cover_url text,
  add column if not exists website_url text,
  add column if not exists location text,
  add column if not exists country text,
  add column if not exists city text,
  add column if not exists profession text,
  add column if not exists education text,
  add column if not exists interests text,
  add column if not exists social_links jsonb not null default '{}'::jsonb,
  add column if not exists privacy_settings jsonb not null default '{}'::jsonb,
  add column if not exists contact_preferences jsonb not null default '{}'::jsonb,
  add column if not exists date_of_birth date,
  add column if not exists gender text;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_read_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text,
  attachment_path text,
  attachment_type text,
  reply_to_id uuid references public.messages(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  constraint messages_body_or_attachment check (nullif(trim(body), '') is not null or attachment_path is not null)
);

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('like','love','haha','wow','sad','angry')),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

create table if not exists public.creator_analytics_events (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null check (event_type in ('profile_view','beat_play','content_play','product_view')),
  content_id uuid,
  viewer_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.moderation_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references public.profiles(id) on delete restrict,
  action text not null,
  target_type text not null,
  target_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists profiles_username_search_idx on public.profiles (lower(username));
create index if not exists conversations_updated_idx on public.conversations (updated_at desc);
create index if not exists conversation_members_user_idx on public.conversation_members (user_id, joined_at desc);
create index if not exists messages_conversation_idx on public.messages (conversation_id, created_at desc);
create index if not exists analytics_creator_event_idx on public.creator_analytics_events (creator_id, event_type, created_at desc);
create index if not exists moderation_audit_created_idx on public.moderation_audit_logs (created_at desc);

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.creator_analytics_events enable row level security;
alter table public.moderation_audit_logs enable row level security;

create policy conversations_member_select on public.conversations for select using (exists (select 1 from public.conversation_members m where m.conversation_id = id and m.user_id = auth.uid()));
create policy conversations_member_insert on public.conversations for insert with check (auth.uid() is not null);
create policy conversation_members_self_select on public.conversation_members for select using (user_id = auth.uid() or exists (select 1 from public.conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid()));
create policy conversation_members_self_insert on public.conversation_members for insert with check (user_id = auth.uid() or exists (select 1 from public.conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid()));
create policy messages_member_select on public.messages for select using (exists (select 1 from public.conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid()));
create policy messages_member_insert on public.messages for insert with check (sender_id = auth.uid() and exists (select 1 from public.conversation_members m where m.conversation_id = conversation_id and m.user_id = auth.uid()));
create policy messages_sender_update on public.messages for update using (sender_id = auth.uid()) with check (sender_id = auth.uid());
create policy message_reactions_member_all on public.message_reactions for all using (user_id = auth.uid() and exists (select 1 from public.messages msg join public.conversation_members m on m.conversation_id = msg.conversation_id where msg.id = message_id and m.user_id = auth.uid())) with check (user_id = auth.uid());
create policy analytics_public_insert on public.creator_analytics_events for insert with check (auth.uid() is not null or viewer_id is null);
create policy analytics_creator_select on public.creator_analytics_events for select using (creator_id = auth.uid());
create policy moderation_admin_select on public.moderation_audit_logs for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy moderation_admin_insert on public.moderation_audit_logs for insert with check (admin_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

-- Private message objects must be stored in a private bucket named message-media.
insert into storage.buckets (id, name, public) values ('message-media', 'message-media', false) on conflict (id) do nothing;
create policy message_media_authenticated_read on storage.objects for select using (bucket_id = 'message-media' and auth.uid() is not null);
create policy message_media_authenticated_insert on storage.objects for insert with check (bucket_id = 'message-media' and auth.uid() is not null);
