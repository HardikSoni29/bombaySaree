import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppRole, UserProfile, DesignerProfile } from '../types/database';
import { BombayDataStore } from '../lib/storage';

interface AuthContextType {
  user: UserProfile;
  currentRole: AppRole;
  currentDesigner?: DesignerProfile;
  setRole: (role: AppRole, designerId?: string) => void;
  isAuthenticated: boolean;
  logout: () => void;
  allDesigners: DesignerProfile[];
}

const mockProfiles: Record<AppRole, UserProfile> = {
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
  const [currentRole, setCurrentRole] = useState<AppRole>(() => {
    return (localStorage.getItem('bombay_active_role') as AppRole) || 'customer';
  });

  const [selectedDesignerId, setSelectedDesignerId] = useState<string>(() => {
    return localStorage.getItem('bombay_active_designer') || 'des-raw-mango';
  });

  const [designers, setDesigners] = useState<DesignerProfile[]>([]);

  useEffect(() => {
    setDesigners(BombayDataStore.getDesigners());
  }, []);

  const setRole = (role: AppRole, designerId?: string) => {
    setCurrentRole(role);
    localStorage.setItem('bombay_active_role', role);
    if (designerId) {
      setSelectedDesignerId(designerId);
      localStorage.setItem('bombay_active_designer', designerId);
    }
  };

  const logout = () => {
    setRole('customer');
  };

  const currentUser = mockProfiles[currentRole];
  const currentDesigner = designers.find((d) => d.id === selectedDesignerId) || designers[0];

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        currentRole,
        currentDesigner,
        setRole,
        isAuthenticated: true,
        logout,
        allDesigners: designers,
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
