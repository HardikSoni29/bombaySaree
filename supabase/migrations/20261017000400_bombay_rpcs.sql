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
