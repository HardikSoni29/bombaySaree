import React, { useState, useRef } from 'react';
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
  const cardRef = useRef<HTMLDivElement | null>(null);

  // 3D Tilt State
  const [tilt, setTilt] = useState<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  const isWishlisted = BombayDataStore.getWishlist(user.id).some((w) => w.product_id === product.id);
  const discountPct = Math.round(((product.mrp - product.price) / product.mrp) * 100);
  const stockCount = product.available_stock_count ?? 0;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 9; // Max 9 deg tilt
    const rotateY = ((x - centerX) / centerX) * 9;

    setTilt({ x: rotateX, y: rotateY, active: true });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0, active: false });
  };

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
      ref={cardRef}
      onClick={() => onSelect(product)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: tilt.active
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-6px) scale3d(1.02, 1.02, 1.02)`
          : 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px) scale3d(1, 1, 1)',
        transition: tilt.active ? 'transform 0.1s ease-out' : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease',
      }}
      className="group bg-white rounded-2xl overflow-hidden border border-ivory-300 hover:border-gold-500/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-luxury-hover flex flex-col cursor-pointer relative preserve-3d"
    >
      {/* Specular Light Reflection Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 rounded-2xl"
        style={{
          background: tilt.active
            ? `radial-gradient(circle at ${50 + tilt.y * 3}% ${50 - tilt.x * 3}%, rgba(255, 255, 255, 0.35) 0%, transparent 60%)`
            : 'none',
        }}
      />

      {/* Visual Image Container with 3D Depth */}
      <div className="relative aspect-[3/4] bg-ivory-100 overflow-hidden preserve-3d">
        <img
          src={imageUrl}
          alt={product.name}
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== FALLBACK_SAREE_IMAGE) {
              target.src = FALLBACK_SAREE_IMAGE;
            }
          }}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
        />

        {/* Ambient Dark Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/70 via-transparent to-charcoal-950/20 opacity-40 group-hover:opacity-60 transition-opacity" />

        {/* Floating 3D Badge: Pure Studio Handloom */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10 card-3d-floating">
          <span className="px-3 py-1 rounded-full text-[10px] font-serif font-bold bg-[#1F070C]/90 text-gold-300 backdrop-blur-md border border-gold-500/40 uppercase tracking-widest shadow-md flex items-center gap-1.5">
            <Award className="w-3 h-3 text-gold-400" />
            <span>Silk Mark Certified</span>
          </span>

          {product.bestseller && (
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-sans font-bold bg-gradient-to-r from-gold-400 to-gold-500 text-burgundy-950 uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Studio Signature</span>
            </span>
          )}
        </div>

        {/* 3D Floating Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`absolute top-3 right-3 p-2.5 rounded-full backdrop-blur-md transition-all duration-300 z-10 card-3d-floating ${
            isWishlisted
              ? 'bg-burgundy-900 text-gold-300 shadow-md scale-105'
              : 'bg-white/85 text-charcoal-700 hover:bg-white hover:text-burgundy-900 shadow-sm'
          }`}
          title={isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-gold-300' : ''}`} />
        </button>

        {/* Quick View Drape on Hover */}
        <div className="absolute inset-x-0 bottom-12 flex justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10 pointer-events-none card-3d-deep">
          <span className="px-4 py-2 rounded-full bg-charcoal-950/90 backdrop-blur-md text-gold-200 text-xs font-serif tracking-wider border border-gold-500/40 shadow-xl flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-gold-400" />
            <span>Inspect Weave & Zari</span>
          </span>
        </div>

        {/* Physical Stock Barcode Pill */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] z-10 card-3d-floating">
          {stockCount > 0 ? (
            <span
              className={`px-2.5 py-0.5 rounded-full font-mono text-[10px] backdrop-blur-md tracking-wide shadow-sm ${
                stockCount === 1
                  ? 'bg-amber-950/85 text-amber-200 border border-amber-500/40'
                  : 'bg-charcoal-900/85 text-ivory-200 border border-ivory-500/30'
              }`}
            >
              {stockCount === 1 ? 'Last 1 physical drape' : `${stockCount} pieces in vault`}
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full font-semibold bg-red-950/85 text-red-200 border border-red-500/30 backdrop-blur-md">
              Reserved / Sold Out
            </span>
          )}

          <span className="text-[10px] text-ivory-200 font-serif hidden sm:inline drop-shadow">
            {product.occasion}
          </span>
        </div>
      </div>

      {/* Product Content Details (with 3D Depth layering) */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-white preserve-3d">
        <div>
          {/* Weave & Fabric Subtitle */}
          <div className="text-[11px] font-mono text-gold-700 uppercase tracking-widest mb-1.5 flex items-center justify-between">
            <span className="truncate">{product.fabric}</span>
            <span className="text-charcoal-400 text-[10px] uppercase font-sans">Kala Ghoda</span>
          </div>

          {/* Saree Title */}
          <h3 className="font-serif text-base sm:text-lg font-bold text-burgundy-950 group-hover:text-burgundy-800 transition-colors line-clamp-1 leading-snug">
            {product.name}
          </h3>

          {/* Short description */}
          <p className="text-xs text-charcoal-500 line-clamp-2 mt-1.5 font-light leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Action Area with 3D Depth */}
        <div className="mt-4 pt-3.5 border-t border-ivory-200 flex items-center justify-between card-3d-floating">
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
                Privilege Save {discountPct}%
              </span>
            ) : (
              <span className="text-[10px] text-charcoal-400 font-serif italic block">
                Pure Gold Electroplated Zari
              </span>
            )}
          </div>

          {/* 3D Tactile Add to Bag Button */}
          <button
            onClick={handleQuickAdd}
            disabled={stockCount === 0}
            className={`p-3 rounded-full transition shadow-md card-3d-deep ${
              stockCount > 0
                ? 'btn-3d-gold'
                : 'bg-ivory-200 text-charcoal-300 cursor-not-allowed shadow-none'
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
