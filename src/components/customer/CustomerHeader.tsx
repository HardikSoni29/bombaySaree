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
  Barcode,
  Award,
} from 'lucide-react';
import { BombayDataStore } from '../../lib/storage';
import { AuthModal } from '../auth/AuthModal';

interface CustomerHeaderProps {
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenOrders: () => void;
  onOpenBarcodeVerifier: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  onOpenCart,
  onOpenWishlist,
  onOpenOrders,
  onOpenBarcodeVerifier,
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
}) => {
  const { itemCount } = useCart();
  const { user, isAuthenticated, isGuest, logout, setRole } = useAuth();
  const wishlistCount = BombayDataStore.getWishlist(user.id).length;

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'customer' | 'staff' | 'admin'>('customer');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const categories = [
    { label: 'All Collections', value: 'all' },
    { label: 'Kanjivaram Silks', value: 'cat-kanjivaram' },
    { label: 'Banarasi Brocades', value: 'cat-banarasi' },
    { label: 'Chanderi & Tissue', value: 'cat-chanderi' },
    { label: 'Paithani Heritage', value: 'cat-paithani' },
    { label: 'Organza & Pichwai', value: 'cat-organza' },
  ];

  const openAuth = (tab: 'customer' | 'staff' | 'admin' = 'customer') => {
    setAuthModalTab(tab);
    setShowAuthModal(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-ivory-50/95 backdrop-blur-md border-b border-ivory-300 transition-all shadow-sm">
        {/* Top Micro Announcement (30% Royal Burgundy, NO staff/admin links visible to customers) */}
        <div className="bg-[#24060C] text-gold-300 text-[11px] py-1.5 px-4 tracking-wider uppercase font-medium flex flex-wrap items-center justify-between gap-2 border-b border-gold-900/40">
          <div className="flex items-center gap-2 mx-auto sm:mx-0">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" />
            <span>Festive Atelier Edit • Complimentary Insured Studio Delivery • Kala Ghoda Flagship Studio</span>
          </div>

          <div className="hidden md:flex items-center gap-4 text-[10px] text-ivory-300">
            <span className="flex items-center gap-1 text-gold-400 font-serif">
              <Award className="w-3 h-3" />
              <span>Govt. Certified Silk Mark Handlooms</span>
            </span>
            <span className="text-burgundy-800">|</span>
            <span className="text-ivory-400">Concierge: +91 22 2284 5600</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Logo / Studio Identity (Couture Typography) */}
            <div className="flex flex-col cursor-pointer" onClick={() => setSelectedCategory('all')}>
              <span className="font-brand text-2xl sm:text-3xl font-bold tracking-[0.22em] text-burgundy-950 uppercase leading-none">
                BOMBAY SAREE
              </span>
              <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.3em] text-gold-700 font-serif mt-1 font-semibold">
                Studio & Designer Marketplace
              </span>
            </div>

            {/* Search bar & Barcode Scanner Trigger */}
            <div className="hidden md:flex flex-1 max-w-lg items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search silk, zari, Kanjivaram, designer..."
                  className="w-full bg-white border border-ivory-300 rounded-full py-2 pl-10 pr-4 text-xs font-serif text-charcoal-900 placeholder-charcoal-400 focus:outline-none focus:ring-1 focus:ring-burgundy-900 focus:border-burgundy-900 transition shadow-2xs"
                />
                <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-2.5" />
              </div>

              {/* Barcode Drape Verifier Button */}
              <button
                type="button"
                onClick={onOpenBarcodeVerifier}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-ivory-100 hover:bg-ivory-200 text-burgundy-950 font-serif text-xs font-semibold border border-gold-500/40 hover:border-gold-500 transition shadow-2xs whitespace-nowrap"
                title="Scan or Verify Saree Barcode Tag"
              >
                <Barcode className="w-4 h-4 text-gold-700" />
                <span className="hidden xl:inline">Verify Barcode</span>
              </button>
            </div>

            {/* Action icons */}
            <div className="flex items-center gap-2.5 sm:gap-4 text-charcoal-800">
              {/* Mobile Barcode Scanner icon */}
              <button
                onClick={onOpenBarcodeVerifier}
                className="flex md:hidden p-2 text-burgundy-900 hover:text-gold-700 transition"
                title="Scan Barcode Tag"
              >
                <Barcode className="w-5 h-5" />
              </button>

              {/* Studio visit indicator */}
              <div className="hidden lg:flex items-center gap-1.5 text-xs text-charcoal-600 bg-ivory-200/60 px-3 py-1.5 rounded-full border border-ivory-300">
                <MapPin className="w-3.5 h-3.5 text-burgundy-800" />
                <span className="font-serif">Kala Ghoda Studio</span>
              </div>

              {/* My Orders */}
              <button
                onClick={onOpenOrders}
                className="flex items-center gap-1 text-xs font-serif font-medium hover:text-burgundy-900 transition"
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
                  <span className="absolute -top-1 -right-1 bg-burgundy-900 text-gold-200 text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Shopping Bag (10% Gold CTA Accent) */}
              <button
                onClick={onOpenCart}
                className="relative flex items-center gap-2 bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-burgundy-950 px-3.5 sm:px-4 py-2 rounded-full font-serif font-bold text-xs shadow-md transition hover:shadow-lg"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">Bag</span>
                <span className="bg-burgundy-950 text-gold-200 font-mono font-bold px-1.5 py-0.2 text-[10px] rounded-full min-w-4 text-center">
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

                        {/* Special Role Portals ONLY visible if already logged into that role or admin */}
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
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-burgundy-900/40 hover:border-burgundy-900 text-burgundy-950 hover:bg-ivory-200 transition text-xs font-serif font-semibold shadow-2xs"
                  >
                    <User className="w-3.5 h-3.5 text-burgundy-900" />
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

      {/* Auth Modal (Pure Customer Mode by default) */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialTab={authModalTab}
      />
    </>
  );
};
