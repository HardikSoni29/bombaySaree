import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { ShoppingBag, Heart, Search, PackageCheck, Sparkles, MapPin } from 'lucide-react';
import { BombayDataStore } from '../../lib/storage';

interface CustomerHeaderProps {
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenOrders: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  onOpenCart,
  onOpenWishlist,
  onOpenOrders,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}) => {
  const { itemCount } = useCart();
  const { user } = useAuth();
  const wishlistCount = BombayDataStore.getWishlist(user.id).length;

  const categories = [
    { label: 'All Collections', value: 'all' },
    { label: 'Kanjivaram Silks', value: 'cat-kanjivaram' },
    { label: 'Banarasi Brocades', value: 'cat-banarasi' },
    { label: 'Chanderi & Tissue', value: 'cat-chanderi' },
    { label: 'Paithani Heritage', value: 'cat-paithani' },
    { label: 'Organza & Pichwai', value: 'cat-organza' },
  ];

  return (
    <header className="sticky top-7 z-40 bg-ivory-50/95 backdrop-blur-md border-b border-ivory-300 transition-all shadow-sm">
      {/* Top micro announcement */}
      <div className="bg-burgundy-950 text-gold-300 text-[11px] py-1 px-4 text-center tracking-widest uppercase font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3 h-3 text-gold-400" />
        <span>Festive & Bridal Atelier Edit • Complimentary Insured Hand-Delivery Across India • Studio Visits in Kala Ghoda</span>
        <Sparkles className="w-3 h-3 text-gold-400" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo / Studio Identity */}
          <div className="flex flex-col cursor-pointer" onClick={() => setSelectedCategory('all')}>
            <span className="font-brand text-2xl sm:text-3xl font-bold tracking-[0.2em] text-burgundy-950 uppercase leading-none">
              BOMBAY SAREE
            </span>
            <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-gold-700 font-serif mt-1 font-semibold">
              Studio & Designer Marketplace
            </span>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-md relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search silk, zari, Kanjivaram, designer..."
              className="w-full bg-ivory-100 border border-ivory-300 rounded-full py-2 pl-10 pr-4 text-sm text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-burgundy-800/40 focus:border-burgundy-800 transition"
            />
            <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-3" />
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-4 sm:gap-6 text-charcoal-800">
            {/* Store visit indicator */}
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-charcoal-600 bg-ivory-200/60 px-3 py-1.5 rounded-full border border-ivory-300">
              <MapPin className="w-3.5 h-3.5 text-burgundy-800" />
              <span>Flagship: Kala Ghoda</span>
            </div>

            {/* My Orders */}
            <button
              onClick={onOpenOrders}
              className="flex items-center gap-1 text-xs font-medium hover:text-burgundy-900 transition"
              title="Track Orders & Invoices"
            >
              <PackageCheck className="w-5 h-5 text-charcoal-700 hover:text-burgundy-900 transition" />
              <span className="hidden sm:inline">Orders</span>
            </button>

            {/* Wishlist */}
            <button
              onClick={onOpenWishlist}
              className="relative p-1 text-charcoal-700 hover:text-burgundy-900 transition"
              title="Wishlisted Sarees"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-burgundy-800 text-gold-200 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Shopping Cart */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 px-4 py-2 rounded-full font-medium text-xs shadow-md transition hover:shadow-lg"
            >
              <ShoppingBag className="w-4 h-4 text-gold-300" />
              <span className="hidden sm:inline">Curated Bag</span>
              <span className="bg-gold-500 text-burgundy-950 font-bold px-1.5 py-0.2 text-[11px] rounded-full min-w-4 text-center">
                {itemCount}
              </span>
            </button>
          </div>
        </div>

        {/* Secondary Category Navigation */}
        <nav className="flex items-center justify-start sm:justify-center overflow-x-auto py-2.5 gap-2 sm:gap-6 border-t border-ivory-200 text-xs font-medium no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`whitespace-nowrap pb-1 border-b-2 transition ${
                selectedCategory === cat.value
                  ? 'border-burgundy-800 text-burgundy-900 font-bold'
                  : 'border-transparent text-charcoal-600 hover:text-burgundy-900 hover:border-ivory-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
