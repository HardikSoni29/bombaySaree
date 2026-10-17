import React from 'react';
import { Product } from '../../types/database';
import { formatINR } from '../../lib/utils';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { BombayDataStore } from '../../lib/storage';
import { Heart, ShoppingBag, Eye, Sparkles, MapPin } from 'lucide-react';

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

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-xl overflow-hidden border border-ivory-300 hover:border-gold-500/50 shadow-sm hover:shadow-luxury transition-all duration-300 flex flex-col cursor-pointer relative"
    >
      {/* Visual Image Container */}
      <div className="relative aspect-[3/4] bg-ivory-100 overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Ownership Tag Badge */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 items-start">
          {product.ownership_type === 'designer_consignment' ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-burgundy-950/85 text-gold-300 backdrop-blur-md border border-gold-500/30 uppercase tracking-wider">
              {product.designer?.brand_name || 'Designer Consignment'}
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-charcoal-900/85 text-ivory-100 backdrop-blur-md border border-ivory-400/30 uppercase tracking-wider">
              Studio Exclusive
            </span>
          )}

          {product.bestseller && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gold-500 text-burgundy-950 uppercase tracking-wider">
              Bestseller
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition ${
            isWishlisted
              ? 'bg-burgundy-800 text-gold-300'
              : 'bg-white/80 text-charcoal-700 hover:bg-white hover:text-burgundy-800'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Stock Alert Pill */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px]">
          {stockCount > 0 ? (
            <span className={`px-2 py-0.5 rounded-full font-medium backdrop-blur-md ${
              stockCount === 1
                ? 'bg-amber-100/90 text-amber-900 border border-amber-300'
                : 'bg-emerald-100/90 text-emerald-900 border border-emerald-300'
            }`}>
              {stockCount === 1 ? 'Last 1 physical piece available' : `${stockCount} physical pieces in stock`}
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full font-semibold bg-red-100/90 text-red-800 border border-red-300 backdrop-blur-md">
              Reserved / Sold Out
            </span>
          )}
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-mono text-charcoal-500 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>{product.fabric}</span>
            <span className="text-burgundy-800 font-medium">{product.occasion}</span>
          </div>

          <h3 className="font-serif text-base font-bold text-charcoal-900 group-hover:text-burgundy-900 transition line-clamp-1">
            {product.name}
          </h3>

          <p className="text-xs text-charcoal-500 line-clamp-2 mt-1 font-light leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action Area */}
        <div className="mt-4 pt-3 border-t border-ivory-200 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-lg font-bold text-burgundy-950">
                {formatINR(product.price)}
              </span>
              {discountPct > 0 && (
                <span className="text-xs text-charcoal-400 line-through">
                  {formatINR(product.mrp)}
                </span>
              )}
            </div>
            {discountPct > 0 && (
              <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                Save {discountPct}% (Festive Privilege)
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={stockCount === 0}
            className={`p-2.5 rounded-full transition shadow-sm ${
              stockCount > 0
                ? 'bg-ivory-100 hover:bg-burgundy-900 text-charcoal-800 hover:text-gold-300 border border-ivory-300'
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
