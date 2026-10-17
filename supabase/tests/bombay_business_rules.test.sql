-- Bombay Saree — Automated Database Acceptance Tests
-- Tested using pgTAP inside PostgreSQL / Supabase Test Runner

begin;
create extension if not exists pgtap;

select plan(10);

-- 1. Physical sarees must have unique barcodes
select throws_ok(
  $$
    insert into public.inventory_items (
      product_id, location_id, barcode, ownership_type
    )
    select p.id, l.id, 'DUPLICATE-TEST-BARCODE', 'bombay_owned'
    from public.products p
    cross join public.store_locations l
    limit 1;

    insert into public.inventory_items (
      product_id, location_id, barcode, ownership_type
    )
    select p.id, l.id, 'DUPLICATE-TEST-BARCODE', 'bombay_owned'
    from public.products p
    cross join public.store_locations l
    limit 1;
  $$,
  '23505',
  null,
  'Duplicate barcode insertion must fail with unique constraint violation'
);

-- 2. Consignment products must identify a designer
select throws_ok(
  $$
    insert into public.products (
      name, slug, sku, fabric, color, occasion, style, mrp, price, ownership_type, designer_id
    ) values (
      'Invalid Consignment Saree', 'invalid-consignment-saree', 'TEST-CONSIGNMENT-NO-DESIGNER',
      'Silk', 'Red', 'Wedding', 'Traditional', 30000, 25000, 'designer_consignment', null
    )
  $$,
  '23514',
  null,
  'Consignment product without a designer must violate check constraint'
);

-- 3. A physical sale item must represent exactly one piece
select throws_ok(
  $$
    insert into public.sale_items (
      sale_id, inventory_item_id, barcode_snapshot, product_name_snapshot,
      sku_snapshot, ownership_snapshot, quantity, unit_price_ex_tax
    )
    select s.id, i.id, i.barcode, 'Test Saree', 'TEST-SKU', i.ownership_type, 2, 10000
    from public.sales s
    cross join public.inventory_items i
    limit 1
  $$,
  '23514',
  null,
  'A physical saree piece cannot be sold with quantity > 1'
);

-- 4. Allocated discount cannot exceed the pre-discount item value
select throws_ok(
  $$
    insert into public.sale_items (
      sale_id, inventory_item_id, barcode_snapshot, product_name_snapshot,
      sku_snapshot, ownership_snapshot, unit_price_ex_tax, allocated_discount_ex_tax
    )
    select s.id, i.id, i.barcode, 'Test Saree', 'TEST-SKU', i.ownership_type, 10000, 15000
    from public.sales s
    cross join public.inventory_items i
    limit 1
  $$,
  '23514',
  null,
  'Discount exceeding pre-discount item price must violate check constraint'
);

-- 5. Negative commission rates are forbidden
select throws_ok(
  $$
    insert into public.commission_rules (
      designer_id, commission_rate
    )
    select id, -0.150000
    from public.designer_profiles
    limit 1
  $$,
  '23514',
  null,
  'Negative commission rate must violate check constraint'
);

-- 6. Commission allocation math must balance: commission_amount + designer_amount = eligible_amount
select throws_ok(
  $$
    insert into public.sale_allocations (
      sale_item_id, designer_id, eligible_amount, commission_rate, commission_amount, designer_amount
    )
    select si.id, (select id from public.designer_profiles limit 1), 10000, 0.300000, 3000, 6000
    from public.sale_items si
    limit 1
  $$,
  '23514',
  null,
  'Mismatched commission and designer allocation sum must fail check constraint'
);

-- 7. Negative payout amounts are forbidden
select throws_ok(
  $$
    insert into public.payouts (
      payout_number, designer_id, amount
    )
    select 'PAY-TEST-NEG', id, -5000
    from public.designer_profiles
    limit 1
  $$,
  '23514',
  null,
  'Negative payout amount must fail check constraint'
);

-- 8. Ledger idempotency keys cannot be duplicated
select throws_ok(
  $$
    insert into public.designer_ledger_entries (
      designer_id, entry_type, amount, signed_amount, reference_type, reference_id, idempotency_key
    )
    select id, 'adjustment_credit', 1000, 1000, 'test', gen_random_uuid(), 'idempotency-key-duplicate'
    from public.designer_profiles limit 1;

    insert into public.designer_ledger_entries (
      designer_id, entry_type, amount, signed_amount, reference_type, reference_id, idempotency_key
    )
    select id, 'adjustment_credit', 1000, 1000, 'test', gen_random_uuid(), 'idempotency-key-duplicate'
    from public.designer_profiles limit 1;
  $$,
  '23505',
  null,
  'Duplicate ledger idempotency key must violate unique constraint'
);

-- 9. Direct client insertion into designer ledger must be revoked
select ok(
  not has_table_privilege('authenticated', 'public.designer_ledger_entries', 'INSERT'),
  'Authenticated clients cannot directly insert into designer ledger'
);

-- 10. Direct client update of inventory items must be revoked
select ok(
  not has_table_privilege('authenticated', 'public.inventory_items', 'UPDATE'),
  'Authenticated clients cannot directly update physical inventory records'
);

select * from finish();
rollback;
