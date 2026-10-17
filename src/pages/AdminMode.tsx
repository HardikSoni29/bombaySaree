import React, { useState } from 'react';
import { BombayDataStore } from '../lib/storage';
import {
  Product,
  InventoryItem,
  DesignerProfile,
  Sale,
  SaleAllocation,
  Payout,
  StoreLocation,
  StockCondition,
  OwnershipType,
} from '../types/database';
import { formatINR, formatDate, formatDateTime, generateBarcodeString } from '../lib/utils';
import { BarcodeModal } from '../components/common/BarcodeModal';
import { InvoiceModal } from '../components/common/InvoiceModal';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  ShieldCheck,
  TrendingUp,
  Package,
  Store,
  ShoppingBag,
  Users,
  CheckCircle2,
  XCircle,
  Barcode,
  ArrowRightLeft,
  DollarSign,
  Download,
  AlertTriangle,
  Plus,
  Search,
  Eye,
  Tag,
  Settings,
  Layers,
  FileSpreadsheet,
  Check,
  X,
  CreditCard,
} from 'lucide-react';

export const AdminMode: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'designers' | 'catalog' | 'inventory' | 'orders' | 'payouts' | 'reports' | 'settings'
  >('overview');

  // Modals & Inspection states
  const [selectedBarcodeItem, setSelectedBarcodeItem] = useState<InventoryItem | null>(null);
  const [selectedInvoiceSale, setSelectedInvoiceSale] = useState<Sale | null>(null);
  const [showReceiveModal, setShowReceiveModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState<boolean>(false);
  const [transferTargetItem, setTransferTargetItem] = useState<InventoryItem | null>(null);
  const [transferTargetLocation, setTransferTargetLocation] = useState<string>('loc-mum-01');

  // Receive stock form state
  const [receiveProductId, setReceiveProductId] = useState<string>('');
  const [receiveLocationId, setReceiveLocationId] = useState<string>('loc-mum-01');
  const [receiveBarcodes, setReceiveBarcodes] = useState<string>('');
  const [receiveCost, setReceiveCost] = useState<number>(15000);

  // Search & Filters
  const [inventorySearch, setInventorySearch] = useState<string>('');
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  // Live data from data store
  const locations = BombayDataStore.getLocations();
  const designers = BombayDataStore.getDesigners();
  const products = BombayDataStore.getProducts();
  const inventory = BombayDataStore.getInventoryItems();
  const sales = BombayDataStore.getSales();
  const allocations = BombayDataStore.getAllocations();
  const payouts = BombayDataStore.getPayouts();
  const movements = BombayDataStore.getInventoryMovements();
  const auditLogs = BombayDataStore.getAuditLogs();

  // Metrics Calculations
  const totalRevenue = sales.reduce((sum, s) => sum + s.total_payable, 0);
  const onlineSalesRevenue = sales.filter((s) => s.channel === 'online').reduce((sum, s) => sum + s.total_payable, 0);
  const posSalesRevenue = sales.filter((s) => s.channel === 'pos').reduce((sum, s) => sum + s.total_payable, 0);

  const totalSareesInStock = inventory.filter((i) => i.status === 'available').length;
  const consignmentStockCount = inventory.filter((i) => i.ownership_type === 'designer_consignment' && i.status === 'available').length;
  const bombayOwnedStockCount = inventory.filter((i) => i.ownership_type === 'bombay_owned' && i.status === 'available').length;

  const inventoryValuation = inventory
    .filter((i) => i.status === 'available')
    .reduce((sum, i) => sum + (i.product?.price || 0), 0);

  const pendingDesignerApplications = designers.filter((d) => d.approval_status === 'pending');
  const pendingProductSubmissions = products.filter((p) => p.status === 'pending');
  const eligiblePayoutLiabilities = allocations
    .filter((a) => a.status === 'eligible')
    .reduce((sum, a) => sum + a.designer_amount, 0);

  // Chart data: Channel Breakdown
  const channelChartData = [
    { name: 'Kala Ghoda POS', revenue: posSalesRevenue },
    { name: 'Online Boutique', revenue: onlineSalesRevenue },
  ];

  // Stock Distribution Chart Data
  const stockPieData = [
    { name: 'Designer Consignment', value: consignmentStockCount, color: '#800020' },
    { name: 'Bombay Owned Studio', value: bombayOwnedStockCount, color: '#D4AF37' },
  ];

  // Stock Receiving Handler
  const handleReceiveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiveProductId) {
      alert('Please select a saree design');
      return;
    }

    const prod = products.find((p) => p.id === receiveProductId);
    if (!prod) return;

    let barcodeList: string[] = [];
    if (receiveBarcodes.trim()) {
      barcodeList = receiveBarcodes
        .split('\n')
        .map((b) => b.trim().toUpperCase())
        .filter((b) => b.length > 0);
    } else {
      // Auto-generate 2 unique barcodes if empty
      barcodeList = [
        generateBarcodeString(prod.sku.substring(0, 6)),
        generateBarcodeString(prod.sku.substring(0, 6)),
      ];
    }

    try {
      BombayDataStore.receiveInventory(
        receiveProductId,
        receiveLocationId,
        barcodeList,
        prod.ownership_type,
        prod.designer_id,
        receiveCost,
        'admin'
      );

      setShowReceiveModal(false);
      setReceiveBarcodes('');
      alert(`Successfully received ${barcodeList.length} physical saree pieces with unique barcodes!`);
    } catch (err: any) {
      alert(err.message || 'Error receiving stock');
    }
  };

  const handleTransferStock = () => {
    if (!transferTargetItem) return;
    try {
      BombayDataStore.transferInventory(transferTargetItem.id, transferTargetLocation, 'admin');
      setShowTransferModal(false);
      setTransferTargetItem(null);
      alert(`Piece ${transferTargetItem.barcode} transferred to selected location.`);
    } catch (err: any) {
      alert(err.message || 'Transfer failed');
    }
  };

  const handleCreatePayoutBatch = (designerId: string) => {
    const designerAllocs = allocations.filter((a) => a.designer_id === designerId && a.status === 'eligible');
    if (designerAllocs.length === 0) {
      alert('No eligible allocations found for this designer.');
      return;
    }

    try {
      const payout = BombayDataStore.createPayoutBatch(
        designerId,
        designerAllocs.map((a) => a.id),
        'admin'
      );
      alert(`Created Payout Batch ${payout.payout_number} for ${formatINR(payout.amount)}!`);
    } catch (err: any) {
      alert(err.message || 'Error creating payout batch');
    }
  };

  const handleSettlePayout = (payoutId: string) => {
    if (window.confirm('Confirm direct bank NEFT/RTGS settlement confirmation?')) {
      BombayDataStore.recordPayoutResult(payoutId, 'paid');
      alert('Payout settled! Designer ledger debit recorded.');
    }
  };

  // CSV Report Exports
  const exportCsv = (filename: string, rows: string[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportSalesCsv = () => {
    const headers = ['Sale Number', 'Channel', 'Customer', 'Date', 'Subtotal', 'Tax', 'Total Payable', 'Status'];
    const rows = sales.map((s) => [
      s.sale_number,
      s.channel,
      `"${s.customer_name || 'Walk-in'}"`,
      s.created_at,
      s.subtotal_ex_tax.toString(),
      s.tax_total.toString(),
      s.total_payable.toString(),
      s.status,
    ]);
    exportCsv(`bombay_saree_sales_${Date.now()}.csv`, [headers, ...rows]);
  };

  const exportInventoryCsv = () => {
    const headers = ['Barcode', 'Saree Name', 'SKU', 'Ownership', 'Designer', 'Location', 'Price', 'Condition', 'Status'];
    const rows = inventory.map((i) => [
      i.barcode,
      `"${i.product?.name || ''}"`,
      i.product?.sku || '',
      i.ownership_type,
      `"${i.designer?.brand_name || 'Bombay Studio'}"`,
      `"${i.location?.name || ''}"`,
      (i.product?.price || 0).toString(),
      i.condition,
      i.status,
    ]);
    exportCsv(`bombay_saree_inventory_${Date.now()}.csv`, [headers, ...rows]);
  };

  return (
    <div className="min-h-screen bg-ivory-50 text-charcoal-900 pb-20 font-sans">
      {/* Admin Executive Header */}
      <div className="bg-charcoal-950 text-ivory-50 border-b border-gold-600/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-gold-400" />
                <h1 className="font-brand text-2xl font-bold tracking-widest text-ivory-100 uppercase">
                  BOMBAY SAREE ADMIN STUDIO
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-burgundy-900 text-gold-300 border border-gold-500/40 uppercase">
                  Executive Command
                </span>
              </div>
              <p className="text-xs text-charcoal-400 mt-1">
                Centralized omnichannel control: physical stores, barcode engine, designer approvals, inventory & settlements.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReceiveModal(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 text-xs font-semibold shadow-sm transition border border-gold-500/30"
              >
                <Plus className="w-4 h-4" />
                <span>Receive Physical Sarees</span>
              </button>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex gap-4 sm:gap-6 mt-6 border-t border-charcoal-800 pt-3 text-xs font-medium overflow-x-auto no-scrollbar">
            {[
              { id: 'overview', label: 'Executive Dashboard' },
              { id: 'designers', label: `Designers (${designers.length})` },
              { id: 'catalog', label: `Catalog (${products.length})` },
              { id: 'inventory', label: `Inventory & Barcodes (${inventory.length})` },
              { id: 'orders', label: `Omnichannel Sales (${sales.length})` },
              { id: 'payouts', label: `Designer Settlements (${allocations.length})` },
              { id: 'reports', label: 'Reports & CSV' },
              { id: 'settings', label: 'Settings & Tax' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap pb-2 border-b-2 transition ${
                  activeTab === tab.id
                    ? 'border-gold-400 text-gold-300 font-bold'
                    : 'border-transparent text-charcoal-400 hover:text-ivory-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Tab 1: Executive Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-sm">
                <span className="text-xs uppercase font-semibold text-charcoal-500 block">Total Omnichannel Revenue</span>
                <span className="font-serif text-2xl font-bold text-burgundy-950 mt-1 block">
                  {formatINR(totalRevenue)}
                </span>
                <div className="flex items-center justify-between text-[11px] text-charcoal-500 mt-2 pt-2 border-t border-ivory-200">
                  <span>POS: {formatINR(posSalesRevenue)}</span>
                  <span>Online: {formatINR(onlineSalesRevenue)}</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-sm">
                <span className="text-xs uppercase font-semibold text-charcoal-500 block">Stock Valuation (Retail)</span>
                <span className="font-serif text-2xl font-bold text-charcoal-900 mt-1 block">
                  {formatINR(inventoryValuation)}
                </span>
                <div className="flex items-center justify-between text-[11px] text-charcoal-500 mt-2 pt-2 border-t border-ivory-200">
                  <span>{totalSareesInStock} Total Pieces</span>
                  <span className="text-burgundy-900 font-semibold">{consignmentStockCount} Consignment</span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-sm">
                <span className="text-xs uppercase font-semibold text-charcoal-500 block">Pending Payout Liability</span>
                <span className="font-serif text-2xl font-bold text-gold-700 mt-1 block">
                  {formatINR(eligiblePayoutLiabilities)}
                </span>
                <span className="text-[11px] text-charcoal-500 mt-2 pt-2 border-t border-ivory-200 block">
                  Cleared 7-day return window
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-ivory-300 shadow-sm">
                <span className="text-xs uppercase font-semibold text-charcoal-500 block">Pending Approvals</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-serif text-2xl font-bold text-charcoal-900">
                    {pendingDesignerApplications.length + pendingProductSubmissions.length}
                  </span>
                  <span className="text-xs text-amber-700 font-medium">Actions Required</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-charcoal-500 mt-2 pt-2 border-t border-ivory-200">
                  <span>{pendingDesignerApplications.length} Designers</span>
                  <span>{pendingProductSubmissions.length} Products</span>
                </div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Channel Sales Bar Chart */}
              <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm">
                <h3 className="font-serif text-base font-bold text-charcoal-900 mb-4">
                  Sales Revenue by Channel (POS vs Online)
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={channelChartData}>
                      <XAxis dataKey="name" stroke="#6D6D6D" fontSize={12} />
                      <YAxis stroke="#6D6D6D" fontSize={11} tickFormatter={(val) => `₹${val / 1000}k`} />
                      <Tooltip formatter={(val: any) => [formatINR(val), 'Revenue']} />
                      <Bar dataKey="revenue" fill="#800020" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Inventory Ownership Pie Chart */}
              <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-ivory-300 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-base font-bold text-charcoal-900 mb-1">
                    Stock Ownership Breakdown
                  </h3>
                  <p className="text-xs text-charcoal-500">Consignment vs Bombay Owned Pieces</p>
                </div>

                <div className="h-48 my-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stockPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        innerRadius={40}
                      >
                        {stockPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-1.5 text-xs pt-3 border-t border-ivory-200">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-burgundy-900 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-burgundy-800"></span> Consignment:
                    </span>
                    <span className="font-mono font-bold">{consignmentStockCount} pcs</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-1.5 text-gold-700 font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-gold-500"></span> Studio Owned:
                    </span>
                    <span className="font-mono font-bold">{bombayOwnedStockCount} pcs</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Audit Trail Snapshot */}
            <div className="bg-white rounded-2xl border border-ivory-300 p-6 shadow-sm">
              <h3 className="font-serif text-base font-bold text-charcoal-900 mb-3">
                Live System Audit Ledger (Immutable)
              </h3>
              <div className="divide-y divide-ivory-200 max-h-56 overflow-y-auto text-xs">
                {auditLogs.slice(0, 8).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-charcoal-800 uppercase text-[10px] bg-ivory-100 px-2 py-0.5 rounded mr-2">
                        {log.action}
                      </span>
                      <span className="text-charcoal-600">{log.entity_type} ID: {log.entity_id}</span>
                    </div>
                    <span className="text-charcoal-400 font-mono text-[10px]">{formatDateTime(log.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Designer Onboarding & Management */}
        {activeTab === 'designers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-lg font-bold text-charcoal-900">
                  Designer Applications & Partner Ateliers ({designers.length})
                </h3>
                <p className="text-xs text-charcoal-500">
                  Review brand applications, configure commission agreements, and track payouts.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {designers.map((d) => (
                <div key={d.id} className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <img
                        src={d.logo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                        alt={d.brand_name}
                        className="w-12 h-12 rounded-xl object-cover border border-ivory-300"
                      />
                      <div>
                        <h4 className="font-serif font-bold text-base text-charcoal-900">{d.brand_name}</h4>
                        <span className="text-xs text-charcoal-500">{d.city}, {d.state} • {d.contact_person}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        d.approval_status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.approval_status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {d.approval_status}
                    </span>
                  </div>

                  <p className="text-xs text-charcoal-600 line-clamp-2">{d.brand_story}</p>

                  <div className="p-3 bg-ivory-50 rounded-xl border border-ivory-200 text-xs space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-charcoal-500">Studio Commission Rate:</span>
                      <strong className="text-burgundy-900">{Math.round(d.default_commission_rate * 100)}% Studio Retained</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-500">Designer Share:</span>
                      <strong className="text-emerald-800">{Math.round((1 - d.default_commission_rate) * 100)}% Designer Payout</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-500">Bank Account:</span>
                      <span>{d.bank_account_number || 'N/A'} (IFSC: {d.bank_ifsc || 'N/A'})</span>
                    </div>
                  </div>

                  {/* Admin Approval Buttons */}
                  {d.approval_status === 'pending' && (
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => {
                          BombayDataStore.reviewDesigner(d.id, 'approved', 0.28, 'Approved by Board');
                          alert(`${d.brand_name} has been approved!`);
                        }}
                        className="flex-1 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition"
                      >
                        Approve Application
                      </button>
                      <button
                        onClick={() => {
                          BombayDataStore.reviewDesigner(d.id, 'rejected', undefined, 'Documentation incomplete');
                          alert(`${d.brand_name} rejected.`);
                        }}
                        className="px-4 py-2 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 font-semibold text-xs transition"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Catalog & Submissions Management */}
        {activeTab === 'catalog' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-lg font-bold text-charcoal-900">
                  Master Saree Catalog ({products.length} Designs)
                </h3>
                <p className="text-xs text-charcoal-500">
                  Publish, review, or archive saree designs. Approved designs can have physical pieces received with barcodes.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-ivory-300 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-ivory-100 text-charcoal-600 uppercase text-[10px] tracking-wider border-y border-ivory-300">
                      <th className="py-3 px-4">Saree Name & Fabric</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Ownership</th>
                      <th className="py-3 px-4">Designer</th>
                      <th className="py-3 px-4 text-right">Retail Price</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-200">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-ivory-50">
                        <td className="py-3 px-4">
                          <p className="font-serif font-bold text-sm text-charcoal-900">{p.name}</p>
                          <span className="text-[10px] text-charcoal-500">{p.fabric} • {p.occasion}</span>
                        </td>
                        <td className="py-3 px-4 font-mono font-semibold text-charcoal-700">{p.sku}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.ownership_type === 'designer_consignment' ? 'bg-burgundy-100 text-burgundy-900' : 'bg-emerald-100 text-emerald-900'
                          }`}>
                            {p.ownership_type === 'designer_consignment' ? 'Consignment' : 'Studio Owned'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-medium text-charcoal-800">
                          {p.designer?.brand_name || 'Bombay Studio'}
                        </td>
                        <td className="py-3 px-4 text-right font-serif font-bold text-burgundy-950">
                          {formatINR(p.price)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            p.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-charcoal-200 text-charcoal-700'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          {p.status === 'pending' ? (
                            <button
                              onClick={() => {
                                BombayDataStore.updateProductStatus(p.id, 'active');
                                alert(`${p.name} approved & published!`);
                              }}
                              className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[11px] font-semibold"
                            >
                              Approve
                            </button>
                          ) : p.status === 'active' ? (
                            <button
                              onClick={() => {
                                BombayDataStore.updateProductStatus(p.id, 'archived');
                                alert(`${p.name} unlisted.`);
                              }}
                              className="px-2.5 py-1 bg-ivory-200 text-charcoal-700 rounded text-[11px] hover:bg-ivory-300"
                            >
                              Archive
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                BombayDataStore.updateProductStatus(p.id, 'active');
                                alert(`${p.name} activated.`);
                              }}
                              className="px-2.5 py-1 bg-emerald-700 text-white rounded text-[11px]"
                            >
                              Reactivate
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

        {/* Tab 4: Physical Inventory & Unique Barcodes */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-charcoal-900">
                  Individual Physical Saree Inventory ({inventory.length} Pieces)
                </h3>
                <p className="text-xs text-charcoal-500">
                  Every physical saree piece is tracked by its unique Code 128 barcode across physical stores and warehouses.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search barcode, location, saree..."
                  className="bg-white border border-ivory-300 rounded-lg px-3 py-1.5 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                />
                <button
                  onClick={() => setShowReceiveModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 text-xs font-semibold shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Receive Stock</span>
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-ivory-300 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-ivory-100 text-charcoal-600 uppercase text-[10px] tracking-wider border-y border-ivory-300">
                      <th className="py-3 px-3">Unique Barcode</th>
                      <th className="py-3 px-3">Saree Title</th>
                      <th className="py-3 px-3">Physical Location</th>
                      <th className="py-3 px-3">Ownership</th>
                      <th className="py-3 px-3">Condition</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Price</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-200">
                    {inventory
                      .filter(
                        (i) =>
                          i.barcode.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                          i.product?.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                          i.location?.name.toLowerCase().includes(inventorySearch.toLowerCase())
                      )
                      .map((item) => (
                        <tr key={item.id} className="hover:bg-ivory-50">
                          <td className="py-3 px-3 font-mono font-bold text-burgundy-900 text-xs flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-gold-600" />
                            <span>{item.barcode}</span>
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-serif font-bold text-charcoal-900">{item.product?.name}</p>
                            <span className="text-[10px] text-charcoal-500 font-mono">SKU: {item.product?.sku}</span>
                          </td>
                          <td className="py-3 px-3 font-medium text-charcoal-700">
                            {item.location?.name}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.ownership_type === 'designer_consignment'
                                ? 'bg-burgundy-50 text-burgundy-900 border border-burgundy-200'
                                : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                            }`}>
                              {item.ownership_type === 'designer_consignment' ? item.designer?.brand_name : 'Bombay Studio'}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.condition === 'sellable' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {item.condition}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === 'available'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'sold'
                                ? 'bg-charcoal-200 text-charcoal-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-serif font-bold text-burgundy-950">
                            {formatINR(item.product?.price)}
                          </td>
                          <td className="py-3 px-3 text-right space-x-1">
                            <button
                              onClick={() => setSelectedBarcodeItem(item)}
                              className="px-2 py-1 rounded bg-ivory-100 hover:bg-gold-100 text-charcoal-800 text-[11px] font-medium border border-ivory-300"
                              title="Print Barcode Tag"
                            >
                              Tag
                            </button>
                            <button
                              onClick={() => {
                                setTransferTargetItem(item);
                                setShowTransferModal(true);
                              }}
                              className="px-2 py-1 rounded bg-ivory-100 hover:bg-blue-100 text-charcoal-800 text-[11px] font-medium border border-ivory-300"
                              title="Transfer Location"
                            >
                              Transfer
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

        {/* Tab 5: Omnichannel Orders & POS Transactions */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <h3 className="font-serif text-lg font-bold text-charcoal-900">
              Omnichannel Sales Ledger ({sales.length} Transactions)
            </h3>

            <div className="bg-white rounded-2xl border border-ivory-300 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-ivory-100 text-charcoal-600 uppercase text-[10px] tracking-wider border-y border-ivory-300">
                      <th className="py-3 px-4">Invoice / Order #</th>
                      <th className="py-3 px-4">Channel</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Items / Barcodes</th>
                      <th className="py-3 px-4 text-right">Total Payable</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-200">
                    {sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-ivory-50">
                        <td className="py-3 px-4 font-mono font-bold text-burgundy-900">{sale.sale_number}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            sale.channel === 'pos' ? 'bg-purple-100 text-purple-900' : 'bg-blue-100 text-blue-900'
                          }`}>
                            {sale.channel === 'pos' ? 'Store POS' : 'Online Store'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-charcoal-600">{formatDateTime(sale.created_at)}</td>
                        <td className="py-3 px-4 font-medium text-charcoal-900">{sale.customer_name || 'Walk-in Client'}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-charcoal-800 block">{sale.items?.length || 1} piece(s)</span>
                          <span className="text-[10px] text-charcoal-400 font-mono">
                            {sale.items?.[0]?.barcode_snapshot}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-serif font-bold text-sm text-burgundy-950">
                          {formatINR(sale.total_payable)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                            {sale.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedInvoiceSale(sale)}
                            className="px-3 py-1 rounded bg-ivory-100 hover:bg-gold-100 text-burgundy-900 font-semibold border border-ivory-300 text-xs"
                          >
                            Tax Invoice
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

        {/* Tab 6: Designer Settlements & Payouts Engine */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-serif text-lg font-bold text-charcoal-900">
                  Designer Settlement Ledger & Batch Payouts
                </h3>
                <p className="text-xs text-charcoal-500">
                  Formula: Eligible Sale Amount = Final discounted item price excluding applicable taxes.
                  Payout batches lock eligible items and execute bank transfers.
                </p>
              </div>
            </div>

            {/* Designer Balances Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {designers.filter(d => d.approval_status === 'approved').map((d) => {
                const dAllocs = allocations.filter((a) => a.designer_id === d.id);
                const eligibleAmt = dAllocs
                  .filter((a) => a.status === 'eligible')
                  .reduce((sum, a) => sum + a.designer_amount, 0);

                return (
                  <div key={d.id} className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-serif font-bold text-sm text-charcoal-900">{d.brand_name}</h4>
                      <span className="text-[10px] text-charcoal-500 font-mono">{dAllocs.length} sales allocated</span>
                    </div>

                    <div className="p-3 bg-ivory-50 rounded-xl border border-ivory-200">
                      <span className="text-[11px] text-charcoal-500 uppercase block font-semibold">Cleared for Direct Payout</span>
                      <span className="font-serif text-xl font-bold text-emerald-900 mt-0.5 block">
                        {formatINR(eligibleAmt)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleCreatePayoutBatch(d.id)}
                      disabled={eligibleAmt <= 0}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs tracking-wider uppercase transition shadow-sm ${
                        eligibleAmt > 0
                          ? 'bg-burgundy-900 hover:bg-burgundy-950 text-gold-300'
                          : 'bg-charcoal-200 text-charcoal-400 cursor-not-allowed'
                      }`}
                    >
                      Create Payout Batch ({formatINR(eligibleAmt)})
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Payout Batches Table */}
            <div className="bg-white rounded-2xl border border-ivory-300 p-5 shadow-sm space-y-3">
              <h4 className="font-serif font-bold text-sm text-charcoal-900">Disbursed Payout Batches</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-ivory-100 text-charcoal-600 uppercase text-[10px] tracking-wider border-y border-ivory-300">
                      <th className="py-2.5 px-3">Batch Number</th>
                      <th className="py-2.5 px-3">Designer</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Destination Account</th>
                      <th className="py-2.5 px-3 text-right">Disbursed Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ivory-200">
                    {payouts.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-charcoal-400 italic">
                          No payout batches created yet.
                        </td>
                      </tr>
                    ) : (
                      payouts.map((p) => (
                        <tr key={p.id} className="hover:bg-ivory-50">
                          <td className="py-3 px-3 font-mono font-bold text-burgundy-900">{p.payout_number}</td>
                          <td className="py-3 px-3 font-semibold text-charcoal-900">{p.designer?.brand_name}</td>
                          <td className="py-3 px-3 text-charcoal-600">{formatDate(p.created_at)}</td>
                          <td className="py-3 px-3 font-mono text-[11px] text-charcoal-600">{p.bank_account_snapshot}</td>
                          <td className="py-3 px-3 text-right font-serif font-bold text-sm text-charcoal-900">{formatINR(p.amount)}</td>
                          <td className="py-3 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              p.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {p.status === 'approved' && (
                              <button
                                onClick={() => handleSettlePayout(p.id)}
                                className="px-3 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition"
                              >
                                Settle Bank Transfer
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Reports & CSV Export Center */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl border border-ivory-300 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="font-serif text-lg font-bold text-charcoal-900">
                Official Business Reports & Data Exports
              </h3>
              <p className="text-xs text-charcoal-500">
                Export verified accounting datasets for GST reconciliation, inventory valuation, and designer settlement audits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 bg-ivory-50 rounded-xl border border-ivory-200 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-burgundy-100 text-burgundy-900 flex items-center justify-center mb-3">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-charcoal-900">Omnichannel Sales Report</h4>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Daily sales, invoices, GST breakdowns, payments, and channel attribution.
                  </p>
                </div>
                <button
                  onClick={exportSalesCsv}
                  className="w-full py-2.5 px-3 rounded-lg bg-burgundy-900 text-gold-300 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-burgundy-950 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Sales CSV</span>
                </button>
              </div>

              <div className="p-5 bg-ivory-50 rounded-xl border border-ivory-200 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-gold-100 text-gold-900 flex items-center justify-center mb-3">
                    <Barcode className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-charcoal-900">Physical Saree Inventory</h4>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Every piece's unique barcode, stock status, location, ownership, and acquisition cost.
                  </p>
                </div>
                <button
                  onClick={exportInventoryCsv}
                  className="w-full py-2.5 px-3 rounded-lg bg-burgundy-900 text-gold-300 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-burgundy-950 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Stock CSV</span>
                </button>
              </div>

              <div className="p-5 bg-ivory-50 rounded-xl border border-ivory-200 flex flex-col justify-between space-y-4">
                <div>
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center mb-3">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <h4 className="font-serif font-bold text-sm text-charcoal-900">Settlement Ledger Report</h4>
                  <p className="text-xs text-charcoal-500 mt-1">
                    Designer commission allocations, return reversals, and paid batch records.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const headers = ['Designer', 'Allocation ID', 'Amount', 'Date', 'Type'];
                    const rows = allocations.map((a) => [
                      `"${a.designer?.brand_name || ''}"`,
                      a.id,
                      a.designer_amount.toString(),
                      a.created_at,
                      a.status,
                    ]);
                    exportCsv(`bombay_saree_settlement_${Date.now()}.csv`, [headers, ...rows]);
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-burgundy-900 text-gold-300 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-burgundy-950 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Ledger CSV</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 8: Settings & Tax Configuration */}
        {activeTab === 'settings' && (
          <div className="bg-white rounded-2xl border border-ivory-300 p-6 shadow-sm space-y-6">
            <h3 className="font-serif text-lg font-bold text-charcoal-900">
              Bombay Saree Retail & Omnichannel Parameters
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-ivory-50 rounded-xl border border-ivory-200 space-y-1">
                <span className="font-semibold text-charcoal-500 uppercase block">Currency Representation</span>
                <p className="font-serif text-base font-bold text-charcoal-900">INR (₹) — Indian Rupee</p>
                <p className="text-charcoal-500">Exact numeric storage with defined precision.</p>
              </div>

              <div className="p-4 bg-ivory-50 rounded-xl border border-ivory-200 space-y-1">
                <span className="font-semibold text-charcoal-500 uppercase block">Applicable GST on Sarees</span>
                <p className="font-serif text-base font-bold text-charcoal-900">5.0% (HSN 5007 Silk Sarees)</p>
                <p className="text-charcoal-500">CGST 2.5% + SGST 2.5% for intra-state Maharashtra supply.</p>
              </div>

              <div className="p-4 bg-ivory-50 rounded-xl border border-ivory-200 space-y-1">
                <span className="font-semibold text-charcoal-500 uppercase block">Return & Exchange Window</span>
                <p className="font-serif text-base font-bold text-charcoal-900">7 Days Post-Delivery</p>
                <p className="text-charcoal-500">Settlements to designers clear only after this window expires.</p>
              </div>

              <div className="p-4 bg-ivory-50 rounded-xl border border-ivory-200 space-y-1">
                <span className="font-semibold text-charcoal-500 uppercase block">Barcode Encoding Standard</span>
                <p className="font-serif text-base font-bold text-charcoal-900">Code 128 (High-Density Retail)</p>
                <p className="text-charcoal-500">Compatible with USB / Bluetooth HID handheld laser scanners.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Receive Stock Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-ivory-300 overflow-hidden flex flex-col">
            <div className="bg-burgundy-950 text-ivory-100 px-6 py-4 flex items-center justify-between border-b border-gold-600/30">
              <h3 className="font-serif text-base font-bold">Receive Physical Saree Stock (Barcode Tagging)</h3>
              <button onClick={() => setShowReceiveModal(false)} className="p-1 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiveStock} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-charcoal-700 block mb-1">Select Catalog Saree</label>
                <select
                  value={receiveProductId}
                  onChange={(e) => setReceiveProductId(e.target.value)}
                  required
                  className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2.5 font-medium text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                >
                  <option value="">-- Choose Saree Design --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.sku}) — {p.ownership_type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-charcoal-700 block mb-1">Receiving Destination</label>
                  <select
                    value={receiveLocationId}
                    onChange={(e) => setReceiveLocationId(e.target.value)}
                    className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2 font-medium"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-charcoal-700 block mb-1">Acquisition Cost (₹)</label>
                  <input
                    type="number"
                    value={receiveCost}
                    onChange={(e) => setReceiveCost(Number(e.target.value))}
                    className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-charcoal-700 block mb-1">
                  Unique Barcode(s) to Assign (One per line, or leave empty for auto-generation)
                </label>
                <textarea
                  value={receiveBarcodes}
                  onChange={(e) => setReceiveBarcodes(e.target.value)}
                  placeholder={`BS-KAN-003\nBS-KAN-004`}
                  rows={3}
                  className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-burgundy-800"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-bold uppercase tracking-wider text-xs transition shadow-luxury"
              >
                Intake Stock & Register Barcodes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Inter-Store Transfer Modal */}
      {showTransferModal && transferTargetItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-ivory-300 overflow-hidden">
            <div className="bg-charcoal-900 text-ivory-100 px-5 py-3.5 flex items-center justify-between">
              <h3 className="font-serif text-sm font-bold">Inter-Store Physical Transfer</h3>
              <button onClick={() => setShowTransferModal(false)} className="p-1 hover:text-white rounded">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <p>
                Transfer piece <strong className="font-mono text-burgundy-900">{transferTargetItem.barcode}</strong> ({transferTargetItem.product?.name})
              </p>

              <div>
                <label className="font-semibold text-charcoal-700 block mb-1">Destination Location</label>
                <select
                  value={transferTargetLocation}
                  onChange={(e) => setTransferTargetLocation(e.target.value)}
                  className="w-full bg-ivory-50 border border-ivory-300 rounded-lg p-2"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleTransferStock}
                className="w-full py-2.5 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-semibold text-xs transition"
              >
                Confirm Physical Transfer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Modal Preview */}
      <BarcodeModal
        item={selectedBarcodeItem}
        onClose={() => setSelectedBarcodeItem(null)}
      />

      {/* Invoice Modal Preview */}
      <InvoiceModal
        sale={selectedInvoiceSale}
        onClose={() => setSelectedInvoiceSale(null)}
      />
    </div>
  );
};
