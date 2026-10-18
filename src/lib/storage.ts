import {
  Product,
  InventoryItem,
  InventoryMovement,
  DesignerProfile,
  Sale,
  SaleItem,
  SaleAllocation,
  DesignerLedgerEntry,
  Payout,
  CashierShift,
  Coupon,
  CustomerAddress,
  WishlistItem,
  CustomerReturn,
  StoreLocation,
  ProductCategory,
  AuditLogItem,
  OwnershipType,
  StockCondition,
} from '../types/database';
import { supabase, isSupabaseConfigured } from './supabase';

import {
  initialLocations,
  initialCategories,
  initialDesigners,
  initialProducts,
  initialInventoryItems,
  initialMovements,
  initialShift,
  initialCoupons,
  initialAddresses,
  initialSales,
  initialAllocations,
  initialLedgerEntries,
} from './mockData';

// LocalStorage Keys
const KEYS = {
  LOCATIONS: 'bombay_locations_v1',
  CATEGORIES: 'bombay_categories_v1',
  DESIGNERS: 'bombay_designers_v1',
  PRODUCTS: 'bombay_products_v1',
  INVENTORY: 'bombay_inventory_v1',
  MOVEMENTS: 'bombay_movements_v1',
  SHIFTS: 'bombay_shifts_v1',
  COUPONS: 'bombay_coupons_v1',
  ADDRESSES: 'bombay_addresses_v1',
  SALES: 'bombay_sales_v1',
  ALLOCATIONS: 'bombay_allocations_v1',
  LEDGER: 'bombay_ledger_v1',
  PAYOUTS: 'bombay_payouts_v1',
  WISHLIST: 'bombay_wishlist_v1',
  RETURNS: 'bombay_returns_v1',
  AUDIT: 'bombay_audit_v1',
};

// Safe JSON storage helpers
function load<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to save to localStorage:', key, err);
  }
}

