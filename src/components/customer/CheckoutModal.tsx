import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { BombayDataStore } from '../../lib/storage';
import { Sale, CustomerAddress } from '../../types/database';
import { formatINR } from '../../lib/utils';
import confetti from 'canvas-confetti';
import { X, CheckCircle, ShieldCheck, CreditCard, Banknote, Truck, ArrowRight, FileText } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (sale: Sale) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess,
}) => {
  const { items, clearCart, appliedCoupon, totalPayable, subtotal, discountAmount, taxAmount } = useCart();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState<CustomerAddress[]>(() =>
    BombayDataStore.getAddresses(user.id)
  );
  const [selectedAddressId, setSelectedAddressId] = useState<string>(() =>
    addresses[0]?.id || 'addr-new'
  );

  const [recipientName, setRecipientName] = useState(user.full_name || 'Ananya Singhania');
  const [phone, setPhone] = useState(user.phone || '+91 98200 11984');
  const [email, setEmail] = useState(user.email || 'ananya.singhania@heritage.org');
  const [streetAddress, setStreetAddress] = useState('14A Samudra Mahal, Worli');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [postalCode, setPostalCode] = useState('400018');

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<Sale | null>(null);

  if (!isOpen) return null;

  const handlePlaceOrder = () => {
    setIsProcessing(true);

    setTimeout(() => {
      try {
        const shippingAddress = {
          recipient_name: recipientName,
          phone,
          street_address: streetAddress,
          city,
          state,
          postal_code: postalCode,
        };

        const orderItems = items.map((i) => ({
          productId: i.product.id,
          barcode: i.assignedItem.barcode,
        }));

        const sale = BombayDataStore.finalizeOnlineOrder({
          customerId: user.id,
          items: orderItems,
          shippingAddress,
          appliedCoupon,
          paymentProvider: paymentMethod === 'razorpay' ? 'razorpay' : 'cod',
          customerName: recipientName,
          customerPhone: phone,
          customerEmail: email,
          notes: 'Customer online order via boutique storefront',
        });

        clearCart();
        setCompletedOrder(sale);
        setIsProcessing(false);

        // Trigger celebratory confetti for luxury purchase!
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#800020', '#C5A059'],
        });

        onOrderSuccess(sale);
      } catch (err: any) {
        setIsProcessing(false);
        alert(err.message || 'Failed to place order.');
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-ivory-300 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-burgundy-950 text-ivory-50 px-6 py-4 flex items-center justify-between border-b border-gold-600/30">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-gold-400" />
            <h3 className="font-serif text-lg font-bold tracking-wide">
              {completedOrder ? 'Order Confirmed & Sealed' : 'Secure Studio Checkout'}
            </h3>
          </div>
          {!completedOrder && (
            <button onClick={onClose} className="p-1 hover:text-white rounded transition">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {completedOrder ? (
            /* Order Success View */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div>
                <span className="text-xs uppercase font-mono tracking-widest text-gold-700 font-bold block mb-1">
                  Payment Verified • Stock Reserved & Locked
                </span>
                <h3 className="font-serif text-2xl font-bold text-charcoal-900">
                  Congratulations, {completedOrder.customer_name}
                </h3>
                <p className="text-xs text-charcoal-500 mt-1 max-w-md mx-auto">
                  Your luxury drape has been successfully placed under Order No:{' '}
                  <strong className="font-mono text-burgundy-900">{completedOrder.sale_number}</strong>.
                  Our Kala Ghoda atelier is packaging your saree in protective unbleached muslin.
                </p>
              </div>

              {/* Order Piece Summary */}
              <div className="max-w-md mx-auto bg-ivory-50 rounded-xl p-4 border border-ivory-300 text-left text-xs space-y-2">
                <div className="flex justify-between font-semibold pb-2 border-b border-ivory-300">
                  <span>Physical Pieces Allocated:</span>
                  <span>{completedOrder.items?.length} Sarees</span>
                </div>
                {completedOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-charcoal-700">
                    <div>
                      <p className="font-medium">{item.product_name_snapshot}</p>
                      <span className="text-[10px] text-charcoal-400 font-mono">Barcode: {item.barcode_snapshot}</span>
                    </div>
                    <span className="font-bold">{formatINR(item.unit_price_ex_tax)}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-ivory-300 flex justify-between font-bold text-sm text-burgundy-950">
                  <span>Total Amount Paid:</span>
                  <span className="font-serif text-base">{formatINR(completedOrder.total_payable)}</span>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-full bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-semibold text-xs transition"
                >
                  Continue Exploring
                </button>
              </div>
            </div>
          ) : (
            /* Checkout Form */
            <div className="space-y-6">
              {/* Delivery Address */}
              <div className="space-y-3">
                <h4 className="font-serif text-sm font-bold text-charcoal-900 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-burgundy-800" />
                  <span>1. Delivery & Recipient Details</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] font-semibold text-charcoal-600 block mb-1">
                      Recipient Full Name
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-burgundy-800 text-charcoal-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-charcoal-600 block mb-1">
                      Contact Phone (for delivery OTP)
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-burgundy-800 text-charcoal-900"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-semibold text-charcoal-600 block mb-1">
                      Street Address & Mansion / Apartment
                    </label>
                    <input
                      type="text"
                      value={streetAddress}
                      onChange={(e) => setStreetAddress(e.target.value)}
                      className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-burgundy-800 text-charcoal-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-charcoal-600 block mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-burgundy-800 text-charcoal-900"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-charcoal-600 block mb-1">Postal Code (PIN)</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-burgundy-800 text-charcoal-900"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3 pt-4 border-t border-ivory-300">
                <h4 className="font-serif text-sm font-bold text-charcoal-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-burgundy-800" />
                  <span>2. Payment Method</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <label
                    className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between transition ${
                      paymentMethod === 'razorpay'
                        ? 'border-burgundy-900 bg-burgundy-50/50 shadow-sm'
                        : 'border-ivory-300 hover:border-ivory-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'razorpay'}
                          onChange={() => setPaymentMethod('razorpay')}
                          className="text-burgundy-900 focus:ring-burgundy-900"
                        />
                        <span className="font-bold text-charcoal-900">Online Gateway (Razorpay)</span>
                      </div>
                      <CreditCard className="w-4 h-4 text-burgundy-800" />
                    </div>
                    <p className="text-[11px] text-charcoal-500">
                      Credit/Debit Cards, UPI, NetBanking, and Luxury EMI. Verified server-side.
                    </p>
                  </label>

                  <label
                    className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between transition ${
                      paymentMethod === 'cod'
                        ? 'border-burgundy-900 bg-burgundy-50/50 shadow-sm'
                        : 'border-ivory-300 hover:border-ivory-400 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === 'cod'}
                          onChange={() => setPaymentMethod('cod')}
                          className="text-burgundy-900 focus:ring-burgundy-900"
                        />
                        <span className="font-bold text-charcoal-900">Cash on Delivery</span>
                      </div>
                      <Banknote className="w-4 h-4 text-emerald-700" />
                    </div>
                    <p className="text-[11px] text-charcoal-500">
                      Pay via Cash or UPI at your doorstep upon inspecting the saree packaging seal.
                    </p>
                  </label>
                </div>
              </div>

              {/* Order Summary & Final Confirm Button */}
              <div className="pt-4 border-t border-ivory-300 space-y-3">
                <div className="bg-ivory-50 p-4 rounded-xl border border-ivory-300 text-xs space-y-1">
                  <div className="flex justify-between text-charcoal-600">
                    <span>Subtotal:</span>
                    <span className="font-mono">{formatINR(subtotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Coupon Discount:</span>
                      <span className="font-mono">-{formatINR(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-charcoal-600">
                    <span>GST (5%):</span>
                    <span className="font-mono">{formatINR(taxAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-burgundy-950 pt-2 border-t border-ivory-300">
                    <span>Payable Total:</span>
                    <span className="font-serif text-base">{formatINR(totalPayable)}</span>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-4 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-semibold text-xs tracking-wider uppercase shadow-luxury flex items-center justify-center gap-2 transition"
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-gold-300 border-t-transparent rounded-full animate-spin"></span>
                      Confirming Order with Studio...
                    </span>
                  ) : (
                    <>
                      <span>Authorize & Place Order</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
