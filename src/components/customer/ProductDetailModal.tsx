import React, { useState } from 'react';
import { Product } from '../../types/database';
import { formatINR, getProductImage, FALLBACK_SAREE_IMAGE } from '../../lib/utils';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { BombayDataStore } from '../../lib/storage';
import { X, Heart, ShoppingBag, ShieldCheck, Sparkles, MapPin, Tag, Check, Award, Scissors } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onWishlistChange?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onWishlistChange,
}) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [selectedImg, setSelectedImg] = useState<number>(0);
  const [addedMessage, setAddedMessage] = useState<string | null>(null);

  if (!product) return null;

  const isWishlisted = BombayDataStore.getWishlist(user.id).some((w) => w.product_id === product.id);
  const discountPct = Math.round(((product.mrp - product.price) / product.mrp) * 100);

  // Available physical pieces in store/warehouse
  const physicalItems = BombayDataStore.getInventoryItems().filter(
    (i) => i.product_id === product.id && i.status === 'available' && i.condition === 'sellable'
  );

  const handleToggleWishlist = () => {
    BombayDataStore.toggleWishlist(user.id, product.id);
    if (onWishlistChange) onWishlistChange();
  };

  const handleAdd = () => {
    const res = addToCart(product);
    setAddedMessage(res.message);
    setTimeout(() => setAddedMessage(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-charcoal-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-ivory-300 overflow-hidden flex flex-col md:flex-row max-h-[92vh] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-white text-charcoal-700 p-2 rounded-full shadow-md transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Images Gallery */}
        <div className="md:w-1/2 bg-ivory-100 p-4 sm:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-ivory-300 overflow-y-auto">
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-md bg-white">
            <img
              src={getProductImage(product, selectedImg)}
              alt={product.name}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== FALLBACK_SAREE_IMAGE) {
                  target.src = FALLBACK_SAREE_IMAGE;
                }
              }}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 rounded-full text-xs font-serif bg-burgundy-950/90 text-gold-300 backdrop-blur-md border border-gold-500/30">
                {product.ownership_type === 'designer_consignment' ? 'Designer Consignment' : 'Bombay Studio Piece'}
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
              {product.images.map((img, idx) => {
                const thumbUrl = typeof img === 'string' ? img : (img as any)?.image_url || FALLBACK_SAREE_IMAGE;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImg(idx)}
                    className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition flex-shrink-0 ${
                      selectedImg === idx ? 'border-burgundy-900 shadow' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={thumbUrl}
                      alt=""
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (target.src !== FALLBACK_SAREE_IMAGE) target.src = FALLBACK_SAREE_IMAGE;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Specifications & Purchase */}
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-5">
            {/* Designer / Category Banner */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-gold-700 font-semibold uppercase tracking-wider mb-1">
                <span>{product.designer?.brand_name || 'Bombay Saree Heritage'}</span>
                <span>SKU: {product.sku}</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 leading-snug">
                {product.name}
              </h2>
            </div>

            {/* Pricing Section */}
            <div className="p-4 bg-ivory-50 rounded-xl border border-ivory-300 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-charcoal-500 block">
                  Studio Price (Taxes Inclusive)
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-serif text-2xl font-bold text-burgundy-950">
                    {formatINR(product.price)}
                  </span>
                  {discountPct > 0 && (
                    <span className="text-sm text-charcoal-400 line-through">
                      {formatINR(product.mrp)}
                    </span>
                  )}
                </div>
              </div>

              {discountPct > 0 && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold uppercase tracking-wider">
                  Save {discountPct}%
                </span>
              )}
            </div>

            {/* Saree Craft & Draping Attributes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-ivory-100/70 rounded-lg border border-ivory-200">
                <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Fabric & Weave</span>
                <span className="font-bold text-charcoal-900 mt-0.5 block">{product.fabric}</span>
              </div>
              <div className="p-3 bg-ivory-100/70 rounded-lg border border-ivory-200">
                <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Drape Dimensions</span>
                <span className="font-bold text-charcoal-900 mt-0.5 block">{product.drape_length} (Full Drape)</span>
              </div>
              <div className="p-3 bg-ivory-100/70 rounded-lg border border-ivory-200">
                <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Blouse Piece</span>
                <span className="font-bold text-charcoal-900 mt-0.5 block">
                  {product.blouse_included ? `Included (${product.blouse_length})` : 'Not Included'}
                </span>
              </div>
              <div className="p-3 bg-ivory-100/70 rounded-lg border border-ivory-200">
                <span className="text-charcoal-500 block text-[10px] uppercase font-semibold">Occasion</span>
                <span className="font-bold text-charcoal-900 mt-0.5 block">{product.occasion}</span>
              </div>
            </div>

            {/* Story & Description */}
            <div>
              <h4 className="font-serif text-sm font-bold text-charcoal-900 mb-1">Curator’s Note</h4>
              <p className="text-xs text-charcoal-600 leading-relaxed font-light">
                {product.description}
              </p>
            </div>

            {/* Care Guide */}
            <div className="text-xs text-charcoal-500 bg-ivory-50 p-3 rounded-lg border border-ivory-200">
              <span className="font-semibold text-charcoal-700 block mb-0.5">Heritage Preservation Guide:</span>
              <p>{product.care_instructions}</p>
            </div>

            {/* Real-time Physical Inventory Transparency */}
            <div className="pt-2 border-t border-ivory-300">
              <span className="text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider block mb-2">
                Physical Inventory Units ({physicalItems.length} Available):
              </span>
              {physicalItems.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {physicalItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-ivory-100 rounded-md border border-ivory-300 text-[11px]"
                    >
                      <Tag className="w-3 h-3 text-gold-600" />
                      <span className="font-mono font-semibold text-charcoal-800">{item.barcode}</span>
                      <span className="text-charcoal-400">•</span>
                      <span className="text-charcoal-600 text-[10px]">{item.location?.name || 'Studio'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-red-600 font-medium">
                  Currently out of stock. Contact our Kala Ghoda studio for pre-orders.
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-ivory-300 mt-6 space-y-3">
            {addedMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>{addedMessage}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleToggleWishlist}
                className={`p-3.5 rounded-xl border transition ${
                  isWishlisted
                    ? 'bg-burgundy-50 border-burgundy-300 text-burgundy-900'
                    : 'border-ivory-300 text-charcoal-600 hover:bg-ivory-100'
                }`}
                title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-burgundy-800 text-burgundy-800' : ''}`} />
              </button>

              <button
                onClick={handleAdd}
                disabled={physicalItems.length === 0}
                className={`flex-1 py-3.5 px-6 rounded-xl font-semibold text-sm shadow-md transition flex items-center justify-center gap-2 ${
                  physicalItems.length > 0
                    ? 'bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 shadow-luxury'
                    : 'bg-charcoal-200 text-charcoal-400 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{physicalItems.length > 0 ? 'Curate & Add to Bag' : 'Sold Out'}</span>
              </button>
            </div>

            <p className="text-[10px] text-center text-charcoal-400">
              * Includes complimentary insured studio shipping & 7-day hassle-free return privilege.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
