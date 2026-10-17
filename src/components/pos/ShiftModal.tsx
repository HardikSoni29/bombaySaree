import React, { useState } from 'react';
import { CashierShift } from '../../types/database';
import { BombayDataStore } from '../../lib/storage';
import { formatINR } from '../../lib/utils';
import { X, Clock, Banknote, ShieldAlert, CheckCircle, Calculator } from 'lucide-react';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: CashierShift | undefined;
  onShiftUpdated: () => void;
  cashierId: string;
  locationId: string;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  shift,
  onShiftUpdated,
  cashierId,
  locationId,
}) => {
  const [openingCashInput, setOpeningCashInput] = useState<number>(10000);
  const [closingCashInput, setClosingCashInput] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  if (!isOpen) return null;

  const isOpenShift = shift && shift.status === 'open';
  const expectedCash = shift ? shift.opening_cash + shift.total_sales_cash : 0;
  const discrepancy = closingCashInput - expectedCash;

  const handleOpenShift = () => {
    BombayDataStore.openShift(cashierId, locationId, openingCashInput, notes);
    onShiftUpdated();
    onClose();
  };

  const handleCloseShift = () => {
    if (!shift) return;
    if (window.confirm(`Confirm closing shift? Cash discrepancy is ${formatINR(discrepancy)}.`)) {
      BombayDataStore.closeShift(shift.id, closingCashInput, notes);
      onShiftUpdated();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-ivory-300 overflow-hidden">
        {/* Header */}
        <div className="bg-charcoal-900 text-ivory-100 px-6 py-4 flex items-center justify-between border-b border-charcoal-800">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold-400" />
            <h3 className="font-serif text-base font-bold tracking-wide">
              {isOpenShift ? 'Active Cashier Shift & Register Summary' : 'Open New Cashier Shift'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white rounded transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-charcoal-800">
          {isOpenShift ? (
            <div className="space-y-4">
              <div className="p-3 bg-ivory-100 rounded-xl border border-ivory-300 space-y-2">
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Cashier:</span>
                  <span className="font-bold">{shift.cashier_name || 'Staff Stylist'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Opened At:</span>
                  <span>{new Date(shift.opened_at).toLocaleTimeString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Opening Float Cash:</span>
                  <span className="font-mono font-bold">{formatINR(shift.opening_cash)}</span>
                </div>
              </div>

              {/* Shift Breakdown */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200">
                  <span className="text-[10px] uppercase font-semibold text-emerald-800 block">Cash Sales</span>
                  <span className="font-mono font-bold text-sm text-emerald-950 mt-1 block">
                    {formatINR(shift.total_sales_cash)}
                  </span>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200">
                  <span className="text-[10px] uppercase font-semibold text-blue-800 block">UPI Sales</span>
                  <span className="font-mono font-bold text-sm text-blue-950 mt-1 block">
                    {formatINR(shift.total_sales_upi)}
                  </span>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200">
                  <span className="text-[10px] uppercase font-semibold text-purple-800 block">Card Sales</span>
                  <span className="font-mono font-bold text-sm text-purple-950 mt-1 block">
                    {formatINR(shift.total_sales_card)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-gold-50/80 rounded-xl border border-gold-200 flex justify-between items-center">
                <div>
                  <span className="text-charcoal-600 block font-semibold">Total Register Sales</span>
                  <span className="text-[10px] text-charcoal-500">{shift.total_bills_generated} Bills Finalized</span>
                </div>
                <span className="font-serif font-bold text-base text-burgundy-950">
                  {formatINR(shift.total_sales_cash + shift.total_sales_upi + shift.total_sales_card)}
                </span>
              </div>

              {/* Shift Closing Cash Counter */}
              <div className="pt-2 border-t border-ivory-300 space-y-2">
                <label className="font-semibold text-charcoal-700 block">
                  Close Shift: Count Actual Cash in Drawer (₹)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={closingCashInput || ''}
                    onChange={(e) => setClosingCashInput(Number(e.target.value))}
                    placeholder={`Expected: ₹${expectedCash}`}
                    className="flex-1 bg-ivory-50 border border-ivory-300 rounded-lg p-2 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                  />
                  <button
                    onClick={() => setClosingCashInput(expectedCash)}
                    className="px-3 py-1.5 rounded-lg bg-ivory-200 hover:bg-ivory-300 text-charcoal-700 font-medium"
                    title="Match Expected"
                  >
                    Auto-Fill
                  </button>
                </div>

                {closingCashInput > 0 && (
                  <div
                    className={`p-2 rounded-lg text-xs flex justify-between font-medium ${
                      discrepancy === 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : discrepancy > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <span>Register Variance / Discrepancy:</span>
                    <span className="font-mono font-bold">
                      {discrepancy > 0 ? `+${formatINR(discrepancy)} (Excess)` : discrepancy < 0 ? `${formatINR(discrepancy)} (Shortage)` : 'Exact (Zero Variance)'}
                    </span>
                  </div>
                )}

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Closing notes / handover comments..."
                  className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2 text-xs h-16 focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                />
              </div>

              <button
                onClick={handleCloseShift}
                className="w-full py-2.5 rounded-xl bg-red-700 hover:bg-red-800 text-white font-semibold text-xs tracking-wider uppercase transition shadow-sm"
              >
                Reconcile & Close Shift
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="font-semibold text-charcoal-700 block mb-1">
                  Opening Cash Float in Till (₹)
                </label>
                <input
                  type="number"
                  value={openingCashInput}
                  onChange={(e) => setOpeningCashInput(Number(e.target.value))}
                  className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2.5 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal-700 block mb-1">Shift Notes / Register ID</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Morning shift opening notes..."
                  className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2.5 text-xs h-20 focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                />
              </div>

              <button
                onClick={handleOpenShift}
                className="w-full py-3 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-semibold text-xs tracking-wider uppercase transition shadow-luxury"
              >
                Start Shift & Initialize Till
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
