import React, { createContext, useContext, useState, useEffect } from 'react';
import { InventoryItem, CashierShift, Sale } from '../types/database';
import { BombayDataStore } from '../lib/storage';

export interface PosBillItem {
  inventoryItem: InventoryItem;
  discount: number; // item-level discount in INR
}

export interface PosPaymentMethod {
  method: 'cash' | 'upi' | 'card';
  amount: number;
  reference?: string;
}

export interface HeldBill {
  id: string;
  timestamp: string;
  items: PosBillItem[];
  customerName?: string;
  customerPhone?: string;
  billDiscount: number;
  total: number;
}

interface PosContextType {
  billItems: PosBillItem[];
  activeShift: CashierShift | undefined;
  refreshShift: () => void;
  addItemByBarcode: (barcode: string) => { success: boolean; message: string };
  removeItem: (barcode: string) => void;
  updateItemDiscount: (barcode: string, discount: number) => void;
  clearBill: () => void;
  billDiscount: number;
  setBillDiscount: (amount: number) => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  customerPhone: string;
  setCustomerPhone: (phone: string) => void;
  customerEmail: string;
  setCustomerEmail: (email: string) => void;
  subtotal: number;
  itemDiscountsTotal: number;
  taxTotal: number;
  totalPayable: number;
  heldBills: HeldBill[];
  holdCurrentBill: () => void;
  resumeBill: (id: string) => void;
  discardHeldBill: (id: string) => void;
  lastCompletedSale: Sale | null;
  setLastCompletedSale: (sale: Sale | null) => void;
}

const PosContext = createContext<PosContextType | undefined>(undefined);

export const PosProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [billItems, setBillItems] = useState<PosBillItem[]>([]);
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [activeShift, setActiveShift] = useState<CashierShift | undefined>(undefined);
  const [heldBills, setHeldBills] = useState<HeldBill[]>(() => {
    try {
      const saved = localStorage.getItem('bombay_pos_held_bills');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [lastCompletedSale, setLastCompletedSale] = useState<Sale | null>(null);

  const refreshShift = () => {
    setActiveShift(BombayDataStore.getActiveShift());
  };

  useEffect(() => {
    refreshShift();
  }, []);

  useEffect(() => {
    localStorage.setItem('bombay_pos_held_bills', JSON.stringify(heldBills));
  }, [heldBills]);

  const addItemByBarcode = (barcode: string): { success: boolean; message: string } => {
    const clean = barcode.trim().toUpperCase();
    if (!clean) return { success: false, message: 'Please provide a valid barcode.' };

    // Check if barcode is already on the current bill
    if (billItems.some((b) => b.inventoryItem.barcode.toUpperCase() === clean)) {
      return {
        success: false,
        message: `Saree piece [${clean}] is already scanned on this bill. (Each piece is unique).`,
      };
    }

    const item = BombayDataStore.findItemByBarcode(clean);
    if (!item) {
      return {
        success: false,
        message: `No saree found with barcode [${clean}]. Check SKU or intake records.`,
      };
    }

    if (item.status !== 'available' || item.condition !== 'sellable') {
      return {
        success: false,
        message: `Saree [${clean}] is currently ${item.status} (condition: ${item.condition}) and cannot be sold.`,
      };
    }

    setBillItems((prev) => [...prev, { inventoryItem: item, discount: 0 }]);
    return {
      success: true,
      message: `Scanned: ${item.product?.name} (${item.barcode})`,
    };
  };

  const removeItem = (barcode: string) => {
    setBillItems((prev) => prev.filter((b) => b.inventoryItem.barcode !== barcode));
  };

  const updateItemDiscount = (barcode: string, discount: number) => {
    setBillItems((prev) =>
      prev.map((b) => (b.inventoryItem.barcode === barcode ? { ...b, discount: Math.max(0, discount) } : b))
    );
  };

  const clearBill = () => {
    setBillItems([]);
    setBillDiscount(0);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
  };

  // Calculations
  const subtotal = billItems.reduce((sum, b) => sum + (b.inventoryItem.product?.price || 0), 0);
  const itemDiscountsTotal = billItems.reduce((sum, b) => sum + b.discount, 0);
  const taxableAmount = Math.max(0, subtotal - itemDiscountsTotal - billDiscount);
  const taxTotal = Math.round(taxableAmount * 0.05); // 5% GST
  const totalPayable = taxableAmount + taxTotal;

  const holdCurrentBill = () => {
    if (billItems.length === 0) return;

    const held: HeldBill = {
      id: `hold-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      items: [...billItems],
      customerName: customerName || 'Walk-in Client',
      customerPhone,
      billDiscount,
      total: totalPayable,
    };

    setHeldBills((prev) => [held, ...prev]);
    clearBill();
  };

  const resumeBill = (id: string) => {
    const found = heldBills.find((h) => h.id === id);
    if (!found) return;

    setBillItems(found.items);
    setCustomerName(found.customerName === 'Walk-in Client' ? '' : found.customerName || '');
    setCustomerPhone(found.customerPhone || '');
    setBillDiscount(found.billDiscount);

    setHeldBills((prev) => prev.filter((h) => h.id !== id));
  };

  const discardHeldBill = (id: string) => {
    setHeldBills((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <PosContext.Provider
      value={{
        billItems,
        activeShift,
        refreshShift,
        addItemByBarcode,
        removeItem,
        updateItemDiscount,
        clearBill,
        billDiscount,
        setBillDiscount,
        customerName,
        setCustomerName,
        customerPhone,
        setCustomerPhone,
        customerEmail,
        setCustomerEmail,
        subtotal,
        itemDiscountsTotal,
        taxTotal,
        totalPayable,
        heldBills,
        holdCurrentBill,
        resumeBill,
        discardHeldBill,
        lastCompletedSale,
        setLastCompletedSale,
      }}
    >
      {children}
    </PosContext.Provider>
  );
};

export function usePos() {
  const context = useContext(PosContext);
  if (!context) throw new Error('usePos must be used within PosProvider');
  return context;
}
