-- ==========================================
-- 20261017000100_bombay_core.sql
-- ==========================================

-- Bombay Saree — Core Schema Migration 001
-- Roles, Store Locations, Designer Profiles, Products, Barcodes, Inventory Items & Movements

begin;

create extension if not exists pgcrypto;
create schema if not exists private;

-- Enums
create type public.app_role as enum (
  'customer',
  'staff',
  'designer',
  'admin'
);

create type public.ownership_type as enum (
  'bombay_owned',
  'designer_consignment'
);

create type public.stock_condition as enum (
  'sellable',
  'inspection',
  'damaged',
  'unsellable'
);

create type public.stock_status as enum (
  'available',
  'reserved',
  'sold',
  'in_transit',
  'held'
);

create type public.sale_channel as enum (
  'online',
  'pos'
);

create type public.sale_status as enum (
  'pending_payment',
  'confirmed',
  'delivered',
  'cancelled',
  'refunded'
);

create type public.ledger_entry_type as enum (
  'sale_allocation',
  'return_reversal',
  'adjustment_credit',
  'adjustment_debit',
  'payout',
  'payout_reversal'
);

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  full_name text not null default '',
  phone text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- User roles
create table public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  assigned_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- Store Locations (Physical Studio, Flagship Store, Central Warehouse)
create table public.store_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  location_type text not null check (location_type in ('store', 'warehouse')),
  address text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Designer Profiles & Onboarding
create table public.designer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references public.profiles(id) on delete restrict,
  brand_name text not null,
  contact_person text not null,
  email text not null,
  phone text not null,
  business_address text not null,
  city text not null,
  state text not null,
  brand_story text,
  portfolio_url text,
  logo_url text,
  bank_account_name text,
  bank_account_number text,
  bank_ifsc text,
  pan_number text,
  gstin text,
  default_commission_rate numeric(7,6) not null default 0.300000 check (default_commission_rate >= 0 and default_commission_rate <= 1),
  approval_status text not null default 'pending' check (approval_status in ('draft', 'pending', 'approved', 'rejected', 'suspended')),
  admin_notes text,
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Product Categories
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  image_url text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Products (Catalog master designs)
create table public.products (
  id uuid primary key default gen_random_uuid(),
  designer_id uuid references public.designer_profiles(id) on delete restrict,
  category_id uuid references public.product_categories(id),
  name text not null,
  slug text not null unique,
  description text,
  sku text not null unique,
  fabric text not null,
  color text not null,
  occasion text not null,
  style text not null,
  drape_length text not null default '5.5 meters',
  blouse_included boolean not null default true,
  blouse_length text not null default '0.8 meters',
  care_instructions text default 'Dry Clean Only. Store wrapped in pure muslin cloth.',
  mrp numeric(12,2) not null check (mrp >= 0),
  price numeric(12,2) not null check (price >= 0 and price <= mrp),
  ownership_type public.ownership_type not null,
  status text not null default 'draft' check (status in ('draft', 'pending', 'active', 'rejected', 'archived')),
  featured boolean not null default false,
  bestseller boolean not null default false,
  new_arrival boolean not null default true,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_owner_matches_type check (
    ownership_type <> 'designer_consignment' or designer_id is not null
  )
);

-- Product Images
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  alt_text text,
  is_primary boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Commission Rules (Per designer and optional per-product override)
create table public.commission_rules (
  id uuid primary key default gen_random_uuid(),
  designer_id uuid not null references public.designer_profiles(id) on delete cascade,
  product_id uuid references public.products(id) on delete cascade,
  commission_rate numeric(7,6) not null check (commission_rate >= 0 and commission_rate <= 1),
  effective_from timestamptz not null default now(),
  effective_to timestamptz,
  return_window_days integer not null default 7 check (return_window_days between 0 and 365),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (effective_to is null or effective_to > effective_from)
);

-- Physical Saree Inventory (One row = One individual physical saree with unique barcode)
create table public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  location_id uuid not null references public.store_locations(id) on delete restrict,
  barcode text not null unique,
  ownership_type public.ownership_type not null,
  designer_id uuid references public.designer_profiles(id) on delete restrict,
  acquisition_cost numeric(12,2),
  condition public.stock_condition not null default 'sellable',
  status public.stock_status not null default 'available',
  received_at timestamptz not null default now(),
  sold_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (ownership_type = 'designer_consignment' and designer_id is not null) or
    (ownership_type = 'bombay_owned')
  ),
  check (acquisition_cost is null or acquisition_cost >= 0)
);

-- Immutable Inventory Movements Ledger
create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  from_location_id uuid references public.store_locations(id),
  to_location_id uuid references public.store_locations(id),
  movement_type text not null check (
    movement_type in ('receipt', 'sale', 'reservation', 'reservation_release', 'transfer', 'return', 'damage', 'adjustment')
  ),
  reference_type text,
  reference_id uuid,
  reason text,
  actor_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Indexes for lightning fast lookups
create index inventory_product_idx on public.inventory_items(product_id);
create index inventory_barcode_idx on public.inventory_items(barcode);
create index inventory_location_status_idx on public.inventory_items(location_id, status, condition);
create index inventory_movements_item_idx on public.inventory_movements(inventory_item_id);
create index commission_lookup_idx on public.commission_rules(designer_id, effective_from);
create index products_status_idx on public.products(status);
create index products_category_idx on public.products(category_id);
create index products_designer_idx on public.products(designer_id);

commit;


-- ==========================================
-- 20261017000200_bombay_sales_finance.sql
-- ==========================================

-- Bombay Saree — Sales & Finance Migration 002
-- Unified Sales (Online & POS), Sale Items (1 piece snapshot), Payments, Designer Allocations,
-- Append-only Designer Ledger, Payouts, Shifts, Wishlist, Addresses, Coupons, Returns

begin;

-- Customer Addresses
create table public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home',
  recipient_name text not null,
  phone text not null,
  street_address text not null,
  landmark text,
  city text not null,
  state text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

-- Coupons
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  description text,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  min_order_value numeric(12,2) not null default 0 check (min_order_value >= 0),
  max_discount_amount numeric(12,2),
  valid_until timestamptz,
  max_uses integer,
  usage_count integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Cashier Shifts for Store POS
create table public.cashier_shifts (
  id uuid primary key default gen_random_uuid(),
  cashier_id uuid not null references public.profiles(id) on delete restrict,
  location_id uuid not null references public.store_locations(id) on delete restrict,
  opening_cash numeric(12,2) not null default 0 check (opening_cash >= 0),
  closing_cash_actual numeric(12,2),
  closing_cash_expected numeric(12,2),
  cash_discrepancy numeric(12,2),
  total_sales_cash numeric(12,2) not null default 0,
  total_sales_upi numeric(12,2) not null default 0,
  total_sales_card numeric(12,2) not null default 0,
  total_bills_generated integer not null default 0,
  notes text,
  status text not null default 'open' check (status in ('open', 'closed')),
  opened_at timestamptz not null default now(),
  closed_at timestamptz
);

