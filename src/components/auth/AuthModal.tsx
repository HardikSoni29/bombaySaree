import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  ShoppingBag,
  Palette,
  Store,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Phone,
  Building,
  KeyRound,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'customer' | 'designer' | 'staff' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'customer',
}) => {
  const {
    loginAsCustomer,
    loginAsDesigner,
    applyAsDesigner,
    loginAsStaff,
    loginAsAdmin,
    loginWithGoogle,
    allDesigners,
  } = useAuth();

  // If initialTab is staff/designer/admin, open in partner gateway mode; otherwise pure customer mode
  const [isPartnerGateway, setIsPartnerGateway] = useState<boolean>(initialTab !== 'customer');
  const [partnerTab, setPartnerTab] = useState<'staff' | 'designer' | 'admin'>(
    initialTab === 'customer' ? 'staff' : initialTab
  );

  // Customer Form State
  const [customerMode, setCustomerMode] = useState<'signin' | 'signup'>('signin');
  const [custEmail, setCustEmail] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custName, setCustName] = useState('');

  // Designer Form State
  const [designerAction, setDesignerAction] = useState<'login' | 'apply'>('login');
  const [brandName, setBrandName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [designerEmail, setDesignerEmail] = useState('');
  const [designerPhone, setDesignerPhone] = useState('');
  const [city, setCity] = useState('Mumbai');
  const [state, setState] = useState('Maharashtra');
  const [brandStory, setBrandStory] = useState('');
  const [selectedExistingDesigner, setSelectedExistingDesigner] = useState<string>(
    allDesigners[0]?.id || ''
  );

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

  // Handle Designer Application Submit
  const handleDesignerApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandName.trim()) {
      alert('Please enter your Brand / Atelier name');
      return;
    }

    applyAsDesigner({
      brand_name: brandName,
      contact_person: contactPerson || 'Designer Lead',
      email: designerEmail || 'atelier@designer.com',
      phone: designerPhone || '+91 98000 12345',
      city,
      state,
      business_address: `${city}, ${state}`,
      brand_story: brandStory || 'Luxury handloom drapes crafted with traditional artisans.',
      default_commission_rate: 0.28,
      approval_status: 'pending',
    });

    onClose();
  };

  // Handle Designer Existing Login
  const handleDesignerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedExistingDesigner) {
      loginAsDesigner(selectedExistingDesigner);
      onClose();
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/75 backdrop-blur-sm animate-fadeIn">
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
                Access curated bridal trousseaus, wishlist heloirloms & track studio orders.
              </p>
            </div>
          ) : (
            /* Staff / Partner Gateway Header */
            <div>
              <button
                onClick={() => setIsPartnerGateway(false)}
                className="flex items-center gap-1.5 text-xs text-gold-300 hover:text-white mb-2 font-medium transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Customer Store</span>
              </button>
              <h3 className="font-serif text-2xl font-bold text-ivory-50">
                Studio Staff & Partner Portal
              </h3>
              <p className="text-xs text-ivory-200/80 font-light mt-0.5">
                Restricted access for Kala Ghoda store staff, consignment designers & studio administrators.
              </p>

              {/* Partner Tabs */}
              <div className="grid grid-cols-3 gap-1.5 mt-4 bg-charcoal-950/60 p-1.5 rounded-2xl border border-gold-500/20 text-xs">
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
                  <span>Store POS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPartnerTab('designer')}
                  className={`py-2 rounded-xl font-medium transition flex items-center justify-center gap-1.5 ${
                    partnerTab === 'designer'
                      ? 'bg-gold-500 text-burgundy-950 font-bold shadow-md'
                      : 'text-ivory-300 hover:text-white'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Designer</span>
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
                  <span>Admin</span>
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
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl border border-ivory-300 bg-white hover:bg-ivory-100 text-charcoal-800 font-semibold text-xs transition shadow-sm"
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

                {/* 10% Gold CTA Button */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold-500 via-gold-400 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-burgundy-950 font-serif font-bold text-xs tracking-wider shadow-md transition"
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

              {/* Discreet Staff & Partner Gateway Link */}
              <div className="pt-4 border-t border-ivory-300 text-center">
                <button
                  type="button"
                  onClick={() => setIsPartnerGateway(true)}
                  className="text-[11px] text-charcoal-500 hover:text-burgundy-900 transition flex items-center justify-center gap-1 mx-auto font-medium"
                >
                  <KeyRound className="w-3.5 h-3.5 text-gold-600" />
                  <span>Store Staff, Designer or Studio Admin? Enter Partner Gateway →</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PARTNER GATEWAY: STAFF POS (PIN 4567) */}
          {/* ========================================================================= */}
          {isPartnerGateway && partnerTab === 'staff' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-ivory-100 border border-ivory-300 text-xs space-y-1">
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
                    className="w-full bg-white border border-ivory-300 rounded-xl py-3 px-4 text-center text-xl tracking-[0.4em] font-mono font-bold text-burgundy-950 focus:outline-none focus:ring-2 focus:ring-burgundy-900 shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-serif font-bold text-xs tracking-wider shadow-md transition"
                >
                  Unlock POS Terminal
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PARTNER GATEWAY: DESIGNER CONSIGNMENT */}
          {/* ========================================================================= */}
          {isPartnerGateway && partnerTab === 'designer' && (
            <div className="space-y-4">
              <div className="flex rounded-xl bg-ivory-200 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setDesignerAction('login')}
                  className={`flex-1 py-1.5 rounded-lg font-serif font-bold transition ${
                    designerAction === 'login'
                      ? 'bg-white text-burgundy-950 shadow-sm'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  Existing Partner Login
                </button>
                <button
                  type="button"
                  onClick={() => setDesignerAction('apply')}
                  className={`flex-1 py-1.5 rounded-lg font-serif font-bold transition ${
                    designerAction === 'apply'
                      ? 'bg-white text-burgundy-950 shadow-sm'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  Apply as New Designer
                </button>
              </div>

              {designerAction === 'login' ? (
                <form onSubmit={handleDesignerLogin} className="space-y-3.5">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-wider text-charcoal-600 block mb-1 font-semibold">
                      Select Approved Atelier Brand:
                    </label>
                    <select
                      value={selectedExistingDesigner}
                      onChange={(e) => setSelectedExistingDesigner(e.target.value)}
                      className="w-full bg-white border border-ivory-300 rounded-xl py-2.5 px-3 text-xs text-charcoal-900 font-serif font-semibold focus:outline-none focus:ring-1 focus:ring-burgundy-900"
                    >
                      {allDesigners.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.brand_name} ({d.city}) — {Math.round(d.default_commission_rate * 100)}% Consignment
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-serif font-bold text-xs tracking-wider shadow-md transition"
                  >
                    Open Designer Dashboard
                  </button>
                </form>
              ) : (
                <form onSubmit={handleDesignerApply} className="space-y-3 text-xs">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-charcoal-600 block mb-1">
                      Brand / Studio Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g. Maya Banaras Loom"
                      className="w-full bg-white border border-ivory-300 rounded-xl py-2 px-3 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-mono text-[10px] uppercase text-charcoal-600 block mb-1">
                        Contact Person
                      </label>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="Lead Designer"
                        className="w-full bg-white border border-ivory-300 rounded-xl py-2 px-3 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase text-charcoal-600 block mb-1">
                        Atelier City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Varanasi / Jaipur"
                        className="w-full bg-white border border-ivory-300 rounded-xl py-2 px-3 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="font-mono text-[10px] uppercase text-charcoal-600 block mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={designerEmail}
                        onChange={(e) => setDesignerEmail(e.target.value)}
                        placeholder="atelier@domain.com"
                        className="w-full bg-white border border-ivory-300 rounded-xl py-2 px-3 text-xs"
                      />
                    </div>
                    <div>
                      <label className="font-mono text-[10px] uppercase text-charcoal-600 block mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={designerPhone}
                        onChange={(e) => setDesignerPhone(e.target.value)}
                        placeholder="+91 98000 00000"
                        className="w-full bg-white border border-ivory-300 rounded-xl py-2 px-3 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-mono text-[10px] uppercase text-charcoal-600 block mb-1">
                      Weaving Heritage & Brand Story
                    </label>
                    <textarea
                      rows={2}
                      value={brandStory}
                      onChange={(e) => setBrandStory(e.target.value)}
                      placeholder="Specialization in hand-loomed kadwa zari..."
                      className="w-full bg-white border border-ivory-300 rounded-xl py-2 px-3 text-xs"
                    />
                  </div>

                  <div className="p-2.5 rounded-lg bg-gold-50 border border-gold-300 text-[11px] text-gold-900 leading-relaxed font-light">
                    * Applications enter a <strong>Pending Approval</strong> state until verified by Bombay Saree Executive Administration.
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-burgundy-950 font-serif font-bold text-xs shadow-md"
                  >
                    Submit Consignment Application
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* PARTNER GATEWAY: EXECUTIVE ADMIN */}
          {/* ========================================================================= */}
          {isPartnerGateway && partnerTab === 'admin' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-ivory-100 border border-ivory-300 text-xs space-y-1">
                <div className="flex items-center gap-2 font-serif font-bold text-burgundy-950">
                  <ShieldCheck className="w-4 h-4 text-gold-600" />
                  <span>Executive Omnichannel Studio Control</span>
                </div>
                <p className="text-charcoal-600 font-light">
                  Full executive control over inventory barcodes, designer commissions & approval, POS audit logs, and studio reports.
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
                    className="w-full bg-white border border-ivory-300 rounded-xl py-3 px-4 text-xs font-mono text-burgundy-950 focus:outline-none focus:ring-2 focus:ring-burgundy-900 shadow-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-300 font-serif font-bold text-xs tracking-wider shadow-md transition"
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
