import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  Store,
  ShieldCheck,
  Sparkles,
  Lock,
  Mail,
  User,
  KeyRound,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'customer' | 'staff' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'customer',
}) => {
  const {
    loginAsCustomer,
    loginAsStaff,
    loginAsAdmin,
    loginWithGoogle,
  } = useAuth();

  // If initialTab is staff/admin, open in partner gateway mode; otherwise pure customer mode
  const [isPartnerGateway, setIsPartnerGateway] = useState<boolean>(initialTab !== 'customer');
  const [partnerTab, setPartnerTab] = useState<'staff' | 'admin'>(
    initialTab === 'admin' ? 'admin' : 'staff'
  );

  // Customer Form State
  const [customerMode, setCustomerMode] = useState<'signin' | 'signup'>('signin');
  const [custEmail, setCustEmail] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custName, setCustName] = useState('');

  // Staff POS PIN State
  const [staffPin, setStaffPin] = useState('4567');
  const [staffError, setStaffError] = useState('');

  // Admin Passcode State
  const [adminPasscode, setAdminPasscode] = useState('admin123');
  const [adminError, setAdminError] = useState('');

  if (!isOpen) return null;

  // Handle Customer Submit
  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsCustomer({
      email: custEmail || 'priya.mehta@example.com',
      name: custName || 'Priya Mehta',
    });
    onClose();
  };

  // Handle Staff PIN
  const handleStaffLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffError('');
    const ok = loginAsStaff(staffPin);
    if (ok) {
      onClose();
    } else {
      setStaffError('Invalid Cashier PIN. (Default demo PIN is 4567)');
    }
  };

  // Handle Admin Passcode
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    const ok = loginAsAdmin(adminPasscode);
    if (ok) {
      onClose();
    } else {
      setAdminError('Invalid Admin credentials. (Default demo is admin123)');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gold-500/30 flex flex-col max-h-[92vh]">
        {/* Modal Header: 30% Royal Burgundy */}
        <div className="bg-gradient-to-r from-burgundy-950 via-burgundy-900 to-burgundy-950 p-6 text-white relative border-b border-gold-500/30">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-ivory-200 transition"
          >
            <X className="w-5 h-5" />
          </button>

          {!isPartnerGateway ? (
            /* Standard Customer Header */
            <div>
              <div className="flex items-center gap-2 text-gold-400 text-xs font-serif uppercase tracking-[0.2em] mb-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bombay Saree Studio</span>
              </div>
              <h3 className="font-serif text-2xl font-bold text-ivory-50">
                {customerMode === 'signin' ? 'Sign In to Your Account' : 'Create Customer Account'}
              </h3>
              <p className="text-xs text-ivory-200/80 font-light mt-0.5">
                Access curated bridal trousseaus, wishlist heirlooms & track studio orders.
              </p>
            </div>
          ) : (
            /* Staff / Admin Gateway Header */
            <div>
              <button
                onClick={() => setIsPartnerGateway(false)}
                className="flex items-center gap-1.5 text-xs text-gold-300 hover:text-white mb-2 font-medium transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Customer Store</span>
              </button>
              <h3 className="font-serif text-2xl font-bold text-ivory-50">
                Studio Staff & Admin Portal
              </h3>
              <p className="text-xs text-ivory-200/80 font-light mt-0.5">
                Restricted access for Kala Ghoda store cashiers and studio administrators.
              </p>

              {/* Partner Tabs: POS & Admin Only */}
              <div className="grid grid-cols-2 gap-2 mt-4 bg-charcoal-950/60 p-1.5 rounded-2xl border border-gold-500/20 text-xs">
                <button
                  type="button"
                  onClick={() => setPartnerTab('staff')}
                  className={`py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
                    partnerTab === 'staff'
                      ? 'bg-gold-500 text-burgundy-950 font-bold shadow-md'
                      : 'text-ivory-300 hover:text-white'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Store POS Register</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPartnerTab('admin')}
                  className={`py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
                    partnerTab === 'admin'
                      ? 'bg-gold-500 text-burgundy-950 font-bold shadow-md'
                      : 'text-ivory-300 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Studio</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body: 60% Ivory Canvas */}
        <div className="p-6 overflow-y-auto space-y-5 bg-[#FAF8F5]">
          {/* ========================================================================= */}
          {/* CUSTOMER MODE (DEFAULT FOR SHOPPERS) */}
          {/* ========================================================================= */}
          {!isPartnerGateway && (
            <div className="space-y-4">
              {/* Google OAuth Login */}
              <button
                onClick={async () => {
                  await loginWithGoogle();
                  onClose();
                }}
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl border border-ivory-300 bg-white hover:bg-ivory-100 text-charcoal-800 font-semibold text-xs transition shadow-sm hover:scale-[1.01]"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2 0 10.04 0 12s.46 3.8 1.27 5.42l4.01-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="h-px bg-ivory-300 flex-1" />
                <span className="text-[11px] font-mono text-charcoal-400 uppercase tracking-widest">
                  or email sign in
                </span>
                <div className="h-px bg-ivory-300 flex-1" />
              </div>

              {/* Email Form */}
              <form onSubmit={handleCustomerSubmit} className="space-y-3.5">
                {customerMode === 'signup' && (
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        placeholder="e.g. Priya Mehta"
                        className="w-full bg-white border border-ivory-300 rounded-xl py-2.5 pl-10 pr-4 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                      />
                      <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      placeholder="e.g. priya.mehta@example.com"
                      className="w-full bg-white border border-ivory-300 rounded-xl py-2.5 pl-10 pr-4 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                    />
                    <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={custPassword}
                      onChange={(e) => setCustPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-white border border-ivory-300 rounded-xl py-2.5 pl-10 pr-4 text-xs text-charcoal-900 focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                    />
                    <Lock className="w-4 h-4 text-charcoal-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* 3D Tactile CTA Button */}
                <button
                  type="submit"
                  className="btn-3d-gold w-full py-3.5 rounded-2xl font-serif font-bold text-xs tracking-wider"
                >
                  {customerMode === 'signin' ? 'Sign In as Shopper' : 'Create Boutique Account'}
                </button>
              </form>

              {/* Toggle Signin / Signup */}
              <div className="text-center text-xs text-charcoal-500 pt-1">
                {customerMode === 'signin' ? (
                  <span>
                    New to Bombay Saree?{' '}
                    <button
                      onClick={() => setCustomerMode('signup')}
                      className="font-bold text-burgundy-900 hover:underline"
                    >
                      Create an account
                    </button>
                  </span>
                ) : (
                  <span>
                    Already registered?{' '}
                    <button
                      onClick={() => setCustomerMode('signin')}
                      className="font-bold text-burgundy-900 hover:underline"
                    >
                      Sign In here
                    </button>
                  </span>
                )}
              </div>

              {/* Discreet Staff & Admin Gateway Link */}
              <div className="pt-4 border-t border-ivory-300 text-center">
                <button
                  type="button"
                  onClick={() => setIsPartnerGateway(true)}
                  className="text-[11px] text-charcoal-500 hover:text-burgundy-900 transition flex items-center justify-center gap-1 mx-auto font-medium"
                >
                  <KeyRound className="w-3.5 h-3.5 text-gold-600" />
                  <span>Store Staff or Studio Admin? Enter Gateway →</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PARTNER GATEWAY: STAFF POS (PIN 4567) */}
          {/* ========================================================================= */}
          {isPartnerGateway && partnerTab === 'staff' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-ivory-100 border border-ivory-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-serif font-bold text-burgundy-950">
                  <Store className="w-4 h-4 text-gold-600" />
                  <span>Kala Ghoda Studio Register #1</span>
                </div>
                <p className="text-charcoal-600 font-light">
                  Enter your assigned Cashier Security PIN to launch the omnichannel POS billing terminal.
                </p>
                <div className="text-[11px] font-mono text-gold-800 pt-1 font-semibold">
                  Demo Cashier PIN: <span className="underline">4567</span>
                </div>
              </div>

              {staffError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{staffError}</span>
                </div>
              )}

              <form onSubmit={handleStaffLogin} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                    4-Digit Cashier PIN
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value)}
                    placeholder="Enter PIN (4567)"
                    className="w-full bg-white border border-ivory-300 rounded-2xl py-3 px-4 text-center text-xl tracking-[0.4em] font-mono font-bold text-burgundy-950 focus:outline-none focus:ring-2 focus:ring-burgundy-900 shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-3d-burgundy w-full py-3.5 rounded-2xl font-serif font-bold text-xs tracking-wider"
                >
                  Unlock POS Terminal
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PARTNER GATEWAY: EXECUTIVE ADMIN */}
          {/* ========================================================================= */}
          {isPartnerGateway && partnerTab === 'admin' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-ivory-100 border border-ivory-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-serif font-bold text-burgundy-950">
                  <ShieldCheck className="w-4 h-4 text-gold-600" />
                  <span>Executive Studio Administration</span>
                </div>
                <p className="text-charcoal-600 font-light">
                  Direct access to upload new saree designs, issue certified barcodes, and oversee store POS transactions.
                </p>
                <div className="text-[11px] font-mono text-gold-800 pt-1 font-semibold">
                  Demo Passcode: <span className="underline">admin123</span>
                </div>
              </div>

              {adminError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                    Master Administrator Passcode
                  </label>
                  <input
                    type="password"
                    value={adminPasscode}
                    onChange={(e) => setAdminPasscode(e.target.value)}
                    placeholder="Enter admin passcode (admin123)"
                    className="w-full bg-white border border-ivory-300 rounded-2xl py-3 px-4 text-xs font-mono text-burgundy-950 focus:outline-none focus:ring-2 focus:ring-burgundy-900 shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-3d-burgundy w-full py-3.5 rounded-2xl font-serif font-bold text-xs tracking-wider"
                >
                  Enter Executive Studio
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
