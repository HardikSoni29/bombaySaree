import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppRole, UserProfile, DesignerProfile } from '../types/database';
import { BombayDataStore } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile;
  currentRole: AppRole;
  currentDesigner?: DesignerProfile;
  isAuthenticated: boolean;
  isGuest: boolean;
  setRole: (role: AppRole, designerId?: string) => void;
  loginAsCustomer: (details?: { email?: string; name?: string }) => void;
  loginAsDesigner: (designerId: string) => void;
  applyAsDesigner: (data: Partial<DesignerProfile>) => DesignerProfile;
  loginAsStaff: (pin: string) => boolean;
  loginAsAdmin: (passcode?: string) => boolean;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  allDesigners: DesignerProfile[];
  refreshDesigners: () => void;
}

const defaultGuestUser: UserProfile = {
  id: 'guest-customer',
  full_name: 'Guest Shopper',
  email: 'guest@bombaysaree.com',
  role: 'customer',
  created_at: new Date().toISOString(),
};

export const defaultMockProfiles: Record<AppRole, UserProfile> = {
  customer: {
    id: 'user-cust-ananya',
    full_name: 'Ananya Singhania',
    email: 'ananya.singhania@heritage.org',
    phone: '+91 98200 11984',
    avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    role: 'customer',
    created_at: '2026-01-20T10:00:00Z',
  },
  staff: {
    id: 'user-staff-priya',
    full_name: 'Priya Sharma (Cashier & Drape Stylist)',
    email: 'priya.sharma@bombaysaree.com',
    phone: '+91 98220 33411',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    role: 'staff',
    created_at: '2026-01-10T09:00:00Z',
  },
  designer: {
    id: 'user-designer-rawmango',
    full_name: 'Sanjay Garg (Raw Mango Atelier)',
    email: 'atelier@rawmango.in',
    phone: '+91 98200 45112',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    role: 'designer',
    created_at: '2026-01-15T09:00:00Z',
  },
  admin: {
    id: 'user-admin-aarav',
    full_name: 'Aarav Mehta (Executive Director)',
    email: 'aarav@bombaysaree.com',
    phone: '+91 98201 99887',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    role: 'admin',
    created_at: '2026-01-01T08:00:00Z',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always default to customer mode for any visitor
  const [currentRole, setCurrentRole] = useState<AppRole>(() => {
    const saved = localStorage.getItem('bombay_active_role') as AppRole;
    return saved || 'customer';
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('bombay_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {}
    }
    const role = (localStorage.getItem('bombay_active_role') as AppRole) || 'customer';
    return defaultMockProfiles[role] || defaultGuestUser;
  });

  const [selectedDesignerId, setSelectedDesignerId] = useState<string>(() => {
    return localStorage.getItem('bombay_active_designer') || '55555555-5555-5555-5555-555555555501';
  });

  const [designers, setDesigners] = useState<DesignerProfile[]>([]);

  const refreshDesigners = () => {
    setDesigners(BombayDataStore.getDesigners());
  };

  useEffect(() => {
    refreshDesigners();
  }, []);

  const setRole = (role: AppRole, designerId?: string) => {
    setCurrentRole(role);
    localStorage.setItem('bombay_active_role', role);

    const updatedUser = defaultMockProfiles[role];
    setUser(updatedUser);
    localStorage.setItem('bombay_user_profile', JSON.stringify(updatedUser));

    if (designerId) {
      setSelectedDesignerId(designerId);
      localStorage.setItem('bombay_active_designer', designerId);
    }
  };

  // Customer Login (Default)
  const loginAsCustomer = (details?: { email?: string; name?: string }) => {
    const custUser: UserProfile = {
      id: `user-cust-${Date.now()}`,
      full_name: details?.name || 'Ananya Singhania',
      email: details?.email || 'ananya.singhania@heritage.org',
      role: 'customer',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      created_at: new Date().toISOString(),
    };
    setUser(custUser);
    setCurrentRole('customer');
    localStorage.setItem('bombay_user_profile', JSON.stringify(custUser));
    localStorage.setItem('bombay_active_role', 'customer');
  };

  // Designer Login (Existing brand)
  const loginAsDesigner = (designerId: string) => {
    const d = designers.find((x) => x.id === designerId) || designers[0];
    if (d) {
      setSelectedDesignerId(d.id);
      localStorage.setItem('bombay_active_designer', d.id);
      const desUser: UserProfile = {
        id: d.user_id || `user-des-${d.id}`,
        full_name: `${d.contact_person} (${d.brand_name})`,
        email: d.email,
        phone: d.phone,
        role: 'designer',
        avatar_url: d.logo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        created_at: d.created_at || new Date().toISOString(),
      };
      setUser(desUser);
      setCurrentRole('designer');
      localStorage.setItem('bombay_user_profile', JSON.stringify(desUser));
      localStorage.setItem('bombay_active_role', 'designer');
    }
  };

  // Apply as New Designer -> Enters pending status!
  const applyAsDesigner = (data: Partial<DesignerProfile>): DesignerProfile => {
    const newDes = BombayDataStore.applyAsDesigner(data);
    refreshDesigners();

    setSelectedDesignerId(newDes.id);
    localStorage.setItem('bombay_active_designer', newDes.id);

    const desUser: UserProfile = {
      id: newDes.user_id,
      full_name: `${newDes.contact_person} (${newDes.brand_name})`,
      email: newDes.email,
      phone: newDes.phone,
      role: 'designer',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      created_at: newDes.created_at,
    };
    setUser(desUser);
    setCurrentRole('designer');
    localStorage.setItem('bombay_user_profile', JSON.stringify(desUser));
    localStorage.setItem('bombay_active_role', 'designer');

    return newDes;
  };

  // Staff POS Login (PIN: 4567 or staff credentials)
  const loginAsStaff = (pin: string): boolean => {
    if (pin.trim() === '4567' || pin.trim() === '1234' || pin.trim() === 'staff') {
      const staffUser = defaultMockProfiles.staff;
      setUser(staffUser);
      setCurrentRole('staff');
      localStorage.setItem('bombay_user_profile', JSON.stringify(staffUser));
      localStorage.setItem('bombay_active_role', 'staff');
      return true;
    }
    return false;
  };

  // Admin Studio Login (Passcode or Admin email)
  const loginAsAdmin = (passcode?: string): boolean => {
    if (!passcode || passcode === 'admin' || passcode === 'admin123' || passcode.includes('Hardik')) {
      const adminUser = defaultMockProfiles.admin;
      setUser(adminUser);
      setCurrentRole('admin');
      localStorage.setItem('bombay_user_profile', JSON.stringify(adminUser));
      localStorage.setItem('bombay_active_role', 'admin');
      return true;
    }
    return false;
  };

  // Google OAuth via Supabase
  const loginWithGoogle = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        return { success: true };
      } catch (err: any) {
        console.warn('Google OAuth redirected or handled fallback:', err);
      }
    }
    // Instant fallback demo sign in as Google user
    loginAsCustomer({
      email: 'user.google@gmail.com',
      name: 'Google Authenticated Shopper',
    });
    return { success: true };
  };

  // Logout returns to Customer Mode
  const logout = () => {
    localStorage.removeItem('bombay_user_profile');
    localStorage.removeItem('bombay_active_role');
    setUser(defaultGuestUser);
    setCurrentRole('customer');
  };

  const isGuest = user.id === 'guest-customer';
  const isAuthenticated = !isGuest;
  const currentDesigner =
    designers.find((d) => d.id === selectedDesignerId) ||
    designers[0] ||
    ({
      id: 'des-new',
      user_id: user.id,
      brand_name: 'Independent Atelier',
      contact_person: user.full_name,
      email: user.email || 'designer@bombaysaree.com',
      phone: '+91 98000 00000',
      business_address: 'Mumbai',
      city: 'Mumbai',
      state: 'Maharashtra',
      approval_status: 'pending',
      default_commission_rate: 0.3,
      created_at: new Date().toISOString(),
    } as DesignerProfile);

  return (
    <AuthContext.Provider
      value={{
        user,
        currentRole,
        currentDesigner,
        isAuthenticated,
        isGuest,
        setRole,
        loginAsCustomer,
        loginAsDesigner,
        applyAsDesigner,
        loginAsStaff,
        loginAsAdmin,
        loginWithGoogle,
        logout,
        allDesigners: designers,
        refreshDesigners,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
