// Database Models & TypeScript Definitions matching Bombay Saree Schema

export type AppRole = 'customer' | 'staff' | 'designer' | 'admin';

export type OwnershipType = 'bombay_owned' | 'designer_consignment';

export type StockCondition = 'sellable' | 'inspection' | 'damaged' | 'unsellable';

export type StockStatus = 'available' | 'reserved' | 'sold' | 'in_transit' | 'held';

export type SaleChannel = 'online' | 'pos';

export type SaleStatus = 'pending_payment' | 'confirmed' | 'delivered' | 'cancelled' | 'refunded';

export type LedgerEntryType =
  | 'sale_allocation'
  | 'return_reversal'
  | 'adjustment_credit'
  | 'adjustment_debit'
  | 'payout'
  | 'payout_reversal';

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  role: AppRole;
  created_at: string;
}

export interface StoreLocation {
  id: string;
  name: string;
  code: string;
  location_type: 'store' | 'warehouse';
  address: string;
  city: string;
  state: string;
  postal_code: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface DesignerProfile {
  id: string;
  user_id: string;
  brand_name: string;
  contact_person: string;
  email: string;
  phone: string;
  business_address: string;
  city: string;
  state: string;
  brand_story?: string;
  portfolio_url?: string;
  logo_url?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  pan_number?: string;
  gstin?: string;
  default_commission_rate: number; // e.g. 0.30 (Bombay Saree keeps 30%, designer gets 70%)
  approval_status: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended';
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  display_order: number;
}

export interface Product {
  id: string;
  designer_id?: string;
  category_id?: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  fabric: string;
  color: string;
  occasion: string;
  style: string;
  drape_length: string;
  blouse_included: boolean;
  blouse_length: string;
  care_instructions: string;
  mrp: number;
  price: number;
  ownership_type: OwnershipType;
  status: 'draft' | 'pending' | 'active' | 'rejected' | 'archived';
  featured: boolean;
  bestseller: boolean;
  new_arrival: boolean;
  tags: string[];
  images: string[];
  created_at: string;
  updated_at: string;
  // Computed / joined fields
  designer?: DesignerProfile;
  category?: ProductCategory;
  available_stock_count?: number;
}

export interface CommissionRule {
  id: string;
  designer_id: string;
  product_id?: string;
  commission_rate: number;
  effective_from: string;
  effective_to?: string;
  return_window_days: number;
  active: boolean;
  created_at: string;
}

// Each physical saree piece has its own unique barcode and ID
export interface InventoryItem {
  id: string;
  product_id: string;
  location_id: string;
  barcode: string; // Unique Barcode (e.g., Code 128)
  ownership_type: OwnershipType;
  designer_id?: string;
  acquisition_cost?: number; // For Bombay-owned stock
  condition: StockCondition;
  status: StockStatus;
  received_at: string;
  sold_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  product?: Product;
  location?: StoreLocation;
  designer?: DesignerProfile;
}

export interface InventoryMovement {
  id: string;
  inventory_item_id: string;
  from_location_id?: string;
  to_location_id?: string;
  movement_type: 'receipt' | 'sale' | 'reservation' | 'reservation_release' | 'transfer' | 'return' | 'damage' | 'adjustment';
  reference_type?: string;
  reference_id?: string;
  reason?: string;
  actor_id?: string;
  created_at: string;
  // Joined
  item_barcode?: string;
  product_name?: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  recipient_name: string;
  phone: string;
  street_address: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
  is_default: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_value: number;
  max_discount_amount?: number;
  valid_until?: string;
  max_uses?: number;
  usage_count: number;
  active: boolean;
  created_at: string;
}

export interface CashierShift {
  id: string;
  cashier_id: string;
  cashier_name?: string;
  location_id: string;
  opening_cash: number;
  closing_cash_actual?: number;
  closing_cash_expected?: number;
  cash_discrepancy?: number;
  total_sales_cash: number;
  total_sales_upi: number;
  total_sales_card: number;
  total_bills_generated: number;
  notes?: string;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
}

export interface Sale {
  id: string;
  channel: SaleChannel;
  customer_id?: string;
  cashier_id?: string;
  location_id?: string;
  shift_id?: string;
  sale_number: string;
  status: SaleStatus;
  currency: string;
  subtotal_ex_tax: number;
  discount_ex_tax: number;
  tax_total: number;
  shipping_total: number;
  total_payable: number;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  shipping_address?: any;
  billing_address?: any;
  applied_coupon_id?: string;
  notes?: string;
  payment_confirmed_at?: string;
  delivered_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  items?: SaleItem[];
  payments?: Payment[];
}

export interface SaleItem {
  id: string;
  sale_id: string;
  inventory_item_id: string;
  barcode_snapshot: string;
  product_name_snapshot: string;
  sku_snapshot: string;
  ownership_snapshot: OwnershipType;
  designer_id?: string;
  quantity: 1; // Always 1 for unique physical saree piece
  unit_price_ex_tax: number;
  allocated_discount_ex_tax: number;
  tax_amount: number;
  final_price_ex_tax: number;
  commission_rule_id?: string;
  commission_rate_snapshot?: number;
  return_window_days_snapshot: number;
  created_at: string;
  // Joined
  designer?: DesignerProfile;
}

export interface Payment {
  id: string;
  sale_id: string;
  provider: string; // 'razorpay' | 'cashfree' | 'cash' | 'upi' | 'card'
  provider_reference?: string;
  amount: number;
  payment_method: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  confirmed_at?: string;
  created_at: string;
}

export interface SaleAllocation {
  id: string;
  sale_item_id: string;
  designer_id: string;
  eligible_amount: number;
  commission_rate: number;
  commission_amount: number;
  designer_amount: number;
  status: 'pending' | 'eligible' | 'reserved_for_payout' | 'paid' | 'held' | 'reversed';
  eligible_at?: string;
  created_at: string;
  updated_at: string;
  // Joined
  sale_item?: SaleItem;
  designer?: DesignerProfile;
}

export interface DesignerLedgerEntry {
  id: string;
  designer_id: string;
  allocation_id?: string;
  entry_type: LedgerEntryType;
  amount: number;
  signed_amount: number; // positive = credit (increases payable), negative = debit
  reference_type: string;
  reference_id: string;
  idempotency_key: string;
  description?: string;
  created_at: string;
}

export interface Payout {
  id: string;
  payout_number: string;
  designer_id: string;
  amount: number;
  status: 'draft' | 'approved' | 'processing' | 'paid' | 'failed' | 'cancelled';
  provider_reference?: string;
  bank_account_snapshot?: string;
  approved_by?: string;
  approved_at?: string;
  paid_at?: string;
  created_at: string;
  designer?: DesignerProfile;
  items?: PayoutItem[];
}

export interface PayoutItem {
  payout_id: string;
  allocation_id: string;
  amount: number;
}

export interface WishlistItem {
  id: string;
  customer_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface CustomerReturn {
  id: string;
  return_number: string;
  sale_id: string;
  sale_item_id: string;
  inventory_item_id: string;
  customer_id?: string;
  reason: string;
  condition_received: StockCondition;
  refund_amount: number;
  status: 'requested' | 'approved' | 'rejected' | 'completed';
  processed_by?: string;
  notes?: string;
  created_at: string;
  // Joined
  sale?: Sale;
  sale_item?: SaleItem;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  type: 'order' | 'designer' | 'inventory' | 'payout' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  actor_id?: string;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: any;
  created_at: string;
}
