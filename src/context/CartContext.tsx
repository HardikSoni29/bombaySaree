import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Coupon, InventoryItem } from '../types/database';
import { BombayDataStore } from '../lib/storage';

export interface CartItem {
  product: Product;
  assignedItem: InventoryItem; // The actual physical piece allocated with its unique barcode
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product) => { success: boolean; message: string };
  removeFromCart: (barcode: string) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  totalPayable: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('bombay_online_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(() => {
    try {
      const saved = localStorage.getItem('bombay_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    localStorage.setItem('bombay_online_cart', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (appliedCoupon) {
      localStorage.setItem('bombay_applied_coupon', JSON.stringify(appliedCoupon));
    } else {
      localStorage.removeItem('bombay_applied_coupon');
    }
  }, [appliedCoupon]);

  const addToCart = (product: Product): { success: boolean; message: string } => {
    // Find an available physical saree piece from inventory that is not already in the cart
    const inventory = BombayDataStore.getInventoryItems();
    const existingBarcodes = new Set(items.map((i) => i.assignedItem.barcode));

    const availablePiece = inventory.find(
      (inv) =>
        inv.product_id === product.id &&
        inv.status === 'available' &&
        inv.condition === 'sellable' &&
        !existingBarcodes.has(inv.barcode)
    );

    if (!availablePiece) {
      return {
        success: false,
        message: 'Regrettably, all physical pieces of this exquisite saree are currently reserved or sold out.',
      };
    }

    setItems((prev) => [...prev, { product, assignedItem: availablePiece }]);
    return {
      success: true,
      message: `Added to your curated cart. Physical piece tagged (Barcode: ${availablePiece.barcode}).`,
    };
  };

  const removeFromCart = (barcode: string) => {
    setItems((prev) => prev.filter((item) => item.assignedItem.barcode !== barcode));
  };

  const clearCart = () => {
    setItems([]);
    setAppliedCoupon(null);
  };

  const subtotal = items.reduce((sum, item) => sum + item.product.price, 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.discount_type === 'percentage') {
      discountAmount = Math.round((subtotal * appliedCoupon.discount_value) / 100);
      if (appliedCoupon.max_discount_amount) {
        discountAmount = Math.min(discountAmount, appliedCoupon.max_discount_amount);
      }
    } else {
      discountAmount = appliedCoupon.discount_value;
    }
  }

  // 5% standard GST on sarees in India
  const taxAmount = Math.round(Math.max(0, subtotal - discountAmount) * 0.05);
  const shippingAmount = 0; // Complimentary insured luxury shipping
  const totalPayable = Math.max(0, subtotal - discountAmount) + taxAmount + shippingAmount;

  const applyCoupon = (code: string) => {
    const result = BombayDataStore.validateCoupon(code, subtotal);
    if (!result.valid || !result.coupon) {
      return { success: false, message: result.error || 'Invalid code' };
    }
    setAppliedCoupon(result.coupon);
    return { success: true, message: `Privilege coupon ${result.coupon.code} applied!` };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        subtotal,
        discountAmount,
        taxAmount,
        shippingAmount,
        totalPayable,
        itemCount: items.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
