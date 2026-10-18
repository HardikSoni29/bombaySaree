import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BombayDataStore } from '../lib/storage';
import { Product, Sale } from '../types/database';
import { formatINR, getProductImage, FALLBACK_SAREE_IMAGE } from '../lib/utils';
import { CustomerHeader } from '../components/customer/CustomerHeader';
import { HeroBanner } from '../components/customer/HeroBanner';
import { ProductCard } from '../components/customer/ProductCard';
import { ProductDetailModal } from '../components/customer/ProductDetailModal';
import { CartDrawer } from '../components/customer/CartDrawer';
import { CheckoutModal } from '../components/customer/CheckoutModal';
import { OrderTrackingModal } from '../components/customer/OrderTrackingModal';
import { InvoiceModal } from '../components/common/InvoiceModal';
import {
  Sparkles,
  MapPin,
  ShieldCheck,
  Award,
  Filter,
  ArrowUpDown,
  Heart,
  Mail,
  Instagram,
  Phone,
  Clock,
} from 'lucide-react';

export const CustomerMode: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState<Sale | null>(null);

  // Filters & Sorting
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');
  const [filterOwnership, setFilterOwnership] = useState<'all' | 'designer_consignment' | 'bombay_owned'>('all');
  const [filterInStockOnly, setFilterInStockOnly] = useState<boolean>(false);

  // Force re-render on wishlist changes
  const [wishlistVersion, setWishlistVersion] = useState(0);

  const products = BombayDataStore.getProducts().filter((p) => p.status === 'active');
  const wishlistItems = BombayDataStore.getWishlist(user.id);
  const designers = BombayDataStore.getDesigners().filter((d) => d.approval_status === 'approved');

  // Filter & Sort Logic
  let filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.fabric.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.color.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.occasion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.designer?.brand_name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === 'all' || p.category_id === selectedCategory;

    const matchesOwnership =
      filterOwnership === 'all' || p.ownership_type === filterOwnership;

    const matchesStock = !filterInStockOnly || (p.available_stock_count ?? 0) > 0;

    return matchesSearch && matchesCategory && matchesOwnership && matchesStock;
  });

  if (sortBy === 'price-asc') {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
    filtered.sort((a, b) => b.price - a.price);
  }

  const handleOrderSuccess = (sale: Sale) => {
    setSelectedInvoiceSale(sale);
  };

  const handleRequestReturn = (sale: Sale, itemId: string) => {
    const item = sale.items?.find((i) => i.id === itemId);
    if (!item) return;

    if (window.confirm(`Submit 7-day return request for ${item.product_name_snapshot} (Barcode: ${item.barcode_snapshot})?`)) {
      try {
        BombayDataStore.processReturn({
          saleId: sale.id,
          saleItemId: item.id,
          inventoryItemId: item.inventory_item_id,
          condition: 'inspection',
          reason: 'Customer initiated online return request',
          refundAmount: item.final_price_ex_tax + item.tax_amount,
          actorId: user.id,
        });
        alert('Return request registered. Our Kala Ghoda concierge will coordinate insured pickup.');
      } catch (err: any) {
        alert(err.message || 'Error processing return');
      }
    }
  };

  return (
    <div className="min-h-screen bg-ivory-50 text-charcoal-900 font-sans flex flex-col">
      {/* Customer Header */}
      <CustomerHeader
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        onOpenOrders={() => setIsOrdersOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />

      {/* Hero Showcase Banner */}
      <HeroBanner onExplore={() => setSelectedCategory('all')} />

      {/* Featured Designer Highlights Strip */}
      <div className="bg-ivory-100 border-b border-ivory-300 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-gold-700 block">
                Direct From Master Looms
              </span>
              <h3 className="font-serif text-lg font-bold text-charcoal-900">
                Partner Ateliers & Designer Guilds
              </h3>
            </div>
            <span className="text-xs text-charcoal-500 font-light">
              Centrally cataloged & authenticated at Bombay Saree Studio
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {designers.map((d) => (
              <div
                key={d.id}
                className="bg-white p-3 rounded-xl border border-ivory-300 hover:border-gold-500/50 shadow-sm flex items-center gap-3 transition"
              >
                <img
                  src={d.logo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={d.brand_name}
                  className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                />
                <div className="overflow-hidden">
                  <h4 className="font-serif font-bold text-xs text-charcoal-900 truncate">{d.brand_name}</h4>
                  <span className="text-[10px] text-charcoal-500 truncate block">{d.city}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Saree Product Catalog */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-ivory-300 mb-8">
          <div>
            <h2 className="font-serif text-2xl font-bold text-charcoal-900">
              Curated Handloom Sarees ({filtered.length})
            </h2>
            <p className="text-xs text-charcoal-500 font-light mt-0.5">
              Every drape is an individually certified physical piece with distinct weave provenance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Filter Ownership */}
            <select
              value={filterOwnership}
              onChange={(e) => setFilterOwnership(e.target.value as any)}
              className="bg-white border border-ivory-300 rounded-lg px-3 py-1.5 font-medium text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-burgundy-800"
            >
              <option value="all">All Ownership Types</option>
              <option value="designer_consignment">Designer Consignment</option>
              <option value="bombay_owned">Bombay Studio Exclusive</option>
            </select>

            {/* In-Stock Filter */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ivory-300 bg-white cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterInStockOnly}
                onChange={(e) => setFilterInStockOnly(e.target.checked)}
                className="text-burgundy-900 rounded focus:ring-burgundy-900"
              />
              <span>In Stock Only</span>
            </label>

            {/* Sorting */}
            <div className="flex items-center gap-1 bg-white border border-ivory-300 rounded-lg px-2 py-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-charcoal-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-medium text-charcoal-800 focus:outline-none cursor-pointer"
              >
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <p className="font-serif text-lg font-bold text-charcoal-700">No sarees match your filter criteria.</p>
            <p className="text-xs text-charcoal-500">Try adjusting your filters or search keywords.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setFilterOwnership('all');
                setFilterInStockOnly(false);
              }}
              className="mt-2 px-5 py-2 rounded-full bg-burgundy-900 text-gold-300 text-xs font-semibold"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={(p) => setSelectedProduct(p)}
                onWishlistChange={() => setWishlistVersion((v) => v + 1)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Customer Wishlist Drawer Modal */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-ivory-300 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-burgundy-950 text-ivory-50 px-6 py-4 flex items-center justify-between border-b border-gold-600/30">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-gold-400 fill-gold-400" />
                <h3 className="font-serif text-base font-bold tracking-wide">
                  Your Wishlisted Drapes ({wishlistItems.length})
                </h3>
              </div>
              <button onClick={() => setIsWishlistOpen(false)} className="p-1 hover:text-white rounded">
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3 text-xs">
              {wishlistItems.length === 0 ? (
                <div className="text-center py-8 text-charcoal-400 space-y-2">
                  <Heart className="w-8 h-8 mx-auto text-ivory-300" />
                  <p className="font-serif font-bold text-charcoal-700">No sarees wishlisted yet</p>
                  <p className="text-xs text-charcoal-500">Tap the heart on any saree to save it to your curated wishlist.</p>
                </div>
              ) : (
                wishlistItems.map((w) => (
                  <div
                    key={w.id}
                    className="p-3 bg-ivory-50 rounded-xl border border-ivory-300 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getProductImage(w.product)}
                        alt=""
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== FALLBACK_SAREE_IMAGE) target.src = FALLBACK_SAREE_IMAGE;
                        }}
                        className="w-14 h-18 object-cover rounded-lg"
                      />
                      <div>
                        <h4 className="font-serif font-bold text-charcoal-900">{w.product?.name}</h4>
                        <span className="text-[11px] text-charcoal-500">{w.product?.fabric}</span>
                        <span className="block font-serif font-bold text-burgundy-950 mt-1">
                          {formatINR(w.product?.price)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <button
                        onClick={() => {
                          if (w.product) setSelectedProduct(w.product);
                          setIsWishlistOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-burgundy-900 text-gold-300 font-semibold text-xs hover:bg-burgundy-950 transition"
                      >
                        View Drape
                      </button>
                      <button
                        onClick={() => {
                          BombayDataStore.toggleWishlist(user.id, w.product_id);
                          setWishlistVersion((v) => v + 1);
                        }}
                        className="text-[10px] text-red-700 hover:underline text-center"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Saree Details Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onWishlistChange={() => setWishlistVersion((v) => v + 1)}
      />

      {/* Cart Drawer Slide-out */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        customerId={user.id}
        onViewInvoice={(sale) => setSelectedInvoiceSale(sale)}
        onRequestReturn={handleRequestReturn}
      />

      {/* A4 Tax Invoice Modal */}
      <InvoiceModal
        sale={selectedInvoiceSale}
        onClose={() => setSelectedInvoiceSale(null)}
      />

      {/* Studio Luxury Footer */}
      <footer className="bg-charcoal-950 text-ivory-200 border-t border-gold-600/30 text-xs pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-charcoal-800">
            {/* Column 1: Studio Identity */}
            <div className="space-y-3">
              <span className="font-brand text-xl font-bold tracking-widest text-gold-400 uppercase block">
                BOMBAY SAREE
              </span>
              <p className="text-charcoal-400 font-light leading-relaxed">
                Omnichannel saree studio & curated designer marketplace. Preserving India’s finest master weavers and artisanal silks through certified barcode provenance.
              </p>
              <div className="flex items-center gap-2 text-gold-400 font-medium">
                <Award className="w-4 h-4" />
                <span>Govt. Certified Handloom Silk Mark</span>
              </div>
            </div>

            {/* Column 2: Flagship Studio */}
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm text-ivory-100 uppercase tracking-wider">
                Flagship Saree Studio
              </h4>
              <div className="text-charcoal-400 space-y-1">
                <p className="flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-burgundy-600 flex-shrink-0 mt-0.5" />
                  <span>Heritage Mansion, V.B. Gandhi Marg, Kala Ghoda, Fort, Mumbai 400001</span>
                </p>
                <p className="flex items-center gap-1.5 pt-1">
                  <Clock className="w-4 h-4 text-burgundy-600 flex-shrink-0" />
                  <span>Tue – Sun: 11:00 AM – 8:30 PM (Mon Closed)</span>
                </p>
                <p className="flex items-center gap-1.5 pt-1">
                  <Phone className="w-4 h-4 text-burgundy-600 flex-shrink-0" />
                  <span>Concierge: +91 22 2284 5600</span>
                </p>
              </div>
            </div>

            {/* Column 3: Saree Categories */}
            <div className="space-y-2">
              <h4 className="font-serif font-bold text-sm text-ivory-100 uppercase tracking-wider">
                Curated Collections
              </h4>
              <ul className="text-charcoal-400 space-y-1">
                <li className="hover:text-gold-300 cursor-pointer" onClick={() => setSelectedCategory('cat-kanjivaram')}>
                  Kanchipuram Pure Mulberry Silks
                </li>
                <li className="hover:text-gold-300 cursor-pointer" onClick={() => setSelectedCategory('cat-banarasi')}>
                  Varanasi Kadwa & Meenakari Brocades
                </li>
                <li className="hover:text-gold-300 cursor-pointer" onClick={() => setSelectedCategory('cat-chanderi')}>
                  Chanderi & Metallic Tissue Drapes
                </li>
                <li className="hover:text-gold-300 cursor-pointer" onClick={() => setSelectedCategory('cat-paithani')}>
                  Yeola Paithani & Peacock Pallu
                </li>
                <li className="hover:text-gold-300 cursor-pointer" onClick={() => setSelectedCategory('cat-organza')}>
                  Artisanal Hand-Painted Pichwai Organza
                </li>
              </ul>
            </div>

            {/* Column 4: Newsletter */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-sm text-ivory-100 uppercase tracking-wider">
                Atelier Privileges
              </h4>
              <p className="text-charcoal-400 font-light">
                Receive private previews of limited edition loom drapes and festive designer spotlights.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email address..."
                  className="bg-charcoal-900 border border-charcoal-800 rounded-lg px-3 py-1.5 text-xs text-ivory-100 focus:outline-none focus:border-gold-500 w-full"
                />
                <button className="px-3 py-1.5 rounded-lg bg-burgundy-900 text-gold-300 font-semibold hover:bg-burgundy-800 transition">
                  Join
                </button>
              </div>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-charcoal-500 text-[11px] gap-2">
            <p>© 2026 Bombay Saree Retail Private Limited. All rights reserved.</p>
            <p>GSTIN: 27AABCB9821M1ZX | HSN 5007 Pure Silk Sarees</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
