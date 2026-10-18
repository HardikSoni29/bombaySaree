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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-charcoal-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-ivory-300 overflow-hidden flex flex-col md:flex-row max-h-[92vh] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-white/90 hover:bg-white text-charcoal-800 p-2 rounded-full shadow-md transition hover:scale-105"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: Images Gallery */}
        <div className="md:w-1/2 bg-[#F9F7F3] p-4 sm:p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-ivory-300 overflow-y-auto">
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-lg bg-white border border-ivory-200">
            <img
              src={getProductImage(product, selectedImg)}
              alt={product.name}
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== FALLBACK_SAREE_IMAGE) {
                  target.src = FALLBACK_SAREE_IMAGE;
                }
              }}
              className="w-full h-full object-cover transition-transform duration-700"
            />
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1 rounded-full text-xs font-serif bg-burgundy-950/90 text-gold-300 backdrop-blur-md border border-gold-500/40">
                {product.ownership_type === 'designer_consignment' ? 'Designer Atelier Consignment' : 'Bombay Saree Studio Archive'}
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2.5 mt-4 overflow-x-auto pb-1">
              {product.images.map((img, idx) => {
                const thumbUrl = typeof img === 'string' ? img : (img as any)?.image_url || FALLBACK_SAREE_IMAGE;
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedImg(idx)}
                    className={`w-16 h-20 rounded-lg overflow-hidden border-2 transition flex-shrink-0 ${
                      selectedImg === idx ? 'border-gold-500 shadow-md ring-1 ring-gold-400' : 'border-transparent opacity-70 hover:opacity-100'
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
        <div className="md:w-1/2 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-white">
          <div className="space-y-5">
            {/* Designer / SKU Banner */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-gold-800 font-semibold uppercase tracking-widest mb-1.5">
                <span>{product.designer?.brand_name || 'Bombay Saree Heritage Guild'}</span>
                <span>SKU: {product.sku}</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950 leading-snug">
                {product.name}
              </h2>
            </div>

            {/* Pricing Section */}
            <div className="p-4 bg-ivory-50 rounded-xl border border-gold-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-charcoal-500 block font-mono">
                  Atelier Price (All Taxes Included)
                </span>
                <div className="flex items-baseline gap-2.5 mt-0.5">
                  <span className="font-serif text-2xl sm:text-3xl font-bold text-burgundy-950">
                    {formatINR(product.price)}
                  </span>
                  {discountPct > 0 && (
                    <span className="text-sm text-charcoal-400 line-through">
                      {formatINR(product.mrp)}
                    </span>
                  )}
                </div>
              </div>

              {discountPct > 0 ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full text-xs font-bold uppercase tracking-wider">
                  Save {discountPct}%
                </span>
              ) : (
                <span className="px-3 py-1 bg-gold-50 text-gold-800 border border-gold-300 rounded-full text-xs font-serif font-bold">
                  Certified Pure Zari
                </span>
              )}
            </div>

            {/* Saree Craft & Draping Attributes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-ivory-100/70 rounded-lg border border-ivory-200">
                <span className="text-charcoal-500 block text-[10px] uppercase font-mono">Fabric & Weave</span>
                <span className="font-serif font-bold text-charcoal-900 mt-0.5 block">{product.fabric}</span>
              </div>
              <div className="p-3 bg-ivory-100/70 rounded-lg border border-ivory-200">
                <span className="text-charcoal-500 block text-[10px] uppercase font-mono">Drape Dimensions</span>
                <span className="font-serif font-bold text-charcoal-900 mt-0.5 block">{product.drape_length} (Full Drape)</span>
              </div>
              <div className="p-3 bg-ivory-100/70 rounded-lg border border-ivory-200">
                <span className="text-charcoal-500 block text-[10px] uppercase font-mono">Blouse Piece</span>
                <span className="font-serif font-bold text-charcoal-900 mt-0.5 block">
                  {product.blouse_included ? `Included (${product.blouse_length})` : 'Not Included'}
                </span>
              </div>
              <div className="p-3 bg-ivory-100/70 rounded-lg border border-ivory-200">
                <span className="text-charcoal-500 block text-[10px] uppercase font-mono">Occasion</span>
                <span className="font-serif font-bold text-charcoal-900 mt-0.5 block">{product.occasion}</span>
              </div>
            </div>

            {/* Story & Description */}
            <div>
              <h4 className="font-serif text-sm font-bold text-burgundy-950 mb-1">Weaver’s Provenance</h4>
              <p className="text-xs text-charcoal-600 leading-relaxed font-light">
                {product.description}
              </p>
            </div>

            {/* Care Guide */}
            <div className="text-xs text-charcoal-600 bg-ivory-50 p-3.5 rounded-lg border border-ivory-200">
              <span className="font-serif font-bold text-burgundy-950 block mb-0.5">Heritage Preservation Guide:</span>
              <p className="font-light">{product.care_instructions}</p>
            </div>

            {/* Real-time Physical Inventory Transparency */}
            <div className="pt-2 border-t border-ivory-300">
              <span className="text-[11px] font-mono uppercase tracking-wider text-charcoal-500 font-semibold block mb-2">
                Physical Barcode Tracking ({physicalItems.length} Available):
              </span>
              {physicalItems.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {physicalItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-1.5 px-3 py-1 bg-ivory-100 rounded-md border border-ivory-300 text-[11px]"
                    >
                      <Tag className="w-3 h-3 text-gold-700" />
                      <span className="font-mono font-semibold text-charcoal-800">{item.barcode}</span>
                      <span className="text-charcoal-400">•</span>
                      <span className="text-charcoal-600 text-[10px]">{item.location?.name || 'Kala Ghoda Studio'}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-red-700 font-medium font-serif">
                  Currently out of stock. Contact our Kala Ghoda studio for bespoke loom commissioning.
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
                    ? 'bg-burgundy-900 border-burgundy-900 text-gold-300 shadow-md'
                    : 'border-ivory-300 text-charcoal-600 hover:bg-ivory-100'
                }`}
                title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-gold-300 text-gold-300' : ''}`} />
              </button>

              <button
                onClick={handleAdd}
                disabled={physicalItems.length === 0}
                className={`flex-1 py-3.5 px-6 rounded-xl font-serif font-bold text-sm shadow-md transition flex items-center justify-center gap-2.5 ${
                  physicalItems.length > 0
                    ? 'bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-burgundy-950 shadow-luxury'
                    : 'bg-charcoal-200 text-charcoal-400 cursor-not-allowed'
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{physicalItems.length > 0 ? 'Curate & Add to Bag' : 'Sold Out'}</span>
              </button>
            </div>

            <p className="text-[10px] text-center text-charcoal-400 font-serif">
              * Includes complimentary insured studio shipping & 7-day hassle-free return privilege.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
