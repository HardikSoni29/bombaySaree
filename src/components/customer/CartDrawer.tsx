import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { formatINR } from '../../lib/utils';
import { X, Trash2, ArrowRight, Tag, ShieldCheck, ShoppingBag, Sparkles } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onCheckout }) => {
  const {
    items,
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
    itemCount,
  } = useCart();

  const [couponCode, setCouponCode] = useState<string>('');
  const [couponMsg, setCouponMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    const res = applyCoupon(couponCode);
    if (res.success) {
      setCouponMsg({ type: 'success', text: res.message });
      setCouponCode('');
    } else {
      setCouponMsg({ type: 'error', text: res.message });
    }
    setTimeout(() => setCouponMsg(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-charcoal-950/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-ivory-300">
          {/* Drawer Header */}
          <div className="bg-burgundy-950 text-ivory-50 p-5 flex items-center justify-between border-b border-gold-600/30">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-gold-400" />
              <h3 className="font-serif text-lg font-bold tracking-wide">Your Curated Drapes</h3>
              <span className="bg-gold-500 text-burgundy-950 text-xs font-bold px-2 py-0.5 rounded-full ml-1">
                {itemCount}
              </span>
            </div>
            <button onClick={onClose} className="p-1 hover:text-white rounded transition">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-charcoal-400 space-y-3">
                <ShoppingBag className="w-12 h-12 text-ivory-300 stroke-[1.5]" />
                <p className="font-serif text-base font-bold text-charcoal-700">Your bag is empty</p>
                <p className="text-xs max-w-xs text-charcoal-500">
                  Explore our festive handlooms and luxury designer collections to curate your bridal wardrobe.
                </p>
                <button
                  onClick={onClose}
                  className="mt-2 px-5 py-2 rounded-full bg-burgundy-900 text-gold-200 text-xs font-semibold hover:bg-burgundy-950 transition"
                >
                  Browse Saree Collections
                </button>
              </div>
            ) : (
              items.map((item, index) => (
                <div
                  key={`${item.assignedItem.barcode}-${index}`}
                  className="flex gap-4 p-3 bg-ivory-50 rounded-xl border border-ivory-300 relative group"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-20 h-24 object-cover rounded-lg flex-shrink-0 shadow-sm"
                  />
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-serif text-xs font-bold text-charcoal-900 line-clamp-1">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.assignedItem.barcode)}
                          className="text-charcoal-400 hover:text-red-700 transition p-1"
                          title="Remove from bag"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-[10px] text-charcoal-500 font-mono mt-0.5">
                        <span>{item.product.fabric}</span>
                      </div>

                      {/* Barcode snapshot allocated to this bag item */}
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-burgundy-900 font-mono bg-ivory-200/80 px-2 py-0.5 rounded w-fit">
                        <Tag className="w-2.5 h-2.5" />
                        <span>Piece: {item.assignedItem.barcode}</span>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between mt-2 pt-1 border-t border-ivory-200">
                      <span className="text-[10px] text-charcoal-400">1 Piece</span>
                      <span className="font-serif font-bold text-sm text-burgundy-950">
                        {formatINR(item.product.price)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Area (if items exist) */}
          {items.length > 0 && (
            <div className="p-5 bg-ivory-100 border-t border-ivory-300 space-y-4">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="space-y-1.5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Enter Coupon (e.g. FESTIVE10)"
                    className="flex-1 bg-white border border-ivory-300 rounded-lg px-3 py-1.5 text-xs text-charcoal-900 uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-charcoal-900 hover:bg-charcoal-800 text-gold-300 text-xs font-semibold transition"
                  >
                    Apply
                  </button>
                </div>

                {couponMsg && (
                  <p
                    className={`text-[11px] ${
                      couponMsg.type === 'success' ? 'text-emerald-700' : 'text-red-600'
                    }`}
                  >
                    {couponMsg.text}
                  </p>
                )}

                {appliedCoupon && (
                  <div className="flex items-center justify-between text-xs bg-emerald-50 text-emerald-800 p-2 rounded-lg border border-emerald-200">
                    <span className="font-mono font-semibold">Coupon: {appliedCoupon.code}</span>
                    <button onClick={removeCoupon} className="text-red-700 hover:underline text-[10px]">
                      Remove
                    </button>
                  </div>
                )}
              </form>

              {/* Order Calculations */}
              <div className="space-y-1 text-xs text-charcoal-600 pt-2 border-t border-ivory-300">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatINR(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Privilege Discount:</span>
                    <span className="font-mono">-{formatINR(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Applicable GST (5%):</span>
                  <span className="font-mono">{formatINR(taxAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Insured Studio Delivery:</span>
                  <span className="font-medium text-emerald-700">COMPLIMENTARY</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-burgundy-950 pt-2 border-t border-ivory-300">
                  <span>Net Payable:</span>
                  <span className="font-serif text-base">{formatINR(totalPayable)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  onClose();
                  onCheckout();
                }}
                className="w-full py-3 px-4 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-semibold text-xs tracking-wider uppercase shadow-luxury flex items-center justify-center gap-2 transition"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-charcoal-500 text-center">
                <ShieldCheck className="w-3.5 h-3.5 text-gold-700" />
                <span>Verified Handloom Silk • 256-bit Encrypted Checkout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
