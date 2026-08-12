-- Generic content purchase entitlements for paid content items.
alter table public.payment_requests
  add column if not exists content_order_id uuid;

create table if not exists public.content_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  content_id uuid not null references public.content_items(id) on delete restrict,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD',
  payment_method text,
  payment_reference text,
  status text not null default 'pending' check (status in ('pending','payment_submitted','under_review','payment_verified','delivered','payment_rejected','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz,
  unique (buyer_id, content_id, id)
);
alter table public.payment_requests
  drop constraint if exists payment_requests_content_order_fk;
alter table public.payment_requests
  add constraint payment_requests_content_order_fk foreign key (content_order_id) references public.content_orders(id) on delete set null;
create index if not exists content_orders_entitlement_idx on public.content_orders (buyer_id, content_id, status);

alter table public.content_orders enable row level security;
create policy "BeatBox content orders visible to parties" on public.content_orders for select using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox buyers create content orders" on public.content_orders for insert to authenticated with check (buyer_id = auth.uid());
create policy "BeatBox sellers review content orders" on public.content_orders for update using (seller_id = auth.uid() or public.is_beatbox_admin()) with check (seller_id = auth.uid() or public.is_beatbox_admin());
