import React, { useState } from 'react';
import { Sale, StockCondition, SaleItem } from '../../types/database';
import { BombayDataStore } from '../../lib/storage';
import { formatINR, formatDateTime } from '../../lib/utils';
import { X, RotateCcw, Search, ShieldAlert, CheckCircle2, AlertCircle } from 'lucide-react';

interface PosReturnsModalProps {
  isOpen: boolean;
  onClose: () => void;
  cashierId: string;
}

export const PosReturnsModal: React.FC<PosReturnsModalProps> = ({ isOpen, onClose, cashierId }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [foundSale, setFoundSale] = useState<Sale | null>(null);
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);
  const [condition, setCondition] = useState<StockCondition>('sellable');
  const [reason, setReason] = useState<string>('Customer color preference exchange');
  const [returnSuccess, setReturnSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setReturnSuccess(null);
    const clean = searchTerm.trim().toUpperCase();
    if (!clean) return;

    const sales = BombayDataStore.getSales();
    const match = sales.find(
      (s) =>
        s.sale_number.toUpperCase() === clean ||
        s.items?.some((i) => i.barcode_snapshot.toUpperCase() === clean)
    );

    if (match) {
      setFoundSale(match);
      setSelectedItem(match.items?.[0] || null);
    } else {
      alert(`No sale record found matching invoice or barcode [${clean}]`);
    }
  };

  const handleProcessReturn = () => {
    if (!foundSale || !selectedItem) return;

    const refundAmount = selectedItem.final_price_ex_tax + selectedItem.tax_amount;

    try {
      const ret = BombayDataStore.processReturn({
        saleId: foundSale.id,
        saleItemId: selectedItem.id,
        inventoryItemId: selectedItem.inventory_item_id,
        condition,
        reason,
        refundAmount,
        actorId: cashierId,
      });

      setReturnSuccess(
        `Return ${ret.return_number} processed successfully! Refund of ${formatINR(refundAmount)} authorized. Saree condition: [${condition}].`
      );
      setFoundSale(null);
      setSelectedItem(null);
    } catch (err: any) {
      alert(err.message || 'Return failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-ivory-300 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-charcoal-900 text-ivory-100 px-6 py-4 flex items-center justify-between border-b border-charcoal-800">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-5 h-5 text-gold-400" />
            <h3 className="font-serif text-base font-bold tracking-wide">
              Store POS Returns & Exchange Authorization
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-6 space-y-5 text-xs">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Scan piece barcode or enter invoice no (e.g. POS-20261017-0012)..."
                className="w-full bg-ivory-50 border border-ivory-300 rounded-lg py-2 pl-9 pr-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-burgundy-800 text-charcoal-900"
              />
              <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-burgundy-900 text-gold-300 font-semibold hover:bg-burgundy-950 transition"
            >
              Verify Invoice
            </button>
          </form>

          {returnSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-900 flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{returnSuccess}</span>
            </div>
          )}

          {foundSale && (
            <div className="space-y-4 pt-2 border-t border-ivory-300">
              <div className="p-3 bg-ivory-100 rounded-xl border border-ivory-300 flex justify-between items-start">
                <div>
                  <span className="font-mono font-bold text-charcoal-900 text-sm">{foundSale.sale_number}</span>
                  <p className="text-charcoal-600 mt-0.5">Date: {formatDateTime(foundSale.created_at)}</p>
                  <p className="text-charcoal-600">Client: {foundSale.customer_name || 'Walk-in Client'}</p>
                </div>
                <div className="text-right font-serif font-bold text-sm text-burgundy-950">
                  {formatINR(foundSale.total_payable)}
                </div>
              </div>

              {/* Items on this invoice */}
              <div className="space-y-2">
                <span className="font-semibold text-charcoal-700 block">Select Item to Return / Exchange:</span>
                {foundSale.items?.map((item) => (
                  <label
                    key={item.id}
                    className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                      selectedItem?.id === item.id
                        ? 'border-burgundy-900 bg-burgundy-50/70'
                        : 'border-ivory-300 hover:bg-ivory-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="returnItem"
                        checked={selectedItem?.id === item.id}
                        onChange={() => setSelectedItem(item)}
                        className="text-burgundy-900 focus:ring-burgundy-900"
                      />
                      <div>
                        <p className="font-serif font-bold text-charcoal-900">{item.product_name_snapshot}</p>
                        <span className="text-[10px] text-charcoal-500 font-mono">
                          Tag: {item.barcode_snapshot} ({item.ownership_snapshot})
                        </span>
                      </div>
                    </div>
                    <span className="font-serif font-bold text-sm">
                      {formatINR(item.final_price_ex_tax + item.tax_amount)}
                    </span>
                  </label>
                ))}
              </div>

              {/* Physical Condition Inspection */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="font-semibold text-charcoal-700 block mb-1">
                    Inspected Stock Condition
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as StockCondition)}
                    className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2 font-medium focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                  >
                    <option value="sellable">Sellable (Restore to Shelf Stock)</option>
                    <option value="inspection">Inspection Required (Hold)</option>
                    <option value="damaged">Damaged / Defect Found (Held)</option>
                    <option value="unsellable">Unsellable / Write-off</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-charcoal-700 block mb-1">Reason for Return</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2 font-medium focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                  >
                    <option value="Customer color preference exchange">Color / Drape Preference</option>
                    <option value="Fabric or zari defect discovered">Fabric / Zari Defect</option>
                    <option value="Occasion cancelled">Occasion Postponed</option>
                    <option value="Staff mis-scan correction">Cashier Correction</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Settlement Impact:</span>
                </div>
                <p>
                  • If marked <strong className="text-emerald-800">Sellable</strong>, physical piece is restored to available store inventory immediately.
                </p>
                <p>
                  • If marked <strong className="text-red-800">Damaged</strong>, stock is isolated in held status.
                </p>
                <p>• The associated designer ledger entry is reversed atomically.</p>
              </div>

              <button
                onClick={handleProcessReturn}
                className="w-full py-3 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-bold uppercase tracking-wider text-xs transition shadow-luxury flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-gold-400" />
                <span>Authorize Return & Issue Refund ({formatINR(selectedItem ? selectedItem.final_price_ex_tax + selectedItem.tax_amount : 0)})</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