// Memory / LocalStorage Central Data Store
export class BombayDataStore {
  static async syncWithSupabase(): Promise<boolean> {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      // 1. Locations
      const { data: locations } = await supabase.from('store_locations').select('*');
      if (locations && locations.length > 0) {
        save(KEYS.LOCATIONS, locations);
      }

      // 2. Categories
      const { data: categories } = await supabase.from('product_categories').select('*');
      if (categories && categories.length > 0) {
        save(KEYS.CATEGORIES, categories);
      }

      // 3. Designers
      const { data: designers } = await supabase.from('designer_profiles').select('*');
      if (designers && designers.length > 0) {
        save(KEYS.DESIGNERS, designers);
      }

      // 4. Products with Images
      const { data: prods } = await supabase.from('products').select('*, product_images(*)');
      if (prods && prods.length > 0) {
        const mappedProducts = prods.map((p: any) => {
          const rawImgs = Array.isArray(p.product_images) ? p.product_images : [];
          const stringUrls: string[] = rawImgs
            .map((img: any) => (typeof img === 'string' ? img : img?.image_url))
            .filter(Boolean);

          const primaryUrl =
            rawImgs.find((img: any) => img.is_primary)?.image_url ||
            stringUrls[0] ||
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80';

          return {
            ...p,
            images: stringUrls.length > 0 ? stringUrls : [primaryUrl],
            primary_image_url: primaryUrl,
          };
        });
        save(KEYS.PRODUCTS, mappedProducts);
      }

      // 5. Inventory Items
      const { data: inventory } = await supabase.from('inventory_items').select('*');
      if (inventory && inventory.length > 0) {
        save(KEYS.INVENTORY, inventory);
      }

      // 6. Coupons
      const { data: coupons } = await supabase.from('coupons').select('*');
      if (coupons && coupons.length > 0) {
        save(KEYS.COUPONS, coupons);
      }

      console.log('✅ Synchronized Bombay Saree with live Supabase database');
      return true;
    } catch (err) {
      console.warn('Supabase sync notice (using offline cache):', err);
      return false;
    }
  }

  static getLocations(): StoreLocation[] {
    return load<StoreLocation[]>(KEYS.LOCATIONS, initialLocations);
  }

  static getCategories(): ProductCategory[] {
    return load<ProductCategory[]>(KEYS.CATEGORIES, initialCategories);
  }

  static getDesigners(): DesignerProfile[] {
    return load<DesignerProfile[]>(KEYS.DESIGNERS, initialDesigners);
  }

  static getProducts(): Product[] {
    const products = load<Product[]>(KEYS.PRODUCTS, initialProducts);
    const designers = this.getDesigners();
    const categories = this.getCategories();
    const inventory = this.getInventoryItems();

    return products.map((prod) => {
      const designer = designers.find((d) => d.id === prod.designer_id);
      const category = categories.find((c) => c.id === prod.category_id);
      const available_stock_count = inventory.filter(
        (i) => i.product_id === prod.id && i.status === 'available' && i.condition === 'sellable'
      ).length;

      // Ensure clean string array of images
      const rawImgs = Array.isArray(prod.images) ? prod.images : [];
      const cleanImages: string[] = rawImgs
        .map((img: any) => (typeof img === 'string' ? img : img?.image_url))
        .filter(Boolean);

      const fallbackImage =
        prod.primary_image_url ||
        cleanImages[0] ||
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80';

      return {
        ...prod,
        images: cleanImages.length > 0 ? cleanImages : [fallbackImage],
        primary_image_url: fallbackImage,
        designer,
        category,
        available_stock_count,
      };
    });
  }

  static getProductById(id: string): Product | undefined {
    return this.getProducts().find((p) => p.id === id);
  }

  static saveProduct(product: Partial<Product>): Product {
    const products = load<Product[]>(KEYS.PRODUCTS, initialProducts);
    let updated: Product;

    if (product.id) {
      updated = {
        ...(products.find((p) => p.id === product.id) as Product),
        ...product,
        updated_at: new Date().toISOString(),
      } as Product;
      const index = products.findIndex((p) => p.id === product.id);
      if (index >= 0) products[index] = updated;
      else products.push(updated);
    } else {
      updated = {
        id: `prod-${Date.now()}`,
        name: product.name || 'Untitled Saree',
        slug: (product.name || 'saree').toLowerCase().replace(/\s+/g, '-'),
        sku: product.sku || `BS-${Date.now().toString().slice(-6)}`,
        description: product.description || '',
        fabric: product.fabric || 'Pure Silk',
        color: product.color || 'Crimson Red',
        occasion: product.occasion || 'Wedding',
        style: product.style || 'Traditional',
        drape_length: product.drape_length || '5.5 meters',
        blouse_included: product.blouse_included ?? true,
        blouse_length: product.blouse_length || '0.8 meters',
        care_instructions: product.care_instructions || 'Dry clean only',
        mrp: product.mrp || 30000,
        price: product.price || 25000,
        ownership_type: product.ownership_type || 'designer_consignment',
        status: product.status || 'draft',
        featured: false,
        bestseller: false,
        new_arrival: true,
        tags: product.tags || [],
        images: product.images && product.images.length > 0 ? product.images : [
          'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85'
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...product,
      } as Product;
      products.push(updated);
    }

    save(KEYS.PRODUCTS, products);
    this.addAuditLog('product_saved', 'product', updated.id, { name: updated.name, sku: updated.sku, status: updated.status });
    return updated;
  }

  static updateProductStatus(productId: string, status: 'draft' | 'pending' | 'active' | 'rejected' | 'archived'): void {
    const products = load<Product[]>(KEYS.PRODUCTS, initialProducts);
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      prod.status = status;
      prod.updated_at = new Date().toISOString();
      save(KEYS.PRODUCTS, products);
      this.addAuditLog('product_status_change', 'product', productId, { status });
    }
  }

  // Inventory Items (Unique Barcoded Physical Pieces)
  static getInventoryItems(): InventoryItem[] {
    const items = load<InventoryItem[]>(KEYS.INVENTORY, initialInventoryItems);
    const products = load<Product[]>(KEYS.PRODUCTS, initialProducts);
    const locations = this.getLocations();
    const designers = this.getDesigners();

    return items.map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.product_id),
      location: locations.find((l) => l.id === item.location_id),
      designer: designers.find((d) => d.id === item.designer_id),
    }));
  }

  static findItemByBarcode(barcode: string): InventoryItem | undefined {
    const items = this.getInventoryItems();
    return items.find((i) => i.barcode.trim().toUpperCase() === barcode.trim().toUpperCase());
  }

  static receiveInventory(
    productId: string,
    locationId: string,
    barcodes: string[],
    ownershipType: OwnershipType,
    designerId?: string,
    acquisitionCost?: number,
    actorId = 'admin'
  ): { count: number; items: InventoryItem[] } {
    const items = load<InventoryItem[]>(KEYS.INVENTORY, initialInventoryItems);
    const movements = load<InventoryMovement[]>(KEYS.MOVEMENTS, initialMovements);
    const product = this.getProductById(productId);

    if (!product) throw new Error('Product not found');

    const createdItems: InventoryItem[] = [];

    for (const barcode of barcodes) {
      const cleanBarcode = barcode.trim().toUpperCase();
      if (!cleanBarcode) continue;

      if (items.some((i) => i.barcode === cleanBarcode)) {
        throw new Error(`Barcode ${cleanBarcode} is already in use by another saree piece! Each saree piece must have a unique barcode.`);
      }

      const newItem: InventoryItem = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        product_id: productId,
        location_id: locationId,
        barcode: cleanBarcode,
        ownership_type: ownershipType,
        designer_id: ownershipType === 'designer_consignment' ? (designerId || product.designer_id) : undefined,
        acquisition_cost: acquisitionCost,
        condition: 'sellable',
        status: 'available',
        received_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      items.push(newItem);
      createdItems.push(newItem);

      movements.push({
        id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        inventory_item_id: newItem.id,
        to_location_id: locationId,
        movement_type: 'receipt',
        reference_type: 'stock_receipt',
        reason: 'Received into physical stock',
        actor_id: actorId,
        created_at: new Date().toISOString(),
        item_barcode: cleanBarcode,
        product_name: product.name,
      });
    }

    save(KEYS.INVENTORY, items);
    save(KEYS.MOVEMENTS, movements);
    this.addAuditLog('inventory_received', 'inventory', productId, { barcodes, locationId, count: createdItems.length });
    return { count: createdItems.length, items: createdItems };
  }

  static transferInventory(inventoryItemId: string, toLocationId: string, actorId = 'admin'): void {
    const items = load<InventoryItem[]>(KEYS.INVENTORY, initialInventoryItems);
    const movements = load<InventoryMovement[]>(KEYS.MOVEMENTS, initialMovements);
    const item = items.find((i) => i.id === inventoryItemId);

    if (!item) throw new Error('Inventory item not found');
    const fromLoc = item.location_id;
    item.location_id = toLocationId;
    item.updated_at = new Date().toISOString();

    movements.push({
      id: `mov-${Date.now()}`,
      inventory_item_id: item.id,
      from_location_id: fromLoc,
      to_location_id: toLocationId,
      movement_type: 'transfer',
      reason: 'Inter-store transfer',
      actor_id: actorId,
      created_at: new Date().toISOString(),
      item_barcode: item.barcode,
    });

    save(KEYS.INVENTORY, items);
    save(KEYS.MOVEMENTS, movements);
    this.addAuditLog('inventory_transferred', 'inventory_item', item.id, { from: fromLoc, to: toLocationId });
  }

  static adjustInventoryCondition(
    inventoryItemId: string,
    condition: StockCondition,
    reason: string,
    actorId = 'admin'
  ): void {
    const items = load<InventoryItem[]>(KEYS.INVENTORY, initialInventoryItems);
    const movements = load<InventoryMovement[]>(KEYS.MOVEMENTS, initialMovements);
    const item = items.find((i) => i.id === inventoryItemId);

    if (!item) throw new Error('Item not found');
    item.condition = condition;
    if (condition === 'damaged' || condition === 'unsellable') {
      item.status = 'held';
    } else if (condition === 'sellable' && item.status === 'held') {
      item.status = 'available';
    }
    item.updated_at = new Date().toISOString();

    movements.push({
      id: `mov-${Date.now()}`,
      inventory_item_id: item.id,
      movement_type: condition === 'damaged' ? 'damage' : 'adjustment',
      reason: reason || `Condition marked as ${condition}`,
      actor_id: actorId,
      created_at: new Date().toISOString(),
      item_barcode: item.barcode,
    });

    save(KEYS.INVENTORY, items);
    save(KEYS.MOVEMENTS, movements);
    this.addAuditLog('inventory_adjusted', 'inventory_item', item.id, { condition, reason });
  }

  static getInventoryMovements(): InventoryMovement[] {
    const movements = load<InventoryMovement[]>(KEYS.MOVEMENTS, initialMovements);
    const items = this.getInventoryItems();

    return movements.map((m) => {
      const item = items.find((i) => i.id === m.inventory_item_id);
      return {
        ...m,
        item_barcode: m.item_barcode || item?.barcode,
        product_name: m.product_name || item?.product?.name,
      };
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // POS Billing Finalization
  static finalizePosSale(params: {
    cashierId: string;
    locationId: string;
    shiftId: string;
    barcodes: string[];
    payments: { provider: string; provider_reference?: string; amount: number; payment_method: string }[];
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    billDiscount?: number;
    notes?: string;
  }): Sale {
    const inventory = load<InventoryItem[]>(KEYS.INVENTORY, initialInventoryItems);
    const products = load<Product[]>(KEYS.PRODUCTS, initialProducts);
    const designers = load<DesignerProfile[]>(KEYS.DESIGNERS, initialDesigners);
    const sales = load<Sale[]>(KEYS.SALES, initialSales);
    const allocations = load<SaleAllocation[]>(KEYS.ALLOCATIONS, initialAllocations);
    const ledger = load<DesignerLedgerEntry[]>(KEYS.LEDGER, initialLedgerEntries);
    const shifts = load<CashierShift[]>(KEYS.SHIFTS, [initialShift]);
    const movements = load<InventoryMovement[]>(KEYS.MOVEMENTS, initialMovements);

    if (params.barcodes.length === 0) {
      throw new Error('No items in bill');
    }

    const saleId = `sale-pos-${Date.now()}`;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const saleNumber = `POS-${dateStr}-${randStr}`;

    let subtotal = 0;
    let taxTotal = 0;
    const saleItems: SaleItem[] = [];
    const billDiscount = params.billDiscount || 0;
    const perItemDiscount = params.barcodes.length > 0 ? Math.round((billDiscount / params.barcodes.length) * 100) / 100 : 0;

    for (const barcode of params.barcodes) {
      const item = inventory.find((i) => i.barcode === barcode);
      if (!item) {
        throw new Error(`Saree with barcode ${barcode} not found in inventory`);
      }
      if (item.status !== 'available' || item.condition !== 'sellable') {
        throw new Error(`Saree barcode ${barcode} is ${item.status} (${item.condition}) and cannot be billed.`);
      }

      const product = products.find((p) => p.id === item.product_id);
      if (!product) throw new Error(`Product definition missing for barcode ${barcode}`);

      // Mark inventory item sold
      item.status = 'sold';
      item.sold_at = new Date().toISOString();
      item.updated_at = new Date().toISOString();

      // Record movement
      movements.push({
        id: `mov-${Date.now()}-${barcode}`,
        inventory_item_id: item.id,
        from_location_id: params.locationId,
        movement_type: 'sale',
        reference_type: 'pos_sale',
        reference_id: saleId,
        reason: `POS Sale ${saleNumber}`,
        actor_id: params.cashierId,
        created_at: new Date().toISOString(),
        item_barcode: item.barcode,
        product_name: product.name,
      });

      const unitPrice = product.price;
      const tax = Math.round(unitPrice * 0.05); // 5% GST on sarees in India
      const finalPrice = Math.max(0, unitPrice - perItemDiscount);
      subtotal += unitPrice;
      taxTotal += tax;

      const designer = designers.find((d) => d.id === item.designer_id);
      const commissionRate = designer?.default_commission_rate ?? 0.30;
      const saleItemId = `s-item-${Date.now()}-${barcode}`;

      const saleItem: SaleItem = {
        id: saleItemId,
        sale_id: saleId,
        inventory_item_id: item.id,
        barcode_snapshot: item.barcode,
        product_name_snapshot: product.name,
        sku_snapshot: product.sku,
        ownership_snapshot: item.ownership_type,
        designer_id: item.designer_id,
        quantity: 1,
        unit_price_ex_tax: unitPrice,
        allocated_discount_ex_tax: perItemDiscount,
        tax_amount: tax,
        final_price_ex_tax: finalPrice,
        commission_rate_snapshot: item.ownership_type === 'designer_consignment' ? commissionRate : undefined,
        return_window_days_snapshot: 7,
        created_at: new Date().toISOString(),
      };
      saleItems.push(saleItem);

      // Consignment Commission Allocation & Designer Ledger
      if (item.ownership_type === 'designer_consignment' && item.designer_id) {
        // Commission basis: Final discounted item price excluding applicable taxes
        const eligibleAmount = finalPrice;
        const commissionAmount = Math.round(eligibleAmount * commissionRate);
        const designerAmount = eligibleAmount - commissionAmount;

        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() + 7);

        const allocation: SaleAllocation = {
          id: `alloc-${Date.now()}-${barcode}`,
          sale_item_id: saleItemId,
          designer_id: item.designer_id,
          eligible_amount: eligibleAmount,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          designer_amount: designerAmount,
          status: 'pending',
          eligible_at: returnDate.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        allocations.push(allocation);

        ledger.push({
          id: `led-${Date.now()}-${barcode}`,
          designer_id: item.designer_id,
          allocation_id: allocation.id,
          entry_type: 'sale_allocation',
          amount: designerAmount,
          signed_amount: designerAmount,
          reference_type: 'pos_sale',
          reference_id: saleId,
          idempotency_key: `pos-sale-item:${saleItemId}`,
          description: `Sale allocation: ${product.name} (${saleNumber})`,
          created_at: new Date().toISOString(),
        });
      }
    }

    const totalPayable = Math.max(0, subtotal - billDiscount) + taxTotal;

    const sale: Sale = {
      id: saleId,
      channel: 'pos',
      cashier_id: params.cashierId,
      location_id: params.locationId,
      shift_id: params.shiftId,
      sale_number: saleNumber,
      status: 'confirmed',
      currency: 'INR',
      subtotal_ex_tax: subtotal,
      discount_ex_tax: billDiscount,
      tax_total: taxTotal,
      shipping_total: 0,
      total_payable: totalPayable,
      customer_name: params.customerName || 'Walk-in Client',
      customer_phone: params.customerPhone,
      customer_email: params.customerEmail,
      payment_confirmed_at: new Date().toISOString(),
      delivered_at: new Date().toISOString(),
      notes: params.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: saleItems,
      payments: params.payments.map((p, idx) => ({
        id: `pay-${Date.now()}-${idx}`,
        sale_id: saleId,
        provider: p.provider,
        provider_reference: p.provider_reference || `POS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        amount: p.amount,
        payment_method: p.payment_method,
        status: 'succeeded',
        confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })),
    };

    // Update shift metrics
    const shift = shifts.find((s) => s.id === params.shiftId);
    if (shift) {
      shift.total_bills_generated += 1;
      for (const pay of params.payments) {
        if (pay.payment_method.toLowerCase() === 'cash') shift.total_sales_cash += pay.amount;
        else if (pay.payment_method.toLowerCase() === 'upi') shift.total_sales_upi += pay.amount;
        else shift.total_sales_card += pay.amount;
      }
    }

    sales.unshift(sale);
    save(KEYS.INVENTORY, inventory);
    save(KEYS.SALES, sales);
    save(KEYS.ALLOCATIONS, allocations);
    save(KEYS.LEDGER, ledger);
    save(KEYS.SHIFTS, shifts);
    save(KEYS.MOVEMENTS, movements);

    this.addAuditLog('pos_sale_completed', 'sale', saleId, { saleNumber, total: totalPayable, itemsCount: saleItems.length });
    return sale;
  }

  // Online Checkout Finalization
  static finalizeOnlineOrder(params: {
    customerId: string;
    items: { productId: string; barcode: string }[];
    shippingAddress: any;
    billingAddress?: any;
    appliedCoupon?: Coupon | null;
    paymentProvider: string;
    paymentRef?: string;
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    notes?: string;
  }): Sale {
    const inventory = load<InventoryItem[]>(KEYS.INVENTORY, initialInventoryItems);
    const products = load<Product[]>(KEYS.PRODUCTS, initialProducts);
    const designers = load<DesignerProfile[]>(KEYS.DESIGNERS, initialDesigners);
    const sales = load<Sale[]>(KEYS.SALES, initialSales);
    const allocations = load<SaleAllocation[]>(KEYS.ALLOCATIONS, initialAllocations);
    const ledger = load<DesignerLedgerEntry[]>(KEYS.LEDGER, initialLedgerEntries);
    const movements = load<InventoryMovement[]>(KEYS.MOVEMENTS, initialMovements);

    const saleId = `sale-online-${Date.now()}`;
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    const saleNumber = `ORD-${dateStr}-${randStr}`;

    let subtotal = 0;
    let taxTotal = 0;
    const saleItems: SaleItem[] = [];

    // Calculate coupon discount
    let totalDiscount = 0;
    const initialSubtotal = params.items.reduce((sum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      return sum + (prod?.price || 0);
    }, 0);

    if (params.appliedCoupon) {
      if (params.appliedCoupon.discount_type === 'percentage') {
        totalDiscount = Math.round((initialSubtotal * params.appliedCoupon.discount_value) / 100);
        if (params.appliedCoupon.max_discount_amount) {
          totalDiscount = Math.min(totalDiscount, params.appliedCoupon.max_discount_amount);
        }
      } else {
        totalDiscount = params.appliedCoupon.discount_value;
      }
    }

    const perItemDiscount = params.items.length > 0 ? Math.round((totalDiscount / params.items.length) * 100) / 100 : 0;

    for (const itemRef of params.items) {
      const invItem = inventory.find((i) => i.barcode === itemRef.barcode);
      if (!invItem) throw new Error(`Inventory item for barcode ${itemRef.barcode} not found`);
      if (invItem.status !== 'available' && invItem.status !== 'reserved') {
        throw new Error(`Saree ${itemRef.barcode} is no longer available.`);
      }

      const product = products.find((p) => p.id === invItem.product_id);
      if (!product) throw new Error(`Product details missing for ${itemRef.barcode}`);

      invItem.status = 'sold';
      invItem.sold_at = new Date().toISOString();
      invItem.updated_at = new Date().toISOString();

      movements.push({
        id: `mov-${Date.now()}-${invItem.barcode}`,
        inventory_item_id: invItem.id,
        movement_type: 'sale',
        reference_type: 'online_order',
        reference_id: saleId,
        reason: `Online Order ${saleNumber}`,
        actor_id: params.customerId,
        created_at: new Date().toISOString(),
        item_barcode: invItem.barcode,
        product_name: product.name,
      });

      const unitPrice = product.price;
      const tax = Math.round(unitPrice * 0.05);
      const finalPrice = Math.max(0, unitPrice - perItemDiscount);
      subtotal += unitPrice;
      taxTotal += tax;

      const designer = designers.find((d) => d.id === invItem.designer_id);
      const commissionRate = designer?.default_commission_rate ?? 0.30;
      const saleItemId = `s-item-${Date.now()}-${invItem.barcode}`;

      const saleItem: SaleItem = {
        id: saleItemId,
        sale_id: saleId,
        inventory_item_id: invItem.id,
        barcode_snapshot: invItem.barcode,
        product_name_snapshot: product.name,
        sku_snapshot: product.sku,
        ownership_snapshot: invItem.ownership_type,
        designer_id: invItem.designer_id,
        quantity: 1,
        unit_price_ex_tax: unitPrice,
        allocated_discount_ex_tax: perItemDiscount,
        tax_amount: tax,
        final_price_ex_tax: finalPrice,
        commission_rate_snapshot: invItem.ownership_type === 'designer_consignment' ? commissionRate : undefined,
        return_window_days_snapshot: 7,
        created_at: new Date().toISOString(),
      };
      saleItems.push(saleItem);

      if (invItem.ownership_type === 'designer_consignment' && invItem.designer_id) {
        const eligibleAmount = finalPrice;
        const commissionAmount = Math.round(eligibleAmount * commissionRate);
        const designerAmount = eligibleAmount - commissionAmount;

        const returnDate = new Date();
        returnDate.setDate(returnDate.getDate() + 7);

        const allocation: SaleAllocation = {
          id: `alloc-${Date.now()}-${invItem.barcode}`,
          sale_item_id: saleItemId,
          designer_id: invItem.designer_id,
          eligible_amount: eligibleAmount,
          commission_rate: commissionRate,
          commission_amount: commissionAmount,
          designer_amount: designerAmount,
          status: 'pending',
          eligible_at: returnDate.toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        allocations.push(allocation);

        ledger.push({
          id: `led-${Date.now()}-${invItem.barcode}`,
          designer_id: invItem.designer_id,
          allocation_id: allocation.id,
          entry_type: 'sale_allocation',
          amount: designerAmount,
          signed_amount: designerAmount,
          reference_type: 'online_order',
          reference_id: saleId,
          idempotency_key: `online-sale-item:${saleItemId}`,
          description: `Online Order allocation: ${product.name} (${saleNumber})`,
          created_at: new Date().toISOString(),
        });
      }
    }

    const totalPayable = Math.max(0, subtotal - totalDiscount) + taxTotal;

    const sale: Sale = {
      id: saleId,
      channel: 'online',
      customer_id: params.customerId,
      sale_number: saleNumber,
      status: 'confirmed',
      currency: 'INR',
      subtotal_ex_tax: subtotal,
      discount_ex_tax: totalDiscount,
      tax_total: taxTotal,
      shipping_total: 0,
      total_payable: totalPayable,
      customer_name: params.customerName,
      customer_phone: params.customerPhone,
      customer_email: params.customerEmail,
      shipping_address: params.shippingAddress,
      billing_address: params.billingAddress || params.shippingAddress,
      applied_coupon_id: params.appliedCoupon?.id,
      payment_confirmed_at: new Date().toISOString(),
      notes: params.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      items: saleItems,
      payments: [
        {
          id: `pay-${Date.now()}`,
          sale_id: saleId,
          provider: params.paymentProvider,
          provider_reference: params.paymentRef || `RAZORPAY-TXN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
          amount: totalPayable,
          payment_method: params.paymentProvider === 'cod' ? 'Cash on Delivery' : 'Online Gateway',
          status: 'succeeded',
          confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
    };

    sales.unshift(sale);
    save(KEYS.INVENTORY, inventory);
    save(KEYS.SALES, sales);
    save(KEYS.ALLOCATIONS, allocations);
    save(KEYS.LEDGER, ledger);
    save(KEYS.MOVEMENTS, movements);

    this.addAuditLog('online_order_placed', 'sale', saleId, { saleNumber, total: totalPayable });
    return sale;
  }

  // Designer Payout Engine
  static getAllocations(designerId?: string): SaleAllocation[] {
    const allocs = load<SaleAllocation[]>(KEYS.ALLOCATIONS, initialAllocations);
    const designers = this.getDesigners();
    const sales = this.getSales();

    // Attach joined sale item & designer
    const enriched = allocs.map((a) => {
      let saleItem: SaleItem | undefined;
      for (const s of sales) {
        const found = s.items?.find((i) => i.id === a.sale_item_id);
        if (found) {
          saleItem = found;
          break;
        }
      }
      return {
        ...a,
        designer: designers.find((d) => d.id === a.designer_id),
        sale_item: saleItem,
      };
    });

    if (designerId) {
      return enriched.filter((a) => a.designer_id === designerId);
    }
    return enriched;
  }

  static getDesignerLedger(designerId?: string): DesignerLedgerEntry[] {
    const entries = load<DesignerLedgerEntry[]>(KEYS.LEDGER, initialLedgerEntries);
    if (designerId) {
      return entries.filter((e) => e.designer_id === designerId).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  static getPayouts(designerId?: string): Payout[] {
    const payouts = load<Payout[]>(KEYS.PAYOUTS, []);
    const designers = this.getDesigners();
    const enriched = payouts.map((p) => ({
      ...p,
      designer: designers.find((d) => d.id === p.designer_id),
    }));

    if (designerId) {
      return enriched.filter((p) => p.designer_id === designerId);
    }
    return enriched;
  }

  static createPayoutBatch(designerId: string, allocationIds: string[], approvedBy = 'admin'): Payout {
    const allocs = load<SaleAllocation[]>(KEYS.ALLOCATIONS, initialAllocations);
    const payouts = load<Payout[]>(KEYS.PAYOUTS, []);
    const designer = this.getDesigners().find((d) => d.id === designerId);

    if (!designer) throw new Error('Designer not found');

    const selectedAllocs = allocs.filter((a) => allocationIds.includes(a.id) && a.designer_id === designerId);
    if (selectedAllocs.length === 0) throw new Error('No allocations selected for payout');

    let totalAmount = 0;
    for (const a of selectedAllocs) {
      if (a.status !== 'eligible') {
        throw new Error(`Allocation ${a.id} is ${a.status} and not yet eligible for payout`);
      }
      totalAmount += a.designer_amount;
      a.status = 'reserved_for_payout';
      a.updated_at = new Date().toISOString();
    }

    const payoutId = `payout-${Date.now()}`;
    const payoutNumber = `PAY-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const payout: Payout = {
      id: payoutId,
      payout_number: payoutNumber,
      designer_id: designerId,
      amount: totalAmount,
      status: 'approved',
      bank_account_snapshot: `A/C: ${designer.bank_account_number || 'N/A'} (IFSC: ${designer.bank_ifsc || 'N/A'})`,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      items: selectedAllocs.map((a) => ({
        payout_id: payoutId,
        allocation_id: a.id,
        amount: a.designer_amount,
      })),
    };

    payouts.unshift(payout);
    save(KEYS.ALLOCATIONS, allocs);
    save(KEYS.PAYOUTS, payouts);
    this.addAuditLog('payout_batch_created', 'payout', payoutId, { payoutNumber, totalAmount, designer: designer.brand_name });
    return payout;
  }

  static recordPayoutResult(payoutId: string, status: 'paid' | 'failed', providerRef?: string): void {
    const payouts = load<Payout[]>(KEYS.PAYOUTS, []);
    const allocs = load<SaleAllocation[]>(KEYS.ALLOCATIONS, initialAllocations);
    const ledger = load<DesignerLedgerEntry[]>(KEYS.LEDGER, initialLedgerEntries);

    const payout = payouts.find((p) => p.id === payoutId);
    if (!payout) throw new Error('Payout not found');

    payout.status = status;
    payout.provider_reference = providerRef || `NEFT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    if (status === 'paid') {
      payout.paid_at = new Date().toISOString();

      // Mark allocations as paid
      for (const item of payout.items || []) {
        const alloc = allocs.find((a) => a.id === item.allocation_id);
        if (alloc) {
          alloc.status = 'paid';
          alloc.updated_at = new Date().toISOString();
        }
      }

      // Add debit to ledger
      ledger.push({
        id: `led-${Date.now()}`,
        designer_id: payout.designer_id,
        entry_type: 'payout',
        amount: payout.amount,
        signed_amount: -payout.amount, // Debit
        reference_type: 'payout_batch',
        reference_id: payoutId,
        idempotency_key: `payout-settled:${payoutId}`,
        description: `Direct Bank Transfer Settled (${payout.payout_number})`,
        created_at: new Date().toISOString(),
      });
    } else {
      // Revert allocations back to eligible
      for (const item of payout.items || []) {
        const alloc = allocs.find((a) => a.id === item.allocation_id);
        if (alloc) {
          alloc.status = 'eligible';
          alloc.updated_at = new Date().toISOString();
        }
      }
    }

    save(KEYS.PAYOUTS, payouts);
    save(KEYS.ALLOCATIONS, allocs);
    save(KEYS.LEDGER, ledger);
    this.addAuditLog('payout_status_updated', 'payout', payoutId, { status, providerRef });
  }

  // Returns & Exchanges Engine
  static processReturn(params: {
    saleId: string;
    saleItemId: string;
    inventoryItemId: string;
    condition: StockCondition;
    reason: string;
    refundAmount: number;
    actorId?: string;
  }): CustomerReturn {
    const actorId = params.actorId || 'staff';
    const sales = load<Sale[]>(KEYS.SALES, initialSales);
    const inventory = load<InventoryItem[]>(KEYS.INVENTORY, initialInventoryItems);
    const movements = load<InventoryMovement[]>(KEYS.MOVEMENTS, initialMovements);
    const allocations = load<SaleAllocation[]>(KEYS.ALLOCATIONS, initialAllocations);
    const ledger = load<DesignerLedgerEntry[]>(KEYS.LEDGER, initialLedgerEntries);
    const returns = load<CustomerReturn[]>(KEYS.RETURNS, []);

    const sale = sales.find((s) => s.id === params.saleId);
    if (!sale) throw new Error('Sale record not found');

    const invItem = inventory.find((i) => i.id === params.inventoryItemId);
    if (!invItem) throw new Error('Inventory piece not found');

    invItem.condition = params.condition;
    // Restore sellable stock only if authorized return determined sellable
    if (params.condition === 'sellable') {
      invItem.status = 'available';
    } else {
      invItem.status = 'held'; // Damaged / unsellable piece held in inspection
    }
    invItem.updated_at = new Date().toISOString();

    movements.push({
      id: `mov-${Date.now()}`,
      inventory_item_id: invItem.id,
      movement_type: 'return',
      reference_type: 'customer_return',
      reference_id: params.saleId,
      reason: `Return processed: ${params.reason} (Condition: ${params.condition})`,
      actor_id: actorId,
      created_at: new Date().toISOString(),
      item_barcode: invItem.barcode,
    });

    // Reverse designer allocation if consignment
    const alloc = allocations.find((a) => a.sale_item_id === params.saleItemId);
    if (alloc) {
      alloc.status = 'reversed';
      alloc.updated_at = new Date().toISOString();

      ledger.push({
        id: `led-${Date.now()}-ret`,
        designer_id: alloc.designer_id,
        allocation_id: alloc.id,
        entry_type: 'return_reversal',
        amount: alloc.designer_amount,
        signed_amount: -alloc.designer_amount, // Deduct from payable
        reference_type: 'customer_return',
        reference_id: params.saleId,
        idempotency_key: `return-reversal:${params.saleItemId}`,
        description: `Reversal for returned item (${params.reason})`,
        created_at: new Date().toISOString(),
      });
    }

    const returnRecord: CustomerReturn = {
      id: `ret-${Date.now()}`,
      return_number: `RET-${Date.now().toString().slice(-6)}`,
      sale_id: params.saleId,
      sale_item_id: params.saleItemId,
      inventory_item_id: params.inventoryItemId,
      customer_id: sale.customer_id,
      reason: params.reason,
      condition_received: params.condition,
      refund_amount: params.refundAmount,
      status: 'completed',
      processed_by: actorId,
      created_at: new Date().toISOString(),
    };

    returns.unshift(returnRecord);
    save(KEYS.INVENTORY, inventory);
    save(KEYS.MOVEMENTS, movements);
    save(KEYS.ALLOCATIONS, allocations);
    save(KEYS.LEDGER, ledger);
    save(KEYS.RETURNS, returns);

    this.addAuditLog('return_processed', 'return', returnRecord.id, { returnNumber: returnRecord.return_number, amount: params.refundAmount });
    return returnRecord;
  }

  static getReturns(): CustomerReturn[] {
    return load<CustomerReturn[]>(KEYS.RETURNS, []);
  }

  static getSales(): Sale[] {
    return load<Sale[]>(KEYS.SALES, initialSales);
  }

  // Shifts
  static getShifts(): CashierShift[] {
    return load<CashierShift[]>(KEYS.SHIFTS, [initialShift]);
  }

  static getActiveShift(): CashierShift | undefined {
    return this.getShifts().find((s) => s.status === 'open');
  }

  static openShift(cashierId: string, locationId: string, openingCash: number, notes?: string): CashierShift {
    const shifts = this.getShifts();
    const newShift: CashierShift = {
      id: `shift-${Date.now()}`,
      cashier_id: cashierId,
      location_id: locationId,
      opening_cash: openingCash,
      total_sales_cash: 0,
      total_sales_upi: 0,
      total_sales_card: 0,
      total_bills_generated: 0,
      notes: notes || 'New Cashier Shift opened',
      status: 'open',
      opened_at: new Date().toISOString(),
    };
    shifts.unshift(newShift);
    save(KEYS.SHIFTS, shifts);
    this.addAuditLog('shift_opened', 'cashier_shift', newShift.id, { openingCash, locationId });
    return newShift;
  }

  static closeShift(shiftId: string, closingCashActual: number, notes?: string): CashierShift {
    const shifts = this.getShifts();
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) throw new Error('Shift not found');

    const expected = shift.opening_cash + shift.total_sales_cash;
    const discrepancy = closingCashActual - expected;

    shift.status = 'closed';
    shift.closing_cash_actual = closingCashActual;
    shift.closing_cash_expected = expected;
    shift.cash_discrepancy = discrepancy;
    shift.closed_at = new Date().toISOString();
    if (notes) shift.notes = `${shift.notes ? shift.notes + ' | ' : ''}Closing Note: ${notes}`;

    save(KEYS.SHIFTS, shifts);
    this.addAuditLog('shift_closed', 'cashier_shift', shiftId, { closingCashActual, expected, discrepancy });
    return shift;
  }

  // Wishlist
  static getWishlist(customerId: string): WishlistItem[] {
    const list = load<WishlistItem[]>(KEYS.WISHLIST, []);
    const products = this.getProducts();
    return list
      .filter((w) => w.customer_id === customerId)
      .map((w) => ({
        ...w,
        product: products.find((p) => p.id === w.product_id),
      }));
  }

  static toggleWishlist(customerId: string, productId: string): boolean {
    const list = load<WishlistItem[]>(KEYS.WISHLIST, []);
    const index = list.findIndex((w) => w.customer_id === customerId && w.product_id === productId);

    if (index >= 0) {
      list.splice(index, 1);
      save(KEYS.WISHLIST, list);
      return false; // Removed
    } else {
      list.push({
        id: `wish-${Date.now()}`,
        customer_id: customerId,
        product_id: productId,
        created_at: new Date().toISOString(),
      });
      save(KEYS.WISHLIST, list);
      return true; // Added
    }
  }

  static getWishlistCountForProduct(productId: string): number {
    const list = load<WishlistItem[]>(KEYS.WISHLIST, []);
    return list.filter((w) => w.product_id === productId).length;
  }

  // Coupons
  static getCoupons(): Coupon[] {
    return load<Coupon[]>(KEYS.COUPONS, initialCoupons);
  }

  static validateCoupon(code: string, cartTotal: number): { valid: boolean; coupon?: Coupon; error?: string } {
    const coupons = this.getCoupons();
    const coupon = coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase());

    if (!coupon) return { valid: false, error: 'Invalid coupon code' };
    if (!coupon.active) return { valid: false, error: 'This coupon has expired' };
    if (cartTotal < coupon.min_order_value) {
      return { valid: false, error: `Minimum order value of ₹${coupon.min_order_value.toLocaleString('en-IN')} required` };
    }
    return { valid: true, coupon };
  }

  // Customer Addresses
  static getAddresses(customerId: string): CustomerAddress[] {
    const addresses = load<CustomerAddress[]>(KEYS.ADDRESSES, initialAddresses);
    return addresses.filter((a) => a.customer_id === customerId);
  }

  static saveAddress(address: Partial<CustomerAddress>): CustomerAddress {
    const addresses = load<CustomerAddress[]>(KEYS.ADDRESSES, initialAddresses);
    const newAddr: CustomerAddress = {
      id: address.id || `addr-${Date.now()}`,
      customer_id: address.customer_id || 'user-cust-ananya',
      label: address.label || 'Home',
      recipient_name: address.recipient_name || '',
      phone: address.phone || '',
      street_address: address.street_address || '',
      landmark: address.landmark || '',
      city: address.city || 'Mumbai',
      state: address.state || 'Maharashtra',
      postal_code: address.postal_code || '400001',
      is_default: address.is_default || false,
      created_at: new Date().toISOString(),
      ...address,
    };

    if (newAddr.is_default) {
      addresses.forEach((a) => {
        if (a.customer_id === newAddr.customer_id) a.is_default = false;
      });
    }

    const idx = addresses.findIndex((a) => a.id === newAddr.id);
    if (idx >= 0) addresses[idx] = newAddr;
    else addresses.push(newAddr);

    save(KEYS.ADDRESSES, addresses);
    return newAddr;
  }

  // Designer Applications & Management
  static applyAsDesigner(data: Partial<DesignerProfile>): DesignerProfile {
    const designers = load<DesignerProfile[]>(KEYS.DESIGNERS, initialDesigners);
    const newDes: DesignerProfile = {
      id: `des-${Date.now()}`,
      user_id: data.user_id || `user-des-${Date.now()}`,
      brand_name: data.brand_name || 'My Atelier',
      contact_person: data.contact_person || '',
      email: data.email || '',
      phone: data.phone || '',
      business_address: data.business_address || '',
      city: data.city || '',
      state: data.state || '',
      brand_story: data.brand_story || '',
      portfolio_url: data.portfolio_url || '',
      default_commission_rate: 0.30,
      approval_status: 'pending',
      created_at: new Date().toISOString(),
      ...data,
    };
    designers.push(newDes);
    save(KEYS.DESIGNERS, designers);
    this.addAuditLog('designer_application_submitted', 'designer', newDes.id, { brand: newDes.brand_name });
    return newDes;
  }

  static reviewDesigner(designerId: string, status: 'approved' | 'rejected' | 'suspended', commissionRate?: number, notes?: string): void {
    const designers = load<DesignerProfile[]>(KEYS.DESIGNERS, initialDesigners);
    const d = designers.find((x) => x.id === designerId);
    if (!d) throw new Error('Designer not found');

    d.approval_status = status;
    if (commissionRate !== undefined) d.default_commission_rate = commissionRate;
    if (notes) d.admin_notes = notes;
    d.reviewed_at = new Date().toISOString();

    save(KEYS.DESIGNERS, designers);
    this.addAuditLog('designer_review', 'designer', designerId, { status, commissionRate, notes });
  }

  // Audit Logs
  static getAuditLogs(): AuditLogItem[] {
    return load<AuditLogItem[]>(KEYS.AUDIT, []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  static addAuditLog(action: string, entity_type: string, entity_id: string, details?: any, actorId = 'system'): void {
    const logs = load<AuditLogItem[]>(KEYS.AUDIT, []);
    logs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      actor_id: actorId,
      actor_name: actorId === 'admin' ? 'Bombay Admin' : actorId === 'staff' ? 'Priya Sharma (Staff)' : 'System',
      action,
      entity_type,
      entity_id,
      details,
      created_at: new Date().toISOString(),
    });
    if (logs.length > 200) logs.pop();
    save(KEYS.AUDIT, logs);
  }

  // Reset demo data
  static resetToDefaults(): void {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  }
}
