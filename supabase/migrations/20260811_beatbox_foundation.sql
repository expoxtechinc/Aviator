create extension if not exists pgcrypto;

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

create table if not exists public.beat_licenses (
  id uuid primary key default gen_random_uuid(),
  beat_id uuid not null references public.beats(id) on delete cascade,
  name text not null check (name in ('Basic', 'Premium', 'Exclusive')),
  price numeric(12,2) not null check (price >= 0),
  terms text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (beat_id, name)
);

alter table public.orders add column if not exists license_id uuid references public.beat_licenses(id) on delete set null;

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  beat_id uuid not null references public.beats(id) on delete cascade,
  license_id uuid references public.beat_licenses(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, beat_id, license_id)
);

create index if not exists beats_discovery_idx on public.beats (status, published_at desc);
create index if not exists beats_genre_idx on public.beats (genre, bpm);
create index if not exists beats_seller_idx on public.beats (seller_id, status, created_at desc);
create index if not exists orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index if not exists orders_seller_idx on public.orders (seller_id, status, created_at desc);
create index if not exists payment_requests_seller_idx on public.payment_requests (seller_id, status, created_at desc);
create index if not exists favorites_user_idx on public.favorites (user_id, created_at desc);
create index if not exists notifications_user_idx on public.notifications (user_id, read, created_at desc);
create index if not exists follows_following_idx on public.follows (following_id, created_at desc);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and account_status = 'active'
  );
$$;

create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('seller', 'admin') and account_status = 'active'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url, role, account_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    'buyer',
    'active'
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name),
    avatar_url = coalesce(public.profiles.avatar_url, excluded.avatar_url),
    updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.promote_self_to_seller(producer_name_input text default null)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required';
  end if;

  update public.profiles
  set role = 'seller', updated_at = now()
  where id = current_user_id and account_status = 'active';

  if not found then
    raise exception 'An active profile is required to become a seller';
  end if;

  insert into public.seller_profiles (id, producer_name)
  select id, coalesce(nullif(trim(producer_name_input), ''), display_name, username, 'BeatBox producer')
  from public.profiles
  where id = current_user_id
  on conflict (id) do update set
    producer_name = coalesce(nullif(trim(producer_name_input), ''), public.seller_profiles.producer_name),
    updated_at = now();
end;
$$;

grant execute on function public.promote_self_to_seller(text) to authenticated;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() = old.id and not public.is_admin() then
    new.id := old.id;
    new.account_status := old.account_status;
    if new.role = 'admin' then
      raise exception 'Only an owner can assign the admin role';
    end if;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_profile_privileges_trigger on public.profiles;
create trigger protect_profile_privileges_trigger
  before update on public.profiles
  for each row execute procedure public.protect_profile_privileges();

create or replace function public.protect_seller_verification()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() = old.id and not public.is_admin() then
    new.verified := old.verified;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists protect_seller_verification_trigger on public.seller_profiles;
create trigger protect_seller_verification_trigger
  before update on public.seller_profiles
  for each row execute procedure public.protect_seller_verification();

create or replace function public.enforce_order_values()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  beat_record public.beats%rowtype;
  license_price numeric(12,2);
begin
  select * into beat_record from public.beats where id = new.beat_id;
  if not found or beat_record.status <> 'published' then
    raise exception 'This beat is unavailable';
  end if;
  if new.seller_id <> beat_record.seller_id then
    raise exception 'Order seller must match the beat seller';
  end if;
  if new.license_id is not null then
    select price into license_price from public.beat_licenses
    where id = new.license_id and beat_id = new.beat_id and is_available = true;
    if license_price is null then
      raise exception 'Selected license is unavailable';
    end if;
    new.amount := license_price;
  else
    new.amount := coalesce(beat_record.price, 0);
  end if;
  if coalesce(beat_record.is_free, false) then
    new.amount := 0;
  end if;
  new.status := 'pending';
  return new;
end;
$$;

drop trigger if exists enforce_order_values_trigger on public.orders;
create trigger enforce_order_values_trigger
  before insert on public.orders
  for each row execute procedure public.enforce_order_values();

create or replace function public.enforce_payment_request_values()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  order_record public.orders%rowtype;
begin
  select * into order_record from public.orders where id = new.order_id;
  if not found or order_record.buyer_id <> new.buyer_id or order_record.seller_id <> new.seller_id then
    raise exception 'Payment request does not match the order parties';
  end if;
  new.amount := order_record.amount;
  new.status := 'payment_submitted';
  update public.orders set status = 'payment_submitted', payment_method = new.method, payment_reference = new.reference, updated_at = now()
  where id = new.order_id and status in ('pending', 'payment_rejected');
  return new;
end;
$$;

drop trigger if exists enforce_payment_request_values_trigger on public.payment_requests;
create trigger enforce_payment_request_values_trigger
  before insert on public.payment_requests
  for each row execute procedure public.enforce_payment_request_values();