-- Unified Sales Header (Both Online Store and Physical Store POS)
create table public.sales (
  id uuid primary key default gen_random_uuid(),
  channel public.sale_channel not null,
  customer_id uuid references public.profiles(id),
  cashier_id uuid references public.profiles(id),
  location_id uuid references public.store_locations(id),
  shift_id uuid references public.cashier_shifts(id),
  sale_number text not null unique,
  status public.sale_status not null default 'pending_payment',
  currency char(3) not null default 'INR',
  subtotal_ex_tax numeric(12,2) not null default 0 check (subtotal_ex_tax >= 0),
  discount_ex_tax numeric(12,2) not null default 0 check (discount_ex_tax >= 0),
  tax_total numeric(12,2) not null default 0 check (tax_total >= 0),
  shipping_total numeric(12,2) not null default 0 check (shipping_total >= 0),
  total_payable numeric(12,2) not null default 0 check (total_payable >= 0),
  customer_name text,
  customer_phone text,
  customer_email text,
  shipping_address jsonb,
  billing_address jsonb,
  applied_coupon_id uuid references public.coupons(id),
  notes text,
  payment_confirmed_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Sale Items: Exact snapshot of the single physical saree piece sold
create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  barcode_snapshot text not null,
  product_name_snapshot text not null,
  sku_snapshot text not null,
  ownership_snapshot public.ownership_type not null,
  designer_id uuid references public.designer_profiles(id),
  quantity integer not null default 1 check (quantity = 1),
  unit_price_ex_tax numeric(12,2) not null check (unit_price_ex_tax >= 0),
  allocated_discount_ex_tax numeric(12,2) not null default 0 check (
    allocated_discount_ex_tax >= 0 and allocated_discount_ex_tax <= unit_price_ex_tax
  ),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  final_price_ex_tax numeric(12,2) generated always as (
    unit_price_ex_tax - allocated_discount_ex_tax
  ) stored,
  commission_rule_id uuid references public.commission_rules(id),
  commission_rate_snapshot numeric(7,6) check (
    commission_rate_snapshot is null or (commission_rate_snapshot >= 0 and commission_rate_snapshot <= 1)
  ),
  return_window_days_snapshot integer not null default 7,
  created_at timestamptz not null default now(),
  unique (sale_id, inventory_item_id),
  check (
    ownership_snapshot <> 'designer_consignment' or designer_id is not null
  )
);

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  provider text not null,
  provider_reference text,
  amount numeric(12,2) not null check (amount >= 0),
  payment_method text not null default 'card',
  status text not null default 'pending' check (status in ('pending', 'succeeded', 'failed', 'refunded')),
  confirmed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (provider, provider_reference)
);

-- Sale Allocations (Designer Commission Settlement Engine)
-- Commission basis: Final discounted item price excluding applicable taxes (final_price_ex_tax)
create table public.sale_allocations (
  id uuid primary key default gen_random_uuid(),
  sale_item_id uuid not null unique references public.sale_items(id) on delete cascade,
  designer_id uuid not null references public.designer_profiles(id) on delete restrict,
  eligible_amount numeric(12,2) not null check (eligible_amount >= 0),
  commission_rate numeric(7,6) not null check (commission_rate >= 0 and commission_rate <= 1),
  commission_amount numeric(12,2) not null check (commission_amount >= 0),
  designer_amount numeric(12,2) not null check (designer_amount >= 0),
  status text not null default 'pending' check (status in (
    'pending',
    'eligible',
    'reserved_for_payout',
    'paid',
    'held',
    'reversed'
  )),
  eligible_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    round(commission_amount + designer_amount, 2) = round(eligible_amount, 2)
  )
);

-- Immutable Designer Ledger Entries
create table public.designer_ledger_entries (
  id uuid primary key default gen_random_uuid(),
  designer_id uuid not null references public.designer_profiles(id) on delete restrict,
  allocation_id uuid references public.sale_allocations(id),
  entry_type public.ledger_entry_type not null,
  amount numeric(12,2) not null check (amount >= 0),
  signed_amount numeric(12,2) not null,
  reference_type text not null,
  reference_id uuid not null,
  idempotency_key text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- Payout Batches
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  payout_number text not null unique,
  designer_id uuid not null references public.designer_profiles(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  status text not null default 'draft' check (status in (
    'draft',
    'approved',
    'processing',
    'paid',
    'failed',
    'cancelled'
  )),
  provider_reference text,
  bank_account_snapshot text,
  approved_by uuid references public.profiles(id),
  approved_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- Payout Allocation Items
create table public.payout_items (
  payout_id uuid not null references public.payouts(id) on delete cascade,
  allocation_id uuid not null references public.sale_allocations(id) on delete restrict,
  amount numeric(12,2) not null check (amount > 0),
  primary key (payout_id, allocation_id)
);

-- Customer Wishlist
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (customer_id, product_id)
);

-- Customer Returns & Exchanges
create table public.returns (
  id uuid primary key default gen_random_uuid(),
  return_number text not null unique,
  sale_id uuid not null references public.sales(id) on delete restrict,
  sale_item_id uuid not null references public.sale_items(id) on delete restrict,
  inventory_item_id uuid not null references public.inventory_items(id) on delete restrict,
  customer_id uuid references public.profiles(id),
  reason text not null,
  condition_received public.stock_condition not null default 'inspection',
  refund_amount numeric(12,2) not null check (refund_amount >= 0),
  status text not null default 'requested' check (status in (
    'requested',
    'approved',
    'rejected',
    'completed'
  )),
  processed_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Notifications
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  message text not null,
  link text,
  type text not null default 'system' check (type in ('order', 'designer', 'inventory', 'payout', 'system')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Audit Logs
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  details jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

-- Indexes
create index sales_customer_idx on public.sales(customer_id, created_at desc);
create index sales_shift_idx on public.sales(shift_id);
create index sales_status_idx on public.sales(status);
create index sale_items_sale_idx on public.sale_items(sale_id);
create index sale_items_designer_idx on public.sale_items(designer_id);
create index allocation_designer_status_idx on public.sale_allocations(designer_id, status);
create index ledger_designer_date_idx on public.designer_ledger_entries(designer_id, created_at desc);
create index payouts_designer_status_idx on public.payouts(designer_id, status);
create index wishlists_product_idx on public.wishlists(product_id);
create index returns_sale_idx on public.returns(sale_id);

commit;


-- ==========================================
-- 20261017000300_bombay_security.sql
-- ==========================================

-- Bombay Saree — Security & Access Control Migration 003
-- Role Helper Functions, Strict RLS Policies across all 4 Modes

begin;

-- Helper functions in private schema with SECURITY DEFINER
create or replace function private.has_role(p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles r
    where r.user_id = (select auth.uid())
      and r.role = p_role
  );
$$;

create or replace function private.current_designer_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select d.id
  from public.designer_profiles d
  where d.user_id = (select auth.uid())
    and d.approval_status = 'approved'
  limit 1;
$$;

grant usage on schema private to authenticated, anon;
grant execute on function private.has_role(public.app_role) to authenticated, anon;
grant execute on function private.current_designer_id() to authenticated, anon;

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.store_locations enable row level security;
alter table public.designer_profiles enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.commission_rules enable row level security;
alter table public.inventory_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.coupons enable row level security;
alter table public.cashier_shifts enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.payments enable row level security;
alter table public.sale_allocations enable row level security;
alter table public.designer_ledger_entries enable row level security;
alter table public.payouts enable row level security;
alter table public.payout_items enable row level security;
alter table public.wishlists enable row level security;
alter table public.returns enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Revoke dangerous direct modifications from clients
revoke all on public.user_roles, public.commission_rules, public.inventory_items,
  public.inventory_movements, public.sale_allocations, public.designer_ledger_entries,
  public.payouts, public.payout_items, public.audit_logs
from anon, authenticated;

-- Grants for select
grant select on public.profiles to authenticated, anon;
grant select on public.user_roles to authenticated;
grant select on public.store_locations to authenticated, anon;
grant select on public.designer_profiles to authenticated, anon;
grant select on public.product_categories to authenticated, anon;
grant select on public.products to authenticated, anon;
grant select on public.product_images to authenticated, anon;
grant select on public.commission_rules to authenticated;
grant select on public.inventory_items to authenticated;
grant select on public.inventory_movements to authenticated;
grant select on public.customer_addresses to authenticated;
grant select on public.coupons to authenticated, anon;
grant select on public.cashier_shifts to authenticated;
grant select on public.sales to authenticated;
grant select on public.sale_items to authenticated;
grant select on public.payments to authenticated;
grant select on public.sale_allocations to authenticated;
grant select on public.designer_ledger_entries to authenticated;
grant select on public.payouts to authenticated;
grant select on public.payout_items to authenticated;
grant select on public.wishlists to authenticated;
grant select on public.returns to authenticated;
grant select on public.notifications to authenticated;
grant select on public.audit_logs to authenticated;

-- Permitted client writes for user-managed data
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.customer_addresses to authenticated;
grant insert, update, delete on public.wishlists to authenticated;
grant update on public.notifications to authenticated;
grant insert on public.designer_profiles to authenticated;

-- 1. Profiles Policies
create policy "profiles_select" on public.profiles
  for select to authenticated, anon
  using (true);

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()));

-- 2. User Roles Policies
create policy "roles_select_own_or_admin" on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.has_role('admin')));

