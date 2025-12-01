import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import KpiDashboard from './components/KpiDashboard';
import SalesChart from './components/SalesChart';
import RecentOrdersTable from './components/RecentOrdersTable';
import TopProductsPieChart from './components/TopProductsPieChart';
import NotepadModal from './components/NotepadModal';
import VisitorsMap from './components/VisitorsMap';
import OrdersPage from './pages/OrdersPage';
import { InventoryPage } from './pages/InventoryPage';
import DiscountsPage from './pages/DiscountsPage';
import BannersPage from './pages/BannersPage';
import ProfilePage from './pages/ProfilePage';
import CustomersPage from './pages/CustomersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import RichContentPage from './pages/RichContentPage';
import LogsPage from './pages/LogsPage';
import { 
  Product, Notification, Order, Customer, NotificationType, OrderStatus, Discount, Banner, 
  UserProfile, MainCategory, Material, SubCategory, Color, Occasion, HomeCollageItem, RPD, Log, NavigationAction 
} from './types';
import * as api from './services/apiService';
import Toast from './components/Toast';

export type Page = 
  | 'dashboard' | 'inventory' | 'orders' | 'customers' | 'analytics' 
  | 'discounts' | 'banners' | 'profile' | 'settings' | 'rich-content' | 'logs';

const PAGE_TO_PATH: Record<Page, string> = {
  dashboard: '/',
  inventory: '/inventory',
  orders: '/orders',
  customers: '/customers',
  analytics: '/analytics',
  discounts: '/discounts',
  banners: '/banners',
  profile: '/profile',
  settings: '/settings',
  'rich-content': '/rich-content',
  logs: '/logs',
};

export type InitialPageProps = {
  searchTerm?: string;
  statusFilter?: string;
  sortConfig?: { key: string; direction: 'asc' | 'desc' };
}

