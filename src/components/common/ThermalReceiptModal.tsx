import React from 'react';
import { Sale } from '../../types/database';
import { formatINR, formatDateTime } from '../../lib/utils';
import { X, Printer, CheckCircle } from 'lucide-react';

interface ThermalReceiptModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({ sale, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full border border-ivory-300 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header (No print) */}
        <div className="bg-charcoal-900 text-ivory-100 px-4 py-3 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="font-semibold text-sm">POS Transaction Finalized</span>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 80mm Thermal Receipt Content */}
        <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-white text-charcoal-950 thermal-receipt">
          <div className="text-center pb-3 border-b border-dashed border-charcoal-400">
            <h2 className="font-brand text-sm font-bold tracking-widest uppercase">
              BOMBAY SAREE
            </h2>
            <p className="text-[10px] text-charcoal-600">Omnichannel Studio & Atelier</p>
            <p className="text-[10px] mt-1">Heritage Mansion, Kala Ghoda, Mumbai 400001</p>
            <p className="text-[10px]">Ph: +91 22 2284 5600 | studio@bombaysaree.com</p>
            <p className="text-[10px] font-semibold mt-1">GSTIN: 27AABCB9821M1ZX</p>
          </div>

          <div className="py-2 border-b border-dashed border-charcoal-400 text-[11px] space-y-0.5">
            <div className="flex justify-between">
              <span>Invoice:</span>
              <span className="font-bold">{sale.sale_number}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{formatDateTime(sale.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span>Customer:</span>
              <span className="font-medium">{sale.customer_name || 'Walk-in Guest'}</span>
            </div>
            {sale.customer_phone && (
              <div className="flex justify-between">
                <span>Phone:</span>
                <span>{sale.customer_phone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Sales Channel:</span>
              <span className="uppercase font-semibold">{sale.channel} Storefront</span>
            </div>
          </div>

          {/* Itemized List */}
          <div className="py-2 border-b border-dashed border-charcoal-400">
            <div className="flex justify-between font-bold text-[11px] mb-1 pb-1 border-b border-charcoal-200">
              <span className="w-2/3">Item / Barcode</span>
              <span className="w-1/3 text-right">Amount (₹)</span>
            </div>

            {sale.items?.map((item, idx) => (
              <div key={idx} className="mb-2">
                <div className="font-medium text-[11px] leading-snug">{item.product_name_snapshot}</div>
                <div className="flex justify-between text-[10px] text-charcoal-600">
                  <span>Tag: {item.barcode_snapshot}</span>
                  <span>{formatINR(item.unit_price_ex_tax)}</span>
                </div>
                {item.allocated_discount_ex_tax > 0 && (
                  <div className="flex justify-between text-[10px] text-emerald-700">
                    <span>Discount:</span>
                    <span>-{formatINR(item.allocated_discount_ex_tax)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-2 border-b border-dashed border-charcoal-400 space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatINR(sale.subtotal_ex_tax)}</span>
            </div>
            {sale.discount_ex_tax > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Bill Discount:</span>
                <span>-{formatINR(sale.discount_ex_tax)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>GST Total (5%):</span>
              <span>{formatINR(sale.tax_total)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold pt-1 border-t border-charcoal-300">
              <span>NET PAYABLE:</span>
              <span>{formatINR(sale.total_payable)}</span>
            </div>
          </div>

          {/* Payments */}
          <div className="py-2 border-b border-dashed border-charcoal-400 text-[10px] space-y-0.5">
            <span className="font-bold block uppercase">Payment Method(s):</span>
            {sale.payments?.map((p, i) => (
              <div key={i} className="flex justify-between">
                <span className="uppercase">{p.payment_method} ({p.provider_reference || 'CONFIRMED'})</span>
                <span>{formatINR(p.amount)}</span>
              </div>
            ))}
          </div>

          {/* Footer note */}
          <div className="pt-3 text-center text-[10px] text-charcoal-600 space-y-1">
            <p className="font-semibold">Thank you for visiting Bombay Saree.</p>
            <p>Exchange eligible within 7 days with intact barcode seal and original tax bill.</p>
            <p className="font-bold text-[9px] pt-1">*** RETAIL COPY ***</p>
          </div>
        </div>

        {/* Modal Actions (No print) */}
        <div className="bg-ivory-100 p-3 border-t border-ivory-300 flex items-center justify-between no-print">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-charcoal-600 hover:text-charcoal-900 font-medium"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 text-xs font-semibold shadow-sm transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print 80mm Receipt
          </button>
        </div>
      </div>
    </div>
  );
};
