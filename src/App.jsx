import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import SplashScreen from '@/components/SplashScreen'
import { queryClientInstance } from '@/lib/query-client'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AdminOrderHistory from './pages/AdminOrderHistory';
import AdminManageAdmins from './pages/AdminManageAdmins';
import AdminReceipts from './pages/AdminReceipts';
import Support from './pages/Support';
import StoreManager from './pages/StoreManager';
import AdminLimited from './pages/AdminLimited';
import AdminGiftCards from './pages/AdminGiftCards';
import GiftCards from './pages/GiftCards';
import Wishlist from './pages/Wishlist';
import AdminWallets from './pages/AdminWallets';
import BirthdayReward from './pages/BirthdayReward';
import AdminBirthdaySubmissions from './pages/AdminBirthdaySubmissions';
import AdminStockAlerts from './pages/AdminStockAlerts';
import AdminNotifications from './pages/AdminNotifications';
import Account from './pages/Account';
import Family from './pages/Family';
import Wallet from './pages/Wallet';
import Driver from './pages/Driver';

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return (
        <div className="fixed inset-0 flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-2">Account not registered</h1>
            <p className="text-slate-600">Your account is not registered for this app. Please sign in with a registered account.</p>
          </div>
        </div>
      );
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/" element={
        <LayoutWrapper currentPageName={mainPageKey}>
          <MainPage />
        </LayoutWrapper>
      } />
      {Object.entries(Pages).map(([path, Page]) => (
        <Route
          key={path}
          path={`/${path}`}
          element={
            <LayoutWrapper currentPageName={path}>
              <Page />
            </LayoutWrapper>
          }
        />
      ))}
      <Route path="/AdminOrderHistory" element={<LayoutWrapper currentPageName="AdminOrderHistory"><AdminOrderHistory /></LayoutWrapper>} />
      <Route path="/StoreManager" element={<LayoutWrapper currentPageName="StoreManager"><StoreManager /></LayoutWrapper>} />
      <Route path="/AdminLimited" element={<LayoutWrapper currentPageName="AdminLimited"><AdminLimited /></LayoutWrapper>} />
      <Route path="/Support" element={<LayoutWrapper currentPageName="Support"><Support /></LayoutWrapper>} />
      <Route path="/AdminManageAdmins" element={<LayoutWrapper currentPageName="AdminManageAdmins"><AdminManageAdmins /></LayoutWrapper>} />
      <Route path="/AdminReceipts" element={<LayoutWrapper currentPageName="AdminReceipts"><AdminReceipts /></LayoutWrapper>} />
      <Route path="/AdminGiftCards" element={<LayoutWrapper currentPageName="AdminGiftCards"><AdminGiftCards /></LayoutWrapper>} />
      <Route path="/GiftCards" element={<LayoutWrapper currentPageName="GiftCards"><GiftCards /></LayoutWrapper>} />
      <Route path="/Wishlist" element={<LayoutWrapper currentPageName="Wishlist"><Wishlist /></LayoutWrapper>} />
      <Route path="/AdminWallets" element={<LayoutWrapper currentPageName="AdminWallets"><AdminWallets /></LayoutWrapper>} />
      <Route path="/BirthdayReward" element={<LayoutWrapper currentPageName="BirthdayReward"><BirthdayReward /></LayoutWrapper>} />
      <Route path="/AdminBirthdaySubmissions" element={<LayoutWrapper currentPageName="AdminBirthdaySubmissions"><AdminBirthdaySubmissions /></LayoutWrapper>} />
      <Route path="/AdminStockAlerts" element={<LayoutWrapper currentPageName="AdminStockAlerts"><AdminStockAlerts /></LayoutWrapper>} />
      <Route path="/AdminNotifications" element={<LayoutWrapper currentPageName="AdminNotifications"><AdminNotifications /></LayoutWrapper>} />
      <Route path="/Account" element={<LayoutWrapper currentPageName="Account"><Account /></LayoutWrapper>} />
      <Route path="/Family" element={<LayoutWrapper currentPageName="Family"><Family /></LayoutWrapper>} />
      <Route path="/Wallet" element={<LayoutWrapper currentPageName="Wallet"><Wallet /></LayoutWrapper>} />
      <Route path="/Driver" element={<LayoutWrapper currentPageName="Driver"><Driver /></LayoutWrapper>} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  const [splashDone, setSplashDone] = useState(false);

  return (
    <>
      {!splashDone && <SplashScreen onDone={() => setSplashDone(true)} />}
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </>
  )
}

export default App