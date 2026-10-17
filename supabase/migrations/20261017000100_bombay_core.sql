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
