import React, { useState } from 'react';
import { Sale } from '../../types/database';
import { formatINR, formatDateTime } from '../../lib/utils';
import { BombayDataStore } from '../../lib/storage';
import { X, PackageCheck, Truck, CheckCircle2, Clock, FileText, ArrowRight, RotateCcw } from 'lucide-react';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  onViewInvoice: (sale: Sale) => void;
  onRequestReturn: (sale: Sale, itemId: string) => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  customerId,
  onViewInvoice,
  onRequestReturn,
}) => {
  const [sales, setSales] = useState<Sale[]>(() =>
    BombayDataStore.getSales().filter((s) => s.customer_id === customerId || s.channel === 'online')
  );

  const [selectedSale, setSelectedSale] = useState<Sale | null>(sales[0] || null);

  if (!isOpen) return null;

  const steps = [
    { label: 'Payment Confirmed', desc: 'Verified server-side' },
    { label: 'Master Inspection', desc: 'Zari & fabric quality check' },
    { label: 'Muslin Packaging', desc: 'Folded in archival muslin' },
    { label: 'Dispatched via VIP Courier', desc: 'Insured transit' },
    { label: 'Delivered', desc: 'Handed over' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-ivory-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Topbar */}
        <div className="bg-burgundy-950 text-ivory-50 px-6 py-4 flex items-center justify-between border-b border-gold-600/30">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-gold-400" />
            <h3 className="font-serif text-lg font-bold tracking-wide">Customer Order & Delivery Tracking</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:text-white rounded transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
          {/* Order Selector List */}
          <div className="md:w-1/3 space-y-3 border-b md:border-b-0 md:border-r border-ivory-300 pb-4 md:pb-0 md:pr-4">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block">
              Recent Orders ({sales.length})
            </span>

            {sales.length === 0 ? (
              <p className="text-xs text-charcoal-400 italic">No previous orders found.</p>
            ) : (
              sales.map((sale) => (
                <div
                  key={sale.id}
                  onClick={() => setSelectedSale(sale)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition ${
                    selectedSale?.id === sale.id
                      ? 'border-burgundy-900 bg-burgundy-50 shadow-sm'
                      : 'border-ivory-300 hover:border-ivory-400 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-xs font-bold text-charcoal-900">{sale.sale_number}</span>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {sale.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-baseline mt-2 text-xs">
                    <span className="text-charcoal-500">{sale.items?.length || 1} Piece(s)</span>
                    <span className="font-serif font-bold text-burgundy-950">{formatINR(sale.total_payable)}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Order Details & Lifecycle Timeline */}
          {selectedSale ? (
            <div className="md:w-2/3 space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-ivory-300">
                <div>
                  <span className="text-xs text-charcoal-500 block">Order Number</span>
                  <span className="font-mono font-bold text-base text-burgundy-900">{selectedSale.sale_number}</span>
                  <span className="text-[11px] text-charcoal-400 block mt-0.5">
                    Placed: {formatDateTime(selectedSale.created_at)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => onViewInvoice(selectedSale)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ivory-100 hover:bg-ivory-200 text-charcoal-800 border border-ivory-300 text-xs font-medium transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-burgundy-800" />
                    <span>View Tax Invoice</span>
                  </button>
                </div>
              </div>

              {/* Lifecycle Progress Bar */}
              <div>
                <h4 className="font-serif text-sm font-bold text-charcoal-900 mb-4">Fulfillment Journey</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 relative">
                  {steps.map((step, idx) => {
                    const isDone = selectedSale.status === 'delivered' ? true : idx <= 2;
                    return (
                      <div key={idx} className="flex flex-col items-center text-center p-2 rounded-lg bg-ivory-50 border border-ivory-200">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center mb-1 text-xs font-bold ${
                            isDone ? 'bg-emerald-600 text-white' : 'bg-charcoal-200 text-charcoal-500'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span className="font-bold text-[11px] text-charcoal-900 leading-tight">{step.label}</span>
                        <span className="text-[9px] text-charcoal-500 mt-0.5 leading-tight">{step.desc}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Items on this Order with Unique Barcode Verification */}
              <div className="space-y-3">
                <h4 className="font-serif text-sm font-bold text-charcoal-900">
                  Physical Sarees in this Order ({selectedSale.items?.length})
                </h4>

                <div className="space-y-2">
                  {selectedSale.items?.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-ivory-50 rounded-xl border border-ivory-300 flex items-center justify-between gap-4"
                    >
                      <div className="space-y-0.5">
                        <p className="font-serif text-sm font-bold text-charcoal-900">{item.product_name_snapshot}</p>
                        <div className="text-[11px] text-charcoal-500 font-mono flex items-center gap-2">
                          <span>Physical Piece Barcode: <strong className="text-burgundy-900">{item.barcode_snapshot}</strong></span>
                          <span>•</span>
                          <span>SKU: {item.sku_snapshot}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-serif font-bold text-sm text-burgundy-950 block">
                          {formatINR(item.unit_price_ex_tax - item.allocated_discount_ex_tax)}
                        </span>
                        {/* 7-day return request */}
                        <button
                          onClick={() => onRequestReturn(selectedSale, item.id)}
                          className="mt-1 flex items-center gap-1 text-[11px] text-charcoal-500 hover:text-burgundy-900 hover:underline"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Request Return/Exchange</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Summary */}
              <div className="bg-ivory-100 p-4 rounded-xl border border-ivory-300 text-xs flex justify-between items-center">
                <div>
                  <span className="text-charcoal-500 block">Total Amount Paid</span>
                  <span className="font-serif text-lg font-bold text-burgundy-950">
                    {formatINR(selectedSale.total_payable)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-charcoal-500 block">Payment Method</span>
                  <span className="font-semibold text-charcoal-800 uppercase">
                    {selectedSale.payments?.[0]?.payment_method || 'Razorpay Online Gateway'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="md:w-2/3 flex items-center justify-center text-charcoal-400">
              Select an order to view tracking details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
