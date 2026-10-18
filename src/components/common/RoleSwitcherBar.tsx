import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppRole } from '../../types/database';
import { ShoppingBag, Store, Palette, ShieldCheck, RefreshCw, UserCheck, LogOut } from 'lucide-react';
import { BombayDataStore } from '../../lib/storage';
import { isSupabaseConfigured } from '../../lib/supabase';

export const RoleSwitcherBar: React.FC = () => {
  const { currentRole, setRole, user, currentDesigner, allDesigners, logout } = useAuth();

  const handleReset = () => {
    if (window.confirm('Reset all demo data (inventory, sales, ledger) to initial state?')) {
      BombayDataStore.resetToDefaults();
    }
  };

  const roles: { role: AppRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      role: 'admin',
      label: 'Admin Studio',
      icon: <ShieldCheck className="w-4 h-4" />,
      desc: 'Executive Control, Approvals & Barcodes',
    },
    {
      role: 'customer',
      label: 'Customer Store',
      icon: <ShoppingBag className="w-4 h-4" />,
      desc: 'Preview Boutique as Shopper',
    },
    {
      role: 'staff',
      label: 'Store POS',
      icon: <Store className="w-4 h-4" />,
      desc: 'POS Barcode Billing Terminal',
    },
    {
      role: 'designer',
      label: 'Designer Portal',
      icon: <Palette className="w-4 h-4" />,
      desc: 'Consignments & Ledger',
    },
  ];

  return (
    <div className="bg-charcoal-950 text-ivory-100 text-xs border-b border-gold-600/40 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-lg no-print sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-500/20 text-gold-300 border border-gold-400/40">
          <ShieldCheck className="w-3.5 h-3.5 text-gold-400" />
          <span>Admin Superpowers</span>
        </span>
        <span className="text-charcoal-500 hidden sm:inline">|</span>
        <span className="text-ivory-300 hidden md:inline font-medium">
          Executive Omnichannel Console
        </span>
        {isSupabaseConfigured && (
          <span className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/80 text-emerald-400 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Supabase Live
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 bg-charcoal-900/90 p-1 rounded-xl border border-charcoal-800">
        <span className="text-[10px] text-charcoal-400 px-1 font-semibold uppercase tracking-wider hidden sm:inline">
          View Mode:
        </span>
        {roles.map((item) => {
          const isActive = currentRole === item.role;
          return (
            <button
              key={item.role}
              onClick={() => setRole(item.role)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                isActive
                  ? 'bg-burgundy-900 text-gold-300 shadow-sm border border-gold-500/40 font-bold'
                  : 'text-charcoal-300 hover:text-ivory-100 hover:bg-charcoal-800'
              }`}
              title={item.desc}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        {/* If in designer mode, allow quick switching between approved/pending designers */}
        {currentRole === 'designer' && (
          <div className="flex items-center gap-1.5 bg-charcoal-900 px-2 py-0.5 rounded-lg border border-gold-600/30">
            <span className="text-charcoal-400 text-[10px]">Preview Atelier:</span>
            <select
              value={currentDesigner?.id}
              onChange={(e) => setRole('designer', e.target.value)}
              className="bg-transparent text-gold-300 font-medium text-xs focus:outline-none cursor-pointer"
            >
              {allDesigners.map((d) => (
                <option key={d.id} value={d.id} className="bg-charcoal-900 text-ivory-100">
                  {d.brand_name} ({d.approval_status})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center gap-1.5 text-charcoal-300">
          <UserCheck className="w-3.5 h-3.5 text-gold-400" />
          <span className="font-medium text-ivory-200 hidden lg:inline">{user.full_name}</span>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-charcoal-800/80 hover:bg-charcoal-800 text-charcoal-400 hover:text-gold-300 border border-charcoal-700 transition text-[11px]"
          title="Reset database and localStorage to initial seeded state"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>

        <button
          onClick={logout}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-burgundy-950 hover:bg-red-900 text-red-200 border border-red-500/30 transition text-[11px] font-semibold"
          title="Exit Admin mode and return to customer shopping"
        >
          <LogOut className="w-3 h-3" />
          <span className="hidden sm:inline">Exit Admin</span>
        </button>
      </div>
    </div>
  );
};
