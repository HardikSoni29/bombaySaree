import React, { useState } from 'react';
import { BombayDataStore } from '../lib/storage';
import {
  Product,
  InventoryItem,
  Sale,
  StoreLocation,
} from '../types/database';
import { formatINR, formatDate, formatDateTime, generateBarcodeString } from '../lib/utils';
import { BarcodeModal } from '../components/common/BarcodeModal';
import { InvoiceModal } from '../components/common/InvoiceModal';
import { ThermalReceiptModal } from '../components/common/ThermalReceiptModal';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  TrendingUp,
  Package,
  Store,
  ShoppingBag,
  Barcode,
  Plus,
  Search,
  Eye,
  Tag,
  CheckCircle2,
  AlertCircle,
  Printer,
  Sparkles,
  ArrowRight,
  Layers,
  FileText,
  DollarSign,
  MapPin,
  Check,
} from 'lucide-react';

export const AdminMode: React.FC = () => {
  const { setRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'inventory' | 'catalog' | 'orders' | 'analytics'>('upload');

  // Modals & Inspection states
  const [selectedBarcodeItem, setSelectedBarcodeItem] = useState<InventoryItem | null>(null);
  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState<Sale | null>(null);
  const [selectedThermalSale, setSelectedThermalSale] = useState<Sale | null>(null);

  // New Saree Upload Form State
  const [name, setName] = useState('');
  const [fabric, setFabric] = useState('Pure Mulberry Kanjivaram Silk');
  const [color, setColor] = useState('Royal Crimson & Gold');
  const [occasion, setOccasion] = useState('Bridal & Wedding');
  const [categoryId, setCategoryId] = useState('cat-kanjivaram');
  const [price, setPrice] = useState<number>(45000);
  const [mrp, setMrp] = useState<number>(55000);
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=85');
  const [drapeLength, setDrapeLength] = useState('5.5 Meters');
  const [blouseIncluded, setBlouseIncluded] = useState(true);
  const [blouseLength, setBlouseLength] = useState('0.8 Meters (Unstitched)');
  const [description, setDescription] = useState('Woven on traditional Korvai pit looms with certified 24K pure gold electroplated zari.');
  const [careInstructions, setCareInstructions] = useState('Dry clean only. Store wrapped in pure unbleached mul-mul cotton cloth.');
  const [bestseller, setBestseller] = useState(false);
  const [stockQuantity, setStockQuantity] = useState<number>(2);

  // Add more pieces to existing product modal
  const [quickAddProductId, setQuickAddProductId] = useState<string | null>(null);
  const [quickAddCount, setQuickAddCount] = useState<number>(2);

  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null);
  const [inventorySearch, setInventorySearch] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [salesSearch, setSalesSearch] = useState('');

  // Live data from data store
  const products = BombayDataStore.getProducts();
  const inventory = BombayDataStore.getInventoryItems();
  const sales = BombayDataStore.getSales();

  // Metrics
  const totalRevenue = sales.reduce((sum, s) => sum + s.total_payable, 0);
  const posRevenue = sales.filter((s) => s.channel === 'pos').reduce((sum, s) => sum + s.total_payable, 0);
  const onlineRevenue = sales.filter((s) => s.channel === 'online').reduce((sum, s) => sum + s.total_payable, 0);
  const availableInventory = inventory.filter((i) => i.status === 'available');
  const totalValuation = availableInventory.reduce((sum, i) => sum + (i.product?.price || 0), 0);

  // Preset Silk Image Options for Quick Selection
  const imagePresets = [
    {
      label: 'Kanjivaram Crimson Gold',
      url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=85',
      fabric: 'Pure Mulberry Kanjivaram Silk',
      color: 'Royal Crimson & Gold',
      cat: 'cat-kanjivaram',
    },
    {
      label: 'Banarasi Midnight Navy',
      url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=800&q=85',
      fabric: 'Pure Katan Silk Banarasi Kadwa',
      color: 'Midnight Navy & Silver Zari',
      cat: 'cat-banarasi',
    },
    {
      label: 'Chanderi Champagne Tissue',
      url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=800&q=85',
      fabric: 'Handwoven Chanderi Metallic Tissue',
      color: 'Champagne Gold & Pearl',
      cat: 'cat-chanderi',
    },
    {
      label: 'Yeola Paithani Peacock',
      url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=800&q=85',
      fabric: 'Pure Mulberry Silk Paithani',
      color: 'Emerald Green & Rich Ruby',
      cat: 'cat-paithani',
    },
  ];

  // Handle Upload Stock
  const handleUploadSaree = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a Saree Design Name');
      return;
    }

    try {
      // 1. Generate unique SKU
      const skuPrefix = `BS-${name.substring(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`;

      // 2. Add product to catalog
      const newProduct = BombayDataStore.saveProduct({
        name,
        sku: skuPrefix,
        category_id: categoryId,
        fabric,
        color,
        occasion,
        price,
        mrp,
        drape_length: drapeLength,
        blouse_included: blouseIncluded,
        blouse_length: blouseLength,
        care_instructions: careInstructions,
        description,
        bestseller,
        status: 'active',
        images: [imageUrl],
        ownership_type: 'bombay_owned',
      });

      // 3. Generate physical stock items with barcodes
      const count = Math.max(1, stockQuantity);
      const generatedBarcodes: string[] = [];

      for (let i = 0; i < count; i++) {
        generatedBarcodes.push(generateBarcodeString(`BS-${name.substring(0, 3).toUpperCase()}`));
      }

      BombayDataStore.receiveInventory(
        newProduct.id,
        'loc-mum-01',
        generatedBarcodes,
        'bombay_owned',
        undefined,
        Math.round(price * 0.55)
      );

      setUploadSuccessMsg(
        `Successfully uploaded "${name}" with ${count} certified barcode tags: ${generatedBarcodes.join(', ')}`
      );

      // Reset form
      setName('');
      setPrice(45000);
      setMrp(55000);
      setStockQuantity(2);
    } catch (err: any) {
      alert(err.message || 'Error uploading saree design');
    }
  };

  // Handle Quick Add Pieces
  const handleAddPiecesToProduct = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;

    const barcodes: string[] = [];
    for (let i = 0; i < quickAddCount; i++) {
      barcodes.push(generateBarcodeString(`BS-${prod.name.substring(0, 3).toUpperCase()}`));
    }

    BombayDataStore.receiveInventory(
      prod.id,
      'loc-mum-01',
      barcodes,
      'bombay_owned',
      undefined,
      Math.round(prod.price * 0.55)
    );

    setQuickAddProductId(null);
    alert(`Added ${quickAddCount} physical barcode pieces to ${prod.name}!`);
  };

  // Filtered Inventory
  const filteredInventory = inventory.filter((item) => {
    const q = inventorySearch.toLowerCase();
    return (
      item.barcode.toLowerCase().includes(q) ||
      (item.product?.name || '').toLowerCase().includes(q) ||
      (item.product?.fabric || '').toLowerCase().includes(q)
    );
  });

  // Filtered Catalog
  const filteredProducts = products.filter((p) => {
    const q = catalogSearch.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.fabric.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q)
    );
  });

  // Filtered Sales
  const filteredSales = sales.filter((s) => {
    const q = salesSearch.toLowerCase();
    return (
      (s.sale_number || '').toLowerCase().includes(q) ||
      (s.customer_name || '').toLowerCase().includes(q) ||
      (s.customer_phone || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-charcoal-900 font-sans flex flex-col">
      {/* Admin Executive Header: 30% Royal Burgundy */}
      <header className="bg-gradient-to-r from-burgundy-950 via-burgundy-900 to-burgundy-950 text-white border-b border-gold-600/40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gold-500/20 text-gold-300 border border-gold-400/40 shadow-md">
                <ShieldCheck className="w-6 h-6 text-gold-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-gold-400 font-bold block">
                  Studio Administration Console
                </span>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ivory-50 leading-tight">
                  Bombay Saree Heritage Management
                </h1>
              </div>
            </div>

            {/* Quick Action: Open Store POS Terminal */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRole('staff')}
                className="btn-3d-gold flex items-center gap-2 px-5 py-2.5 rounded-xl font-serif text-xs font-bold tracking-wider"
              >
                <Store className="w-4 h-4" />
                <span>Open Store POS Register</span>
              </button>

              <button
                onClick={() => setRole('customer')}
                className="btn-3d-burgundy flex items-center gap-2 px-4 py-2.5 rounded-xl font-serif text-xs font-bold tracking-wider border border-gold-500/30"
              >
                <ShoppingBag className="w-4 h-4 text-gold-400" />
                <span>View Boutique</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-gold-600/20">
            <div className="bg-charcoal-950/50 p-3 rounded-xl border border-gold-500/20">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gold-300 block">Total Revenue</span>
              <span className="font-serif text-xl font-bold text-white mt-0.5 block">{formatINR(totalRevenue)}</span>
            </div>
            <div className="bg-charcoal-950/50 p-3 rounded-xl border border-gold-500/20">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gold-300 block">Available Drapes</span>
              <span className="font-serif text-xl font-bold text-white mt-0.5 block">{availableInventory.length} Pieces</span>
            </div>
            <div className="bg-charcoal-950/50 p-3 rounded-xl border border-gold-500/20">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gold-300 block">Vault Valuation</span>
              <span className="font-serif text-xl font-bold text-white mt-0.5 block">{formatINR(totalValuation)}</span>
            </div>
            <div className="bg-charcoal-950/50 p-3 rounded-xl border border-gold-500/20">
              <span className="text-[10px] font-mono uppercase tracking-wider text-gold-300 block">Completed Sales</span>
              <span className="font-serif text-xl font-bold text-white mt-0.5 block">{sales.length} Orders</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1 text-xs font-serif font-bold tracking-wide">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition ${
                activeTab === 'upload'
                  ? 'bg-gold-500 text-burgundy-950 shadow-md font-bold'
                  : 'text-ivory-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Upload Saree Stock</span>
            </button>

            <button
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition ${
                activeTab === 'inventory'
                  ? 'bg-gold-500 text-burgundy-950 shadow-md font-bold'
                  : 'text-ivory-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Barcode className="w-4 h-4" />
              <span>Physical Barcode Vault ({inventory.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition ${
                activeTab === 'catalog'
                  ? 'bg-gold-500 text-burgundy-950 shadow-md font-bold'
                  : 'text-ivory-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Saree Designs Catalog ({products.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition ${
                activeTab === 'orders'
                  ? 'bg-gold-500 text-burgundy-950 shadow-md font-bold'
                  : 'text-ivory-200 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>POS & Boutique Orders ({sales.length})</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area: 60% Ivory Canvas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* ========================================================================= */}
        {/* TAB 1: UPLOAD NEW SAREE STOCK */}
        {/* ========================================================================= */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-ivory-300">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold-700 font-bold block">
                  Inventory Onboarding
                </span>
                <h2 className="font-serif text-2xl font-bold text-burgundy-950">
                  Upload Saree Design & Issue Barcodes
                </h2>
              </div>
              <span className="text-xs text-charcoal-500 font-light">
                Each uploaded unit automatically receives a unique Code 128 barcode tag.
              </span>
            </div>

            {uploadSuccessMsg && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-3 shadow-sm animate-fadeIn">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span className="font-medium">{uploadSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleUploadSaree} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Specifications */}
              <div className="lg:col-span-8 bg-white p-6 sm:p-8 rounded-3xl border border-ivory-300 shadow-sm space-y-5">
                <h3 className="font-serif text-lg font-bold text-burgundy-950 border-b border-ivory-200 pb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-600" />
                  <span>Saree Draping & Craft Attributes</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                      Saree Design Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Royal Imperial Crimson Kanjivaram"
                      className="w-full bg-[#FAF8F5] border border-ivory-300 rounded-xl py-2.5 px-3.5 text-xs text-charcoal-900 font-serif font-semibold focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                      Curated Occasion
                    </label>
                    <select
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-ivory-300 rounded-xl py-2.5 px-3.5 text-xs text-charcoal-900 font-serif focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                    >
                      <option value="Bridal & Wedding">Bridal & Wedding Trousseau</option>
                      <option value="Festive & Puja Heirlooms">Festive & Puja Heirlooms</option>
                      <option value="Cocktails & Evening Soirée">Cocktails & Evening Soirée</option>
                      <option value="Single-Loom Heritage Archive">Single-Loom Heritage Archive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                      Fabric & Weave *
                    </label>
                    <input
                      type="text"
                      required
                      value={fabric}
                      onChange={(e) => setFabric(e.target.value)}
                      placeholder="e.g. Pure Mulberry Silk & 24K Zari"
                      className="w-full bg-[#FAF8F5] border border-ivory-300 rounded-xl py-2.5 px-3.5 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                      Color Palette
                    </label>
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="e.g. Crimson Red & Antique Gold"
                      className="w-full bg-[#FAF8F5] border border-ivory-300 rounded-xl py-2.5 px-3.5 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                      Collection Category
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-ivory-300 rounded-xl py-2.5 px-3.5 text-xs text-charcoal-900 font-serif focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                    >
                      <option value="cat-kanjivaram">Kanjivaram Silks</option>
                      <option value="cat-banarasi">Banarasi Brocades</option>
                      <option value="cat-chanderi">Chanderi & Tissue</option>
                      <option value="cat-paithani">Paithani Heritage</option>
                      <option value="cat-organza">Organza & Pichwai</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                      Selling Price (₹ Taxes Inclusive) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={500}
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      className="w-full bg-[#FAF8F5] border border-ivory-300 rounded-xl py-2.5 px-3.5 text-sm font-bold font-serif text-burgundy-950 focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                      Original MRP (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={price}
                      step={500}
                      value={mrp}
                      onChange={(e) => setMrp(Number(e.target.value))}
                      className="w-full bg-[#FAF8F5] border border-ivory-300 rounded-xl py-2.5 px-3.5 text-sm font-serif text-charcoal-600 focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                    Master Loom Description & Weave Story
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-[#FAF8F5] border border-ivory-300 rounded-xl py-2.5 px-3.5 text-xs text-charcoal-900 leading-relaxed focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                      Drape Length
                    </label>
                    <input
                      type="text"
                      value={drapeLength}
                      onChange={(e) => setDrapeLength(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-ivory-300 rounded-xl py-2 px-3 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                      Blouse Specifications
                    </label>
                    <input
                      type="text"
                      value={blouseLength}
                      onChange={(e) => setBlouseLength(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-ivory-300 rounded-xl py-2 px-3 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="bestseller-check"
                    checked={bestseller}
                    onChange={(e) => setBestseller(e.target.checked)}
                    className="rounded text-burgundy-900 accent-burgundy-900"
                  />
                  <label htmlFor="bestseller-check" className="text-xs font-serif text-charcoal-800 cursor-pointer">
                    Feature as Studio Bestseller
                  </label>
                </div>
              </div>

              {/* Right Column: Visual Image & Barcode Batch */}
              <div className="lg:col-span-4 space-y-6">
                {/* Image Preview & Presets */}
                <div className="bg-white p-6 rounded-3xl border border-ivory-300 shadow-sm space-y-4">
                  <h4 className="font-serif text-base font-bold text-burgundy-950 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gold-600" />
                    <span>Drape Photography</span>
                  </h4>

                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-ivory-100 border border-ivory-200">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-charcoal-900/80 text-gold-300 text-[10px] font-mono px-2 py-0.5 rounded-full">
                      Silk Mark Certified
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                      Image URL (Direct link)
                    </label>
                    <input
                      type="url"
                      required
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-[#FAF8F5] border border-ivory-300 rounded-xl py-2 px-3 text-[11px] text-charcoal-800"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-charcoal-500 block mb-2 font-semibold">
                      Quick Silk Presets:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {imagePresets.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setImageUrl(preset.url);
                            setFabric(preset.fabric);
                            setColor(preset.color);
                            setCategoryId(preset.cat);
                          }}
                          className="p-2 rounded-xl border border-ivory-200 hover:border-gold-500 text-left text-[10px] bg-[#FAF8F5] transition"
                        >
                          <span className="font-bold text-charcoal-800 block truncate">{preset.label}</span>
                          <span className="text-charcoal-400 block truncate">{preset.color}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Physical Barcodes Issuance */}
                <div className="bg-white p-6 rounded-3xl border-2 border-gold-500/40 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-gold-800 font-bold font-serif text-base">
                    <Barcode className="w-5 h-5 text-gold-600" />
                    <span>Physical Barcode Issuance</span>
                  </div>

                  <p className="text-xs text-charcoal-500 font-light leading-relaxed">
                    Set the physical pieces woven. Individual certified Code 128 barcodes will be generated and assigned to Kala Ghoda Studio Vault.
                  </p>

                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                      Pieces to Mint & Receive (Physical Stock)
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={stockQuantity}
                        onChange={(e) => setStockQuantity(Number(e.target.value))}
                        className="w-24 bg-[#FAF8F5] border border-ivory-300 rounded-xl py-2.5 px-3 text-center font-bold text-base text-burgundy-950 font-mono"
                      />
                      <span className="text-xs text-charcoal-600 font-serif">
                        Individual Code 128 Barcodes
                      </span>
                    </div>
                  </div>

                  {/* 3D Tactile Upload Button */}
                  <button
                    type="submit"
                    className="btn-3d-gold w-full py-4 rounded-2xl font-serif font-bold text-sm tracking-wider shadow-lg flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publish & Issue Barcodes</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PHYSICAL BARCODE VAULT */}
        {/* ========================================================================= */}
        {activeTab === 'inventory' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-300">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold-700 font-bold block">
                  Vault Transparency
                </span>
                <h2 className="font-serif text-2xl font-bold text-burgundy-950">
                  Individual Physical Saree Barcodes ({filteredInventory.length})
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search barcode, fabric, name..."
                  className="w-full bg-white border border-ivory-300 rounded-xl py-2 pl-9 pr-3 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                />
                <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Inventory Table */}
            <div className="bg-white rounded-3xl border border-ivory-300 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1A060B] text-gold-300 font-serif text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Barcode Tag</th>
                      <th className="py-3.5 px-4">Saree Design</th>
                      <th className="py-3.5 px-4">Fabric</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Location</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Label Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-200">
                    {filteredInventory.map((item) => (
                      <tr key={item.id} className="hover:bg-ivory-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-burgundy-950">
                          <span className="px-2.5 py-1 rounded-md bg-ivory-100 border border-ivory-300">
                            {item.barcode}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-serif font-bold text-charcoal-900">
                          {item.product?.name}
                        </td>
                        <td className="py-3 px-4 text-charcoal-600 font-mono text-[11px]">
                          {item.product?.fabric}
                        </td>
                        <td className="py-3 px-4 font-serif font-bold text-burgundy-950">
                          {formatINR(item.product?.price || 0)}
                        </td>
                        <td className="py-3 px-4 text-charcoal-600">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-burgundy-800" />
                            <span>{item.location?.name || 'Kala Ghoda Studio'}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                              item.status === 'available'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-charcoal-100 text-charcoal-600'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedBarcodeItem(item)}
                            className="btn-3d-gold inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print Barcode</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: SAREE DESIGNS CATALOG */}
        {/* ========================================================================= */}
        {activeTab === 'catalog' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-300">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold-700 font-bold block">
                  Studio Catalog
                </span>
                <h2 className="font-serif text-2xl font-bold text-burgundy-950">
                  Master Saree Designs ({filteredProducts.length})
                </h2>
              </div>

              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Search catalog designs..."
                  className="w-full bg-white border border-ivory-300 rounded-xl py-2 pl-9 pr-3 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                />
                <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((prod) => {
                const stock = inventory.filter((i) => i.product_id === prod.id && i.status === 'available').length;
                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-3xl border border-ivory-300 overflow-hidden shadow-sm flex flex-col justify-between p-5"
                  >
                    <div>
                      <div className="flex gap-4 items-start">
                        <img
                          src={prod.images?.[0] ? (typeof prod.images[0] === 'string' ? prod.images[0] : (prod.images[0] as any).image_url) : ''}
                          alt={prod.name}
                          className="w-20 h-24 object-cover rounded-2xl shadow-sm border border-ivory-200 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <span className="text-[10px] font-mono uppercase text-gold-700 font-bold block">
                            SKU: {prod.sku}
                          </span>
                          <h4 className="font-serif text-base font-bold text-burgundy-950 mt-0.5 leading-snug">
                            {prod.name}
                          </h4>
                          <span className="text-xs text-charcoal-500 font-mono block mt-0.5">
                            {prod.fabric}
                          </span>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="font-serif font-bold text-burgundy-950 text-base">
                              {formatINR(prod.price)}
                            </span>
                            <span className="text-xs text-charcoal-400 line-through">
                              {formatINR(prod.mrp)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-ivory-200 flex items-center justify-between text-xs">
                        <span className="text-charcoal-500 font-mono">Available Stock:</span>
                        <span className="font-serif font-bold text-burgundy-950 bg-ivory-100 px-3 py-1 rounded-full border border-ivory-300">
                          {stock} physical drapes
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-ivory-200">
                      {quickAddProductId === prod.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={quickAddCount}
                            onChange={(e) => setQuickAddCount(Number(e.target.value))}
                            className="w-16 bg-[#FAF8F5] border border-ivory-300 rounded-lg py-1 px-2 text-center text-xs font-mono font-bold"
                          />
                          <button
                            onClick={() => handleAddPiecesToProduct(prod.id)}
                            className="btn-3d-gold flex-1 py-1.5 rounded-lg text-xs font-serif font-bold"
                          >
                            Generate Barcodes
                          </button>
                          <button
                            onClick={() => setQuickAddProductId(null)}
                            className="text-charcoal-400 hover:text-charcoal-600 px-2"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setQuickAddProductId(prod.id)}
                          className="w-full py-2 rounded-xl bg-ivory-100 hover:bg-ivory-200 text-burgundy-950 font-serif font-bold text-xs border border-ivory-300 transition flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add More Physical Pieces & Barcodes</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: POS & BOUTIQUE ORDERS */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ivory-300">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold-700 font-bold block">
                  Studio Transactions
                </span>
                <h2 className="font-serif text-2xl font-bold text-burgundy-950">
                  Sales Ledger & Tax Invoices ({filteredSales.length})
                </h2>
              </div>

              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={salesSearch}
                  onChange={(e) => setSalesSearch(e.target.value)}
                  placeholder="Search invoice, customer..."
                  className="w-full bg-white border border-ivory-300 rounded-xl py-2 pl-9 pr-3 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                />
                <Search className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-ivory-300 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1A060B] text-gold-300 font-serif text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Invoice #</th>
                      <th className="py-3.5 px-4">Date & Time</th>
                      <th className="py-3.5 px-4">Channel</th>
                      <th className="py-3.5 px-4">Customer</th>
                      <th className="py-3.5 px-4">Items / Barcodes</th>
                      <th className="py-3.5 px-4">Net Total</th>
                      <th className="py-3.5 px-4 text-right">Invoices</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-200">
                    {filteredSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-ivory-50 transition">
                        <td className="py-3 px-4 font-mono font-bold text-burgundy-950">
                          {sale.sale_number}
                        </td>
                        <td className="py-3 px-4 text-charcoal-500 font-mono text-[11px]">
                          {formatDateTime(sale.created_at)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              sale.channel === 'pos'
                                ? 'bg-burgundy-100 text-burgundy-900 border border-burgundy-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {sale.channel === 'pos' ? 'Store POS' : 'Online'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-serif font-bold text-charcoal-900">
                          {sale.customer_name || 'Walk-in Client'}
                        </td>
                        <td className="py-3 px-4 text-charcoal-600 font-mono text-[11px]">
                          {sale.items?.length || 0} pieces
                        </td>
                        <td className="py-3 px-4 font-serif font-bold text-burgundy-950">
                          {formatINR(sale.total_payable)}
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedInvoiceSale(sale)}
                            className="btn-3d-burgundy inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold"
                          >
                            <FileText className="w-3 h-3 text-gold-400" />
                            <span>Tax Invoice</span>
                          </button>
                          {sale.channel === 'pos' && (
                            <button
                              onClick={() => setSelectedThermalSale(sale)}
                              className="btn-3d-gold inline-flex items-center gap-1 px-3 py-1 rounded-lg text-[10px] font-bold"
                            >
                              <Printer className="w-3 h-3" />
                              <span>POS Slip</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Barcode Print Modal */}
      <BarcodeModal
        item={selectedBarcodeItem}
        onClose={() => setSelectedBarcodeItem(null)}
      />

      {/* A4 Tax Invoice Modal */}
      <InvoiceModal
        sale={selectedInvoiceSale}
        onClose={() => setSelectedInvoiceSale(null)}
      />

      {/* POS Thermal Receipt Modal */}
      <ThermalReceiptModal
        sale={selectedThermalSale}
        onClose={() => setSelectedThermalSale(null)}
      />
    </div>
  );
};
