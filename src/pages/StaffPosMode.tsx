import React, { useState, useRef, useEffect } from 'react';
import { usePos } from '../context/PosContext';
import { useAuth } from '../context/AuthContext';
import { BombayDataStore } from '../lib/storage';
import { Product, InventoryItem, Sale } from '../types/database';
import { formatINR } from '../lib/utils';
import { useBarcodeScanner } from '../lib/barcode';
import { ShiftModal } from '../components/pos/ShiftModal';
import { SplitPaymentModal } from '../components/pos/SplitPaymentModal';
import { PosReturnsModal } from '../components/pos/PosReturnsModal';
import { ThermalReceiptModal } from '../components/common/ThermalReceiptModal';
import { InvoiceModal } from '../components/common/InvoiceModal';
import {
  Barcode,
  Search,
  Trash2,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  Clock,
  User,
  Phone,
  Tag,
  CreditCard,
  Printer,
  FileText,
  Sparkles,
  ShoppingBag,
  Store,
  ChevronRight,
  AlertCircle,
  X,
} from 'lucide-react';

export const StaffPosMode: React.FC = () => {
  const {
    billItems,
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
    subtotal,
    itemDiscountsTotal,
    taxTotal,
    totalPayable,
    heldBills,
    holdCurrentBill,
    resumeBill,
    activeShift,
    refreshShift,
    lastCompletedSale,
    setLastCompletedSale,
  } = usePos();

  const { user } = useAuth();
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [showShiftModal, setShowShiftModal] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [showReturnsModal, setShowReturnsModal] = useState<boolean>(false);
  const [showHeldModal, setShowHeldModal] = useState<boolean>(false);
  const [showThermalModal, setShowThermalModal] = useState<boolean>(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false);

  const barcodeInputRef = useRef<HTMLInputElement | null>(null);
  const products = BombayDataStore.getProducts().filter((p) => p.status === 'active');
  const inventory = BombayDataStore.getInventoryItems().filter((i) => i.status === 'available' && i.condition === 'sellable');

  // Hardware Barcode Scanner listener (USB / Bluetooth keyboard emulation)
  useBarcodeScanner((scannedBarcode) => {
    handleBarcodeScan(scannedBarcode);
  });

  const handleBarcodeScan = (code: string) => {
    const res = addItemByBarcode(code);
    if (res.success) {
      setScanFeedback({ type: 'success', text: res.message });
      setBarcodeInput('');
    } else {
      setScanFeedback({ type: 'error', text: res.message });
    }
    setTimeout(() => setScanFeedback(null), 3500);
  };

  const handleBarcodeInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      handleBarcodeScan(barcodeInput.trim());
    }
  };

  const handleAddProductPiece = (product: Product) => {
    // Find an available piece for this product
    const piece = inventory.find((i) => i.product_id === product.id && !billItems.some((b) => b.inventoryItem.barcode === i.barcode));
    if (piece) {
      handleBarcodeScan(piece.barcode);
    } else {
      setScanFeedback({ type: 'error', text: `No available physical pieces in stock for ${product.name}` });
      setTimeout(() => setScanFeedback(null), 3000);
    }
  };

  const handleFinalizeSale = (payments: { provider: string; provider_reference?: string; amount: number; payment_method: string }[]) => {
    try {
      const sale = BombayDataStore.finalizePosSale({
        cashierId: user.id,
        locationId: 'loc-mum-01', // Kala Ghoda Flagship Studio
        shiftId: activeShift?.id || 'shift-active-today',
        barcodes: billItems.map((b) => b.inventoryItem.barcode),
        payments,
        customerName: customerName || 'Walk-in Client',
        customerPhone,
        billDiscount,
        notes: 'Finalized at Flagship Register',
      });

      clearBill();
      setShowPaymentModal(false);
      setLastCompletedSale(sale);
      setShowThermalModal(true);
      refreshShift();
    } catch (err: any) {
      alert(err.message || 'Error finalizing sale.');
    }
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.fabric.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.sku.toLowerCase().includes(catalogSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-ivory-100 flex flex-col font-sans text-charcoal-900">
      {/* Top POS Terminal Navigation Bar */}
      <div className="bg-charcoal-900 text-ivory-100 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-md border-b border-charcoal-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-brand text-sm sm:text-base font-bold uppercase tracking-widest text-gold-300">
            <Store className="w-4 h-4 text-gold-400" />
            <span>Kala Ghoda Flagship POS</span>
          </div>
          <span className="text-charcoal-600 hidden sm:inline">•</span>
          <span className="text-xs text-charcoal-300 hidden md:inline">
            Cashier: <strong className="text-ivory-200">{user.full_name}</strong>
          </span>
        </div>

        {/* Shift Snapshot & Quick POS Actions */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <button
            onClick={() => setShowShiftModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-gold-300 border border-charcoal-700 transition"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Shift: {activeShift ? formatINR(activeShift.total_sales_cash + activeShift.total_sales_upi + activeShift.total_sales_card) : 'Closed'}</span>
          </button>

          <button
            onClick={() => setShowHeldModal(true)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-ivory-200 border border-charcoal-700 transition"
          >
            <PauseCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Held ({heldBills.length})</span>
          </button>

          <button
            onClick={() => setShowReturnsModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-charcoal-800 hover:bg-charcoal-700 text-ivory-200 border border-charcoal-700 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Returns</span>
          </button>
        </div>
      </div>

      {/* Main POS Workspace (2 Columns) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Barcode Scanning & Quick Product Catalog Search */}
        <div className="lg:w-7/12 p-4 sm:p-5 flex flex-col gap-4 overflow-y-auto">
          {/* Barcode Scanner Box */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-ivory-300">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-2">
                <Barcode className="w-4 h-4 text-burgundy-900" />
                <span>Barcode Scanner Input (Hardware Auto-Detect)</span>
              </label>
              <span className="text-[10px] text-charcoal-500 font-mono">USB / Bluetooth Emulation Active</span>
            </div>

            <form onSubmit={handleBarcodeInputSubmit} className="flex gap-2">
              <input
                ref={barcodeInputRef}
                type="text"
                data-barcode-scanner="true"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Scan saree tag or enter barcode (e.g. BS-KAN-001)..."
                className="flex-1 bg-ivory-50 border-2 border-ivory-300 rounded-lg px-3.5 py-2.5 font-mono text-sm uppercase tracking-wider text-charcoal-900 focus:outline-none focus:border-burgundy-900 focus:bg-white transition"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-bold text-xs uppercase tracking-wider transition shadow-sm"
              >
                Enter
              </button>
            </form>

            {/* Quick Demo Scan Chips */}
            <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[11px] text-charcoal-500">
              <span className="font-semibold text-charcoal-700">Quick Test Barcodes:</span>
              {['BS-KAN-001', 'BS-BAN-001', 'BS-CHA-001', 'BS-PAI-001', 'BS-ORG-001'].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => handleBarcodeScan(code)}
                  className="px-2 py-0.5 rounded bg-ivory-100 hover:bg-gold-100 border border-ivory-300 font-mono font-medium text-burgundy-900 transition"
                >
                  +{code}
                </button>
              ))}
            </div>

            {/* Scan Feedback Notification */}
            {scanFeedback && (
              <div
                className={`mt-3 p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 animate-fade-in ${
                  scanFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                    : 'bg-red-50 text-red-900 border border-red-300'
                }`}
              >
                {scanFeedback.type === 'success' ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <span>{scanFeedback.text}</span>
              </div>
            )}
          </div>

          {/* Manual Catalog Fast Search & Add Grid */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-ivory-300 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3 gap-3">
              <h3 className="font-serif text-sm font-bold text-charcoal-900">
                Manual Saree Catalog Selection ({filteredProducts.length})
              </h3>
              <div className="relative w-56">
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Filter name, fabric, SKU..."
                  className="w-full bg-ivory-50 border border-ivory-300 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                />
                <Search className="w-3.5 h-3.5 text-charcoal-400 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 overflow-y-auto max-h-[460px] p-1">
              {filteredProducts.map((p) => {
                const availableCount = inventory.filter((i) => i.product_id === p.id).length;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleAddProductPiece(p)}
                    className="p-2.5 rounded-xl border border-ivory-300 hover:border-gold-500 bg-ivory-50/70 hover:bg-white cursor-pointer transition flex flex-col justify-between shadow-2xl group"
                  >
                    <div>
                      <div className="flex justify-between items-start text-[10px] text-charcoal-500 font-mono">
                        <span className="truncate max-w-[120px]">{p.fabric}</span>
                        <span className={`px-1.5 py-0.2 rounded font-semibold ${
                          availableCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
                        }`}>
                          {availableCount} pcs
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-xs text-charcoal-900 mt-1 line-clamp-1 group-hover:text-burgundy-900">
                        {p.name}
                      </h4>
                      <span className="text-[10px] text-charcoal-400 font-mono block">{p.sku}</span>
                    </div>

                    <div className="mt-2 pt-1 border-t border-ivory-200 flex items-baseline justify-between">
                      <span className="font-serif font-bold text-xs text-burgundy-950">
                        {formatINR(p.price)}
                      </span>
                      <span className="text-[10px] text-gold-700 font-semibold group-hover:underline">
                        + Add Piece
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active POS Bill & Tender Terminal */}
        <div className="lg:w-5/12 bg-white border-t lg:border-t-0 lg:border-l border-ivory-300 p-4 sm:p-5 flex flex-col justify-between shadow-md">
          {/* Customer Selection Card */}
          <div className="pb-3 border-b border-ivory-300 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-charcoal-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-burgundy-800" />
                <span>Client Identification</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setCustomerName('Walk-in Client');
                  setCustomerPhone('');
                }}
                className="text-[10px] text-burgundy-800 hover:underline font-medium"
              >
                Reset to Walk-in
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Walk-in Client Name"
                className="bg-ivory-50 border border-ivory-300 rounded-lg p-2 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-800"
              />
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="Mobile (for SMS bill & OTP)"
                className="bg-ivory-50 border border-ivory-300 rounded-lg p-2 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-800"
              />
            </div>
          </div>

          {/* Scanned Items on Current Bill */}
          <div className="flex-1 overflow-y-auto py-3 space-y-2 max-h-[300px]">
            {billItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-charcoal-400 space-y-2">
                <Barcode className="w-10 h-10 text-ivory-400" />
                <p className="font-serif text-sm font-bold text-charcoal-700">POS Bill is empty</p>
                <p className="text-xs text-charcoal-500 max-w-xs">
                  Scan barcode with physical scanner or select a piece from catalog.
                </p>
              </div>
            ) : (
              billItems.map((item, idx) => (
                <div
                  key={item.inventoryItem.barcode}
                  className="p-3 bg-ivory-50 rounded-xl border border-ivory-300 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <span className="font-serif font-bold text-charcoal-900 text-xs">
                        {item.inventoryItem.product?.name}
                      </span>
                      <button
                        onClick={() => removeItem(item.inventoryItem.barcode)}
                        className="text-charcoal-400 hover:text-red-700 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-charcoal-500 font-mono mt-0.5">
                      <span>Tag: <strong className="text-burgundy-900">{item.inventoryItem.barcode}</strong></span>
                      <span>•</span>
                      <span className="text-charcoal-600">{item.inventoryItem.ownership_type === 'designer_consignment' ? 'Consignment' : 'Studio Owned'}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] text-charcoal-500">Piece Discount (₹):</span>
                      <input
                        type="number"
                        value={item.discount || ''}
                        onChange={(e) => updateItemDiscount(item.inventoryItem.barcode, Number(e.target.value))}
                        placeholder="₹0"
                        className="w-20 bg-white border border-ivory-300 rounded px-1.5 py-0.5 text-[11px] font-mono text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                      />
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-serif font-bold text-sm text-burgundy-950 block">
                      {formatINR((item.inventoryItem.product?.price || 0) - item.discount)}
                    </span>
                    {item.discount > 0 && (
                      <span className="text-[10px] text-emerald-700 line-through">
                        {formatINR(item.inventoryItem.product?.price)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals & Bill Calculations */}
          <div className="pt-3 border-t border-ivory-300 space-y-2 text-xs">
            <div className="flex justify-between text-charcoal-600">
              <span>Subtotal ({billItems.length} Pieces):</span>
              <span className="font-mono">{formatINR(subtotal)}</span>
            </div>

            {itemDiscountsTotal > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Item Level Discounts:</span>
                <span className="font-mono">-{formatINR(itemDiscountsTotal)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-charcoal-600">
              <span>Bill Level Discount (₹):</span>
              <input
                type="number"
                value={billDiscount || ''}
                onChange={(e) => setBillDiscount(Number(e.target.value))}
                placeholder="₹0"
                className="w-24 bg-ivory-50 border border-ivory-300 rounded px-2 py-0.5 font-mono text-xs text-right focus:outline-none focus:ring-1 focus:ring-burgundy-800"
              />
            </div>

            <div className="flex justify-between text-charcoal-600">
              <span>Applicable GST (5%):</span>
              <span className="font-mono">{formatINR(taxTotal)}</span>
            </div>

            <div className="flex justify-between text-base font-bold text-burgundy-950 pt-2 border-t border-ivory-300">
              <span>Total Payable:</span>
              <span className="font-serif text-lg">{formatINR(totalPayable)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-ivory-300 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={holdCurrentBill}
                disabled={billItems.length === 0}
                className="py-2 px-3 rounded-lg border border-charcoal-300 hover:bg-ivory-100 text-charcoal-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
              >
                <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
                <span>Hold Bill</span>
              </button>

              <button
                onClick={clearBill}
                disabled={billItems.length === 0}
                className="py-2 px-3 rounded-lg border border-charcoal-300 hover:bg-red-50 text-red-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Void / Clear</span>
              </button>
            </div>

            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={billItems.length === 0}
              className="w-full py-3.5 px-4 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-bold text-xs uppercase tracking-wider shadow-luxury flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <CreditCard className="w-4 h-4 text-gold-400" />
              <span>Tender & Complete POS Sale ({formatINR(totalPayable)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Held Bills Modal */}
      {showHeldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-ivory-300 overflow-hidden">
            <div className="bg-charcoal-900 text-ivory-100 px-6 py-4 flex items-center justify-between">
              <h3 className="font-serif text-base font-bold">Held Bills Queue ({heldBills.length})</h3>
              <button onClick={() => setShowHeldModal(false)} className="p-1 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto text-xs">
              {heldBills.length === 0 ? (
                <p className="text-charcoal-400 italic text-center py-4">No held bills in queue.</p>
              ) : (
                heldBills.map((h) => (
                  <div key={h.id} className="p-3 bg-ivory-50 rounded-xl border border-ivory-300 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-charcoal-900">{h.customerName}</p>
                      <span className="text-[10px] text-charcoal-500">{h.timestamp} • {h.items.length} Saree pieces</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-burgundy-950">{formatINR(h.total)}</span>
                      <button
                        onClick={() => {
                          resumeBill(h.id);
                          setShowHeldModal(false);
                        }}
                        className="px-3 py-1 rounded-lg bg-burgundy-900 text-gold-300 font-semibold hover:bg-burgundy-950 transition"
                      >
                        Resume
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Shift Management Modal */}
      <ShiftModal
        isOpen={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        shift={activeShift}
        onShiftUpdated={refreshShift}
        cashierId={user.id}
        locationId="loc-mum-01"
      />

      {/* Split Payment Modal */}
      <SplitPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        totalPayable={totalPayable}
        onFinalize={handleFinalizeSale}
      />

      {/* POS Returns Modal */}
      <PosReturnsModal
        isOpen={showReturnsModal}
        onClose={() => setShowReturnsModal(false)}
        cashierId={user.id}
      />

      {/* Thermal Receipt Print Modal */}
      <ThermalReceiptModal
        sale={lastCompletedSale}
        onClose={() => setLastCompletedSale(null)}
      />

      {/* A4 Tax Invoice Modal */}
      <InvoiceModal
        sale={showInvoiceModal ? lastCompletedSale : null}
        onClose={() => setShowInvoiceModal(false)}
      />
    </div>
  );
};
