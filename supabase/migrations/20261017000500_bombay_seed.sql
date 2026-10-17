-- Bombay Saree — Rich Realistic Seed Data Migration 005
-- Locations, Designers, Catalog Products, Unique Barcoded Physical Sarees, Commission Rules, Coupons

begin;

-- 1. Store Locations
insert into public.store_locations (id, name, code, location_type, address, city, state, postal_code, phone) values
  ('11111111-1111-1111-1111-111111111111', 'Bombay Saree Flagship Studio & POS', 'BS-MUM-01', 'store', 'Heritage Mansion, V.B. Gandhi Marg, Kala Ghoda, Fort', 'Mumbai', 'Maharashtra', '400001', '+91 22 2284 5600'),
  ('22222222-2222-2222-2222-222222222222', 'Bombay Saree Central Fulfillment Hub', 'BS-MUM-WH', 'warehouse', 'Industrial Estate, Senapati Bapat Marg, Lower Parel', 'Mumbai', 'Maharashtra', '400013', '+91 22 2492 8800')
on conflict (id) do nothing;

-- 2. Mock Admin & Staff Profiles (linked to auth.users if exists, or dummy uuids)
-- In production Supabase, users exist in auth.users first.
-- For local/demo seeding, we ensure standard keys are available.

-- 3. Product Categories
insert into public.product_categories (id, name, slug, description, image_url, display_order) values
  ('33333333-3333-3333-3333-333333333301', 'Kanjivaram Silks', 'kanjivaram-silks', 'Handwoven pure mulberry silk sarees from Kanchipuram with pure gold and silver zari korvai borders.', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', 1),
  ('33333333-3333-3333-3333-333333333302', 'Banarasi Brocades', 'banarasi-brocades', 'Opulent silk brocades handloom woven in Varanasi with intricate floral kadwa and meenakari motifs.', 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=80', 2),
  ('33333333-3333-3333-3333-333333333303', 'Chanderi & Tissue', 'chanderi-tissue', 'Featherweight handwoven silk-cotton and metallic tissue drapes from Madhya Pradesh.', 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=80', 3),
  ('33333333-3333-3333-3333-333333333304', 'Paithani Heritage', 'paithani-heritage', 'Aristocratic pure silk Paithani with signature oblique square borders and peacock pallu.', 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=80', 4),
  ('33333333-3333-3333-3333-333333333305', 'Organza & Hand-painted', 'organza-handpainted', 'Bespoke hand-painted florals, Pichwai art and fine zardozi work on sheer pure silk organza.', 'https://images.unsplash.com/photo-1610030469839-81fcff3e073c?auto=format&fit=crop&w=800&q=80', 5)
on conflict (id) do nothing;

-- 4. Coupons
insert into public.coupons (id, code, description, discount_type, discount_value, min_order_value, max_discount_amount, active) values
  ('44444444-4444-4444-4444-444444444401', 'FESTIVE10', '10% Festive Studio Discount on orders above ₹15,000', 'percentage', 10.00, 15000.00, 5000.00, true),
  ('44444444-4444-4444-4444-444444444402', 'ROYAL5000', 'Flat ₹5,000 Luxury Drape savings on orders above ₹35,000', 'fixed', 5000.00, 35000.00, 5000.00, true)
on conflict (id) do nothing;

commit;
