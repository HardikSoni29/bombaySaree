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
  Crown,
  Flame,
  Gem,
  Compass,
  ArrowRight,
  Calendar,
} from 'lucide-react';

export const CustomerMode: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('all');
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

    const matchesOccasion =
      selectedOccasion === 'all' ||
      p.occasion.toLowerCase().includes(selectedOccasion.toLowerCase());

    const matchesOwnership =
      filterOwnership === 'all' || p.ownership_type === filterOwnership;

    const matchesStock = !filterInStockOnly || (p.available_stock_count ?? 0) > 0;

    return matchesSearch && matchesCategory && matchesOccasion && matchesOwnership && matchesStock;
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

  const handleOccasionClick = (occasion: string) => {
    setSelectedOccasion(occasion === selectedOccasion ? 'all' : occasion);
    const catalogElement = document.getElementById('saree-catalog');
    if (catalogElement) {
      catalogElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-charcoal-900 font-sans flex flex-col selection:bg-gold-500/20 selection:text-burgundy-950">
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
      <HeroBanner
        onExplore={() => {
          setSelectedCategory('all');
          setSelectedOccasion('all');
          const cat = document.getElementById('saree-catalog');
          if (cat) cat.scrollIntoView({ behavior: 'smooth' });
        }}
        onSelectCategory={(catId) => {
          setSelectedCategory(catId);
          setSelectedOccasion('all');
          const cat = document.getElementById('saree-catalog');
          if (cat) cat.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Curated Occasion Portals (Haute Couture Gateways) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 w-full">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-[11px] uppercase font-serif tracking-[0.25em] text-gold-700 block font-semibold">
            Curated Occasion Edits
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-normal text-burgundy-950 mt-1">
            Drapes for Every Sacred Moment
          </h2>
          <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent mx-auto mt-3" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: The Bridal Trousseau */}
          <div
            onClick={() => handleOccasionClick('Bridal')}
            className={`group relative h-96 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-luxury-hover transition-all duration-500 border ${
              selectedOccasion === 'Bridal' ? 'border-gold-500 ring-2 ring-gold-400' : 'border-ivory-300'
            }`}
          >
            <img
              src="https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=85"
              alt="Bridal Trousseau"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-burgundy-950 via-burgundy-950/40 to-transparent" />
            <div className="absolute top-4 left-4">
              <span className="p-2 rounded-full bg-gold-500/20 text-gold-300 border border-gold-400/30 backdrop-blur-md inline-block">
                <Crown className="w-4 h-4" />
              </span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 text-ivory-50">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-300 block mb-1">
                Sacred Muhurtham
              </span>
              <h3 className="font-serif text-xl font-bold leading-tight">The Bridal Trousseau</h3>
              <p className="text-xs text-ivory-200/80 mt-1.5 font-light line-clamp-2">
                Heavy Kanjivaram Korvai silks & pure gold zari heirloom brocades.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-serif text-gold-300 mt-3 group-hover:translate-x-1 transition-transform">
                <span>Explore Bridal Drapes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 2: Festive & Puja Heirlooms */}
          <div
            onClick={() => handleOccasionClick('Festive')}
            className={`group relative h-96 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-luxury-hover transition-all duration-500 border ${
              selectedOccasion === 'Festive' ? 'border-gold-500 ring-2 ring-gold-400' : 'border-ivory-300'
            }`}
          >
            <img
              src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=85"
              alt="Festive Heirlooms"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-burgundy-950 via-burgundy-950/40 to-transparent" />
            <div className="absolute top-4 left-4">
              <span className="p-2 rounded-full bg-gold-500/20 text-gold-300 border border-gold-400/30 backdrop-blur-md inline-block">
                <Flame className="w-4 h-4" />
              </span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 text-ivory-50">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-300 block mb-1">
                Auspicious Celebrations
              </span>
              <h3 className="font-serif text-xl font-bold leading-tight">Festive Heirlooms</h3>
              <p className="text-xs text-ivory-200/80 mt-1.5 font-light line-clamp-2">
                Meenakari floral weaves, Yeola Paithanis, and Banarasi Kadwa drapes.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-serif text-gold-300 mt-3 group-hover:translate-x-1 transition-transform">
                <span>View Festive Edit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 3: Cocktails & Metallic Tissue */}
          <div
            onClick={() => handleOccasionClick('Cocktail')}
            className={`group relative h-96 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-luxury-hover transition-all duration-500 border ${
              selectedOccasion === 'Cocktail' ? 'border-gold-500 ring-2 ring-gold-400' : 'border-ivory-300'
            }`}
          >
            <img
              src="https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=85"
              alt="Cocktails & Tissue"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-burgundy-950 via-burgundy-950/40 to-transparent" />
            <div className="absolute top-4 left-4">
              <span className="p-2 rounded-full bg-gold-500/20 text-gold-300 border border-gold-400/30 backdrop-blur-md inline-block">
                <Gem className="w-4 h-4" />
              </span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 text-ivory-50">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-300 block mb-1">
                Evening Glamour
              </span>
              <h3 className="font-serif text-xl font-bold leading-tight">Cocktails & Tissue</h3>
              <p className="text-xs text-ivory-200/80 mt-1.5 font-light line-clamp-2">
                Featherweight metallic tissue, hand-embroidered borders & organza.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-serif text-gold-300 mt-3 group-hover:translate-x-1 transition-transform">
                <span>Explore Evening Drapes</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Card 4: Generational Loom Archive */}
          <div
            onClick={() => {
              setSelectedCategory('all');
              setSelectedOccasion('all');
              setFilterOwnership('bombay_owned');
              const cat = document.getElementById('saree-catalog');
              if (cat) cat.scrollIntoView({ behavior: 'smooth' });
            }}
            className="group relative h-96 rounded-2xl overflow-hidden cursor-pointer shadow-md hover:shadow-luxury-hover transition-all duration-500 border border-ivory-300"
          >
            <img
              src="https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=85"
              alt="Loom Archive"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-burgundy-950 via-burgundy-950/40 to-transparent" />
            <div className="absolute top-4 left-4">
              <span className="p-2 rounded-full bg-gold-500/20 text-gold-300 border border-gold-400/30 backdrop-blur-md inline-block">
                <Compass className="w-4 h-4" />
              </span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 text-ivory-50">
              <span className="text-[10px] font-mono uppercase tracking-widest text-gold-300 block mb-1">
                Single-Loom Pieces
              </span>
              <h3 className="font-serif text-xl font-bold leading-tight">Studio Archive</h3>
              <p className="text-xs text-ivory-200/80 mt-1.5 font-light line-clamp-2">
                Exclusive Bombay Saree limited productions with certified barcode ancestry.
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-serif text-gold-300 mt-3 group-hover:translate-x-1 transition-transform">
                <span>View Vault Pieces</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Designer Guilds Strip */}
      <section className="bg-gradient-to-b from-ivory-100 to-ivory-50 border-y border-ivory-300 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-[10px] uppercase font-serif tracking-[0.2em] font-bold text-gold-800 block">
                Direct From Master Looms & Guilds
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-burgundy-950">
                Partner Ateliers & Designer Collectives
              </h3>
            </div>
            <span className="text-xs text-charcoal-500 font-light max-w-sm sm:text-right">
              Centrally cataloged & physically authenticated at our Kala Ghoda studio.
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {designers.map((d) => (
              <div
                key={d.id}
                onClick={() => {
                  setSearchQuery(d.brand_name);
                  const cat = document.getElementById('saree-catalog');
                  if (cat) cat.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white p-4 rounded-xl border border-ivory-300 hover:border-gold-500/60 shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-3.5 cursor-pointer group"
              >
                <img
                  src={d.logo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                  alt={d.brand_name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0 border border-ivory-300 group-hover:border-gold-500 transition-colors"
                />
                <div className="overflow-hidden">
                  <h4 className="font-serif font-bold text-sm text-charcoal-900 group-hover:text-burgundy-900 transition-colors truncate">
                    {d.brand_name}
                  </h4>
                  <span className="text-[11px] text-charcoal-500 truncate block font-light">
                    {d.city} Atelier
                  </span>
                  <span className="text-[10px] text-gold-700 font-mono font-medium block mt-0.5">
                    View Catalog →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Saree Product Catalog */}
      <main id="saree-catalog" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Controls & Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-ivory-300 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase tracking-widest text-gold-700 font-bold">
                Couture Inventory
              </span>
              {selectedOccasion !== 'all' && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-serif bg-burgundy-900 text-gold-200">
                  Occasion: {selectedOccasion}
                </span>
              )}
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-normal text-burgundy-950 mt-1">
              Curated Masterpiece Drapes ({filtered.length})
            </h2>
            <p className="text-xs text-charcoal-500 font-light mt-0.5">
              Every drape carries an authentic physical barcode tag tied to its individual loom.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            {/* Occasion Quick Filter */}
            {selectedOccasion !== 'all' && (
              <button
                onClick={() => setSelectedOccasion('all')}
                className="px-3 py-1.5 rounded-lg bg-burgundy-100 text-burgundy-900 hover:bg-burgundy-200 font-medium transition"
              >
                Clear Occasion (✕)
              </button>
            )}

            {/* Filter Ownership */}
            <select
              value={filterOwnership}
              onChange={(e) => setFilterOwnership(e.target.value as any)}
              className="bg-white border border-ivory-300 rounded-lg px-3.5 py-2 font-serif font-medium text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-burgundy-800 shadow-sm"
            >
              <option value="all">All Ownership Types</option>
              <option value="designer_consignment">Designer Consignment</option>
              <option value="bombay_owned">Bombay Studio Exclusive</option>
            </select>

            {/* In-Stock Filter */}
            <label className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-ivory-300 bg-white cursor-pointer select-none shadow-sm hover:border-gold-500 transition">
              <input
                type="checkbox"
                checked={filterInStockOnly}
                onChange={(e) => setFilterInStockOnly(e.target.checked)}
                className="text-burgundy-900 rounded focus:ring-burgundy-900 accent-burgundy-900"
              />
              <span className="font-serif">In Stock Only</span>
            </label>

            {/* Sorting */}
            <div className="flex items-center gap-1.5 bg-white border border-ivory-300 rounded-lg px-3 py-2 shadow-sm">
              <ArrowUpDown className="w-3.5 h-3.5 text-gold-700" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-serif font-medium text-charcoal-800 focus:outline-none cursor-pointer"
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
          <div className="text-center py-20 space-y-4 bg-white rounded-2xl border border-ivory-300 p-8">
            <Sparkles className="w-10 h-10 mx-auto text-gold-500" />
            <h3 className="font-serif text-xl font-bold text-charcoal-800">
              No sarees match your filter criteria
            </h3>
            <p className="text-xs text-charcoal-500 max-w-md mx-auto leading-relaxed">
              Our master weavers create limited runs. Try clearing your search keyword, category, or occasion filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedOccasion('all');
                setFilterOwnership('all');
                setFilterInStockOnly(false);
              }}
              className="mt-2 px-6 py-2.5 rounded-full bg-burgundy-950 text-gold-300 text-xs font-serif font-semibold hover:bg-burgundy-900 transition shadow-md"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 sm:gap-7">
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

      {/* Kala Ghoda Flagship Studio Story & Bespoke Draping Section */}
      <section className="bg-[#140407] text-ivory-50 border-t border-gold-600/30 py-16 sm:py-24 relative overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Story text */}
            <div className="lg:col-span-7 space-y-6">
              <span className="text-[11px] font-serif uppercase tracking-[0.3em] text-gold-400 font-bold block">
                The Kala Ghoda Heritage Experience
              </span>

              <h2 className="font-serif text-3xl sm:text-5xl font-normal leading-tight text-ivory-50">
                Experience the Art of Draping in Mumbai’s Art District
              </h2>

              <p className="text-sm sm:text-base text-ivory-200/90 font-light leading-relaxed">
                Nestled along V.B. Gandhi Marg in historic Kala Ghoda, Bombay Saree is more than a boutique—it is a sanctuary for India’s textile heritage. Under restored colonial archways, our master drapers assist brides, collectors, and connoisseurs with private bridal appointments, customized blouse pairings, and heirloom authentication.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-burgundy-950/60 border border-gold-500/20">
                  <Crown className="w-5 h-5 text-gold-400 mb-2" />
                  <h4 className="font-serif font-bold text-sm text-ivory-100">Private Salon</h4>
                  <p className="text-xs text-ivory-300/80 mt-1">One-on-one bridal trousseau consultations with master stylists.</p>
                </div>
                <div className="p-4 rounded-xl bg-burgundy-950/60 border border-gold-500/20">
                  <Award className="w-5 h-5 text-gold-400 mb-2" />
                  <h4 className="font-serif font-bold text-sm text-ivory-100">Govt. Silk Mark</h4>
                  <p className="text-xs text-ivory-300/80 mt-1">Laboratory certified 100% pure silk and genuine zari verification.</p>
                </div>
                <div className="p-4 rounded-xl bg-burgundy-950/60 border border-gold-500/20">
                  <ShieldCheck className="w-5 h-5 text-gold-400 mb-2" />
                  <h4 className="font-serif font-bold text-sm text-ivory-100">Single Barcode</h4>
                  <p className="text-xs text-ivory-300/80 mt-1">Individual physical inventory tracing prevents duplicates or counterfeits.</p>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-xs text-gold-300 bg-gold-500/10 px-4 py-2.5 rounded-full border border-gold-500/30">
                  <MapPin className="w-4 h-4 text-gold-400" />
                  <span>Heritage Mansion, V.B. Gandhi Marg, Kala Ghoda, Mumbai</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-ivory-300">
                  <Clock className="w-4 h-4 text-gold-400" />
                  <span>Tue–Sun: 11:00 AM – 8:30 PM</span>
                </div>
              </div>
            </div>

            {/* Studio visual feature */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-80 sm:w-96 h-[460px] rounded-2xl overflow-hidden shadow-2xl border-2 border-gold-500/40">
                <img
                  src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=85"
                  alt="Kala Ghoda Studio Experience"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal-950/90 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-charcoal-900/90 backdrop-blur-md border border-gold-500/30 text-left">
                  <span className="text-[10px] uppercase font-mono font-bold text-gold-400 tracking-wider block">
                    Private Bridal Consultation
                  </span>
                  <p className="font-serif text-sm font-semibold text-ivory-100 mt-1">
                    Reserve an afternoon with our heritage draper
                  </p>
                  <p className="text-xs text-ivory-300 font-light mt-0.5">
                    Concierge Line: +91 22 2284 5600
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Wishlist Drawer Modal */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-ivory-300 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-burgundy-950 text-ivory-50 px-6 py-4 flex items-center justify-between border-b border-gold-600/30">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-gold-400 fill-gold-400" />
                <h3 className="font-serif text-base font-bold tracking-wide">
                  Your Curated Wishlist ({wishlistItems.length})
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
      <footer className="bg-[#0D0205] text-ivory-200 border-t border-gold-600/30 text-xs pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12 border-b border-charcoal-800">
            {/* Column 1: Studio Identity */}
            <div className="space-y-3.5">
              <span className="font-brand text-2xl font-bold tracking-[0.25em] text-gold-400 uppercase block">
                BOMBAY SAREE
              </span>
              <p className="text-charcoal-400 font-light leading-relaxed">
                Omnichannel saree studio & curated designer marketplace. Preserving India’s finest master weavers and artisanal silks through certified barcode provenance.
              </p>
              <div className="flex items-center gap-2 text-gold-400 font-medium pt-1">
                <Award className="w-4 h-4" />
                <span className="font-serif">Govt. Certified Handloom Silk Mark</span>
              </div>
            </div>

            {/* Column 2: Flagship Studio */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-sm text-ivory-100 uppercase tracking-widest">
                Flagship Studio
              </h4>
              <div className="text-charcoal-400 space-y-2 leading-relaxed">
                <p className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gold-500 flex-shrink-0 mt-0.5" />
                  <span>Heritage Mansion, V.B. Gandhi Marg, Kala Ghoda, Fort, Mumbai 400001</span>
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold-500 flex-shrink-0" />
                  <span>Tue – Sun: 11:00 AM – 8:30 PM (Mon Closed)</span>
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gold-500 flex-shrink-0" />
                  <span>Concierge: +91 22 2284 5600</span>
                </p>
              </div>
            </div>

            {/* Column 3: Saree Categories */}
            <div className="space-y-3">
              <h4 className="font-serif font-bold text-sm text-ivory-100 uppercase tracking-widest">
                Curated Collections
              </h4>
              <ul className="text-charcoal-400 space-y-2 font-serif text-sm">
                <li
                  className="hover:text-gold-300 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedCategory('cat-kanjivaram');
                    const el = document.getElementById('saree-catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Kanchipuram Pure Mulberry Silks
                </li>
                <li
                  className="hover:text-gold-300 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedCategory('cat-banarasi');
                    const el = document.getElementById('saree-catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Varanasi Kadwa & Meenakari Brocades
                </li>
                <li
                  className="hover:text-gold-300 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedCategory('cat-chanderi');
                    const el = document.getElementById('saree-catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Chanderi & Metallic Tissue Drapes
                </li>
                <li
                  className="hover:text-gold-300 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedCategory('cat-paithani');
                    const el = document.getElementById('saree-catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Yeola Paithani & Peacock Pallu
                </li>
                <li
                  className="hover:text-gold-300 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedCategory('cat-organza');
                    const el = document.getElementById('saree-catalog');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  Artisanal Hand-Painted Pichwai Organza
                </li>
              </ul>
            </div>

            {/* Column 4: Atelier Privileges Newsletter */}
            <div className="space-y-3.5">
              <h4 className="font-serif font-bold text-sm text-ivory-100 uppercase tracking-widest">
                Atelier Privileges
              </h4>
              <p className="text-charcoal-400 font-light leading-relaxed">
                Receive private previews of limited edition loom drapes and festive designer spotlights.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter email address..."
                  className="bg-charcoal-900 border border-charcoal-800 rounded-lg px-3 py-2 text-xs text-ivory-100 focus:outline-none focus:border-gold-500 w-full"
                />
                <button className="px-4 py-2 rounded-lg bg-burgundy-900 text-gold-300 font-serif font-semibold hover:bg-burgundy-800 transition">
                  Join
                </button>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-charcoal-500 text-[11px] gap-2 font-mono">
            <p>© 2026 Bombay Saree Retail Private Limited. All rights reserved.</p>
            <p>GSTIN: 27AABCB9821M1ZX | HSN 5007 Pure Silk Sarees</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