create or replace function public.sync_payment_review()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.status is distinct from old.status and new.status in ('under_review', 'payment_verified', 'payment_rejected', 'delivered') then
    update public.orders
    set status = new.status,
        verified_at = case when new.status = 'payment_verified' then now() else verified_at end,
        delivered_at = case when new.status = 'delivered' then now() else delivered_at end,
        updated_at = now()
    where id = new.order_id;
  end if;
  return new;
end;
$$;

drop trigger if exists sync_payment_review_trigger on public.payment_requests;
create trigger sync_payment_review_trigger
  after update on public.payment_requests
  for each row execute procedure public.sync_payment_review();

create or replace function public.notify_payment_request()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.notifications (user_id, type, title, message, metadata)
  values (new.seller_id, 'payment_request', 'Payment submitted', 'A buyer submitted a payment reference for review.', jsonb_build_object('order_id', new.order_id, 'payment_request_id', new.id));
  insert into public.notifications (user_id, type, title, message, metadata)
  select id, 'platform_order', 'New payment request', 'A buyer submitted a payment request requiring seller review.', jsonb_build_object('order_id', new.order_id, 'payment_request_id', new.id)
  from public.profiles where role = 'admin' and account_status = 'active';
  return new;
end;
$$;

drop trigger if exists notify_payment_request_trigger on public.payment_requests;
create trigger notify_payment_request_trigger
  after insert on public.payment_requests
  for each row execute procedure public.notify_payment_request();

create or replace function public.notify_payment_review()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.status is distinct from old.status and new.status in ('payment_verified', 'payment_rejected', 'delivered') then
    insert into public.notifications (user_id, type, title, message, metadata)
    values (
      new.buyer_id,
      'payment_review',
      case when new.status = 'payment_verified' then 'Payment verified' when new.status = 'delivered' then 'Beat delivered' else 'Payment needs attention' end,
      case when new.status = 'payment_verified' then 'Your payment was verified. Your secure download is now available.' when new.status = 'delivered' then 'Your order has been marked delivered.' else 'Your payment request was rejected. Review the seller instructions and submit a new reference.' end,
      jsonb_build_object('order_id', new.order_id, 'payment_request_id', new.id, 'status', new.status)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists notify_payment_review_trigger on public.payment_requests;
create trigger notify_payment_review_trigger
  after update on public.payment_requests
  for each row execute procedure public.notify_payment_review();

create or replace function public.get_payment_instructions(order_id_input uuid)
returns table (id uuid, provider text, account_name text, account_number text, phone_number text, instructions text)
language sql
stable
security definer
set search_path = public, auth
as $$
  select pm.id, pm.provider, pm.account_name, pm.account_number, pm.phone_number, pm.instructions
  from public.seller_payment_methods pm
  join public.orders o on o.seller_id = pm.seller_id
  where o.id = order_id_input and o.buyer_id = auth.uid();
$$;

grant execute on function public.get_payment_instructions(uuid) to authenticated;

alter table public.follows enable row level security;
alter table public.beat_licenses enable row level security;
alter table public.cart_items enable row level security;
alter table public.profiles enable row level security;
alter table public.seller_profiles enable row level security;
alter table public.beats enable row level security;
alter table public.categories enable row level security;
alter table public.tags enable row level security;
alter table public.beat_tags enable row level security;
alter table public.favorites enable row level security;
alter table public.orders enable row level security;
alter table public.payment_requests enable row level security;
alter table public.seller_payment_methods enable row level security;
alter table public.downloads enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.audit_logs enable row level security;
alter table public.platform_settings enable row level security;

drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles for select using (true);
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles for insert with check (id = auth.uid());
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles for update using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

drop policy if exists seller_profiles_read on public.seller_profiles;
create policy seller_profiles_read on public.seller_profiles for select using (true);
drop policy if exists seller_profiles_manage_own on public.seller_profiles;
create policy seller_profiles_manage_own on public.seller_profiles for all using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

drop policy if exists beats_read_published_or_own on public.beats;
create policy beats_read_published_or_own on public.beats for select using (status = 'published' or seller_id = auth.uid() or public.is_admin());
drop policy if exists beats_insert_seller on public.beats;
create policy beats_insert_seller on public.beats for insert with check (seller_id = auth.uid() and public.is_seller());
drop policy if exists beats_update_seller on public.beats;
create policy beats_update_seller on public.beats for update using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());
drop policy if exists beats_delete_seller on public.beats;
create policy beats_delete_seller on public.beats for delete using (seller_id = auth.uid() or public.is_admin());

drop policy if exists beat_licenses_read on public.beat_licenses;
create policy beat_licenses_read on public.beat_licenses for select using (exists (select 1 from public.beats b where b.id = beat_id and (b.status = 'published' or b.seller_id = auth.uid() or public.is_admin())));
drop policy if exists beat_licenses_manage on public.beat_licenses;
create policy beat_licenses_manage on public.beat_licenses for all using (exists (select 1 from public.beats b where b.id = beat_id and (b.seller_id = auth.uid() or public.is_admin()))) with check (exists (select 1 from public.beats b where b.id = beat_id and (b.seller_id = auth.uid() or public.is_admin())));

