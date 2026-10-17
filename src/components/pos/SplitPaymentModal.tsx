import React, { useState } from 'react';
import { formatINR } from '../../lib/utils';
import { X, CreditCard, Banknote, QrCode, CheckCircle2, ArrowRight } from 'lucide-react';

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalPayable: number;
  onFinalize: (payments: { provider: string; provider_reference?: string; amount: number; payment_method: string }[]) => void;
}

export const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  isOpen,
  onClose,
  totalPayable,
  onFinalize,
}) => {
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [upiAmount, setUpiAmount] = useState<number>(0);
  const [upiRef, setUpiRef] = useState<string>('');
  const [cardAmount, setCardAmount] = useState<number>(0);
  const [cardRef, setCardRef] = useState<string>('');

  if (!isOpen) return null;

  const totalAllocated = cashAmount + upiAmount + cardAmount;
  const remaining = totalPayable - totalAllocated;
  const cashChangeDue = Math.max(0, cashTendered - cashAmount);

  const handleQuickSingle = (method: 'cash' | 'upi' | 'card') => {
    if (method === 'cash') {
      setCashAmount(totalPayable);
      setCashTendered(totalPayable);
      setUpiAmount(0);
      setCardAmount(0);
    } else if (method === 'upi') {
      setUpiAmount(totalPayable);
      setCashAmount(0);
      setCardAmount(0);
    } else {
      setCardAmount(totalPayable);
      setCashAmount(0);
      setUpiAmount(0);
    }
  };

  const handleSubmit = () => {
    if (remaining > 0) {
      alert(`Payment deficit of ${formatINR(remaining)}. Please allocate full amount.`);
      return;
    }

    const payments: { provider: string; provider_reference?: string; amount: number; payment_method: string }[] = [];

    if (cashAmount > 0) {
      payments.push({
        provider: 'store_till',
        provider_reference: `CASH-TILL-${Date.now().toString().slice(-4)}`,
        amount: cashAmount,
        payment_method: 'cash',
      });
    }

    if (upiAmount > 0) {
      payments.push({
        provider: 'upi_terminal',
        provider_reference: upiRef || `UPI-${Date.now().toString().slice(-6)}`,
        amount: upiAmount,
        payment_method: 'upi',
      });
    }

    if (cardAmount > 0) {
      payments.push({
        provider: 'edc_pos_pinelabs',
        provider_reference: cardRef || `EDC-${Date.now().toString().slice(-6)}`,
        amount: cardAmount,
        payment_method: 'card',
      });
    }

    onFinalize(payments);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-ivory-300 overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="bg-burgundy-950 text-ivory-100 px-6 py-4 flex items-center justify-between border-b border-gold-600/30">
          <div>
            <h3 className="font-serif text-lg font-bold tracking-wide">POS Tender & Split Settlement</h3>
            <span className="text-[11px] text-gold-300 font-mono">Invoice Payable: {formatINR(totalPayable)}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-charcoal-800">
          {/* Quick full pay buttons */}
          <div>
            <span className="text-charcoal-500 font-semibold uppercase tracking-wider block mb-2 text-[10px]">
              Quick Full Payment (1-Click)
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSingle('cash')}
                className="py-2.5 px-3 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Banknote className="w-4 h-4" />
                <span>100% Cash</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSingle('upi')}
                className="py-2.5 px-3 rounded-lg border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold flex items-center justify-center gap-1.5 transition"
              >
                <QrCode className="w-4 h-4" />
                <span>100% UPI</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSingle('card')}
                className="py-2.5 px-3 rounded-lg border border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold flex items-center justify-center gap-1.5 transition"
              >
                <CreditCard className="w-4 h-4" />
                <span>100% Card</span>
              </button>
            </div>
          </div>

          {/* Custom Split Fields */}
          <div className="space-y-3 pt-3 border-t border-ivory-300">
            {/* Cash */}
            <div className="p-3 bg-ivory-50 rounded-xl border border-ivory-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-charcoal-900">
                  <Banknote className="w-4 h-4 text-emerald-700" /> Cash Payment
                </span>
                <span className="text-charcoal-500 text-[11px]">Tendered: {formatINR(cashTendered)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-charcoal-500 block mb-0.5">Amount to apply (₹)</label>
                  <input
                    type="number"
                    value={cashAmount || ''}
                    onChange={(e) => setCashAmount(Number(e.target.value))}
                    placeholder="₹0"
                    className="w-full bg-white border border-ivory-300 rounded p-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-charcoal-500 block mb-0.5">Cash Handed / Tendered (₹)</label>
                  <input
                    type="number"
                    value={cashTendered || ''}
                    onChange={(e) => setCashTendered(Number(e.target.value))}
                    placeholder="₹0"
                    className="w-full bg-white border border-ivory-300 rounded p-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                  />
                </div>
              </div>
              {cashTendered > cashAmount && (
                <div className="text-[11px] font-semibold text-emerald-800 flex justify-between bg-emerald-100/70 p-1.5 rounded">
                  <span>Change Due to Client:</span>
                  <span className="font-mono font-bold">{formatINR(cashChangeDue)}</span>
                </div>
              )}
            </div>

            {/* UPI */}
            <div className="p-3 bg-ivory-50 rounded-xl border border-ivory-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-charcoal-900">
                  <QrCode className="w-4 h-4 text-blue-700" /> UPI Dynamic QR
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-charcoal-500 block mb-0.5">UPI Amount (₹)</label>
                  <input
                    type="number"
                    value={upiAmount || ''}
                    onChange={(e) => setUpiAmount(Number(e.target.value))}
                    placeholder="₹0"
                    className="w-full bg-white border border-ivory-300 rounded p-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-charcoal-500 block mb-0.5">UPI UTR / Reference No</label>
                  <input
                    type="text"
                    value={upiRef}
                    onChange={(e) => setUpiRef(e.target.value)}
                    placeholder="UTR 12-digits..."
                    className="w-full bg-white border border-ivory-300 rounded p-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                  />
                </div>
              </div>
            </div>

            {/* Card */}
            <div className="p-3 bg-ivory-50 rounded-xl border border-ivory-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5 text-charcoal-900">
                  <CreditCard className="w-4 h-4 text-purple-700" /> Credit / Debit Card (EDC Pinelabs)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-charcoal-500 block mb-0.5">Card Amount (₹)</label>
                  <input
                    type="number"
                    value={cardAmount || ''}
                    onChange={(e) => setCardAmount(Number(e.target.value))}
                    placeholder="₹0"
                    className="w-full bg-white border border-ivory-300 rounded p-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-charcoal-500 block mb-0.5">Approval Code / Auth ID</label>
                  <input
                    type="text"
                    value={cardRef}
                    onChange={(e) => setCardRef(e.target.value)}
                    placeholder="Auth code..."
                    className="w-full bg-white border border-ivory-300 rounded p-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Allocation Balance Tracker */}
          <div className="p-3 bg-ivory-100 rounded-xl border border-ivory-300 flex justify-between items-center text-xs">
            <div>
              <span className="text-charcoal-500 block">Total Tender Allocated</span>
              <span className="font-mono font-bold text-sm text-charcoal-900">{formatINR(totalAllocated)}</span>
            </div>
            <div className="text-right">
              <span className="text-charcoal-500 block">Balance Remaining</span>
              <span
                className={`font-mono font-bold text-sm ${
                  remaining === 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                {remaining === 0 ? 'Matched (₹0.00)' : formatINR(remaining)}
              </span>
            </div>
          </div>

          {/* Finalize Button */}
          <button
            onClick={handleSubmit}
            disabled={remaining > 0}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-luxury ${
              remaining === 0
                ? 'bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 cursor-pointer'
                : 'bg-charcoal-200 text-charcoal-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-gold-400" />
            <span>Finalize Bill & Deduct Stock Atomically</span>
          </button>
        </div>
      </div>
    </div>
  );
};
