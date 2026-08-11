-- BeatBox Supabase foundation: role-safe marketplace data, private media, and payment-request workflows.

create extension if not exists pgcrypto;

alter table public.seller_profiles
  add column if not exists instagram_url text,
  add column if not exists youtube_url text,
  add column if not exists soundcloud_url text,
  add column if not exists follower_count integer not null default 0;

create table if not exists public.producer_follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  producer_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, producer_id),
  constraint producer_follows_no_self_follow check (follower_id <> producer_id)
);

create table if not exists public.beat_licenses (
  id uuid primary key default gen_random_uuid(),
  beat_id uuid not null references public.beats(id) on delete cascade,
  license_code text not null check (license_code in ('basic', 'premium', 'exclusive')),
  name text not null,
  price numeric(12,2) not null default 0 check (price >= 0),
  terms text,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (beat_id, license_code)
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  beat_id uuid not null references public.beats(id) on delete cascade,
  license_id uuid references public.beat_licenses(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, beat_id, license_id)
);

create index if not exists beats_discovery_idx on public.beats (status, created_at desc);
create index if not exists beats_seller_idx on public.beats (seller_id, status, updated_at desc);
create index if not exists beats_genre_bpm_idx on public.beats (genre, bpm) where status = 'published';
create index if not exists orders_buyer_idx on public.orders (buyer_id, created_at desc);
create index if not exists orders_seller_idx on public.orders (seller_id, created_at desc);
create index if not exists payment_requests_seller_idx on public.payment_requests (seller_id, created_at desc);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
create index if not exists producer_follows_producer_idx on public.producer_follows (producer_id, created_at desc);

create or replace function public.is_beatbox_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and account_status = 'active'
  );
$$;

create or replace function public.is_beatbox_seller()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('seller', 'admin') and account_status = 'active'
  );
$$;

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if old.role = 'buyer' and new.role = 'seller' and auth.uid() = old.id then
      null;
    elsif public.is_beatbox_admin() then
      null;
    else
      raise exception 'Only a buyer may opt in to seller access; administrator access cannot be self-assigned';
    end if;
  end if;

  if new.account_status is distinct from old.account_status and not public.is_beatbox_admin() then
    raise exception 'Only an administrator may alter account status';
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists beatbox_protect_profile_privileges on public.profiles;
create trigger beatbox_protect_profile_privileges
before update on public.profiles
for each row execute function public.protect_profile_privileges();

create or replace function public.protect_seller_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.verified is distinct from old.verified and not public.is_beatbox_admin() then
    raise exception 'Seller verification is administrator-controlled';
  end if;
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists beatbox_protect_seller_verification on public.seller_profiles;
create trigger beatbox_protect_seller_verification
before update on public.seller_profiles
for each row execute function public.protect_seller_verification();

create or replace function public.sync_follower_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.seller_profiles
    set follower_count = follower_count + 1, updated_at = now()
    where id = new.producer_id;
    return new;
  end if;

  update public.seller_profiles
  set follower_count = greatest(follower_count - 1, 0), updated_at = now()
  where id = old.producer_id;
  return old;
end;
$$;

drop trigger if exists beatbox_sync_follower_count on public.producer_follows;
create trigger beatbox_sync_follower_count
after insert or delete on public.producer_follows
for each row execute function public.sync_follower_count();