-- 3. Store Locations Policies
create policy "locations_select_all" on public.store_locations
  for select to authenticated, anon
  using (is_active = true or (select private.has_role('admin')) or (select private.has_role('staff')));

-- 4. Designer Profiles Policies
create policy "designers_select" on public.designer_profiles
  for select to authenticated, anon
  using (approval_status = 'approved' or user_id = (select auth.uid()) or (select private.has_role('admin')));

create policy "designers_insert_application" on public.designer_profiles
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "designers_update_own_or_admin" on public.designer_profiles
  for update to authenticated
  using (user_id = (select auth.uid()) or (select private.has_role('admin')));

-- 5. Products Policies (Public can view active, designers their own, admin all)
create policy "products_select_public" on public.products
  for select to authenticated, anon
  using (
    status = 'active'
    or (select private.has_role('admin'))
    or designer_id = (select private.current_designer_id())
  );

create policy "products_designer_insert" on public.products
  for insert to authenticated
  with check (
    designer_id = (select private.current_designer_id())
    or (select private.has_role('admin'))
  );

create policy "products_designer_update_draft" on public.products
  for update to authenticated
  using (
    (designer_id = (select private.current_designer_id()) and status in ('draft', 'rejected'))
    or (select private.has_role('admin'))
  );

-- 6. Product Images Policies
create policy "product_images_select" on public.product_images
  for select to authenticated, anon
  using (true);

-- 7. Commission Rules Policies
create policy "commission_rules_select" on public.commission_rules
  for select to authenticated
  using (
    (select private.has_role('admin'))
    or designer_id = (select private.current_designer_id())
  );

-- 8. Inventory Items Policies
create policy "inventory_items_select" on public.inventory_items
  for select to authenticated
  using (
    (select private.has_role('admin'))
    or (select private.has_role('staff'))
    or designer_id = (select private.current_designer_id())
  );

-- 9. Inventory Movements Policies
create policy "inventory_movements_select" on public.inventory_movements
  for select to authenticated
  using (
    (select private.has_role('admin'))
    or (select private.has_role('staff'))
    or exists (
      select 1 from public.inventory_items i
      where i.id = inventory_item_id
        and i.designer_id = (select private.current_designer_id())
    )
  );

-- 10. Sales Policies
create policy "sales_select_policy" on public.sales
  for select to authenticated
  using (
    customer_id = (select auth.uid())
    or cashier_id = (select auth.uid())
    or (select private.has_role('staff'))
    or (select private.has_role('admin'))
  );

-- 11. Sale Items Policies
create policy "sale_items_select_policy" on public.sale_items
  for select to authenticated
  using (
    exists (
      select 1 from public.sales s
      where s.id = sale_id
        and (
          s.customer_id = (select auth.uid())
          or s.cashier_id = (select auth.uid())
          or (select private.has_role('staff'))
          or (select private.has_role('admin'))
        )
    )
    or designer_id = (select private.current_designer_id())
  );

-- 12. Allocations Policies
create policy "allocations_select_policy" on public.sale_allocations
  for select to authenticated
  using (
    designer_id = (select private.current_designer_id())
    or (select private.has_role('admin'))
  );

-- 13. Designer Ledger Policies
create policy "ledger_select_policy" on public.designer_ledger_entries
  for select to authenticated
  using (
    designer_id = (select private.current_designer_id())
    or (select private.has_role('admin'))
  );

-- 14. Payouts Policies
create policy "payouts_select_policy" on public.payouts
  for select to authenticated
  using (
    designer_id = (select private.current_designer_id())
    or (select private.has_role('admin'))
  );

create policy "payout_items_select_policy" on public.payout_items
  for select to authenticated
  using (
    exists (
      select 1 from public.payouts p
      where p.id = payout_id
        and (
          p.designer_id = (select private.current_designer_id())
          or (select private.has_role('admin'))
        )
    )
  );

-- 15. Wishlist Policies
create policy "wishlist_own_access" on public.wishlists
  for all to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

-- 16. Customer Addresses Policies
create policy "addresses_own_access" on public.customer_addresses
  for all to authenticated
  using (customer_id = (select auth.uid()))
  with check (customer_id = (select auth.uid()));

-- 17. Cashier Shifts Policies
create policy "shifts_staff_admin_select" on public.cashier_shifts
  for select to authenticated
  using (
    cashier_id = (select auth.uid())
    or (select private.has_role('staff'))
    or (select private.has_role('admin'))
  );

