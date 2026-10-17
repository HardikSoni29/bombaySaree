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
