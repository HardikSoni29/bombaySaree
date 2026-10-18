import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import {
  ShoppingBag,
  Heart,
  Search,
  PackageCheck,
  Sparkles,
  MapPin,
  User,
  LogOut,
  ChevronDown,
  Palette,
  Store,
  ShieldCheck,
} from 'lucide-react';
import { BombayDataStore } from '../../lib/storage';
import { AuthModal } from '../auth/AuthModal';

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
  const { user, isAuthenticated, isGuest, logout, setRole } = useAuth();
  const wishlistCount = BombayDataStore.getWishlist(user.id).length;

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'customer' | 'designer' | 'staff' | 'admin'>('customer');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const categories = [
    { label: 'All Collections', value: 'all' },
    { label: 'Kanjivaram Silks', value: 'cat-kanjivaram' },
    { label: 'Banarasi Brocades', value: 'cat-banarasi' },
    { label: 'Chanderi & Tissue', value: 'cat-chanderi' },
    { label: 'Paithani Heritage', value: 'cat-paithani' },
    { label: 'Organza & Pichwai', value: 'cat-organza' },
  ];

  const openAuth = (tab: 'customer' | 'designer' | 'staff' | 'admin') => {
    setAuthModalTab(tab);
    setShowAuthModal(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-ivory-50/95 backdrop-blur-md border-b border-ivory-300 transition-all shadow-sm">
        {/* Top Micro Announcement & Portal Access */}
        <div className="bg-burgundy-950 text-gold-300 text-[11px] py-1.5 px-4 tracking-wider uppercase font-medium flex flex-wrap items-center justify-between gap-2 border-b border-gold-900/40">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>Festive Atelier Edit • Complimentary Insured Delivery • Kala Ghoda Flagship Studio</span>
          </div>

          <div className="flex items-center gap-4 text-[10px] mx-auto sm:mx-0 lowercase text-ivory-300">
            <button
              onClick={() => openAuth('designer')}
              className="hover:text-gold-300 flex items-center gap-1 font-semibold uppercase tracking-wider transition"
            >
              <Palette className="w-3 h-3 text-gold-400" />
              <span>Sell With Us (Designer Portal)</span>
            </button>
            <span className="text-burgundy-800">|</span>
            <button
              onClick={() => openAuth('staff')}
              className="hover:text-gold-300 flex items-center gap-1 uppercase tracking-wider transition"
            >
              <Store className="w-3 h-3" />
              <span>Store Staff</span>
            </button>
            <span className="text-burgundy-800">|</span>
            <button
              onClick={() => openAuth('admin')}
              className="hover:text-gold-300 flex items-center gap-1 uppercase tracking-wider transition"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin</span>
            </button>
          </div>
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
            <div className="flex items-center gap-3 sm:gap-5 text-charcoal-800">
              {/* Store visit indicator */}
              <div className="hidden xl:flex items-center gap-1.5 text-xs text-charcoal-600 bg-ivory-200/60 px-3 py-1.5 rounded-full border border-ivory-300">
                <MapPin className="w-3.5 h-3.5 text-burgundy-800" />
                <span>Kala Ghoda Flagship</span>
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
                className="relative flex items-center gap-2 bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 px-3.5 sm:px-4 py-2 rounded-full font-medium text-xs shadow-md transition hover:shadow-lg"
              >
                <ShoppingBag className="w-4 h-4 text-gold-300" />
                <span className="hidden sm:inline">Bag</span>
                <span className="bg-gold-500 text-burgundy-950 font-bold px-1.5 py-0.2 text-[11px] rounded-full min-w-4 text-center">
                  {itemCount}
                </span>
              </button>

              {/* User Account / Profile Menu */}
              <div className="relative">
                {isAuthenticated && !isGuest ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 p-1.5 rounded-full hover:bg-ivory-200 transition border border-ivory-300"
                    >
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-burgundy-900 text-gold-200 flex items-center justify-center text-xs font-bold font-serif">
                          {user.full_name.charAt(0)}
                        </div>
                      )}
                      <span className="hidden md:inline text-xs font-serif font-bold text-charcoal-900 max-w-[120px] truncate">
                        {user.full_name}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-charcoal-500" />
                    </button>

                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-ivory-300 py-2 z-50 animate-fadeIn text-xs">
                        <div className="px-4 py-2 border-b border-ivory-200">
                          <p className="font-serif font-bold text-charcoal-900 truncate">{user.full_name}</p>
                          <p className="text-[11px] text-charcoal-500 truncate">{user.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-burgundy-100 text-burgundy-900">
                            Role: {user.role}
                          </span>
                        </div>

                        <div className="py-1">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              onOpenOrders();
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-ivory-100 flex items-center gap-2 text-charcoal-700"
                          >
                            <PackageCheck className="w-4 h-4 text-charcoal-500" />
                            <span>My Orders & Invoices</span>
                          </button>
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              onOpenWishlist();
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-ivory-100 flex items-center gap-2 text-charcoal-700"
                          >
                            <Heart className="w-4 h-4 text-charcoal-500" />
                            <span>My Wishlist ({wishlistCount})</span>
                          </button>
                        </div>

                        {/* Special Role Portals if applicable */}
                        {(user.role === 'designer' || user.role === 'admin') && (
                          <div className="py-1 border-t border-ivory-200">
                            <button
                              onClick={() => {
                                setShowUserMenu(false);
                                setRole('designer');
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-ivory-100 flex items-center gap-2 text-burgundy-900 font-semibold"
                            >
                              <Palette className="w-4 h-4 text-gold-600" />
                              <span>Go to Designer Portal</span>
                            </button>
                          </div>
                        )}

                        {(user.role === 'staff' || user.role === 'admin') && (
                          <div className="py-1 border-t border-ivory-200">
                            <button
                              onClick={() => {
                                setShowUserMenu(false);
                                setRole('staff');
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-ivory-100 flex items-center gap-2 text-burgundy-900 font-semibold"
                            >
                              <Store className="w-4 h-4 text-gold-600" />
                              <span>Open Store POS Register</span>
                            </button>
                          </div>
                        )}

                        {user.role === 'admin' && (
                          <div className="py-1 border-t border-ivory-200">
                            <button
                              onClick={() => {
                                setShowUserMenu(false);
                                setRole('admin');
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-ivory-100 flex items-center gap-2 text-burgundy-900 font-semibold"
                            >
                              <ShieldCheck className="w-4 h-4 text-gold-600" />
                              <span>Admin Studio</span>
                            </button>
                          </div>
                        )}

                        <div className="pt-1 border-t border-ivory-200">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              logout();
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-700 flex items-center gap-2"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Sign Out</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => openAuth('customer')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-burgundy-900/30 hover:border-burgundy-900 text-burgundy-950 hover:bg-ivory-200 transition text-xs font-semibold"
                  >
                    <User className="w-4 h-4 text-burgundy-900" />
                    <span>Sign In</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Secondary Category Navigation */}
          <nav className="flex items-center justify-start sm:justify-center overflow-x-auto py-3 gap-3 sm:gap-8 border-t border-ivory-200 text-xs sm:text-sm font-serif tracking-wide no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`whitespace-nowrap pb-1.5 border-b-2 transition-all ${
                  selectedCategory === cat.value
                    ? 'border-gold-600 text-burgundy-950 font-bold'
                    : 'border-transparent text-charcoal-600 hover:text-burgundy-900 hover:border-gold-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialTab={authModalTab}
      />
    </>
  );
};