-- 18. Notifications Policies
create policy "notifications_own_access" on public.notifications
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 19. Audit Logs Policies (Admin only)
create policy "audit_logs_admin_only" on public.audit_logs
  for select to authenticated
  using ((select private.has_role('admin')));

commit;


-- ==========================================
-- 20261017000400_bombay_rpcs.sql
-- ==========================================

-- Bombay Saree — Transactional RPC Functions Migration 004
-- Core transactional engines: Inventory Receiving, Reservations, POS Finalization,
-- Online Checkout, Returns, Commission Allocation, and Payout Settlement

begin;

-- 1. Inventory Receiving (Creates unique physical pieces + movements)
create or replace function public.receive_inventory(
  p_product_id uuid,
  p_location_id uuid,
  p_barcodes text[],
  p_ownership_type public.ownership_type,
  p_designer_id uuid default null,
  p_acquisition_cost numeric default null,
  p_actor_id uuid default null
)
returns table (
  items_created integer,
  barcodes_registered text[]
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_barcode text;
  v_item_id uuid;
  v_count integer := 0;
  v_prod public.products%rowtype;
begin
  select * into v_prod from public.products where id = p_product_id;
  if not found then
    raise exception 'Product % does not exist', p_product_id;
  end if;

  if p_ownership_type = 'designer_consignment' and p_designer_id is null then
    p_designer_id := v_prod.designer_id;
  end if;

  if p_ownership_type = 'designer_consignment' and p_designer_id is null then
    raise exception 'Designer must be provided for consignment inventory';
  end if;

  foreach v_barcode in array p_barcodes
  loop
    v_barcode := trim(v_barcode);
    if length(v_barcode) = 0 then
      continue;
    end if;

    insert into public.inventory_items (
      product_id,
      location_id,
      barcode,
      ownership_type,
      designer_id,
      acquisition_cost,
      condition,
      status
    ) values (
      p_product_id,
      p_location_id,
      v_barcode,
      p_ownership_type,
      p_designer_id,
      p_acquisition_cost,
      'sellable',
      'available'
    ) returning id into v_item_id;

    insert into public.inventory_movements (
      inventory_item_id,
      to_location_id,
      movement_type,
      reference_type,
      reference_id,
      reason,
      actor_id
    ) values (
      v_item_id,
      p_location_id,
      'receipt',
      'stock_receipt',
      p_product_id,
      'Initial stock intake',
      p_actor_id
    );

    v_count := v_count + 1;
  end loop;

  return query select v_count, p_barcodes;
end;
$$;

-- 2. Reserve inventory piece for online checkout
create or replace function public.reserve_inventory(
  p_inventory_item_id uuid,
  p_order_reference text,
  p_actor_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_status public.stock_status;
  v_condition public.stock_condition;
begin
  select status, condition
  into v_current_status, v_condition
  from public.inventory_items
  where id = p_inventory_item_id
  for update;

  if not found then
    raise exception 'Inventory item not found';
  end if;

  if v_current_status <> 'available' or v_condition <> 'sellable' then
    raise exception 'Item is not available for sale (status: %, condition: %)', v_current_status, v_condition;
  end if;

  update public.inventory_items
  set status = 'reserved',
      updated_at = now()
  where id = p_inventory_item_id;

  insert into public.inventory_movements (
    inventory_item_id,
    movement_type,
    reference_type,
    reason,
    actor_id
  ) values (
    p_inventory_item_id,
    'reservation',
    'online_cart',
    'Reserved for checkout: ' || coalesce(p_order_reference, ''),
    p_actor_id
  );

  return true;
end;
$$;

-- 3. Release inventory reservation (Abandoned checkout or cancelled order)
create or replace function public.release_inventory_reservation(
  p_inventory_item_id uuid,
  p_reason text default 'Checkout abandoned or expired',
  p_actor_id uuid default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_status public.stock_status;
begin
  select status into v_current_status
  from public.inventory_items
  where id = p_inventory_item_id
  for update;

  if not found then
    raise exception 'Inventory item not found';
  end if;

  if v_current_status = 'reserved' then
    update public.inventory_items
    set status = 'available',
        updated_at = now()
    where id = p_inventory_item_id;

    insert into public.inventory_movements (
      inventory_item_id,
      movement_type,
      reference_type,
      reason,
      actor_id
    ) values (
      p_inventory_item_id,
      'reservation_release',
      'cart_expiry',
      p_reason,
      p_actor_id
    );
  end if;

  return true;
end;
$$;

-- 4. Finalize Store POS Sale (Barcode scan, keyboard billing, multi-payment)
create or replace function public.finalize_pos_sale(
  p_cashier_id uuid,
  p_location_id uuid,
  p_shift_id uuid,
  p_barcodes text[],
  p_payments jsonb, -- array of {provider, reference, amount, method}
  p_customer_name text default null,
  p_customer_phone text default null,
  p_customer_email text default null,
  p_bill_discount numeric default 0,
  p_notes text default null
)
returns table (
  sale_id uuid,
  sale_number text,
  total_payable numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sale_id uuid;
  v_sale_number text;
  v_barcode text;
  v_item record;
  v_subtotal numeric(12,2) := 0;
  v_tax_total numeric(12,2) := 0;
  v_total_payable numeric(12,2) := 0;
  v_item_count integer := array_length(p_barcodes, 1);
  v_per_item_discount numeric(12,2) := 0;
  v_eligible_amount numeric(12,2);
  v_comm_rate numeric(7,6);
  v_commission_amount numeric(12,2);
  v_designer_amount numeric(12,2);
  v_sale_item_id uuid;
  v_pay record;
  v_cash_paid numeric(12,2) := 0;
  v_upi_paid numeric(12,2) := 0;
  v_card_paid numeric(12,2) := 0;
  v_return_days integer := 7;
begin
  if v_item_count is null or v_item_count = 0 then
    raise exception 'No items provided for POS billing';
  end if;

  v_sale_number := 'POS-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));

  -- Calculate allocated discount per piece
  if p_bill_discount > 0 then
    v_per_item_discount := round(p_bill_discount / v_item_count, 2);
  end if;

  -- Create sale header
  insert into public.sales (
    channel,
    cashier_id,
    location_id,
    shift_id,
    sale_number,
    status,
    currency,
    customer_name,
    customer_phone,
    customer_email,
    payment_confirmed_at,
    notes
  ) values (
    'pos',
    p_cashier_id,
    p_location_id,
    p_shift_id,
    v_sale_number,
    'confirmed',
    'INR',
    p_customer_name,
    p_customer_phone,
    p_customer_email,
    now(),
    p_notes
  ) returning id into v_sale_id;

  -- Process each physical saree piece
  foreach v_barcode in array p_barcodes
  loop
    select i.id as item_id, i.barcode, i.ownership_type, i.designer_id, i.status, i.condition,
           p.name as product_name, p.sku, p.price, p.mrp,
           cr.id as comm_rule_id, coalesce(cr.commission_rate, dp.default_commission_rate, 0.300000) as comm_rate,
           coalesce(cr.return_window_days, 7) as ret_days
    into v_item
    from public.inventory_items i
    join public.products p on p.id = i.product_id
    left join public.designer_profiles dp on dp.id = i.designer_id
    left join public.commission_rules cr on (cr.designer_id = i.designer_id and cr.active = true and (cr.product_id = p.id or cr.product_id is null))
    where i.barcode = trim(v_barcode)
    for update of i;

    if not found then
      raise exception 'Physical saree with barcode % not found', v_barcode;
    end if;

    if v_item.status <> 'available' or v_item.condition <> 'sellable' then
      raise exception 'Saree barcode % is not available for sale (status: %, condition: %)',
        v_barcode, v_item.status, v_item.condition;
    end if;

    -- Update inventory item to sold
    update public.inventory_items
    set status = 'sold',
        sold_at = now(),
        updated_at = now()
    where id = v_item.item_id;

    -- Record movement
    insert into public.inventory_movements (
      inventory_item_id,
      from_location_id,
      movement_type,
      reference_type,
      reference_id,
      reason,
      actor_id
    ) values (
      v_item.item_id,
      p_location_id,
      'sale',
      'pos_sale',
      v_sale_id,
      'POS Sale ' || v_sale_number,
      p_cashier_id
    );

    -- 5% GST on sarees standard in India
    declare
      v_unit_price numeric(12,2) := v_item.price;
      v_tax numeric(12,2) := round(v_unit_price * 0.05, 2);
    begin
      v_subtotal := v_subtotal + v_unit_price;
      v_tax_total := v_tax_total + v_tax;

      -- Insert sale item snapshot
      insert into public.sale_items (
        sale_id,
        inventory_item_id,
        barcode_snapshot,
        product_name_snapshot,
        sku_snapshot,
        ownership_snapshot,
        designer_id,
        quantity,
        unit_price_ex_tax,
        allocated_discount_ex_tax,
        tax_amount,
        commission_rule_id,
        commission_rate_snapshot,
        return_window_days_snapshot
      ) values (
        v_sale_id,
        v_item.item_id,
        v_item.barcode,
        v_item.product_name,
        v_item.sku,
        v_item.ownership_type,
        v_item.designer_id,
        1,
        v_unit_price,
        v_per_item_discount,
        v_tax,
        v_item.comm_rule_id,
        case when v_item.ownership_type = 'designer_consignment' then v_item.comm_rate else null end,
        v_item.ret_days
      ) returning id into v_sale_item_id;

      -- Designer Commission Allocation (Only for designer consignment stock)
      if v_item.ownership_type = 'designer_consignment' and v_item.designer_id is not null then
        v_eligible_amount := round(v_unit_price - v_per_item_discount, 2);
        v_comm_rate := v_item.comm_rate;
        v_commission_amount := round(v_eligible_amount * v_comm_rate, 2);
        v_designer_amount := v_eligible_amount - v_commission_amount;

        insert into public.sale_allocations (
          sale_item_id,
          designer_id,
          eligible_amount,
          commission_rate,
          commission_amount,
          designer_amount,
          status,
          eligible_at
        ) values (
          v_sale_item_id,
          v_item.designer_id,
          v_eligible_amount,
          v_comm_rate,
          v_commission_amount,
          v_designer_amount,
          'pending',
          now() + (v_item.ret_days || ' days')::interval
        );

        -- Insert into immutable designer ledger
        insert into public.designer_ledger_entries (
          designer_id,
          allocation_id,
          entry_type,
          amount,
          signed_amount,
          reference_type,
          reference_id,
          idempotency_key,
          description
        ) values (
          v_item.designer_id,
          null,
          'sale_allocation',
          v_designer_amount,
          v_designer_amount, -- positive credit
          'pos_sale',
          v_sale_id,
          'pos-sale-item:' || v_sale_item_id,
          'Allocation for POS sale ' || v_sale_number || ' (' || v_item.product_name || ')'
        );
      end if;
    end;
  end loop;

  v_total_payable := (v_subtotal - coalesce(p_bill_discount, 0)) + v_tax_total;

  -- Update final totals on sales header
  update public.sales
  set subtotal_ex_tax = v_subtotal,
      discount_ex_tax = coalesce(p_bill_discount, 0),
      tax_total = v_tax_total,
      total_payable = v_total_payable
  where id = v_sale_id;

  -- Process payments
  for v_pay in select * from jsonb_to_recordset(p_payments) as x(
    provider text,
    provider_reference text,
    amount numeric,
    payment_method text
  )
  loop
    insert into public.payments (
      sale_id,
      provider,
      provider_reference,
      amount,
      payment_method,
      status,
      confirmed_at
    ) values (
      v_sale_id,
      coalesce(v_pay.provider, 'store_pos'),
      coalesce(v_pay.provider_reference, 'POS-REF-' || upper(substr(md5(random()::text), 1, 8))),
      v_pay.amount,
      coalesce(v_pay.payment_method, 'cash'),
      'succeeded',
      now()
    );

    if lower(v_pay.payment_method) = 'cash' then
      v_cash_paid := v_cash_paid + v_pay.amount;
    elsif lower(v_pay.payment_method) = 'upi' then
      v_upi_paid := v_upi_paid + v_pay.amount;
    else
      v_card_paid := v_card_paid + v_pay.amount;
    end if;
  end loop;

  -- Update shift metrics if shift_id provided
  if p_shift_id is not null then
    update public.cashier_shifts
    set total_sales_cash = total_sales_cash + v_cash_paid,
        total_sales_upi = total_sales_upi + v_upi_paid,
        total_sales_card = total_sales_card + v_card_paid,
        total_bills_generated = total_bills_generated + 1
    where id = p_shift_id;
  end if;

  return query select v_sale_id, v_sale_number, v_total_payable;
end;
$$;

-- 5. Mark allocations eligible after return window elapses
create or replace function public.mark_allocations_eligible()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  update public.sale_allocations
  set status = 'eligible',
      updated_at = now()
  where status = 'pending'
    and eligible_at <= now()
    and not exists (
      select 1 from public.returns r
      where r.sale_item_id = sale_allocations.sale_item_id
        and r.status in ('requested', 'approved', 'completed')
    );

  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

-- 6. Create Payout Batch for Designer
create or replace function public.create_payout_batch(
  p_designer_id uuid,
  p_allocation_ids uuid[],
  p_approved_by uuid default null
)
returns table (
  payout_id uuid,
  payout_number text,
  total_amount numeric
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payout_id uuid;
  v_payout_number text;
  v_total numeric(12,2) := 0;
  v_alloc record;
  v_designer public.designer_profiles%rowtype;
begin
  select * into v_designer from public.designer_profiles where id = p_designer_id;
  if not found then
    raise exception 'Designer profile not found';
  end if;

  v_payout_number := 'PAY-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));

  -- Calculate total and lock allocations
  for v_alloc in
    select id, designer_amount, status
    from public.sale_allocations
    where id = any(p_allocation_ids)
      and designer_id = p_designer_id
    for update
  loop
    if v_alloc.status <> 'eligible' then
      raise exception 'Allocation % is not eligible for payout (status: %)', v_alloc.id, v_alloc.status;
    end if;
    v_total := v_total + v_alloc.designer_amount;
  end loop;

  if v_total <= 0 then
    raise exception 'Payout total must be greater than zero';
  end if;

  insert into public.payouts (
    payout_number,
    designer_id,
    amount,
    status,
    bank_account_snapshot,
    approved_by,
    approved_at
  ) values (
    v_payout_number,
    p_designer_id,
    v_total,
    'approved',
    'A/C: ' || coalesce(v_designer.bank_account_number, 'N/A') || ' IFSC: ' || coalesce(v_designer.bank_ifsc, 'N/A'),
    p_approved_by,
    now()
  ) returning id into v_payout_id;

  -- Insert payout items and mark allocations reserved
  insert into public.payout_items (payout_id, allocation_id, amount)
  select v_payout_id, sa.id, sa.designer_amount
  from public.sale_allocations sa
  where sa.id = any(p_allocation_ids);

  update public.sale_allocations
  set status = 'reserved_for_payout',
      updated_at = now()
  where id = any(p_allocation_ids);

  return query select v_payout_id, v_payout_number, v_total;
end;
$$;

-- 7. Record Payout Result (Provider Webhook / Bank Settlement)
create or replace function public.record_payout_result(
  p_payout_id uuid,
  p_status text, -- 'paid' or 'failed'
  p_provider_reference text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payout public.payouts%rowtype;
  v_item record;
begin
  select * into v_payout from public.payouts where id = p_payout_id for update;
  if not found then
    raise exception 'Payout not found';
  end if;

  if p_status = 'paid' then
    update public.payouts
    set status = 'paid',
        paid_at = now(),
        provider_reference = coalesce(p_provider_reference, 'BANK-TXN-' || upper(substr(md5(random()::text), 1, 8)))
    where id = p_payout_id;

    update public.sale_allocations
    set status = 'paid',
        updated_at = now()
    where id in (select allocation_id from public.payout_items where payout_id = p_payout_id);

    -- Post debit in designer ledger
    insert into public.designer_ledger_entries (
      designer_id,
      entry_type,
      amount,
      signed_amount,
      reference_type,
      reference_id,
      idempotency_key,
      description
    ) values (
      v_payout.designer_id,
      'payout',
      v_payout.amount,
      -v_payout.amount, -- negative reduces payable
      'payout_batch',
      p_payout_id,
      'payout-settled:' || p_payout_id,
      'Bank payout settled (' || v_payout.payout_number || ')'
    );

  elsif p_status = 'failed' then
    update public.payouts
    set status = 'failed'
    where id = p_payout_id;

    -- Release allocations back to eligible
    update public.sale_allocations
    set status = 'eligible',
        updated_at = now()
    where id in (select allocation_id from public.payout_items where payout_id = p_payout_id);
  end if;

  return true;
end;
$$;

-- Grant execution to authenticated users
grant execute on function public.receive_inventory to authenticated;
grant execute on function public.reserve_inventory to authenticated;
grant execute on function public.release_inventory_reservation to authenticated;
grant execute on function public.finalize_pos_sale to authenticated;
grant execute on function public.mark_allocations_eligible to authenticated;
grant execute on function public.create_payout_batch to authenticated;
grant execute on function public.record_payout_result to authenticated;

commit;


-- ==========================================
-- 20261017000500_bombay_seed.sql
-- ==========================================

-- Bombay Saree — Rich Realistic Seed Data Migration 005
-- Locations, Designers, Catalog Products, Images, Unique Barcoded Physical Sarees, Commission Rules, Coupons

begin;

-- 1. Store Locations
insert into public.store_locations (id, name, code, location_type, address, city, state, postal_code, phone) values
  ('11111111-1111-1111-1111-111111111111', 'Bombay Saree Flagship Studio & POS', 'BS-MUM-01', 'store', 'Heritage Mansion, V.B. Gandhi Marg, Kala Ghoda, Fort', 'Mumbai', 'Maharashtra', '400001', '+91 22 2284 5600'),
  ('22222222-2222-2222-2222-222222222222', 'Bombay Saree Central Fulfillment Hub', 'BS-MUM-WH', 'warehouse', 'Industrial Estate, Senapati Bapat Marg, Lower Parel', 'Mumbai', 'Maharashtra', '400013', '+91 22 2492 8800')
on conflict (id) do nothing;

-- 2. Product Categories
insert into public.product_categories (id, name, slug, description, image_url, display_order) values
  ('33333333-3333-3333-3333-333333333301', 'Kanjivaram Silks', 'kanjivaram-silks', 'Handwoven pure mulberry silk sarees from Kanchipuram with pure gold and silver zari korvai borders.', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', 1),
  ('33333333-3333-3333-3333-333333333302', 'Banarasi Brocades', 'banarasi-brocades', 'Opulent silk brocades handloom woven in Varanasi with intricate floral kadwa and meenakari motifs.', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', 2),
  ('33333333-3333-3333-3333-333333333303', 'Chanderi & Tissue', 'chanderi-tissue', 'Featherweight handwoven silk-cotton and metallic tissue drapes from Madhya Pradesh.', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', 3),
  ('33333333-3333-3333-3333-333333333304', 'Paithani Heritage', 'paithani-heritage', 'Aristocratic pure silk Paithani with signature oblique square borders and peacock pallu.', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80', 4),
  ('33333333-3333-3333-3333-333333333305', 'Organza & Hand-painted', 'organza-handpainted', 'Bespoke hand-painted florals, Pichwai art and fine zardozi work on sheer pure silk organza.', 'https://images.unsplash.com/photo-1610030469839-81fcff3e073c?auto=format&fit=crop&w=800&q=80', 5)
on conflict (id) do nothing;

-- 3. Designer Profiles (Pre-created approved ateliers)
insert into public.designer_profiles (id, brand_name, contact_person, email, phone, business_address, city, state, brand_story, portfolio_url, default_commission_rate, approval_status) values
  ('55555555-5555-5555-5555-555555555501', 'Raw Mango Atelier', 'Sanjay Garg', 'atelier@rawmango.in', '+91 98200 45112', 'Angoori Badi, Farm 2, Mehrauli', 'New Delhi', 'Delhi', 'Celebrating Indian handloom traditions through contemporary forms in Chanderi, Varanasi silks, and Mashru.', 'https://rawmango.com', 0.300000, 'approved'),
  ('55555555-5555-5555-5555-555555555502', 'Kanjivaram Silk Guild', 'V. Ramanathan', 'craft@kanjivaramguild.org', '+91 98401 22890', '14 Weaver Street, Chinna Kanchipuram', 'Kanchipuram', 'Tamil Nadu', 'An authentic collective of master weavers dedicated to authentic GI-tagged Kanchipuram silk drapes with petni borders.', 'https://kanjivaramguild.org', 0.250000, 'approved'),
  ('55555555-5555-5555-5555-555555555503', 'Sabyasachi Heritage Textiles', 'Kunal Mukherjee', 'concierge@sabyasachi.com', '+91 98300 77123', 'P-545 Lake Road', 'Kolkata', 'West Bengal', 'Luxury bridal and heritage antique revival silks featuring antique zardozi, badla embroidery and vintage weaves.', 'https://sabyasachi.com', 0.350000, 'approved'),
  ('55555555-5555-5555-5555-555555555504', 'Anavila Linen & Silk', 'Anavila Misra', 'studio@anavila.com', '+91 98190 33411', 'Bandra West Arts Colony', 'Mumbai', 'Maharashtra', 'Pioneering organic linen, jamdani silk and sustainable luxury draping in earth tones and natural dyes.', 'https://anavila.com', 0.280000, 'approved')
on conflict (id) do nothing;

-- 4. Commission Rules
insert into public.commission_rules (id, designer_id, commission_rate, return_window_days, active) values
  ('77777777-7777-7777-7777-777777777701', '55555555-5555-5555-5555-555555555501', 0.300000, 7, true),
  ('77777777-7777-7777-7777-777777777702', '55555555-5555-5555-5555-555555555502', 0.250000, 7, true),
  ('77777777-7777-7777-7777-777777777703', '55555555-5555-5555-5555-555555555503', 0.350000, 7, true),
  ('77777777-7777-7777-7777-777777777704', '55555555-5555-5555-5555-555555555504', 0.280000, 7, true)
on conflict (id) do nothing;

-- 5. Products Catalog
insert into public.products (id, designer_id, category_id, name, slug, sku, description, fabric, color, occasion, style, drape_length, blouse_included, blouse_length, care_instructions, mrp, price, ownership_type, status, featured, bestseller, new_arrival, tags) values
  (
    '66666666-6666-6666-6666-666666666601',
    '55555555-5555-5555-5555-555555555502',
    '33333333-3333-3333-3333-333333333301',
    'Kanjivaram Korvai Gold Zari Silk Saree',
    'kanjivaram-korvai-gold-zari-crimson',
    'BS-KAN-001',
    'Woven with 3-ply twisted pure mulberry silk and 0.5 gram pure silver zari with 24kt gold electroplating. Authentic temple petni interlocking border in contrast emerald green.',
    'Pure Kanchipuram Mulberry Silk',
    'Crimson Red & Emerald Green',
    'Wedding & Bridal',
    'Korvai Traditional',
    '5.5 meters',
    true,
    '0.8 meters contrast brocade',
    'Dry clean only. Roll in soft cotton fabric.',
    52000.00,
    46800.00,
    'designer_consignment',
    'active',
    true,
    true,
    false,
    array['bridal', 'kanjivaram', 'pure zari', 'handloom', 'wedding']
  ),
  (
    '66666666-6666-6666-6666-666666666602',
    '55555555-5555-5555-5555-555555555501',
    '33333333-3333-3333-3333-333333333302',
    'Banarasi Kadwa Jangla Pure Katan Silk',
    'banarasi-kadwa-jangla-royal-navy',
    'BS-BAN-002',
    'Magnificent all-over floral kadwa jangla jaal hand-woven by master craftsmen in Varanasi over 45 days. Heavy silver and gold sona-rupa zari jaal with meenakari accents.',
    'Pure Katan Silk (Varanasi)',
    'Royal Navy & Antique Gold',
    'Festive & Reception',
    'Kadwa Jangla',
    '5.5 meters',
    true,
    '0.8 meters with matching border',
    'Dry clean only. Store flat.',
    44000.00,
    38500.00,
    'designer_consignment',
    'active',
    true,
    false,
    true,
    array['banarasi', 'kadwa', 'royal navy', 'katan silk', 'handloom']
  ),
  (
    '66666666-6666-6666-6666-666666666603',
    '55555555-5555-5555-5555-555555555501',
    '33333333-3333-3333-3333-333333333303',
    'Chanderi Pure Metallic Tissue Drape',
    'chanderi-pure-metallic-tissue-champagne-gold',
    'BS-CHA-003',
    'Feather-light metallic tissue drape combining hand-spun silk warp with fine metallic weft. Luminous sheen under evening chandeliers with delicate hand-block printed border.',
    'Silk Metallic Tissue',
    'Champagne Gold',
    'Cocktail & Sangeet',
    'Contemporary Minimalist',
    '5.5 meters',
    true,
    '0.8 meters pure raw silk',
    'Dry clean only. Do not spray perfume directly.',
    31000.00,
    27900.00,
    'designer_consignment',
    'active',
    true,
    true,
    true,
    array['chanderi', 'tissue', 'gold', 'cocktail', 'raw mango']
  ),
  (
    '66666666-6666-6666-6666-666666666604',
    null,
    '33333333-3333-3333-3333-333333333304',
    'Royal Peacock Brocade Pure Silk Paithani',
    'royal-peacock-brocade-pure-silk-paithani-emerald',
    'BS-PAI-004',
    'Bombay Saree Flagship direct acquisition. Maharani Paithani featuring handwoven Mor-Bangadi (peacock in bangle) motifs on an exquisite pallu woven with pure gold zari warp.',
    'Pure Yeola Silk',
    'Emerald Green & Magenta',
    'Maharashtrian Wedding & Puja',
    'Asavali Paithani',
    '5.5 meters',
    true,
    '0.8 meters plain silk with border',
    'Dry clean only. Refold along new creases every 3 months.',
    58000.00,
    52000.00,
    'bombay_owned',
    'active',
    true,
    false,
    false,
    array['paithani', 'maharashtrian', 'peacock', 'yeola silk', 'bombay owned']
  ),
  (
    '66666666-6666-6666-6666-666666666605',
    '55555555-5555-5555-5555-555555555504',
    '33333333-3333-3333-3333-333333333305',
    'Hand-painted Lotus Pichwai Organza Saree',
    'hand-painted-lotus-pichwai-organza-blush-pink',
    'BS-ORG-005',
    'Fine 100% pure silk organza hand-painted with sacred Shrinathji Pichwai lotus pond motifs using organic natural pigments, bordered with fine hand-embroidered gota patti.',
    'Pure Silk Organza',
    'Blush Pink & Gold',
    'Summer Wedding & Day Festive',
    'Hand-painted Pichwai',
    '5.5 meters',
    true,
    '0.8 meters unstitched chanderi silk',
    'Strict dry clean only.',
    28500.00,
    24500.00,
    'designer_consignment',
    'active',
    false,
    true,
    true,
    array['organza', 'handpainted', 'pichwai', 'summer wedding', 'blush pink']
  ),
  (
    '66666666-6666-6666-6666-666666666606',
    '55555555-5555-5555-5555-555555555503',
    '33333333-3333-3333-3333-333333333301',
    'Antique Temple Border Vintage Silk Drape',
    'antique-temple-border-vintage-silk-maroon',
    'BS-TEM-006',
    'From the private archive revival series. Recreated from a 19th-century Tanjore royal court drape with solid pure gold zari thazhampoo reku borders and gopuram motifs.',
    'Pure Mulberry Silk with Antique Zari',
    'Deep Maroon & Antique Brass',
    'Heritage Evening & Wedding',
    'Temple Border Antique Revival',
    '5.5 meters',
    true,
    '0.8 meters antique zari brocade',
    'Dry clean only wrapped in unbleached muslin.',
    76000.00,
    69000.00,
    'designer_consignment',
    'active',
    true,
    false,
    true,
    array['sabyasachi', 'antique zari', 'temple border', 'heritage', 'luxury']
  )
on conflict (id) do nothing;

-- 6. Product Images
insert into public.product_images (id, product_id, image_url, alt_text, is_primary, display_order) values
  ('88888888-8888-8888-8888-888888888801', '66666666-6666-6666-6666-666666666601', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80', 'Kanjivaram Korvai Silk Saree Crimson Red', true, 1),
  ('88888888-8888-8888-8888-888888888802', '66666666-6666-6666-6666-666666666602', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80', 'Banarasi Kadwa Pure Katan Silk Navy Blue', true, 1),
  ('88888888-8888-8888-8888-888888888803', '66666666-6666-6666-6666-666666666603', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80', 'Chanderi Pure Metallic Tissue Drape Champagne', true, 1),
  ('88888888-8888-8888-8888-888888888804', '66666666-6666-6666-6666-666666666604', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1200&q=80', 'Royal Peacock Silk Paithani Emerald', true, 1),
  ('88888888-8888-8888-8888-888888888805', '66666666-6666-6666-6666-666666666605', 'https://images.unsplash.com/photo-1610030469839-81fcff3e073c?auto=format&fit=crop&w=1200&q=80', 'Hand-painted Lotus Pichwai Organza Blush Pink', true, 1),
  ('88888888-8888-8888-8888-888888888806', '66666666-6666-6666-6666-666666666606', 'https://images.unsplash.com/photo-1574634534894-89d7576c8259?auto=format&fit=crop&w=1200&q=80', 'Antique Temple Border Vintage Silk Maroon', true, 1)
on conflict (id) do nothing;

-- 7. Unique Physical Inventory Items (1 Piece = 1 Barcode)
insert into public.inventory_items (id, product_id, location_id, barcode, ownership_type, designer_id, acquisition_cost, condition, status) values
  -- Saree 1: Kanjivaram (2 pieces at Flagship Store)
  ('99999999-9999-9999-9999-999999999901', '66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111111', 'BOM-KAN-001-A', 'designer_consignment', '55555555-5555-5555-5555-555555555502', null, 'sellable', 'available'),
  ('99999999-9999-9999-9999-999999999902', '66666666-6666-6666-6666-666666666601', '11111111-1111-1111-1111-111111111111', 'BOM-KAN-001-B', 'designer_consignment', '55555555-5555-5555-5555-555555555502', null, 'sellable', 'available'),

  -- Saree 2: Banarasi (2 pieces: 1 Flagship, 1 Warehouse)
  ('99999999-9999-9999-9999-999999999903', '66666666-6666-6666-6666-666666666602', '11111111-1111-1111-1111-111111111111', 'BOM-BAN-001-A', 'designer_consignment', '55555555-5555-5555-5555-555555555501', null, 'sellable', 'available'),
  ('99999999-9999-9999-9999-999999999904', '66666666-6666-6666-6666-666666666602', '22222222-2222-2222-2222-222222222222', 'BOM-BAN-001-B', 'designer_consignment', '55555555-5555-5555-5555-555555555501', null, 'sellable', 'available'),

  -- Saree 3: Chanderi Tissue (2 pieces)
  ('99999999-9999-9999-9999-999999999905', '66666666-6666-6666-6666-666666666603', '11111111-1111-1111-1111-111111111111', 'BOM-CHA-001-A', 'designer_consignment', '55555555-5555-5555-5555-555555555501', null, 'sellable', 'available'),
  ('99999999-9999-9999-9999-999999999906', '66666666-6666-6666-6666-666666666603', '11111111-1111-1111-1111-111111111111', 'BOM-CHA-001-B', 'designer_consignment', '55555555-5555-5555-5555-555555555501', null, 'sellable', 'available'),

  -- Saree 4: Paithani (Bombay Saree Owned - acquisition cost ₹32,000)
  ('99999999-9999-9999-9999-999999999907', '66666666-6666-6666-6666-666666666604', '11111111-1111-1111-1111-111111111111', 'BOM-PAI-001-A', 'bombay_owned', null, 32000.00, 'sellable', 'available'),
  ('99999999-9999-9999-9999-999999999908', '66666666-6666-6666-6666-666666666604', '22222222-2222-2222-2222-222222222222', 'BOM-PAI-001-B', 'bombay_owned', null, 32000.00, 'sellable', 'available'),

  -- Saree 5: Organza Pichwai (2 pieces)
  ('99999999-9999-9999-9999-999999999909', '66666666-6666-6666-6666-666666666605', '11111111-1111-1111-1111-111111111111', 'BOM-ORG-001-A', 'designer_consignment', '55555555-5555-5555-5555-555555555504', null, 'sellable', 'available'),
  ('99999999-9999-9999-9999-999999999910', '66666666-6666-6666-6666-666666666605', '11111111-1111-1111-1111-111111111111', 'BOM-ORG-001-B', 'designer_consignment', '55555555-5555-5555-5555-555555555504', null, 'sellable', 'available'),

  -- Saree 6: Temple Vintage Silk (1 exclusive piece at Flagship POS)
  ('99999999-9999-9999-9999-999999999911', '66666666-6666-6666-6666-666666666606', '11111111-1111-1111-1111-111111111111', 'BOM-TEM-001-A', 'designer_consignment', '55555555-5555-5555-5555-555555555503', null, 'sellable', 'available')
on conflict (id) do nothing;

-- 8. Coupons
insert into public.coupons (id, code, description, discount_type, discount_value, min_order_value, max_discount_amount, active) values
  ('44444444-4444-4444-4444-444444444401', 'FESTIVE10', '10% Festive Studio Discount on orders above ₹15,000', 'percentage', 10.00, 15000.00, 5000.00, true),
  ('44444444-4444-4444-4444-444444444402', 'ROYAL5000', 'Flat ₹5,000 Luxury Drape savings on orders above ₹35,000', 'fixed', 5000.00, 35000.00, 5000.00, true)
on conflict (id) do nothing;

commit;
