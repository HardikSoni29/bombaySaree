import React from 'react';
import { Sale } from '../../types/database';
import { formatINR, formatDateTime, formatDate } from '../../lib/utils';
import { X, Printer, Download, ShieldCheck } from 'lucide-react';

interface InvoiceModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, onClose }) => {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const halfTax = Math.round(sale.tax_total / 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-ivory-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Topbar (No print) */}
        <div className="bg-burgundy-900 text-ivory-100 px-6 py-3.5 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gold-400" />
            <h3 className="font-serif text-lg font-semibold tracking-wide">Official GST Tax Invoice</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-burgundy-800 hover:bg-burgundy-700 text-gold-300 text-xs font-medium border border-gold-500/30 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button onClick={onClose} className="p-1 hover:text-white rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Body (A4 printable) */}
        <div className="p-8 overflow-y-auto flex-1 text-charcoal-900 bg-white invoice-a4">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-burgundy-900 pb-6 mb-6">
            <div>
              <h1 className="font-brand text-2xl font-bold tracking-widest text-burgundy-950 uppercase">
                BOMBAY SAREE
              </h1>
              <p className="text-xs text-charcoal-500 tracking-wider uppercase font-semibold">
                Omnichannel Studio & Multi-Designer Marketplace
              </p>
              <div className="text-xs text-charcoal-600 mt-2 space-y-0.5">
                <p>Heritage Mansion, V.B. Gandhi Marg, Kala Ghoda, Fort</p>
                <p>Mumbai, Maharashtra — 400001, India</p>
                <p>GSTIN: <span className="font-mono font-semibold text-charcoal-900">27AABCB9821M1ZX</span> | PAN: AABCB9821M</p>
                <p>Email: accounts@bombaysaree.com | Ph: +91 22 2284 5600</p>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-burgundy-100 text-burgundy-900 font-bold text-xs uppercase tracking-wider rounded border border-burgundy-200">
                TAX INVOICE
              </span>
              <div className="mt-3 text-xs space-y-1">
                <div>
                  <span className="text-charcoal-500">Invoice No:</span>{' '}
                  <span className="font-mono font-bold text-charcoal-900 text-sm">{sale.sale_number}</span>
                </div>
                <div>
                  <span className="text-charcoal-500">Invoice Date:</span>{' '}
                  <span className="font-medium">{formatDate(sale.created_at)}</span>
                </div>
                <div>
                  <span className="text-charcoal-500">Channel:</span>{' '}
                  <span className="font-semibold uppercase text-burgundy-800">{sale.channel} Store</span>
                </div>
                <div>
                  <span className="text-charcoal-500">Payment Status:</span>{' '}
                  <span className="font-bold text-emerald-700 uppercase">Paid & Verified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Billing & Shipping Details */}
          <div className="grid grid-cols-2 gap-8 mb-6 pb-6 border-b border-ivory-300 text-xs">
            <div>
              <span className="font-bold uppercase tracking-wider text-charcoal-400 block mb-1">
                Billed To (Customer):
              </span>
              <p className="font-serif text-sm font-bold text-charcoal-900">{sale.customer_name || 'Walk-in Client'}</p>
              {sale.customer_phone && <p className="text-charcoal-600 mt-0.5">Phone: {sale.customer_phone}</p>}
              {sale.customer_email && <p className="text-charcoal-600">Email: {sale.customer_email}</p>}
              {sale.billing_address && (
                <div className="text-charcoal-600 mt-1">
                  <p>{sale.billing_address.street_address}</p>
                  <p>{sale.billing_address.city}, {sale.billing_address.state} — {sale.billing_address.postal_code}</p>
                </div>
              )}
            </div>

            <div>
              <span className="font-bold uppercase tracking-wider text-charcoal-400 block mb-1">
                Place of Supply:
              </span>
              <p className="font-medium text-charcoal-800">Maharashtra (State Code: 27)</p>
              <p className="text-charcoal-500 mt-1">
                Fulfilled from: {sale.channel === 'pos' ? 'Kala Ghoda Studio' : 'Central Fulfillment Hub, Lower Parel'}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-ivory-100 text-charcoal-700 font-semibold border-y border-ivory-300 uppercase text-[11px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Description & Physical Barcode</th>
                  <th className="py-2.5 px-3">HSN Code</th>
                  <th className="py-2.5 px-3 text-right">Unit Price</th>
                  <th className="py-2.5 px-3 text-right">Discount</th>
                  <th className="py-2.5 px-3 text-right">Taxable Val</th>
                  <th className="py-2.5 px-3 text-right">GST (5%)</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ivory-200">
                {sale.items?.map((item, index) => {
                  const finalExTax = item.unit_price_ex_tax - item.allocated_discount_ex_tax;
                  const itemTotal = finalExTax + item.tax_amount;
                  return (
                    <tr key={item.id} className="hover:bg-ivory-50/50">
                      <td className="py-3 px-3 text-charcoal-400 font-mono">{index + 1}</td>
                      <td className="py-3 px-3">
                        <div className="font-serif font-bold text-charcoal-900">{item.product_name_snapshot}</div>
                        <div className="text-[10px] text-charcoal-500 font-mono flex items-center gap-2 mt-0.5">
                          <span>Piece Barcode: <strong className="text-burgundy-900">{item.barcode_snapshot}</strong></span>
                          <span>•</span>
                          <span>SKU: {item.sku_snapshot}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-charcoal-600">5007</td>
                      <td className="py-3 px-3 text-right">{formatINR(item.unit_price_ex_tax)}</td>
                      <td className="py-3 px-3 text-right text-emerald-700">
                        {item.allocated_discount_ex_tax > 0 ? `-${formatINR(item.allocated_discount_ex_tax)}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-medium">{formatINR(finalExTax)}</td>
                      <td className="py-3 px-3 text-right text-charcoal-600">{formatINR(item.tax_amount)}</td>
                      <td className="py-3 px-3 text-right font-bold text-burgundy-950">{formatINR(itemTotal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Grand Total */}
          <div className="flex justify-between items-start pt-4 border-t-2 border-charcoal-200">
            <div className="w-1/2 text-xs space-y-2">
              <div className="p-3 bg-ivory-100 rounded-lg border border-ivory-300">
                <span className="font-bold text-charcoal-800 uppercase block mb-1">GST Breakdown (Intra-State):</span>
                <div className="flex justify-between text-charcoal-600">
                  <span>CGST @ 2.5%:</span>
                  <span className="font-mono font-medium">{formatINR(halfTax)}</span>
                </div>
                <div className="flex justify-between text-charcoal-600">
                  <span>SGST @ 2.5%:</span>
                  <span className="font-mono font-medium">{formatINR(sale.tax_total - halfTax)}</span>
                </div>
              </div>

              <div className="text-[11px] text-charcoal-500 italic">
                * Sarees are certified Handloom Silk Mark. Return policy: 7 days with intact security tag and original invoice.
              </div>
            </div>

            <div className="w-2/5 text-xs space-y-1.5">
              <div className="flex justify-between text-charcoal-600">
                <span>Subtotal (Excl. Tax):</span>
                <span className="font-mono">{formatINR(sale.subtotal_ex_tax)}</span>
              </div>
              {sale.discount_ex_tax > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Total Discount:</span>
                  <span className="font-mono">-{formatINR(sale.discount_ex_tax)}</span>
                </div>
              )}
              <div className="flex justify-between text-charcoal-600">
                <span>Total Tax (GST 5%):</span>
                <span className="font-mono">{formatINR(sale.tax_total)}</span>
              </div>
              <div className="flex justify-between text-charcoal-600">
                <span>Insured Studio Shipping:</span>
                <span className="font-mono text-emerald-700 font-semibold">FREE</span>
              </div>
              <div className="flex justify-between text-base font-bold text-burgundy-950 pt-2 border-t border-charcoal-300">
                <span>Grand Total:</span>
                <span className="font-serif font-bold text-lg">{formatINR(sale.total_payable)}</span>
              </div>
            </div>
          </div>

          {/* Signature & Seal */}
          <div className="mt-12 pt-6 border-t border-ivory-300 flex justify-between items-end text-xs text-charcoal-500">
            <div>
              <p className="font-medium text-charcoal-700">Bombay Saree Retail Private Limited</p>
              <p className="text-[10px]">Computer generated invoice. No physical signature required under IT Act 2000.</p>
            </div>
            <div className="text-center">
              <div className="w-32 h-12 border-b border-charcoal-400 mx-auto mb-1"></div>
              <span className="text-[10px] uppercase font-semibold">Authorised Signatory</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
