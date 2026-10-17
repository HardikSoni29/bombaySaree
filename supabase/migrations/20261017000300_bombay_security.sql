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

revoke all on function private.has_role(public.app_role) from public, anon;
revoke all on function private.current_designer_id() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.has_role(public.app_role) to authenticated;
grant execute on function private.current_designer_id() to authenticated;

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
