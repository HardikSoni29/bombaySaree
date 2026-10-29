import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppRole } from '../../types/database';
import { ShoppingBag, Store, ShieldCheck, RefreshCw, LogOut } from 'lucide-react';
import { BombayDataStore } from '../../lib/storage';
import { isSupabaseConfigured } from '../../lib/supabase';

export const RoleSwitcherBar: React.FC = () => {
  const { currentRole, setRole, logout } = useAuth();

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
      desc: 'Stock Upload, Barcodes & Sales Overview',
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
      desc: 'Kala Ghoda POS Barcode Register',
    },
  ];

  return (
    <div className="bg-charcoal-950 text-ivory-100 text-xs border-b border-gold-600/40 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-lg no-print sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gold-500/20 text-gold-300 border border-gold-400/40 shadow-sm">
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
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
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
        <button
          onClick={handleReset}
          className="text-charcoal-400 hover:text-ivory-200 text-[11px] flex items-center gap-1 transition"
          title="Reset database to initial pristine state"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>

        <span className="text-charcoal-700">|</span>

        <button
          onClick={() => {
            setRole('customer');
            logout();
          }}
          className="text-red-400 hover:text-red-300 text-[11px] flex items-center gap-1 transition"
          title="Exit Admin Console"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Console</span>
        </button>
      </div>
    </div>
  );
};
