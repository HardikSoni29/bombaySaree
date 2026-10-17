import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AppRole } from '../../types/database';
import { ShoppingBag, Store, Palette, ShieldCheck, RefreshCw, UserCheck } from 'lucide-react';
import { BombayDataStore } from '../../lib/storage';

export const RoleSwitcherBar: React.FC = () => {
  const { currentRole, setRole, user, currentDesigner, allDesigners } = useAuth();

  const handleReset = () => {
    if (window.confirm('Reset all demo data (inventory, sales, ledger) to initial state?')) {
      BombayDataStore.resetToDefaults();
    }
  };

  const roles: { role: AppRole; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      role: 'customer',
      label: 'Customer Store',
      icon: <ShoppingBag className="w-4 h-4" />,
      desc: 'Online Boutique & Drapes',
    },
    {
      role: 'staff',
      label: 'Store POS',
      icon: <Store className="w-4 h-4" />,
      desc: 'Barcode Billing & Shift',
    },
    {
      role: 'designer',
      label: 'Designer Portal',
      icon: <Palette className="w-4 h-4" />,
      desc: 'Submissions & Settlements',
    },
    {
      role: 'admin',
      label: 'Admin Studio',
      icon: <ShieldCheck className="w-4 h-4" />,
      desc: 'Executive Control & Barcodes',
    },
  ];

  return (
    <div className="bg-charcoal-950 text-ivory-100 text-xs border-b border-gold-600/30 px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-md no-print sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <span className="font-brand uppercase tracking-widest text-gold-400 font-semibold flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse"></span>
          Bombay Saree
        </span>
        <span className="text-charcoal-400 hidden sm:inline">|</span>
        <span className="text-charcoal-300 hidden md:inline">Omnichannel Retail & Designer Marketplace</span>
      </div>

      <div className="flex items-center gap-1.5 bg-charcoal-900/90 p-1 rounded-lg border border-charcoal-800">
        {roles.map((item) => {
          const isActive = currentRole === item.role;
          return (
            <button
              key={item.role}
              onClick={() => setRole(item.role)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all ${
                isActive
                  ? 'bg-burgundy-800 text-gold-300 shadow-sm border border-gold-500/40'
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
        {/* If in designer mode, allow quick switching between approved designers */}
        {currentRole === 'designer' && (
          <div className="flex items-center gap-1.5 bg-charcoal-900 px-2 py-0.5 rounded border border-gold-600/20">
            <span className="text-charcoal-400">Viewing as:</span>
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
          className="flex items-center gap-1 px-2 py-0.5 rounded bg-charcoal-800/80 hover:bg-charcoal-800 text-charcoal-400 hover:text-gold-300 border border-charcoal-700 transition"
          title="Reset database and localStorage to initial seeded state"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>
      </div>
    </div>
  );
};