create or replace function public.create_payment_request(
  p_beat_id uuid,
  p_method text,
  p_reference text default null,
  p_proof_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid := auth.uid();
  v_seller_id uuid;
  v_amount numeric(12,2);
  v_order_id uuid;
begin
  if v_buyer_id is null then
    raise exception 'Authentication is required';
  end if;

  select seller_id, price
  into v_seller_id, v_amount
  from public.beats
  where id = p_beat_id and status = 'published' and coalesce(is_free, false) = false;

  if v_seller_id is null then
    raise exception 'This beat is not available for a payment request';
  end if;

  if v_seller_id = v_buyer_id then
    raise exception 'You cannot request payment for your own beat';
  end if;

  if p_method not in ('Mobile Money', 'Orange Money', 'WhatsApp') then
    raise exception 'Unsupported payment method';
  end if;

  insert into public.orders (beat_id, buyer_id, seller_id, amount, currency, payment_method, payment_reference, status)
  values (p_beat_id, v_buyer_id, v_seller_id, coalesce(v_amount, 0), 'USD', p_method, nullif(trim(coalesce(p_reference, '')), ''), 'payment_submitted')
  returning id into v_order_id;

  insert into public.payment_requests (order_id, buyer_id, seller_id, amount, method, reference, proof_url, status)
  values (v_order_id, v_buyer_id, v_seller_id, coalesce(v_amount, 0), p_method, nullif(trim(coalesce(p_reference, '')), ''), p_proof_path, 'payment_submitted');

  insert into public.notifications (user_id, type, title, message, metadata)
  values (
    v_seller_id,
    'payment_request',
    'New payment request',
    'A buyer submitted a payment request for one of your beats.',
    jsonb_build_object('order_id', v_order_id, 'beat_id', p_beat_id)
  );

  return v_order_id;
end;
$$;

create or replace function public.review_payment_request(
  p_payment_request_id uuid,
  p_status public.order_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_buyer_id uuid;
  v_seller_id uuid;
  v_order_id uuid;
begin
  if p_status not in ('under_review', 'payment_verified', 'payment_rejected') then
    raise exception 'Unsupported payment review status';
  end if;

  select buyer_id, seller_id, order_id into v_buyer_id, v_seller_id, v_order_id
  from public.payment_requests
  where id = p_payment_request_id;

  if v_seller_id is null then
    raise exception 'Payment request not found';
  end if;

  if auth.uid() <> v_seller_id and not public.is_beatbox_admin() then
    raise exception 'Only the seller or an administrator may review this payment request';
  end if;

  update public.payment_requests
  set status = p_status, reviewed_at = now()
  where id = p_payment_request_id;

  update public.orders
  set status = p_status,
      verified_at = case when p_status = 'payment_verified' then now() else verified_at end,
      updated_at = now()
  where id = v_order_id;

  insert into public.notifications (user_id, type, title, message, metadata)
  values (
    v_buyer_id,
    'payment_status',
    'Payment request updated',
    case p_status
      when 'payment_verified' then 'Your payment was verified. Your secure download is now available.'
      when 'payment_rejected' then 'Your payment request was rejected. Review the seller instructions and submit a new request if needed.'
      else 'Your payment request is under review.'
    end,
    jsonb_build_object('order_id', v_order_id, 'payment_request_id', p_payment_request_id, 'status', p_status)
  );
end;
$$;

grant execute on function public.create_payment_request(uuid, text, text, text) to authenticated;
grant execute on function public.review_payment_request(uuid, public.order_status) to authenticated;

create or replace view public.public_profiles
with (security_invoker = false)
as
select id, username, display_name, avatar_url, bio, country, role, created_at
from public.profiles
where account_status = 'active';

grant select on public.public_profiles to anon, authenticated;

-- Replace broad policies with role-aware policies.
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
create policy "BeatBox profiles are private by default" on public.profiles
  for select using (id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox users can insert their own profile" on public.profiles
  for insert with check (id = auth.uid());
create policy "BeatBox users can update their own profile" on public.profiles
  for update using (id = auth.uid() or public.is_beatbox_admin())
  with check (id = auth.uid() or public.is_beatbox_admin());

drop policy if exists "Seller profiles are viewable by everyone" on public.seller_profiles;
drop policy if exists "Sellers can manage own seller profile" on public.seller_profiles;
create policy "BeatBox seller profiles are public" on public.seller_profiles for select using (true);
create policy "BeatBox sellers create own profile" on public.seller_profiles
  for insert with check (id = auth.uid() and public.is_beatbox_seller());
create policy "BeatBox sellers update own profile" on public.seller_profiles
  for update using (id = auth.uid() or public.is_beatbox_admin())
  with check (id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox sellers delete own profile" on public.seller_profiles
  for delete using (id = auth.uid() or public.is_beatbox_admin());

drop policy if exists "Published beats are viewable by everyone" on public.beats;
drop policy if exists "Sellers can insert own beats" on public.beats;
drop policy if exists "Sellers can update own beats" on public.beats;
drop policy if exists "Sellers can delete own beats" on public.beats;
create policy "BeatBox published beats are public" on public.beats
  for select using (status = 'published' or seller_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox sellers create own beats" on public.beats
  for insert with check (seller_id = auth.uid() and public.is_beatbox_seller());
create policy "BeatBox sellers update own beats" on public.beats
  for update using (seller_id = auth.uid() or public.is_beatbox_admin())
  with check (seller_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox sellers delete own beats" on public.beats
  for delete using (seller_id = auth.uid() or public.is_beatbox_admin());

drop policy if exists "Beat tags are public" on public.beat_tags;
create policy "BeatBox beat tags are public" on public.beat_tags for select using (true);
create policy "BeatBox sellers manage own beat tags" on public.beat_tags for all
  using (exists (select 1 from public.beats b where b.id = beat_id and (b.seller_id = auth.uid() or public.is_beatbox_admin())))
  with check (exists (select 1 from public.beats b where b.id = beat_id and (b.seller_id = auth.uid() or public.is_beatbox_admin())));

drop policy if exists "Categories are public" on public.categories;
create policy "BeatBox categories are public" on public.categories for select using (true);
drop policy if exists "Tags are public" on public.tags;
create policy "BeatBox tags are public" on public.tags for select using (true);

drop policy if exists "Users can view own favorites" on public.favorites;
drop policy if exists "Users can insert own favorites" on public.favorites;
drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "BeatBox users view own favorites" on public.favorites for select using (user_id = auth.uid());
create policy "BeatBox users create own favorites" on public.favorites for insert with check (user_id = auth.uid());
create policy "BeatBox users delete own favorites" on public.favorites for delete using (user_id = auth.uid());

alter table public.producer_follows enable row level security;
create policy "BeatBox follows are readable" on public.producer_follows for select using (true);
create policy "BeatBox users create own follows" on public.producer_follows for insert with check (follower_id = auth.uid());
create policy "BeatBox users delete own follows" on public.producer_follows for delete using (follower_id = auth.uid());

alter table public.beat_licenses enable row level security;
create policy "BeatBox licenses are public for visible beats" on public.beat_licenses for select
  using (exists (select 1 from public.beats b where b.id = beat_id and (b.status = 'published' or b.seller_id = auth.uid() or public.is_beatbox_admin())));
create policy "BeatBox sellers manage own licenses" on public.beat_licenses for all
  using (exists (select 1 from public.beats b where b.id = beat_id and (b.seller_id = auth.uid() or public.is_beatbox_admin())))
  with check (exists (select 1 from public.beats b where b.id = beat_id and (b.seller_id = auth.uid() or public.is_beatbox_admin())));

alter table public.cart_items enable row level security;
create policy "BeatBox users view own cart" on public.cart_items for select using (user_id = auth.uid());
create policy "BeatBox users update own cart" on public.cart_items for insert with check (user_id = auth.uid());
create policy "BeatBox users remove own cart items" on public.cart_items for delete using (user_id = auth.uid());

drop policy if exists "Users can view own orders" on public.orders;
drop policy if exists "Users can create orders" on public.orders;
drop policy if exists "Sellers can update order status" on public.orders;
create policy "BeatBox buyers and sellers view orders" on public.orders for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox buyers create pending orders" on public.orders for insert
  with check (buyer_id = auth.uid() and status = 'pending');
create policy "BeatBox sellers review own orders" on public.orders for update
  using (seller_id = auth.uid() or public.is_beatbox_admin())
  with check (seller_id = auth.uid() or public.is_beatbox_admin());

drop policy if exists "Users can view own payment requests" on public.payment_requests;
drop policy if exists "Buyers can create payment requests" on public.payment_requests;
drop policy if exists "Sellers can update payment requests" on public.payment_requests;
create policy "BeatBox parties view payment requests" on public.payment_requests for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_beatbox_admin());

drop policy if exists "Payment methods viewable by buyers on purchase" on public.seller_payment_methods;
drop policy if exists "Sellers manage own payment methods" on public.seller_payment_methods;
create policy "BeatBox sellers manage payment instructions" on public.seller_payment_methods for all
  using (seller_id = auth.uid() or public.is_beatbox_admin())
  with check (seller_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox buyers view payment instructions on orders" on public.seller_payment_methods for select
  using (
    public.is_beatbox_admin()
    or exists (
      select 1 from public.orders o
      where o.seller_id = seller_payment_methods.seller_id
        and o.buyer_id = auth.uid()
        and o.status in ('pending', 'payment_submitted', 'under_review', 'payment_verified', 'delivered')
    )
  );

drop policy if exists "Users can view own downloads" on public.downloads;
drop policy if exists "System can insert downloads" on public.downloads;
create policy "BeatBox users view own downloads" on public.downloads for select
  using (user_id = auth.uid() or public.is_beatbox_admin());

drop policy if exists "Users can view own notifications" on public.notifications;
drop policy if exists "Users can update own notifications" on public.notifications;
create policy "BeatBox users view own notifications" on public.notifications for select using (user_id = auth.uid());
create policy "BeatBox users update own notifications" on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "Users can create reports" on public.reports;
drop policy if exists "Users can view own reports" on public.reports;
create policy "BeatBox users view own reports" on public.reports for select
  using (reporter_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox users create own reports" on public.reports for insert with check (reporter_id = auth.uid());
create policy "BeatBox administrators moderate reports" on public.reports for update
  using (public.is_beatbox_admin()) with check (public.is_beatbox_admin());

drop policy if exists "Audit logs viewable by admins" on public.audit_logs;
drop policy if exists "System can insert audit logs" on public.audit_logs;
create policy "BeatBox administrators view audit logs" on public.audit_logs for select using (public.is_beatbox_admin());

drop policy if exists "Platform settings are public" on public.platform_settings;
create policy "BeatBox public platform settings are readable" on public.platform_settings for select using (true);
create policy "BeatBox administrators manage platform settings" on public.platform_settings for all
  using (public.is_beatbox_admin()) with check (public.is_beatbox_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('beat-covers', 'beat-covers', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('beat-previews', 'beat-previews', false, 52428800, array['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac']),
  ('beat-masters', 'beat-masters', false, 524288000, array['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/mp4', 'audio/aac']),
  ('payment-proofs', 'payment-proofs', false, 10485760, array['image/jpeg', 'image/png', 'application/pdf']),
  ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "BeatBox public cover reads" on storage.objects;
drop policy if exists "BeatBox public preview reads" on storage.objects;
drop policy if exists "BeatBox seller cover uploads" on storage.objects;
drop policy if exists "BeatBox seller preview uploads" on storage.objects;
drop policy if exists "BeatBox seller master access" on storage.objects;
drop policy if exists "BeatBox buyer proof uploads" on storage.objects;
drop policy if exists "BeatBox seller proof review" on storage.objects;
drop policy if exists "BeatBox user avatar access" on storage.objects;

create policy "BeatBox public cover reads" on storage.objects for select
  using (bucket_id = 'beat-covers');
create policy "BeatBox public preview reads" on storage.objects for select
  using (bucket_id = 'beat-previews');
create policy "BeatBox seller cover uploads" on storage.objects for all to authenticated
  using (bucket_id = 'beat-covers' and (storage.foldername(name))[1] = auth.uid()::text and public.is_beatbox_seller())
  with check (bucket_id = 'beat-covers' and (storage.foldername(name))[1] = auth.uid()::text and public.is_beatbox_seller());
create policy "BeatBox seller preview uploads" on storage.objects for all to authenticated
  using (bucket_id = 'beat-previews' and (storage.foldername(name))[1] = auth.uid()::text and public.is_beatbox_seller())
  with check (bucket_id = 'beat-previews' and (storage.foldername(name))[1] = auth.uid()::text and public.is_beatbox_seller());
create policy "BeatBox seller master access" on storage.objects for all to authenticated
  using (bucket_id = 'beat-masters' and (storage.foldername(name))[1] = auth.uid()::text and public.is_beatbox_seller())
  with check (bucket_id = 'beat-masters' and (storage.foldername(name))[1] = auth.uid()::text and public.is_beatbox_seller());
create policy "BeatBox buyer proof uploads" on storage.objects for insert to authenticated
  with check (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "BeatBox buyer proof reads" on storage.objects for select to authenticated
  using (bucket_id = 'payment-proofs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "BeatBox seller proof review" on storage.objects for select to authenticated
  using (
    bucket_id = 'payment-proofs'
    and exists (
      select 1 from public.payment_requests pr
      where pr.proof_url = storage.objects.name and pr.seller_id = auth.uid()
    )
  );
create policy "BeatBox user avatar access" on storage.objects for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