const App: React.FC = () => {
  const [isNotepadOpen, setIsNotepadOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const hasRestoredPageRef = useRef(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mainCategories, setMainCategories] = useState<MainCategory[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [collageItems, setCollageItems] = useState<HomeCollageItem[]>([]);
  const [rpds, setRpds] = useState<RPD[]>([]);

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [initialPageProps, setInitialPageProps] = useState<InitialPageProps | null>(null);
  
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('accessToken'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [logs, setLogs] = useState<Log[]>([]);
  const [isLoggingEnabled, setIsLoggingEnabled] = useState(true);
  const [globalToast, setGlobalToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [visitorCount, setVisitorCount] = useState<number>(0);

  const syncSource = useRef<'product' | 'rpd' | null>(null);
  const idleTimerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const IDLE_TIMEOUT_MS = 60 * 60 * 1000; // 1 hour
  // Background notification state
  const prevOrdersRef = useRef<Map<number, OrderStatus>>(new Map());
  const prevProductsRef = useRef<Map<number, number>>(new Map());
  const notifiedNewOrdersRef = useRef<Set<number>>(new Set());
  const notifiedCancelledOrdersRef = useRef<Set<number>>(new Set());
  const notifiedOOSProductsRef = useRef<Set<number>>(new Set());

  // --- Function to Fetch User Profile Completely ---
  const fetchUserProfile = async () => {
  try {
    const res = await api.getUserProfile();
    setProfile(res);
  } catch (err) {
    console.error("Failed to fetch full user profile:", err);
  }
};

  // --- Function to Add Log ---
  const addLog = async (message: string, type: Log['type'] = 'info') => {
    if (!isLoggingEnabled) return;

    const newLog: Omit<Log, "id" | "timestamp"> = { message, type };

    try {
      const savedLog = await api.createLog(newLog); // ✅ Save to Django
      setLogs(prev => [savedLog, ...prev]);
    } catch (error) {
      console.error("❌ Failed to save log:", error);
      // fallback: keep in memory
      setLogs(prev => [
        {
          id: `log_${Date.now()}`,
          message,
          type,
          timestamp: new Date().toISOString(),
        },
        ...prev,
      ]);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      const fetchInitialData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const [
            ordersData, 
            productsData, 
            customersData,
            discountsData,
            bannersData,
            profileData,
            notificationsData,
            mainCategoriesData,
            materialsData,
            subCategoriesData,
            colorsData,
            occasionsData,
            collageItemsData,
            rpdsData,
            logsData,
            visitorRegionData,
          ] = await Promise.all([
            api.getOrders(),
            api.getProducts(),
            api.getCustomers(),
            api.getDiscounts(),
            api.getBanners(),
            api.getUserProfile(),
            api.getNotifications(),
            api.getMainCategories(),
            api.getMaterials(),
            api.getSubCategories(),
            api.getColors(),
            api.getOccasions(),
            api.getCollageItems(),
            api.getRPDs(),
            api.getLogs(),
            api.getVisitorData(),
          ]);

          setOrders(ordersData);
          setProducts(productsData);
          setCustomers(customersData);
          setDiscounts(discountsData);
          setBanners(bannersData);
          setProfile(profileData);
          setNotifications(notificationsData);
          setMainCategories(mainCategoriesData);
          setMaterials(materialsData);
          setSubCategories(subCategoriesData);
          setColors(colorsData);
          setOccasions(occasionsData);
          setCollageItems(collageItemsData);
          setRpds(rpdsData);
          setLogs(logsData);
          if (Array.isArray(visitorRegionData)) {
            const totalVisitors = visitorRegionData.reduce((sum: number, row: any) => sum + (Number(row.visitors) || 0), 0);
            setVisitorCount(totalVisitors);
          } else {
            setVisitorCount(0);
          }

          // ✅ After dashboard data load, fetch the full user profile again
          await fetchUserProfile();

        } catch (err) {
          console.error("Failed to fetch initial data:", err);
          setError("Could not load dashboard data. Please check your connection and try again.");
          if (err instanceof Error && (err.message.includes('401') || err.message.includes('credentials'))) {
            handleLogout();
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchInitialData();
    } else {
        setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Restore last visited admin page from URL or storage
  useEffect(() => {
    if (hasRestoredPageRef.current) return;
    const path = (window.location.pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
    const pathMap: Record<string, Page> = {
      '/': 'dashboard',
      '/dashboard': 'dashboard',
      '/inventory': 'inventory',
      '/orders': 'orders',
      '/customers': 'customers',
      '/analytics': 'analytics',
      '/discounts': 'discounts',
      '/banners': 'banners',
      '/profile': 'profile',
      '/settings': 'settings',
      '/rich-content': 'rich-content',
      '/logs': 'logs',
    };
    const stored = (localStorage.getItem('app:lastPage') as Page | null) || null;
    const fromPath = pathMap[path];
    const nextPage = fromPath || stored;
    if (nextPage && nextPage !== currentPage) {
      setCurrentPage(nextPage);
    }
    hasRestoredPageRef.current = true;
  }, [currentPage]);

  // Keep URL and storage in sync with current page so refresh stays on the same view
  useEffect(() => {
    const path = PAGE_TO_PATH[currentPage] || '/';
    try {
      window.history.replaceState({}, document.title, path);
      localStorage.setItem('app:lastPage', currentPage);
    } catch {}
  }, [currentPage]);

  // Idle auto-logout with simple progress save
  useEffect(() => {
    if (!isAuthenticated) return;

    const onActivity = () => {
      lastActivityRef.current = Date.now();
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        const idleFor = Date.now() - lastActivityRef.current;
        if (idleFor >= IDLE_TIMEOUT_MS) {
          try {
            // Save minimal progress (last page) and set a toast for next view
            localStorage.setItem('app:lastPage', currentPage);
            sessionStorage.setItem('pendingToast', JSON.stringify({
              message: 'You were logged out due to 1 hour of inactivity.',
              type: 'error',
            }));
          } catch {}
          addLog('User auto-logged out due to inactivity.', 'warning');
          handleLogout();
        }
      }, IDLE_TIMEOUT_MS) as unknown as number;
    };

    // Prime the timer and add listeners
    onActivity();
    const events: (keyof DocumentEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((ev) => document.addEventListener(ev, onActivity));
    return () => {
      events.forEach((ev) => document.removeEventListener(ev, onActivity));
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [isAuthenticated, currentPage]);

  // Show pending toast after navigation or on mount; refresh notifications if flagged
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('pendingToast');
      if (pending) {
        const data = JSON.parse(pending);
        if (data && data.message && data.type) {
          setGlobalToast({ message: data.message, type: data.type });
        }
        sessionStorage.removeItem('pendingToast');
      }
      if (sessionStorage.getItem('refreshNotifications')) {
        (async () => {
          try {
            const latest = await api.getNotifications();
            setNotifications(latest);
          } catch {}
          sessionStorage.removeItem('refreshNotifications');
        })();
      }
    } catch {}
  }, [currentPage]);

  // Background poller for orders/products to raise notifications
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      try {
        // Orders check: new or cancelled
        const latestOrders = await api.getOrders();
        const prevOrders = prevOrdersRef.current;
        const nextOrdersMap = new Map<number, OrderStatus>();

        // Build next map first
        for (const o of latestOrders) {
          nextOrdersMap.set(o.id, o.status);
        }

        // On first poll, seed and skip notifications to avoid false "new" alerts
        if (prevOrders.size === 0) {
          prevOrdersRef.current = nextOrdersMap;
          return;
        }

        const allowNewOrderNotifs = !!profile?.notificationSettings?.[NotificationType.NewOrder];
        const NOW = Date.now();
        const FRESH_MS = 5 * 60 * 1000; // only notify orders created in last 5 minutes

        for (const o of latestOrders) {
          const isNewId = !prevOrders.has(o.id);
          const notNotifiedYet = !notifiedNewOrdersRef.current.has(o.id);
          if (isNewId && notNotifiedYet) {
            // Check recency to avoid alerting on old historical orders
            const created = Date.parse((o as any).date);
            const isFresh = !Number.isNaN(created) ? (NOW - created) <= FRESH_MS : true;
            if (allowNewOrderNotifs && isFresh) {
              try {
                await api.createNotification({
                  title: 'New Order Received',
                  message: `#${o.id} from ${o.customerName || 'Customer'}`,
                  type: NotificationType.NewOrder,
                });
                sessionStorage.setItem('refreshNotifications', '1');
              } catch {}
              notifiedNewOrdersRef.current.add(o.id);
              setGlobalToast({ message: `New order received: #${o.id}`, type: 'success' });
            }
          } else {
            const prevStatus = prevOrders.get(o.id);
            if (
              prevStatus &&
              prevStatus !== o.status &&
              o.status === OrderStatus.Cancelled &&
              !notifiedCancelledOrdersRef.current.has(o.id)
            ) {
              try {
                await api.createNotification({
                  title: 'Order Declined',
                  message: `Order #${o.id} was cancelled by customer`,
                  type: NotificationType.OrderDeclined,
                });
                sessionStorage.setItem('refreshNotifications', '1');
              } catch {}
              notifiedCancelledOrdersRef.current.add(o.id);
              setGlobalToast({ message: `Order #${o.id} cancelled`, type: 'error' });
            }
          }
        }
        prevOrdersRef.current = nextOrdersMap;

        // Products check: out of stock
        const latestProducts = await api.getProducts();
        const prevProducts = prevProductsRef.current;
        const nextProductsMap = new Map<number, number>();
        for (const p of latestProducts) {
          nextProductsMap.set(p.id, p.stock ?? 0);
          const prevStock = prevProducts.get(p.id);
          if (prevStock !== undefined && prevStock > 0 && (p.stock ?? 0) <= 0 && !notifiedOOSProductsRef.current.has(p.id)) {
            try {
              await api.createNotification({
                title: 'Product Out of Stock',
                message: `${p.name} is now out of stock`,
                type: NotificationType.ProductOutOfStock,
              });
              sessionStorage.setItem('refreshNotifications', '1');
            } catch {}
            notifiedOOSProductsRef.current.add(p.id);
            setGlobalToast({ message: `${p.name} is out of stock`, type: 'error' });
          }
        }
        // Seed the map if first run
        if (prevProducts.size === 0) {
          nextProductsMap.forEach((v, k) => prevProductsRef.current.set(k, v));
        } else {
          prevProductsRef.current = nextProductsMap;
        }
      } catch {
        // ignore polling errors
      }
    }, 20000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // Show pending toast after navigation or on mount; refresh notifications if flagged
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem('pendingToast');
      if (pending) {
        const data = JSON.parse(pending);
        if (data && data.message && data.type) {
          setGlobalToast({ message: data.message, type: data.type });
        }
        sessionStorage.removeItem('pendingToast');
      }
      if (sessionStorage.getItem('refreshNotifications')) {
        (async () => {
          try {
            const latest = await api.getNotifications();
            setNotifications(latest);
          } catch {}
          sessionStorage.removeItem('refreshNotifications');
        })();
      }
    } catch {}
  }, [currentPage]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    addLog('User successfully logged in.', 'success');
    fetchUserProfile();
  };

  const handleLogout = () => {
    addLog('User logged out.');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setOrders([]);
    setProducts([]);
    setCustomers([]);
    setDiscounts([]);
    setBanners([]);
    setProfile(null);
    setNotifications([]);
  };

  const handlePasswordResetSuccess = () => {
    setIsAuthenticated(true);
    addLog('User password was successfully reset.', 'success');
    fetchUserProfile();
  };

  // ✅ Helpers for products / rpds
  const handleSetProducts = (updatedProducts: Product[]) => {
    setProducts(updatedProducts);
    addLog('Products list updated.', 'info');
  };
  const handleSetRpds = (updatedRpds: RPD[]) => {
    setRpds(updatedRpds);
    addLog('RPD list updated.', 'info');
  };

  const clearInitialPageProps = () => {
    setInitialPageProps(null);
  };

  const pageProps = { ...initialPageProps, onApplied: clearInitialPageProps };

  const renderPage = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <svg
            className="animate-spin h-10 w-10 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 4v.01h.01V4H4zm0 8v.01h.01V12H4zm0 8v.01h.01V20H4zm8-16v.01h.01V4H12zm0 8v.01h.01V12H12zm0 8v.01h.01V20H12zm8-16v.01h.01V4H20zm0 8v.01h.01V12H20zm0 8v.01h.01V20H20z"
            ></path>
          </svg>
          <span className="ml-4 text-xl text-text-secondary">
            Loading Dashboard...
          </span>
        </div>
      );
    }

    if (error) {
      return <div className="text-center text-red-500 p-8">{error}</div>;
    }

    switch (currentPage) {
      case "orders":
        return (
          <OrdersPage
            orders={orders}
            setOrders={setOrders}
            allProducts={products}
            addLog={addLog}
            initialProps={pageProps}
          />
        );
      case "inventory":
        return (
          <InventoryPage
            products={products}
            setProducts={handleSetProducts}
            initialProps={pageProps}
            mainCategories={mainCategories}
            materials={materials}
            subCategories={subCategories}
            colors={colors}
            occasions={occasions}
            rpds={rpds}
            addLog={addLog}
          />
        );
      case "customers":
        return (
          <CustomersPage
            customers={customers}
            setCustomers={setCustomers}
            addLog={addLog}
            initialProps={pageProps}
          />
        );
      case "analytics":
        return <AnalyticsPage orders={orders} />;
      case "discounts":
        return (
          <DiscountsPage
            discounts={discounts}
            setDiscounts={setDiscounts}
            allProducts={products}
            addLog={addLog}
            initialProps={pageProps}
          />
        );
      case "banners":
        return (
          <BannersPage
            banners={banners}
            setBanners={setBanners}
            addLog={addLog}
          />
        );
      case "rich-content":
        return (
          <RichContentPage
            rpds={rpds}
            setRpds={handleSetRpds}
            allProducts={products}
            addLog={addLog}
          />
        );
      case "profile":
        return (
          <ProfilePage
            profile={profile}
            setProfile={setProfile}
            onLogout={handleLogout}
            addLog={addLog}
          />
        );
      case "settings":
        return (
          <SettingsPage
            mainCategories={mainCategories}
            setMainCategories={setMainCategories}
            materials={materials}
            setMaterials={setMaterials}
            subCategories={subCategories}
            setSubCategories={setSubCategories}
            colors={colors}
            setColors={setColors}
            occasions={occasions}
            setOccasions={setOccasions}
            collageItems={collageItems}
            setCollageItems={setCollageItems}
            addLog={addLog}
          />
        );
      case "logs":
        return (
          <LogsPage
            logs={logs}
            setLogs={setLogs}
            isLoggingEnabled={isLoggingEnabled}
            setIsLoggingEnabled={setIsLoggingEnabled}
          />
        );
      case "dashboard":
      default:
        return (
          <div className="container mx-auto">
            <KpiDashboard orders={orders} visitorData={visitorCount} />
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
              <SalesChart orders={orders} />
              <VisitorsMap />
            </div>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <RecentOrdersTable orders={orders} />
              </div>
              <div className="lg:col-span-2">
                <TopProductsPieChart orders={orders} />
              </div>
            </div>
          </div>
        );
    }
  };

  if (!isAuthenticated) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onPasswordResetSuccess={handlePasswordResetSuccess} />;
  }

  return (
    <div className="flex h-screen bg-background text-text-primary">
      <Sidebar 
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        onNotepadClick={() => setIsNotepadOpen(true)} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          notifications={notifications}
          setNotifications={setNotifications}
          products={products}
          onSearchResultClick={() => {}}
          profile={profile}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-8">
          {globalToast && (
            <Toast message={globalToast.message} type={globalToast.type} onClose={() => setGlobalToast(null)} />
          )}
          {renderPage()}
        </main>
      </div>
      {isNotepadOpen && <NotepadModal onClose={() => setIsNotepadOpen(false)} />}
    </div>
  );
};

export default App;