drop policy if exists categories_public_read on public.categories;
create policy categories_public_read on public.categories for select using (true);
drop policy if exists categories_admin_manage on public.categories;
create policy categories_admin_manage on public.categories for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists tags_public_read on public.tags;
create policy tags_public_read on public.tags for select using (true);
drop policy if exists tags_admin_manage on public.tags;
create policy tags_admin_manage on public.tags for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists beat_tags_read on public.beat_tags;
create policy beat_tags_read on public.beat_tags for select using (exists (select 1 from public.beats b where b.id = beat_id and (b.status = 'published' or b.seller_id = auth.uid() or public.is_admin())));
drop policy if exists beat_tags_manage on public.beat_tags;
create policy beat_tags_manage on public.beat_tags for all using (exists (select 1 from public.beats b where b.id = beat_id and (b.seller_id = auth.uid() or public.is_admin()))) with check (exists (select 1 from public.beats b where b.id = beat_id and (b.seller_id = auth.uid() or public.is_admin())));

drop policy if exists favorites_manage_own on public.favorites;
create policy favorites_manage_own on public.favorites for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists follows_public_read on public.follows;
create policy follows_public_read on public.follows for select using (true);
drop policy if exists follows_manage_own on public.follows;
create policy follows_manage_own on public.follows for all using (follower_id = auth.uid()) with check (follower_id = auth.uid());

drop policy if exists cart_manage_own on public.cart_items;
create policy cart_manage_own on public.cart_items for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists orders_read_parties on public.orders;
create policy orders_read_parties on public.orders for select using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
drop policy if exists orders_insert_buyer on public.orders;
create policy orders_insert_buyer on public.orders for insert with check (buyer_id = auth.uid());
drop policy if exists orders_update_seller_or_admin on public.orders;
create policy orders_update_seller_or_admin on public.orders for update using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());

drop policy if exists payment_requests_read_parties on public.payment_requests;
create policy payment_requests_read_parties on public.payment_requests for select using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
drop policy if exists payment_requests_insert_buyer on public.payment_requests;
create policy payment_requests_insert_buyer on public.payment_requests for insert with check (buyer_id = auth.uid());
drop policy if exists payment_requests_update_seller_or_admin on public.payment_requests;
create policy payment_requests_update_seller_or_admin on public.payment_requests for update using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());

drop policy if exists payment_methods_manage_own on public.seller_payment_methods;
create policy payment_methods_manage_own on public.seller_payment_methods for all using (seller_id = auth.uid() or public.is_admin()) with check (seller_id = auth.uid() or public.is_admin());

drop policy if exists downloads_read_own on public.downloads;
create policy downloads_read_own on public.downloads for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists notifications_manage_own on public.notifications;
create policy notifications_manage_own on public.notifications for select using (user_id = auth.uid());
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists reports_read_own_or_admin on public.reports;
create policy reports_read_own_or_admin on public.reports for select using (reporter_id = auth.uid() or public.is_admin());
drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports for insert with check (reporter_id = auth.uid());
drop policy if exists reports_admin_update on public.reports;
create policy reports_admin_update on public.reports for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists audit_logs_admin_read on public.audit_logs;
create policy audit_logs_admin_read on public.audit_logs for select using (public.is_admin());
drop policy if exists platform_settings_admin_manage on public.platform_settings;
create policy platform_settings_admin_manage on public.platform_settings for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('beat-covers', 'beat-covers', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('beat-previews', 'beat-previews', true, 20971520, array['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/aac', 'audio/flac']),
  ('beat-masters', 'beat-masters', false, 262144000, array['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/aac', 'audio/flac']),
  ('payment-proofs', 'payment-proofs', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists beat_assets_public_read on storage.objects;
create policy beat_assets_public_read on storage.objects for select using (bucket_id in ('beat-covers', 'beat-previews'));
drop policy if exists beat_assets_owner_insert on storage.objects;
create policy beat_assets_owner_insert on storage.objects for insert with check (bucket_id in ('beat-covers', 'beat-previews', 'beat-masters', 'payment-proofs') and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists beat_assets_owner_update on storage.objects;
create policy beat_assets_owner_update on storage.objects for update using (bucket_id in ('beat-covers', 'beat-previews', 'beat-masters', 'payment-proofs') and owner_id = (select auth.uid()::text)) with check (bucket_id in ('beat-covers', 'beat-previews', 'beat-masters', 'payment-proofs') and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists beat_assets_owner_delete on storage.objects;
create policy beat_assets_owner_delete on storage.objects for delete using (bucket_id in ('beat-covers', 'beat-previews', 'beat-masters', 'payment-proofs') and owner_id = (select auth.uid()::text));
