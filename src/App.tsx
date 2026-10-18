import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { PosProvider } from './context/PosContext';
import { RoleSwitcherBar } from './components/common/RoleSwitcherBar';
import { CustomerMode } from './pages/CustomerMode';
import { StaffPosMode } from './pages/StaffPosMode';
import { DesignerMode } from './pages/DesignerMode';
import { AdminMode } from './pages/AdminMode';
import { BombayDataStore } from './lib/storage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent: React.FC = () => {
  const { currentRole } = useAuth();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bombay_products_v1');
      if (stored && (stored.includes('[object Object]') || !stored.includes('https://'))) {
        localStorage.removeItem('bombay_products_v1');
      }
    } catch {}
    BombayDataStore.syncWithSupabase();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-ivory-50">
      {/* Top Demo & Role Switcher Bar */}
      <RoleSwitcherBar />

      {/* Role-Based Mode Router */}
      <div className="flex-1">
        {currentRole === 'customer' && <CustomerMode />}
        {currentRole === 'staff' && <StaffPosMode />}
        {currentRole === 'designer' && <DesignerMode />}
        {currentRole === 'admin' && <AdminMode />}
      </div>
    </div>
  );
};

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <PosProvider>
              <AppContent />
            </PosProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
