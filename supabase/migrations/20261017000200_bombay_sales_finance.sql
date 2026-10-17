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
