create table if not exists public.product_orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete restrict,
  seller_id uuid not null references public.profiles(id) on delete restrict,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'USD',
  status text not null default 'pending' check (status in ('pending','payment_submitted','under_review','payment_verified','fulfilled','cancelled')),
  buyer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_orders_buyer_idx on public.product_orders (buyer_id, created_at desc);
create index if not exists product_orders_seller_idx on public.product_orders (seller_id, created_at desc);
alter table public.product_orders enable row level security;
create policy "BeatBox product orders visible to parties" on public.product_orders for select using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_beatbox_admin());
create policy "BeatBox buyers create product orders" on public.product_orders for insert to authenticated with check (buyer_id = auth.uid());
create policy "BeatBox sellers update product orders" on public.product_orders for update using (seller_id = auth.uid() or public.is_beatbox_admin()) with check (seller_id = auth.uid() or public.is_beatbox_admin());
