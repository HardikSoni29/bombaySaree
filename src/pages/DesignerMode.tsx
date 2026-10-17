import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BombayDataStore } from '../lib/storage';
import { Product, SaleAllocation, DesignerLedgerEntry, Payout, InventoryItem } from '../types/database';
import { formatINR, formatDateTime, formatDate } from '../lib/utils';
import {
  Palette,
  Package,
  DollarSign,
  TrendingUp,
  Heart,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Tag,
  ShieldCheck,
  Eye,
  Building,
  CreditCard,
  X,
} from 'lucide-react';

export const DesignerMode: React.FC = () => {
  const { currentDesigner, allDesigners, setRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'ledger' | 'payouts'>('overview');
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);

  // Form state for new saree submission
  const [sareeName, setSareeName] = useState<string>('');
  const [fabric, setFabric] = useState<string>('Pure Mulberry Silk');
  const [color, setColor] = useState<string>('Gulabi Pink & Antique Gold');
  const [occasion, setOccasion] = useState<string>('Festive & Bridal Receptions');
  const [style, setStyle] = useState<string>('Handwoven Brocade');
  const [mrp, setMrp] = useState<number>(38000);
  const [price, setPrice] = useState<number>(32000);
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=85'
  );

  if (!currentDesigner) {
    return <div className="p-8 text-center text-charcoal-500">No designer profile selected.</div>;
  }

  const isApproved = currentDesigner.approval_status === 'approved';

  // Filtered data for this designer only (Tenant Isolation)
  const products = BombayDataStore.getProducts().filter((p) => p.designer_id === currentDesigner.id);
  const allocations = BombayDataStore.getAllocations(currentDesigner.id);
  const ledger = BombayDataStore.getDesignerLedger(currentDesigner.id);
  const payouts = BombayDataStore.getPayouts(currentDesigner.id);
  const inventory = BombayDataStore.getInventoryItems().filter((i) => i.designer_id === currentDesigner.id);

  // Designer metrics calculations
  const totalListedProducts = products.length;
  const approvedProducts = products.filter((p) => p.status === 'active').length;
  const pendingProducts = products.filter((p) => p.status === 'pending').length;

  const totalUnitsSold = allocations.length;
  const grossSalesAttributed = allocations.reduce((sum, a) => sum + a.eligible_amount, 0);
  const totalDesignerEarnings = allocations.reduce((sum, a) => sum + a.designer_amount, 0);
  const pendingReturnWindowAmount = allocations
    .filter((a) => a.status === 'pending')
    .reduce((sum, a) => sum + a.designer_amount, 0);
  const eligibleForPayoutAmount = allocations
    .filter((a) => a.status === 'eligible')
    .reduce((sum, a) => sum + a.designer_amount, 0);
  const totalPaidOut = payouts
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  // Total Wishlist engagement count across all this designer's products
  const totalWishlists = products.reduce((sum, prod) => {
    return sum + BombayDataStore.getWishlistCountForProduct(prod.id);
  }, 0);

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sareeName.trim()) return;

    try {
      BombayDataStore.saveProduct({
        designer_id: currentDesigner.id,
        name: sareeName,
        fabric,
        color,
        occasion,
        style,
        mrp,
        price,
        description: description || `Exquisite handwoven creation submitted by ${currentDesigner.brand_name}.`,
        ownership_type: 'designer_consignment',
        status: 'pending', // Pending Admin review!
        images: [imageUrl],
        tags: ['New Designer Submission', fabric, color],
      });

      setShowSubmitModal(false);
      setSareeName('');
      setDescription('');
      alert('Product submitted for Bombay Saree curation review! Admin has been notified.');
    } catch (err: any) {
      alert(err.message || 'Error submitting product');
    }
  };

  return (
    <div className="min-h-screen bg-ivory-50 text-charcoal-900 pb-16">
      {/* Designer Portal Header */}
      <div className="bg-burgundy-950 text-ivory-50 border-b border-gold-600/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={currentDesigner.logo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                alt={currentDesigner.brand_name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-gold-500/40 shadow-md"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ivory-50">
                    {currentDesigner.brand_name}
                  </h1>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      currentDesigner.approval_status === 'approved'
                        ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/30'
                        : currentDesigner.approval_status === 'pending'
                        ? 'bg-amber-900/80 text-amber-300 border border-amber-500/30'
                        : 'bg-red-900/80 text-red-300 border border-red-500/30'
                    }`}
                  >
                    {currentDesigner.approval_status}
                  </span>
                </div>
                <p className="text-xs text-ivory-300 font-light mt-0.5 flex items-center gap-3">
                  <span>Atelier: {currentDesigner.city}, {currentDesigner.state}</span>
                  <span>•</span>
                  <span>Contact: {currentDesigner.contact_person}</span>
                  <span>•</span>
                  <span className="text-gold-400 font-semibold">
                    Studio Agreement: {Math.round((1 - currentDesigner.default_commission_rate) * 100)}% Designer Share
                  </span>
                </p>
              </div>
            </div>

            {/* Quick Action */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSubmitModal(true)}
                disabled={!isApproved}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-xs tracking-wider uppercase transition shadow-luxury ${
                  isApproved
                    ? 'bg-gold-500 hover:bg-gold-400 text-burgundy-950 cursor-pointer'
                    : 'bg-charcoal-800 text-charcoal-400 cursor-not-allowed'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Submit Saree Collection</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-6 mt-8 border-t border-gold-600/20 pt-3 text-xs font-medium">
            {[
              { id: 'overview', label: 'Performance & Settlement' },
              { id: 'products', label: `My Collections (${products.length})` },
              { id: 'ledger', label: `Sales & Commission Ledger (${ledger.length})` },
              { id: 'payouts', label: `Settled Payouts (${payouts.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-gold-400 text-gold-300 font-bold'
                    : 'border-transparent text-ivory-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* If pending application status banner */}
        {!isApproved && (
          <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-300 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <h4 className="font-bold text-sm">Designer Application Status: {currentDesigner.approval_status.toUpperCase()}</h4>
              <p>
                Your brand onboarding application is currently under review by Bombay Saree’s curation board.
                Once approved, your proposed sarees will be cataloged with Code 128 barcodes and distributed across our Kala Ghoda studio and online marketplace.
              </p>
              {currentDesigner.admin_notes && (
                <p className="font-medium text-amber-950 pt-1">Admin Feedback: "{currentDesigner.admin_notes}"</p>
              )}
            </div>
          </div>
        )}

        {/* Tab 1: Overview & Metrics */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-sm">
                <div className="flex justify-between items-start text-charcoal-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Gross Sales Value</span>
                  <DollarSign className="w-4 h-4 text-burgundy-800" />
                </div>
                <div className="font-serif text-2xl font-bold text-burgundy-950">
                  {formatINR(grossSalesAttributed)}
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">
                  {totalUnitsSold} pieces sold across online & POS
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-sm">
                <div className="flex justify-between items-start text-charcoal-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Net Designer Share</span>
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="font-serif text-2xl font-bold text-emerald-900">
                  {formatINR(totalDesignerEarnings)}
                </div>
                <span className="text-[11px] text-emerald-700 mt-1 block font-medium">
                  After studio retention ({Math.round((1 - currentDesigner.default_commission_rate) * 100)}% share)
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-sm">
                <div className="flex justify-between items-start text-charcoal-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Eligible for Payout</span>
                  <CheckCircle2 className="w-4 h-4 text-gold-600" />
                </div>
                <div className="font-serif text-2xl font-bold text-charcoal-900">
                  {formatINR(eligibleForPayoutAmount)}
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">
                  Cleared return window (7 days)
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-sm">
                <div className="flex justify-between items-start text-charcoal-500 mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider">Wishlist Engagement</span>
                  <Heart className="w-4 h-4 text-burgundy-800" />
                </div>
                <div className="font-serif text-2xl font-bold text-burgundy-950">
                  {totalWishlists}
                </div>
                <span className="text-[11px] text-charcoal-500 mt-1 block">
                  Unique customers wishlisted your drapes
                </span>
              </div>
            </div>

            {/* Settlement Status Breakdown */}
            <div className="bg-white rounded-2xl border border-ivory-300 p-6 shadow-sm space-y-4">
              <h3 className="font-serif text-base font-bold text-charcoal-900">
                Transparent Settlement Policy & Payout Timeline
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-900">
                    <Clock className="w-4 h-4" />
                    <span>In 7-Day Return Window</span>
                  </div>
                  <p className="font-serif text-xl font-bold text-amber-950">
                    {formatINR(pendingReturnWindowAmount)}
                  </p>
                  <p className="text-[11px] text-amber-800">
                    Sarees delivered recently. Becomes eligible for payout once customer return privilege closes.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Cleared for Direct Transfer</span>
                  </div>
                  <p className="font-serif text-xl font-bold text-emerald-950">
                    {formatINR(eligibleForPayoutAmount)}
                  </p>
                  <p className="text-[11px] text-emerald-800">
                    Ready for batch payout to: A/C {currentDesigner.bank_account_number || 'Registered'}
                  </p>
                </div>

                <div className="p-4 bg-ivory-100 rounded-xl border border-ivory-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-charcoal-800">
                    <ShieldCheck className="w-4 h-4 text-gold-600" />
                    <span>Total Historical Settled</span>
                  </div>
                  <p className="font-serif text-xl font-bold text-burgundy-950">
                    {formatINR(totalPaidOut)}
                  </p>
                  <p className="text-[11px] text-charcoal-600">
                    Settled to designer bank account via direct NEFT/RTGS.
                  </p>
                </div>
              </div>
            </div>

            {/* Stock Level Transparency for this designer */}
            <div className="bg-white rounded-2xl border border-ivory-300 p-6 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-serif text-base font-bold text-charcoal-900">
                  Consignment Inventory Status ({inventory.length} Physical Pieces)
                </h3>
                <span className="text-xs text-charcoal-500">Live Studio & Warehouse Count</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-ivory-100 text-charcoal-600 uppercase text-[10px] tracking-wider border-y border-ivory-300">
                      <th className="py-2.5 px-3">Piece Barcode</th>
                      <th className="py-2.5 px-3">Saree Name</th>
                      <th className="py-2.5 px-3">Location</th>
                      <th className="py-2.5 px-3">Condition</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Studio Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-200">
                    {inventory.map((inv) => (
                      <tr key={inv.id} className="hover:bg-ivory-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-burgundy-900">
                          {inv.barcode}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-charcoal-900">
                          {inv.product?.name}
                        </td>
                        <td className="py-2.5 px-3 text-charcoal-600">
                          {inv.location?.name || 'Studio'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.condition === 'sellable' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {inv.condition}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.status === 'available'
                              ? 'bg-emerald-100 text-emerald-800'
                              : inv.status === 'sold'
                              ? 'bg-charcoal-100 text-charcoal-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-serif font-bold text-burgundy-950">
                          {formatINR(inv.product?.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Products List */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-serif text-lg font-bold text-charcoal-900">
                Collections Registered by {currentDesigner.brand_name}
              </h3>
              <button
                onClick={() => setShowSubmitModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 text-xs font-semibold shadow-sm transition"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Submit New Drape</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-xl border border-ivory-300 p-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-3">
                    <img src={p.images[0]} alt={p.name} className="w-full h-44 object-cover rounded-lg" />
                    <div>
                      <div className="flex justify-between items-center text-[10px] text-charcoal-500 font-mono">
                        <span>SKU: {p.sku}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                          p.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-charcoal-900 mt-1">{p.name}</h4>
                      <p className="text-xs text-charcoal-500 mt-0.5">{p.fabric} • {p.color}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-ivory-200 flex justify-between items-baseline">
                    <span className="font-serif font-bold text-sm text-burgundy-950">{formatINR(p.price)}</span>
                    <span className="text-xs text-charcoal-500">
                      Designer Share: {formatINR(Math.round(p.price * (1 - currentDesigner.default_commission_rate)))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Sales & Commission Ledger */}
        {activeTab === 'ledger' && (
          <div className="bg-white rounded-2xl border border-ivory-300 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-serif text-base font-bold text-charcoal-900">
                Immutable Designer Allocation Ledger
              </h3>
              <p className="text-xs text-charcoal-500">
                Formula: Commission = (Item Final Price Ex. Tax) × {Math.round(currentDesigner.default_commission_rate * 100)}% | Payout becomes eligible after 7-day return window.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-ivory-100 text-charcoal-600 uppercase text-[10px] tracking-wider border-y border-ivory-300">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Saree Snapshot</th>
                    <th className="py-2.5 px-3">Sale Channel</th>
                    <th className="py-2.5 px-3 text-right">Eligible Amount</th>
                    <th className="py-2.5 px-3 text-right">Studio Comm (₹)</th>
                    <th className="py-2.5 px-3 text-right">Net Designer Share</th>
                    <th className="py-2.5 px-3 text-center">Settlement Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200">
                  {allocations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-charcoal-400 italic">
                        No sales ledger entries recorded yet.
                      </td>
                    </tr>
                  ) : (
                    allocations.map((a) => (
                      <tr key={a.id} className="hover:bg-ivory-50">
                        <td className="py-3 px-3 font-mono text-charcoal-600">
                          {formatDate(a.created_at)}
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-bold text-charcoal-900">{a.sale_item?.product_name_snapshot || 'Silk Saree'}</p>
                          <span className="text-[10px] text-charcoal-400 font-mono">
                            Piece Barcode: {a.sale_item?.barcode_snapshot}
                          </span>
                        </td>
                        <td className="py-3 px-3 uppercase text-[10px] font-semibold text-charcoal-700">
                          Store / Online
                        </td>
                        <td className="py-3 px-3 text-right font-mono">{formatINR(a.eligible_amount)}</td>
                        <td className="py-3 px-3 text-right font-mono text-red-700">
                          -{formatINR(a.commission_amount)} ({Math.round(a.commission_rate * 100)}%)
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-800">
                          +{formatINR(a.designer_amount)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                            a.status === 'eligible'
                              ? 'bg-emerald-100 text-emerald-800'
                              : a.status === 'paid'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: Payouts History */}
        {activeTab === 'payouts' && (
          <div className="bg-white rounded-2xl border border-ivory-300 p-6 shadow-sm space-y-4">
            <h3 className="font-serif text-base font-bold text-charcoal-900">
              Bank Transfers & Payout Disbursements
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-ivory-100 text-charcoal-600 uppercase text-[10px] tracking-wider border-y border-ivory-300">
                    <th className="py-2.5 px-3">Payout Batch #</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Destination Bank A/C</th>
                    <th className="py-2.5 px-3">UTR Reference</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ivory-200">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-charcoal-400 italic">
                        No previous payout disbursements recorded.
                      </td>
                    </tr>
                  ) : (
                    payouts.map((p) => (
                      <tr key={p.id} className="hover:bg-ivory-50">
                        <td className="py-3 px-3 font-mono font-bold text-burgundy-900">{p.payout_number}</td>
                        <td className="py-3 px-3 text-charcoal-600">{formatDate(p.created_at)}</td>
                        <td className="py-3 px-3 text-charcoal-700 font-mono text-[11px]">{p.bank_account_snapshot}</td>
                        <td className="py-3 px-3 text-charcoal-600 font-mono text-[11px]">{p.provider_reference || 'Processing'}</td>
                        <td className="py-3 px-3 text-right font-serif font-bold text-sm text-charcoal-900">{formatINR(p.amount)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Saree Submission Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-ivory-300 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-burgundy-950 text-ivory-100 px-6 py-4 flex items-center justify-between border-b border-gold-600/30">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-gold-400" />
                <h3 className="font-serif text-base font-bold tracking-wide">
                  Submit New Saree Drape for Review
                </h3>
              </div>
              <button onClick={() => setShowSubmitModal(false)} className="p-1 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div>
                <label className="font-bold text-charcoal-700 block mb-1">Saree Name / Design Title</label>
                <input
                  type="text"
                  required
                  value={sareeName}
                  onChange={(e) => setSareeName(e.target.value)}
                  placeholder="e.g. Royal Maroon Paithani Silk Saree"
                  className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2.5 font-serif text-sm focus:outline-none focus:ring-1 focus:ring-burgundy-800 text-charcoal-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-charcoal-700 block mb-1">Fabric & Weave</label>
                  <input
                    type="text"
                    value={fabric}
                    onChange={(e) => setFabric(e.target.value)}
                    className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2 text-charcoal-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-charcoal-700 block mb-1">Color Palette</label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2 text-charcoal-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-charcoal-700 block mb-1">Occasion</label>
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2 text-charcoal-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-charcoal-700 block mb-1">Weave Style</label>
                  <input
                    type="text"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2 text-charcoal-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-charcoal-700 block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={mrp}
                    onChange={(e) => setMrp(Number(e.target.value))}
                    className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2 font-mono text-charcoal-900"
                  />
                </div>
                <div>
                  <label className="font-semibold text-charcoal-700 block mb-1">Proposed Retail Price (₹)</label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2 font-mono text-charcoal-900"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-charcoal-700 block mb-1">High-Resolution Photography URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2 font-mono text-xs text-charcoal-900"
                />
              </div>

              <div>
                <label className="font-semibold text-charcoal-700 block mb-1">Design & Craft Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Details of zari, loom technique, motif significance..."
                  className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                />
              </div>

              <div className="p-3 bg-ivory-100 rounded-xl border border-ivory-300 text-[11px] text-charcoal-600">
                <span className="font-bold text-burgundy-900 block mb-0.5">Bombay Saree Consignment Terms:</span>
                Proposed items are saved as pending submission. Bombay Saree review board approves quality, tags unique physical barcodes, and publishes to online and physical store channels.
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-bold uppercase tracking-wider text-xs transition shadow-luxury"
              >
                Submit Saree to Studio Curation Board
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
