import React from 'react';
import { Product } from '../../types/database';
import { formatINR, getProductImage, FALLBACK_SAREE_IMAGE } from '../../lib/utils';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { BombayDataStore } from '../../lib/storage';
import { Heart, ShoppingBag, Eye, Award, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onWishlistChange?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelect,
  onWishlistChange,
}) => {
  const { addToCart } = useCart();
  const { user } = useAuth();

  const isWishlisted = BombayDataStore.getWishlist(user.id).some((w) => w.product_id === product.id);
  const discountPct = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const stockCount = product.available_stock_count ?? 0;

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    BombayDataStore.toggleWishlist(user.id, product.id);
    if (onWishlistChange) onWishlistChange();
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = addToCart(product);
    if (!res.success) {
      alert(res.message);
    }
  };

  const imageUrl = getProductImage(product);

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-xl overflow-hidden border border-ivory-300 hover:border-gold-500/60 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-luxury-hover transition-all duration-500 flex flex-col cursor-pointer relative"
    >
      {/* Visual Image Container with editorial aspect ratio */}
      <div className="relative aspect-[3/4] bg-ivory-100 overflow-hidden">
        <img
          src={imageUrl}
          alt={product.name}
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== FALLBACK_SAREE_IMAGE) {
              target.src = FALLBACK_SAREE_IMAGE;
            }
          }}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Subtle dark gradient scrim at top and bottom */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/60 via-transparent to-charcoal-950/20 opacity-40 group-hover:opacity-60 transition-opacity" />

        {/* Ownership & Origin Badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
          {product.ownership_type === 'designer_consignment' ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-serif font-medium bg-[#1F070C]/90 text-gold-300 backdrop-blur-md border border-gold-500/30 uppercase tracking-widest shadow-sm">
              {product.designer?.brand_name || 'Designer Atelier'}
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-serif font-medium bg-charcoal-950/85 text-ivory-100 backdrop-blur-md border border-ivory-400/20 uppercase tracking-widest shadow-sm">
              Studio Archive
            </span>
          )}

          {product.bestseller && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-sans font-bold bg-gold-500 text-burgundy-950 uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Bestseller</span>
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 z-10 ${
            isWishlisted
              ? 'bg-burgundy-900 text-gold-300 shadow-md scale-105'
              : 'bg-white/80 text-charcoal-700 hover:bg-white hover:text-burgundy-900 shadow-sm'
          }`}
          title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-gold-300' : ''}`} />
        </button>

        {/* Quick View Overlay on Hover */}
        <div className="absolute inset-x-0 bottom-12 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none">
          <span className="px-4 py-1.5 rounded-full bg-charcoal-950/85 backdrop-blur-md text-gold-200 text-xs font-serif tracking-wider border border-gold-500/30 shadow-lg flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-gold-400" />
            <span>View Drape & Zari</span>
          </span>
        </div>

        {/* Physical Inventory Stock Tag */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] z-10">
          {stockCount > 0 ? (
            <span
              className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] backdrop-blur-md tracking-wide ${
                stockCount === 1
                  ? 'bg-amber-950/80 text-amber-200 border border-amber-500/40'
                  : 'bg-charcoal-900/80 text-ivory-200 border border-ivory-500/20'
              }`}
            >
              {stockCount === 1 ? '1 physical piece woven' : `${stockCount} pieces in vault`}
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full font-semibold bg-red-950/85 text-red-200 border border-red-500/30 backdrop-blur-md">
              Reserved / Sold
            </span>
          )}

          <span className="text-[10px] text-ivory-300 font-mono hidden sm:inline">
            {product.occasion}
          </span>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white">
        <div>
          {/* Weave & Fabric Subtitle */}
          <div className="text-[11px] font-mono text-gold-700 uppercase tracking-widest mb-1.5 flex items-center justify-between">
            <span className="truncate">{product.fabric}</span>
            <span className="text-charcoal-400 text-[10px] uppercase font-sans">Kala Ghoda</span>
          </div>

          {/* Saree Title */}
          <h3 className="font-serif text-base sm:text-lg font-bold text-charcoal-900 group-hover:text-burgundy-900 transition-colors line-clamp-1 leading-snug">
            {product.name}
          </h3>

          {/* Short description */}
          <p className="text-xs text-charcoal-500 line-clamp-2 mt-1.5 font-light leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action Area */}
        <div className="mt-4 pt-3.5 border-t border-ivory-200 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-lg sm:text-xl font-bold text-burgundy-950">
                {formatINR(product.price)}
              </span>
              {discountPct > 0 && (
                <span className="text-xs text-charcoal-400 line-through">
                  {formatINR(product.mrp)}
                </span>
              )}
            </div>
            {discountPct > 0 ? (
              <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block font-sans">
                Save {discountPct}% (Festive Privilege)
              </span>
            ) : (
              <span className="text-[10px] text-charcoal-400 font-serif italic block">
                Pure Handloom Zari
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={stockCount === 0}
            className={`p-2.5 sm:p-3 rounded-full transition shadow-sm ${
              stockCount > 0
                ? 'bg-ivory-100 hover:bg-burgundy-900 text-charcoal-800 hover:text-gold-300 border border-ivory-300 hover:border-burgundy-950 hover:shadow-luxury'
                : 'bg-ivory-100 text-charcoal-300 cursor-not-allowed'
            }`}
            title={stockCount > 0 ? 'Add to Bag' : 'Sold Out'}
          >
            <ShoppingBag className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
