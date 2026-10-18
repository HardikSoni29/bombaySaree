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
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'customer' | 'designer' | 'staff' | 'admin';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialTab = 'customer' }) => {
  const {
    loginAsCustomer,
    loginAsDesigner,
    applyAsDesigner,
    loginAsStaff,
    loginAsAdmin,
    loginWithGoogle,
    allDesigners,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'customer' | 'designer' | 'staff' | 'admin'>(initialTab);

  // Customer Form State
  const [customerMode, setCustomerMode] = useState<'signin' | 'signup'>('signin');
  const [custEmail, setCustEmail] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [custName, setCustName] = useState('');

  // Designer Form State
  const [designerAction, setDesignerAction] = useState<'apply' | 'login'>('apply');
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
      email: custEmail || 'ananya.singhania@heritage.org',
      name: custName || 'Ananya Singhania',
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
      approval_status: 'pending', // Key requirement: Admin approval required!
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
      setAdminError('Invalid Admin credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gold-500/30 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-burgundy-950 via-burgundy-900 to-burgundy-950 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-ivory-200 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-gold-400 text-xs font-serif uppercase tracking-widest mb-1 font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>Bombay Saree Studio Identity</span>
          </div>
          <h3 className="font-serif text-2xl font-bold text-ivory-50">
            Sign In & Portals
          </h3>
          <p className="text-xs text-ivory-200/80 font-light mt-0.5">
            Select your role to access online shopping, designer collections, POS, or management.
          </p>

          {/* Primary Role Selector Tabs */}
          <div className="grid grid-cols-4 gap-1.5 mt-5 bg-charcoal-900/60 p-1.5 rounded-2xl border border-gold-500/20 text-xs">
            <button
              onClick={() => setActiveTab('customer')}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl font-medium transition ${
                activeTab === 'customer'
                  ? 'bg-gold-500 text-burgundy-950 font-bold shadow-md'
                  : 'text-ivory-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Customer</span>
            </button>

            <button
              onClick={() => setActiveTab('designer')}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl font-medium transition ${
                activeTab === 'designer'
                  ? 'bg-gold-500 text-burgundy-950 font-bold shadow-md'
                  : 'text-ivory-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Palette className="w-4 h-4" />
              <span>Designer</span>
            </button>

            <button
              onClick={() => setActiveTab('staff')}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl font-medium transition ${
                activeTab === 'staff'
                  ? 'bg-gold-500 text-burgundy-950 font-bold shadow-md'
                  : 'text-ivory-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Store POS</span>
            </button>

            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl font-medium transition ${
                activeTab === 'admin'
                  ? 'bg-gold-500 text-burgundy-950 font-bold shadow-md'
                  : 'text-ivory-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* ========================================================================= */}
          {/* TAB 1: CUSTOMER (DEFAULT) */}
          {/* ========================================================================= */}
          {activeTab === 'customer' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h4 className="font-serif text-lg font-bold text-charcoal-900">
                  {customerMode === 'signin' ? 'Welcome Back to Bombay Saree' : 'Create Customer Account'}
                </h4>
                <p className="text-xs text-charcoal-500">
                  By default, all registered users browse and shop our luxury handloom collections.
                </p>
              </div>

              {/* Continue with Google */}
              <button
                onClick={async () => {
                  await loginWithGoogle();
                  onClose();
                }}
                type="button"
                className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-ivory-300 bg-white hover:bg-ivory-100 text-charcoal-800 font-semibold text-xs transition shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-ivory-200"></div>
                <span className="text-[10px] text-charcoal-400 uppercase tracking-widest font-semibold">Or with Email</span>
                <div className="flex-1 h-px bg-ivory-200"></div>
              </div>

              <form onSubmit={handleCustomerSubmit} className="space-y-3">
                {customerMode === 'signup' && (
                  <div>
                    <label className="block text-[11px] font-medium text-charcoal-600 mb-1">Full Name</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        placeholder="Ananya Singhania"
                        required
                        className="w-full bg-ivory-50 border border-ivory-300 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-burgundy-800"
                      />
                      <User className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-medium text-charcoal-600 mb-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={custEmail}
                      onChange={(e) => setCustEmail(e.target.value)}
                      placeholder="ananya@example.com"
                      required
                      className="w-full bg-ivory-50 border border-ivory-300 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-burgundy-800"
                    />
                    <Mail className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-charcoal-600 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={custPassword}
                      onChange={(e) => setCustPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full bg-ivory-50 border border-ivory-300 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-burgundy-800"
                    />
                    <Lock className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 font-semibold text-xs tracking-wider uppercase transition shadow-md"
                >
                  {customerMode === 'signin' ? 'Sign In as Customer' : 'Complete Registration'}
                </button>
              </form>

              <div className="flex items-center justify-between text-[11px] text-charcoal-600 pt-1">
                <span>
                  {customerMode === 'signin' ? "Don't have an account?" : 'Already have an account?'}
                </span>
                <button
                  type="button"
                  onClick={() => setCustomerMode(customerMode === 'signin' ? 'signup' : 'signin')}
                  className="text-burgundy-900 font-bold hover:underline"
                >
                  {customerMode === 'signin' ? 'Create Account' : 'Sign In'}
                </button>
              </div>

              {/* Fast 1-Click Demo Shortcut */}
              <div className="pt-2 border-t border-ivory-200">
                <button
                  type="button"
                  onClick={() => {
                    loginAsCustomer();
                    onClose();
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-ivory-100 hover:bg-ivory-200 text-charcoal-700 text-xs font-medium flex items-center justify-between transition border border-ivory-300"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-gold-600" />
                    <span>Quick Demo: Sign In as Ananya Singhania</span>
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: DESIGNER (APPLY / LOGIN) */}
          {/* ========================================================================= */}
          {activeTab === 'designer' && (
            <div className="space-y-4">
              <div className="flex bg-ivory-100 p-1 rounded-xl text-xs font-medium border border-ivory-200">
                <button
                  type="button"
                  onClick={() => setDesignerAction('apply')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    designerAction === 'apply'
                      ? 'bg-burgundy-900 text-gold-200 shadow-sm font-bold'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  Apply to Sell (New Designer)
                </button>
                <button
                  type="button"
                  onClick={() => setDesignerAction('login')}
                  className={`flex-1 py-1.5 rounded-lg transition ${
                    designerAction === 'login'
                      ? 'bg-burgundy-900 text-gold-200 shadow-sm font-bold'
                      : 'text-charcoal-600 hover:text-charcoal-900'
                  }`}
                >
                  Designer Partner Login
                </button>
              </div>

              {designerAction === 'apply' ? (
                <form onSubmit={handleDesignerApply} className="space-y-3">
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Admin Approval Required:</strong> Once you submit, your account will enter <em>Pending Review</em> status. The Bombay Saree Administrator reviews brand applications and sets your commission rate before saree publishing is unlocked.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-charcoal-600 mb-1">Brand / Atelier Name</label>
                    <input
                      type="text"
                      value={brandName}
                      onChange={(e) => setBrandName(e.target.value)}
                      placeholder="e.g. Chanderi Heritage Guild"
                      required
                      className="w-full bg-ivory-50 border border-ivory-300 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-burgundy-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-charcoal-600 mb-1">Contact Person</label>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        placeholder="Vikramaditya Rao"
                        required
                        className="w-full bg-ivory-50 border border-ivory-300 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-burgundy-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-charcoal-600 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        value={designerPhone}
                        onChange={(e) => setDesignerPhone(e.target.value)}
                        placeholder="+91 98401 22890"
                        required
                        className="w-full bg-ivory-50 border border-ivory-300 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-burgundy-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-charcoal-600 mb-1">Business Email</label>
                    <input
                      type="email"
                      value={designerEmail}
                      onChange={(e) => setDesignerEmail(e.target.value)}
                      placeholder="concierge@atelier.com"
                      required
                      className="w-full bg-ivory-50 border border-ivory-300 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-burgundy-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-charcoal-600 mb-1">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-ivory-50 border border-ivory-300 rounded-xl py-2 px-3 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-charcoal-600 mb-1">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full bg-ivory-50 border border-ivory-300 rounded-xl py-2 px-3 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-charcoal-600 mb-1">Brand Craft & Story</label>
                    <textarea
                      value={brandStory}
                      onChange={(e) => setBrandStory(e.target.value)}
                      placeholder="Describe your weaving craft, GI certification, natural dyes, or bridal aesthetics..."
                      rows={2}
                      className="w-full bg-ivory-50 border border-ivory-300 rounded-xl py-2 px-3 text-xs focus:ring-2 focus:ring-burgundy-800"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 font-semibold text-xs tracking-wider uppercase transition shadow-md flex items-center justify-center gap-2"
                  >
                    <span>Submit Brand Application</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleDesignerLogin} className="space-y-4">
                  <p className="text-xs text-charcoal-600">
                    Select your registered designer atelier to manage live consignment stock, collection approvals, and payouts:
                  </p>

                  <div className="space-y-2">
                    {allDesigners.map((d) => (
                      <label
                        key={d.id}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                          selectedExistingDesigner === d.id
                            ? 'bg-burgundy-50 border-burgundy-800 shadow-sm'
                            : 'bg-ivory-50 border-ivory-300 hover:bg-ivory-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="designerSelect"
                            value={d.id}
                            checked={selectedExistingDesigner === d.id}
                            onChange={() => setSelectedExistingDesigner(d.id)}
                            className="text-burgundy-900 focus:ring-burgundy-800"
                          />
                          <div>
                            <span className="font-serif font-bold text-xs text-charcoal-900 block">
                              {d.brand_name}
                            </span>
                            <span className="text-[10px] text-charcoal-500">
                              {d.city}, {d.state} • {d.contact_person}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            d.approval_status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.approval_status}
                        </span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 font-semibold text-xs tracking-wider uppercase transition shadow-md"
                  >
                    Open Designer Portal
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: STORE STAFF (POS BILLING) */}
          {/* ========================================================================= */}
          {activeTab === 'staff' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Store className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-lg font-bold text-charcoal-900">
                  Store POS Billing Terminal
                </h4>
                <p className="text-xs text-charcoal-500">
                  Dedicated interface for physical store cashiers and barcode billing.
                </p>
              </div>

              <div className="p-3 bg-ivory-50 rounded-xl border border-ivory-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Store Location:</span>
                  <strong className="text-charcoal-900">Kala Ghoda Flagship Studio (Mumbai)</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Assigned Cashier:</span>
                  <strong className="text-charcoal-900">Priya Sharma</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Hardware:</span>
                  <span className="text-emerald-700 font-medium">Barcode Scanner & Thermal Printer Ready</span>
                </div>
              </div>

              <form onSubmit={handleStaffLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-charcoal-600 mb-1">
                    Enter Cashier Security PIN (Default Demo: 4567)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      maxLength={6}
                      value={staffPin}
                      onChange={(e) => setStaffPin(e.target.value)}
                      placeholder="4567"
                      required
                      className="w-full bg-ivory-50 border border-ivory-300 rounded-xl py-2 pl-9 pr-3 text-xs tracking-widest text-center font-mono font-bold text-base focus:ring-2 focus:ring-burgundy-800"
                    />
                    <KeyRound className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
                  </div>
                  {staffError && <p className="text-[11px] text-red-600 font-medium mt-1">{staffError}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 font-semibold text-xs tracking-wider uppercase transition shadow-md"
                >
                  Unlock POS Register & Shifts
                </button>
              </form>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: ADMIN STUDIO */}
          {/* ========================================================================= */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-burgundy-100 text-burgundy-900 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h4 className="font-serif text-lg font-bold text-charcoal-900">
                  Executive Admin Studio
                </h4>
                <p className="text-xs text-charcoal-500">
                  Full control: omnichannel sales analytics, designer review & approvals, physical piece barcode generation, and payout engines.
                </p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-charcoal-600 mb-1">Admin Passcode</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      placeholder="admin123"
                      required
                      className="w-full bg-ivory-50 border border-ivory-300 rounded-xl py-2 pl-9 pr-3 text-xs focus:ring-2 focus:ring-burgundy-800"
                    />
                    <Lock className="w-4 h-4 text-charcoal-400 absolute left-3 top-2.5" />
                  </div>
                  {adminError && <p className="text-[11px] text-red-600 font-medium mt-1">{adminError}</p>}
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-burgundy-900 hover:bg-burgundy-950 text-gold-200 font-semibold text-xs tracking-wider uppercase transition shadow-md"
                >
                  Enter Executive Admin Studio
                </button>
              </form>

              <div className="p-3 bg-ivory-100 rounded-xl border border-ivory-200 text-[11px] text-charcoal-600 space-y-1">
                <strong className="text-charcoal-900 block font-serif">Admin Privileges:</strong>
                <ul className="list-disc list-inside space-y-0.5 text-charcoal-600">
                  <li>Approve pending designer applications with custom commission splits</li>
                  <li>Real-time revenue split: Online Boutique vs POS Register</li>
                  <li>Batch generate & print Code 128 piece barcodes</li>
                  <li>Release consignment payout batches with 7-day dispute checks</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
