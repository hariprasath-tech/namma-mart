import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { BottomTabBar } from './components/layout/BottomTabBar';
import { LocationModal } from './components/layout/LocationModal';

import { SplashPage } from './pages/SplashPage';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { ComparePage } from './pages/ComparePage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersListPage } from './pages/OrdersListPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { ShopPage } from './pages/ShopPage';
import { ShopDashboardPage } from './pages/ShopDashboardPage';
import { AccountPage } from './pages/AccountPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OfflinePage } from './pages/OfflinePage';

function AppLayout({ children }: { children: React.ReactNode }) {
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const location = useLocation();

  const isSplash = location.pathname === '/splash';

  if (isSplash) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9F4] text-[#14201B]">
      <Header onOpenLocationModal={() => setIsLocationModalOpen(true)} />
      
      <main className="flex-1 pb-16 md:pb-6">
        {children}
      </main>

      <Footer />
      <BottomTabBar />

      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </div>
  );
}

// Initial splash session redirect check
function SessionSplashRedirect() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const splashSeen = sessionStorage.getItem('localkart_splash_seen');
    if (!splashSeen && location.pathname === '/') {
      sessionStorage.setItem('localkart_splash_seen', 'true');
      navigate('/splash', { replace: true });
    }
  }, [navigate, location.pathname]);

  return null;
}

export function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOffline) {
    return <OfflinePage />;
  }

  return (
    <BrowserRouter>
      <SessionSplashRedirect />
      <AppLayout>
        <Routes>
          <Route path="/splash" element={<SplashPage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersListPage />} />
          <Route path="/orders/:orderId" element={<OrderTrackingPage />} />
          <Route path="/shop" element={<ShopDashboardPage />} />
          <Route path="/shop/:shopId" element={<ShopPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
