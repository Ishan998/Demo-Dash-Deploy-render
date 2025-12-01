import React, { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ReturnRequestModal from './components/ReturnRequestModal';
import ReviewModal from './components/ReviewModal';
import PageLoader from './components/PageLoader';
import { detailedProduct, products, sampleUser, occasions as defaultOccasions, crystals as defaultCrystals, productTypes as defaultProductTypes } from './constants';
import {
  fetchProducts as fetchProductsApi,
  addToWishlist,
  removeFromWishlist,
  fetchWishlist,
  logVisitor,
  addToCart,
  removeFromCart,
  fetchCart,
  fetchAddresses,
  fetchOrders,
  fetchCollageTiles,
  submitProductReview,
  fetchMyReviews,
  fetchProductReviews,
  fetchCustomerProfile,
  updateCustomerProfile,
  logoutCustomer,
  type StorefrontOrder,
} from './services/apiService';
import { fetchNotifications } from './services/notificationService';
import type { Product, WishlistItem, CartItem, Notification, User, Address, Order, MegaMenuLink, Occasion, Crystal, ProductType, ProductReview } from './types';

// Lazy load pages for code splitting
const HomePage = React.lazy(() => import('./pages/HomePage'));
const ProductViewPage = React.lazy(() => import('./pages/ProductViewPage'));
const AllProductsPage = React.lazy(() => import('./pages/AllProductsPage'));
const AboutUsPage = React.lazy(() => import('./pages/AboutUsPage'));
const WishlistPage = React.lazy(() => import('./pages/WishlistPage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = React.lazy(() => import('./pages/ForgotPasswordPage'));
const SignUpPage = React.lazy(() => import('./pages/SignUpPage'));
const CheckoutPage = React.lazy(() => import('./pages/CheckoutPage'));


type Page = 'home' | 'product' | 'all-products' | 'about-us' | 'wishlist' | 'cart' | 'profile' | 'login' | 'forgot-password' | 'signup' | 'checkout';
type PostLoginAction =
  | { type: 'wishlist'; productId: number }
  | { type: 'cart'; productId: number }
  | { type: 'checkout' }
  | { type: 'buyNow'; productId: number }
  | null;
type ProfileTab = 'account' | 'orders' | 'address';
type Filter = MegaMenuLink['filter'];
type ProductSelection = { product: Product; variantId?: number };

const mapApiAddressToClient = (addr: any): Address => ({
  id: addr.id,
  type: (addr.type as Address['type']) || (addr.is_default ? 'Home' : 'Work'),
  line1: addr.line1 ?? '',
  line2: addr.line2 ?? '',
  city: addr.city ?? '',
  state: addr.state ?? '',
  zip: addr.pincode ?? addr.zip ?? '',
  country: addr.country ?? 'India',
  isDefault: Boolean(addr.is_default ?? addr.isDefault),
});

const mapOrderFromApi = (order: StorefrontOrder): Order => {
  const normalizedStatus = ((order.status as string) || '').toLowerCase() as Order['status'];
  return {
    id: order.id,
    date: order.date,
    status: normalizedStatus || 'pending',
    total: Number(order.total || 0),
    paymentMethod: order.payment_method,
    items: (order.items || []).map((it) => ({
      productId: it.productId,
      quantity: it.quantity,
      name: (it as any).name,
      price: Number((it as any).price || 0),
      sku: (it as any).sku,
    })),
  };
};

const App: React.FC = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [menuProducts, setMenuProducts] = useState<Product[]>(products);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [postLoginAction, setPostLoginAction] = useState<PostLoginAction>(null);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [loginPrompt, setLoginPrompt] = useState('');
  const [profilePageTab, setProfilePageTab] = useState<ProfileTab>('account');
  const [history, setHistory] = useState<Page[]>(['home']);
  const [initialFilters, setInitialFilters] = useState<Filter[] | null>(null);
  const [initialSearchQuery, setInitialSearchQuery] = useState<string | null>(null);

  const [user, setUser] = useState<User>(sampleUser);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [myReviews, setMyReviews] = useState<ProductReview[]>([]);
  const [returnRequestOrder, setReturnRequestOrder] = useState<Order | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{ orderId: number; productId: number; productName: string } | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [collageOccasions, setCollageOccasions] = useState<Occasion[]>([]);
  const [collageCrystals, setCollageCrystals] = useState<Crystal[]>([]);
  const [collageProductTypes, setCollageProductTypes] = useState<ProductType[]>([]);
  
  const hasRestoredDeepLink = useRef(false);
  const [hasLoadedMenuProducts, setHasLoadedMenuProducts] = useState(false);
  const clearCustomerSession = useCallback(() => {
    logoutCustomer();
    setIsLoggedIn(false);
    setUser(sampleUser);
    setAddresses([]);
    setOrders([]);
    setMyReviews([]);
    setCheckoutItems([]);
    setWishlistItems([]);
    setCartItems([]);
  }, []);

  const loadAddresses = useCallback(async () => {
    try {
      const fetched = await fetchAddresses();
      const normalized = (Array.isArray(fetched) ? fetched : []).map(mapApiAddressToClient);
      setAddresses(normalized);
    } catch (error) {
      console.error('Failed to load addresses', error);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      const fetched = await fetchOrders();
      const normalized = (Array.isArray(fetched) ? fetched : []).map(mapOrderFromApi);
      setOrders(normalized);
    } catch (error) {
      console.error('Failed to load orders', error);
    }
  }, []);

  const loadCustomerReviews = useCallback(async () => {
    try {
      const fetched = await fetchMyReviews();
      setMyReviews(fetched || []);
    } catch (error) {
      console.error('Failed to load reviews', error);
    }
  }, []);

  const getDetailedProductData = (basicProduct: Product): Product => {
    // Dynamically create the specifications array based on available product data
    const specs = [];
    if (basicProduct.color) specs.push({ key: 'Color', value: basicProduct.color });
    if (basicProduct.metal) specs.push({ key: 'Material', value: basicProduct.metal });
    if (basicProduct.category) specs.push({ key: 'Category', value: basicProduct.category });
    if (basicProduct.subcategory) specs.push({ key: 'Sub Category', value: basicProduct.subcategory });
    if (basicProduct.gemstone) specs.push({ key: 'Crystal Name', value: basicProduct.gemstone });
    if (basicProduct.occasion) specs.push({ key: 'Occasion', value: basicProduct.occasion });
    specs.push({ key: 'SKU', value: `AUR${basicProduct.id.toString().padStart(4, '0')}` });
    if (basicProduct.stock !== undefined) specs.push({ key: 'Units in Stock', value: `${basicProduct.stock > 0 ? basicProduct.stock : 'Out of Stock'}` });

    // In a real app, this would be an API call.
    // For this mock, we'll merge the basic product with generated detailed data.
    return {
      ...basicProduct,
      // If the product already has a full image array (from API), use it.
      // Otherwise, generate a mock array from the basic imageUrl.
      images: (Array.isArray(basicProduct.images) && basicProduct.images.length > 0)
        ? basicProduct.images
        : [
            basicProduct.imageUrl,
            `https://picsum.photos/seed/${basicProduct.id}A/800/1000`,
            `https://picsum.photos/seed/${basicProduct.id}B/800/1000`,
            `https://picsum.photos/seed/${basicProduct.id}C/800/1000`,
            `https://picsum.photos/seed/${basicProduct.id}D/800/1000`,
          ].filter(Boolean) as string[], // .filter(Boolean) removes any potential undefined values
      description: `The ${basicProduct.name} is a masterpiece of design, featuring exquisite details that make it a timeless piece. Its elegance makes it the perfect accessory for both grand occasions and everyday luxury. A symbol of sophistication, it's not just a piece of jewellery, but a future heirloom.`,
      specifications: specs,
      // For mock purposes, reuse reviews and other details from the sample product
      reviews: detailedProduct.reviews,
      discounts: detailedProduct.discounts,
      richDescription: detailedProduct.richDescription,
      // Add delivery info here, it could also come from the basicProduct object
      weight: basicProduct.weight || '12g',
      width: basicProduct.width || '2cm',
      height: basicProduct.height || '3.5cm',
      depth: basicProduct.depth || '0.4cm',
      deliveryDays: basicProduct.deliveryDays || 5,
    };
  };

  const navigate = (page: Page) => {
    if (page !== 'product') {
      sessionStorage.setItem('lastPage', page);
      sessionStorage.removeItem('lastViewedProduct');
      const pathByPage: Record<Page, string> = {
        home: '/',
        'all-products': '/all-products',
        'about-us': '/about-us',
        wishlist: '/wishlist',
        cart: '/cart',
        profile: '/profile',
        login: '/login',
        'forgot-password': '/forgot-password',
        signup: '/signup',
        checkout: '/checkout',
        product: window.location.pathname, // unused here
      };
      const nextPath = pathByPage[page] || '/';
      window.history.replaceState({}, document.title, nextPath);
    }
    setSelectedProduct(null);
    if (currentPage !== page) {
      setHistory(prev => [...prev, page]);
    }
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const goToFilteredListing = (filters: Filter[]) => {
    setInitialFilters(filters);
    navigate('all-products');
  };

  const handleSelectOccasionTile = (name: string) => {
    goToFilteredListing([{ type: 'occasion', value: name } as Filter]);
  };

  const handleSelectCrystalTile = (name: string) => {
    goToFilteredListing([{ type: 'gemstone', value: name } as Filter]);
  };

  const handleSelectProductTypeTile = (name: string) => {
    goToFilteredListing([{ type: 'category', value: name } as Filter]);
  };

  const handleBack = () => {
    if (history.length <= 1) {
      if (currentPage !== 'home') {
        navigate('home');
      }
      return;
    }

    const newHistory = history.slice(0, -1);
    const previousPage = newHistory[newHistory.length - 1];

    setHistory(newHistory);
    setCurrentPage(previousPage);
    if (previousPage === 'product') {
      setSelectedProduct(detailedProduct);
    } else {
      setSelectedProduct(null);
    }
    window.scrollTo(0, 0);
  };

  // This function is kept for client-side events like placing an order.
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  useEffect(() => {
    // Restore non-product pages (e.g., all-products) on hard refresh using the URL path.
    const path = window.location.pathname.toLowerCase();
    if (path.startsWith('/product')) {
      return; // handled by the deep link effect below
    }
    const mapPathToPage: Record<string, Page> = {
      '/all-products': 'all-products',
      '/about-us': 'about-us',
      '/wishlist': 'wishlist',
      '/cart': 'cart',
      '/profile': 'profile',
      '/login': 'login',
      '/forgot-password': 'forgot-password',
      '/signup': 'signup',
      '/checkout': 'checkout',
      '/': 'home',
    };
    const matched = mapPathToPage[path];
    if (matched && currentPage !== matched) {
      setCurrentPage(matched);
      setHistory(prev => [...prev, matched]);
      sessionStorage.setItem('lastPage', matched);
    }
  }, [currentPage]);

  useEffect(() => {
    if (hasRestoredDeepLink.current) return;

    // On app load, check for a product deep link (query param or pretty path)
    const urlParams = new URLSearchParams(window.location.search);
    const productIdFromUrl = urlParams.get('product_id');
    const prettyPathMatch = window.location.pathname.match(/\/product\/(\d+)/i);
    const productIdFromPath = prettyPathMatch ? prettyPathMatch[1] : null;
    const productIdToOpen = productIdFromUrl || productIdFromPath;

    const storedProductRaw = sessionStorage.getItem('lastViewedProduct');
    let storedProduct: Product | undefined;
    if (storedProductRaw) {
      try {
        storedProduct = JSON.parse(storedProductRaw) as Product;
      } catch (err) {
        console.error('Failed to parse last viewed product', err);
      }
    }

    const targetId = productIdToOpen ? parseInt(productIdToOpen, 10) : storedProduct?.id;
    let productToView: Product | undefined;

    if (targetId && hasLoadedMenuProducts && Array.isArray(menuProducts) && menuProducts.length > 0) {
      productToView = menuProducts.find(p => p.id === targetId);
    }

    if (!productToView && storedProduct && storedProduct.id === targetId) {
      productToView = storedProduct;
    }

    if (!productToView && !targetId) {
      const lastPage = sessionStorage.getItem('lastPage');
      if (lastPage === 'product' && storedProduct) {
        productToView = storedProduct;
      }
    }

    if (productToView && productToView.id) {
      hasRestoredDeepLink.current = true;
      setTimeout(() => {
        handleSelectProduct({ product: productToView as Product });
        window.history.replaceState({}, document.title, `/product/${productToView.id}`);
      }, 50);
    } else if (targetId) {
      // If we have an ID but no cached product (e.g., fresh reload before API menus load),
      // create a minimal placeholder to keep the user on the product page.
      hasRestoredDeepLink.current = true;
      const placeholder: Product = {
        id: targetId,
        name: 'Loading product...',
        category: '',
        price: 0,
        imageUrl: '',
      } as Product;
      sessionStorage.setItem('lastPage', 'product');
      sessionStorage.setItem('lastViewedProduct', JSON.stringify(placeholder));
      setSelectedProduct(placeholder);
      setCurrentPage('product');
      window.history.replaceState({}, document.title, `/product/${targetId}`);
    }
  }, [menuProducts, hasLoadedMenuProducts]);

  useEffect(() => {
    const loadMenuProducts = async () => {
      try {
        const fresh = await fetchProductsApi();
        if (Array.isArray(fresh) && fresh.length > 0) {
          const normalized = fresh.map((p: any) => {
            const price = Number(p.selling_price ?? p.sellingPrice ?? p.price ?? p.mrp ?? 0) || 0;
            const imageUrl = Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : (p.imageUrl ?? '');
            return { ...p, price, imageUrl };
          });
          setMenuProducts(normalized as any);
          setHasLoadedMenuProducts(true);
        }
      } catch (err) {
        console.error('Failed to load products for mega menu preview', err);
      }
    };
    loadMenuProducts();
  }, []);

  useEffect(() => {
    // Log the visitor when the app loads
    logVisitor();
  }, []);

  // Auto-load profile (and mark logged-in) when a token already exists (e.g., after refresh)
  useEffect(() => {
    const token = localStorage.getItem("customer_token");
    if (!token) return;
    const loadProfile = async () => {
      try {
        const profile = await fetchCustomerProfile();
        if (profile) {
          setIsLoggedIn(true);
          setUser({
            id: Number(profile.id ?? user.id),
            fullName: profile.name || profile.email || user.fullName,
            email: profile.email ?? user.email,
            phone: profile.phone || user.phone || '',
          });
        }
      } catch (err) {
        console.error("Failed to auto-load customer profile", err);
      }
    };
    loadProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const loadCollageTiles = async () => {
      try {
        const res = await fetchCollageTiles();
        const nextOccasions = (res.occasions && res.occasions.length > 0) ? res.occasions : defaultOccasions;
        const nextCrystals = (res.crystals && res.crystals.length > 0) ? res.crystals as Crystal[] : defaultCrystals;
        const nextProductTypes = (res.productTypes && res.productTypes.length > 0) ? res.productTypes as ProductType[] : defaultProductTypes;
        setCollageOccasions(nextOccasions);
        setCollageCrystals(nextCrystals);
        setCollageProductTypes(nextProductTypes);
      } catch (error) {
        console.error("Failed to load collage tiles", error);
        setCollageOccasions(defaultOccasions);
        setCollageCrystals(defaultCrystals);
        setCollageProductTypes(defaultProductTypes);
      }
    };
    loadCollageTiles();
  }, []);

  useEffect(() => {
    // On app load, and whenever login status changes, fetch notifications.
    const loadNotifications = async () => {
        const fetchedNotifications = await fetchNotifications(isLoggedIn);
        // In this mock setup, we simply replace the notifications.
        // A more complex app might merge these with unsynced client-side notifications.
        setNotifications(fetchedNotifications);
    };
    loadNotifications();
  }, [isLoggedIn]); // This dependency ensures the effect runs on login/logout.

  useEffect(() => {
    if (isLoggedIn) {
      loadAddresses();
    } else {
      setAddresses([]);
    }
  }, [isLoggedIn, loadAddresses]);

  useEffect(() => {
    if (isLoggedIn) {
      loadOrders();
      loadCustomerReviews();
    } else {
      setOrders([]);
      setMyReviews([]);
    }
  }, [isLoggedIn, loadOrders, loadCustomerReviews]);

  const handleToggleWishlist = async (productId: number, force = false) => {
  if (!isLoggedIn && !force) {
    setPostLoginAction({ type: 'wishlist', productId });
    setLoginPrompt('Please log in to save items to your wishlist.');
    navigate('login');
    return;
  }
  // 🔍 DEBUG: [App.tsx] Toggling wishlist for product ID.
  console.log(`🔍 DEBUG: [App.tsx] Toggling wishlist for product: ${productId}`);
  try {
    // ✅ Correctly find the item by looking inside the nested `product` object.
    const existing = wishlistItems.find(item => item.product.id === productId);
    console.log('Found existing wishlist item:', existing);

    if (existing) {
      await removeFromWishlist(existing.id); // ✅ Remove from Django
    } else {
      await addToWishlist(productId); // ✅ Add to Django
    }

    // ✅ Fetch updated wishlist from backend
    const updated = await fetchWishlist();
    // 🔍 DEBUG: [App.tsx] Wishlist state updated.
    console.log("🔍 DEBUG: [App.tsx] Wishlist state updated with fetched data:", updated);
    setWishlistItems(updated);

  } catch (error) {
    console.error("❌ Wishlist update failed:", error);
  }
};

  const handleToggleCart = async (productId: number) => {
  if (!isLoggedIn) {
    setPostLoginAction({ type: 'cart', productId });
    setLoginPrompt('Please log in to add items to your cart.');
    navigate('login');
    return;
  }

  try {
    // ✅ Correctly find item by looking inside the nested product object.
    const existing = cartItems.find(item => item.product.id === productId);
    console.log('Found existing cart item:', existing);

    if (existing) {
      await removeFromCart(existing.id); // ✅ Remove from Django
    } else {
      await addToCart(productId, 1); // ✅ Add new item
    }

    // ✅ Refresh cart from Django after update
    const updated = await fetchCart();
    console.log("🔍 DEBUG: [App.tsx] Cart state updated after toggle:", updated);
    setCartItems(updated);

  } catch (error) {
    console.error("❌ Error updating cart:", error);
  }
  };

  const handleUpdateUserProfile = async (updatedUser: User) => {
    try {
      const payload: any = {
        name: updatedUser.fullName,
        phone: updatedUser.phone,
      };
      const saved = await updateCustomerProfile(payload);
      setUser({
        id: Number(saved?.id ?? updatedUser.id),
        fullName: saved?.name ?? updatedUser.fullName,
        email: saved?.email ?? updatedUser.email,
        phone: saved?.phone ?? updatedUser.phone,
      });
    } catch (error) {
      console.error('Failed to update profile', error);
      // Optimistically keep local state so UI reflects user edits even if backend failed silently.
      setUser(updatedUser);
    }
  };

  const handleBuyNow = async (productId: number) => {
    if (!isLoggedIn) {
      setPostLoginAction({ type: 'buyNow', productId });
      setLoginPrompt('Please log in to buy this item now.');
      navigate('login');
      return;
    }
    
    try {
      // Add the item to the cart on the backend first.
      // This ensures we have a valid cart item with full product details.
      await addToCart(productId, 1);
      
      // Fetch the updated cart to find the item we just added.
      const updatedCart = await fetchCart();
      setCartItems(updatedCart);

      // Find the specific item to pass to checkout (tolerant to different shapes).
      const itemForCheckout =
        updatedCart.find(
          (item: any) =>
            item?.product?.id === productId ||
            item?.productId === productId ||
            item?.product_id === productId
        ) || updatedCart[0];

      if (itemForCheckout) {
        setCheckoutItems([itemForCheckout]);
        navigate('checkout');
      } else {
        console.error("❌ Could not find the 'Buy Now' item in the cart after adding it.");
        // Fallback: still send user to checkout with full cart so it's not empty
        if (updatedCart.length > 0) {
          setCheckoutItems(updatedCart);
          navigate('checkout');
        }
      }
    } catch (error) {
      console.error("❌ Error during 'Buy Now' process:", error);
    }
  };
  
  const handleAddAllToCart = async (productsToAdd: Product[]) => {
    if (!isLoggedIn) {
      setLoginPrompt('Please log in to add items to your cart.');
      navigate('login');
      return;
    }
    
    // We can add items in parallel
    const addPromises = productsToAdd.map(p => addToCart(p.id, 1));

    try {
      // Wait for all additions to complete
      await Promise.all(addPromises);

      // Then fetch the updated cart from the server to ensure UI consistency
      const updatedCart = await fetchCart();
      setCartItems(updatedCart);

    } catch (error) {
      console.error("❌ Error adding all items to cart:", error);
      // Optionally, add a user-facing notification about the failure
    }
  };

  const handleUpdateCartQuantity = async (cartItemId: number, quantity: number) => {
    if (quantity < 1) {
      // If quantity is zero or less, treat it as a removal.
      const itemToRemove = cartItems.find(item => item.id === cartItemId);
      if (itemToRemove) {
        await handleToggleCart(itemToRemove.product.id);
      }
      return;
    }

    // For now, we update locally for responsiveness and then refetch.
    // A more advanced implementation would use a dedicated backend endpoint.
    const updatedCartItems = cartItems.map(item =>
      item.id === cartItemId ? { ...item, quantity } : item
    );
    setCartItems(updatedCartItems);
    // TODO: Implement a backend endpoint for quantity updates to make this permanent.
    // For now, this change is only local to the session.
  };

  const handleMarkAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSelectProduct = (selection: ProductSelection) => {
    const { product, variantId } = selection;
    const parentId = (product as any).parentId ?? product.id;
    sessionStorage.setItem('lastPage', 'product');
    sessionStorage.setItem('lastViewedProduct', JSON.stringify(product));
    window.history.replaceState({}, document.title, `/product/${parentId}`);
    window.scrollTo(0, 0);
    // Pass variantId to the detailed product data
    setSelectedProduct({ ...getDetailedProductData(product), selectedVariantId: variantId ?? (product as any).selectedVariantId, parentId });
    if (currentPage !== 'product' || selectedProduct?.id !== parentId) {
      setHistory(prev => [...prev, 'product']);
    }
    setCurrentPage('product');
  };

  const handleNavigateWithFilter = (filter: Filter) => {
    if (filter) {
      setInitialFilters([filter]);
    }
    navigate('all-products');
  };

  const clearInitialFilters = useCallback(() => {
    setInitialFilters(null);
  }, []);

  const handleNavigateToAllProductsWithSearch = (query: string) => {
    setInitialFilters(null); // Clear any category filters
    setInitialSearchQuery(query);
    navigate('all-products');
  };

  const clearInitialSearchQuery = useCallback(() => {
    setInitialSearchQuery(null);
  }, []);
  
  const handleNavigateHome = () => navigate('home');
  const handleNavigateToAllProducts = () => {
    setInitialFilters(null); // Clear any filters when navigating via main link
    navigate('all-products');
  }
  const handleNavigateToAboutUs = () => navigate('about-us');
  const handleNavigateToWishlist = () => isLoggedIn ? navigate('wishlist') : handleLoginRedirect('wishlist');
  const handleNavigateToCart = () => navigate('cart');
  const handleNavigateToProfile = () => {
    setProfilePageTab('account'); // Reset tab to default
    isLoggedIn ? navigate('profile') : handleLoginRedirect('profile');
  };
  const handleNavigateToLogin = () => { setLoginPrompt(''); navigate('login'); };
  const handleNavigateToForgotPassword = () => navigate('forgot-password');
  const handleNavigateToSignUp = () => navigate('signup');
  
  const handleLoginRedirect = (from: 'wishlist' | 'profile' | 'checkout') => {
      setLoginPrompt(`You need to be logged in to access your ${from}.`);
      navigate('login');
  };

  const handleNavigateToCheckout = () => {
    if (!isLoggedIn) {
      setPostLoginAction({ type: 'checkout' });
      setLoginPrompt('Please log in to proceed to checkout.');
      navigate('login');
      return;
    }
    setCheckoutItems(cartItems);
    navigate('checkout');
  };

  const handleCreateOrder = (order: Order, orderItems: CartItem[]) => {
    setOrders(prev => [order, ...prev]);
    
    // Remove only the ordered items from the main cart
    // Keep in sync with nested product object ids.
    const orderedProductIds = new Set(orderItems.map(item => item.product.id));
    setCartItems(prev => prev.filter(item => !orderedProductIds.has(item.product.id)));

    addNotification({
      type: 'shipping',
      title: 'Order Placed!',
      message: `Your order ORD-${order.id} has been successfully placed.`,
    });
    
    setProfilePageTab('orders');
    navigate('profile');
  };

  const handleLoginSuccess = async (loggedInUser: User | null = null) => {
    setIsLoggedIn(true);

    let latestCart: CartItem[] = cartItems;

    try {
      // Fetch data from Django after login
      console.log('[App.tsx] Fetching user data after login success...');
      const updatedWishlist = await fetchWishlist();
      console.log('[App.tsx] Fetched Wishlist:', updatedWishlist);
      setWishlistItems(updatedWishlist);

      const updatedCart = await fetchCart();
      latestCart = updatedCart;
      console.log('[App.tsx] Fetched Cart:', updatedCart);
      setCartItems(updatedCart);

      // Fetch customer profile (name/phone/email) and map to UI user object
      const profile = await fetchCustomerProfile();
      if (profile) {
        setUser({
          id: Number(profile.id ?? user.id),
          fullName: profile.name || profile.email || user.fullName,
          email: profile.email ?? user.email,
          phone: profile.phone || user.phone || '',
        });
      }
    } catch (error) {
      console.error("[App.tsx] Error fetching data after login:", error);
      console.error('Failed to load wishlist or cart:', error);
    }

    await loadAddresses();
    await loadOrders();

      // Update user info only after a successful login (merge so we don't erase phone/name)
      if (loggedInUser) {
        setUser((prev) => ({
          ...prev,
          id: Number(loggedInUser.id ?? prev.id),
          fullName: loggedInUser.fullName ?? loggedInUser.name ?? prev.fullName,
          email: loggedInUser.email ?? prev.email,
          phone: (loggedInUser as any).phone ?? prev.phone,
        }));
      }

    window.scrollTo(0, 0);

    if (postLoginAction) {
      const action = { ...postLoginAction };
      setPostLoginAction(null);
      console.log("[App.tsx] Executing post-login action:", action);
      setLoginPrompt('');

      switch (action.type) {
        case 'wishlist':
          await handleToggleWishlist(action.productId, true);
          navigate('wishlist');
          break;

        case 'cart': {
          try {
            await addToCart(action.productId, 1);
            const refreshedCart = await fetchCart();
            latestCart = refreshedCart;
            setCartItems(refreshedCart);
          } catch (error) {
            console.error("[App.tsx] Error adding cart item post-login:", error);
          }
          navigate('cart');
          break;
        }

        case 'buyNow': {
          const productToBuy = products.find(p => p.id === action.productId);
          // After logging in, perform the full "Buy Now" logic which fetches
          // the complete cart item, ensuring the price is included for checkout.
          if (productToBuy) { 
            await handleBuyNow(action.productId);
            navigate('checkout');
          } else {
            navigate('home');
          }
          break;
        }

        case 'checkout':
          setCheckoutItems(latestCart);
          navigate('checkout');
          break;
      }
    } else {
      navigate('home');
    }
  };
  const handleLogout = () => {
    clearCustomerSession();
    navigate('home');
    window.scrollTo(0, 0);
  };
  
  const handleInitiateReturn = (order: Order) => {
    setReturnRequestOrder(order);
  };

  const handleStartReview = (order: Order, item: Order['items'][number]) => {
    if (!item.productId) return;
    const productName = item.name || `Product #${item.productId}`;
    setReviewError(null);
    setReviewTarget({ orderId: order.id, productId: item.productId, productName });
  };

  const handleSubmitReview = async (payload: { rating: number; title: string; comment: string }) => {
    if (!reviewTarget) return;
    try {
      setIsSubmittingReview(true);
      setReviewError(null);
      await submitProductReview({
        orderId: reviewTarget.orderId,
        productId: reviewTarget.productId,
        rating: payload.rating,
        title: payload.title,
        comment: payload.comment,
      });
      await loadCustomerReviews();
      addNotification({
        type: 'welcome',
        title: 'Review submitted',
        message: 'Thanks for sharing your feedback!',
      });
      setReviewTarget(null);
    } catch (error: any) {
      const apiMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        (typeof error?.response?.data === 'string' ? error.response.data : null);
      setReviewError(apiMessage || 'Could not submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSubmitReturnRequest = (orderId: number, reason: string, photos: File[]) => {
    console.log('Return request submitted for order:', orderId, 'Reason:', reason, 'Photos:', photos.length);

    // Update status to "Return Requested"
    setOrders(prevOrders =>
        prevOrders.map(order =>
            order.id === orderId ? { ...order, status: 'return_requested' as const } : order
        )
    );
    setReturnRequestOrder(null); // Close the modal

    addNotification({
        type: 'shipping',
        title: 'Return Request Sent',
        message: `Your return request for order ${orderId} has been submitted.`,
    });

    // Simulate business owner approval after a delay
    setTimeout(() => {
        setOrders(prevOrders =>
            prevOrders.map(order =>
                order.id === orderId ? { ...order, status: 'return_approved' as const } : order
            )
        );
        addNotification({
            type: 'shipping',
            title: 'Return Approved!',
            message: `Your return request for order ${orderId} has been approved.`,
        });
    }, 5000); // 5-second delay
  };

  const productSliderProps = {
    wishlistItems,
    cartItems,
    onToggleWishlist: handleToggleWishlist,
    onToggleCart: handleToggleCart,
    onSelectProduct: handleSelectProduct,
    onBuyNow: handleBuyNow,
  };

  const renderPage = () => {
    switch(currentPage) {
      case 'product':
        return selectedProduct ? (
          <ProductViewPage 
            product={selectedProduct} 
            onBack={handleNavigateToAllProducts} 
            {...productSliderProps} 
          />
        ) : (
          <HomePage
            productSliderProps={productSliderProps}
            onNavigateToAllProducts={handleNavigateToAllProducts}
            collageOccasions={collageOccasions}
            collageCrystals={collageCrystals}
            onSelectOccasion={handleSelectOccasionTile}
            onSelectCrystal={handleSelectCrystalTile}
            collageProductTypes={collageProductTypes}
            onSelectProductType={handleSelectProductTypeTile}
          />
        );
       case 'all-products':
          return <AllProductsPage {...productSliderProps} onBack={handleNavigateHome} initialFilters={initialFilters} onClearInitialFilters={clearInitialFilters} initialSearchQuery={initialSearchQuery} onClearInitialSearchQuery={clearInitialSearchQuery} />;
      case 'about-us':
        return <AboutUsPage />;
      case 'wishlist':
        return <WishlistPage 
            wishlistItems={wishlistItems}
            cartItems={cartItems}
            onToggleWishlist={handleToggleWishlist}
            onToggleCart={handleToggleCart}
            onNavigateToAllProducts={handleNavigateToAllProducts}
            onSelectProduct={handleSelectProduct}
            onAddAllToCart={(products) => handleAddAllToCart(products)}
            onBuyNow={handleBuyNow}
        />;
      case 'cart':
        return <CartPage
            cartItems={cartItems}
            wishlistItems={wishlistItems}
            onToggleWishlist={handleToggleWishlist}
            onToggleCart={handleToggleCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onSelectProduct={(product) => handleSelectProduct({ product })}
            onNavigateToAllProducts={handleNavigateToAllProducts}
            onNavigateToCheckout={handleNavigateToCheckout}
        />;
      case 'profile':
          return <ProfilePage 
              user={user}
              addresses={addresses}
              orders={orders}
              onUpdateUser={handleUpdateUserProfile}
          onUpdateAddresses={(updatedAddresses) => setAddresses(updatedAddresses)}
          onResetPassword={() => setCurrentPage('forgot-password')}
              activeTab={profilePageTab}
              setActiveTab={setProfilePageTab}
              onNavigateToAllProducts={handleNavigateToAllProducts}
              onInitiateReturn={handleInitiateReturn}
              onRefreshOrders={loadOrders}
              onAddReview={handleStartReview}
              reviews={myReviews}
          />;
      case 'checkout':
        return <CheckoutPage
            items={checkoutItems}
            user={user}
            addresses={addresses}
            onCreateOrder={handleCreateOrder}
            onNavigateToAllProducts={handleNavigateToAllProducts}
        />;
      case 'login':
        return <LoginPage onLoginSuccess={handleLoginSuccess} onNavigateToForgotPassword={handleNavigateToForgotPassword} onNavigateToSignUp={handleNavigateToSignUp} promptMessage={loginPrompt} />;
      case 'forgot-password':
        return <ForgotPasswordPage onNavigateToLogin={handleNavigateToLogin} />;
      case 'signup':
        return <SignUpPage onNavigateToLogin={handleNavigateToLogin} />;
      case 'home':
      default:
        return (
          <HomePage
            productSliderProps={productSliderProps}
            onNavigateToAllProducts={handleNavigateToAllProducts}
            collageOccasions={collageOccasions}
            collageCrystals={collageCrystals}
            onSelectOccasion={handleSelectOccasionTile}
            onSelectCrystal={handleSelectCrystalTile}
            collageProductTypes={collageProductTypes}
            onSelectProductType={handleSelectProductTypeTile}
          />
        );
    }
  }

  return (
    <div className="bg-[#FDFBF6] text-gray-800 min-h-screen">
      <Header 
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        wishlistCount={wishlistItems.length} 
        cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} 
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onNavigateHome={handleNavigateHome}
        onNavigateToAllProducts={handleNavigateToAllProducts}
        onNavigateToAboutUs={handleNavigateToAboutUs}
        onNavigateToWishlist={handleNavigateToWishlist}
        onNavigateToCart={handleNavigateToCart}
        onNavigateToProfile={handleNavigateToProfile}
        onNavigateWithFilter={(filter) => handleNavigateWithFilter(filter)}
        onSelectProduct={(product) => handleSelectProduct({ product })}
        products={menuProducts}
        onNavigateToAllProductsWithSearch={handleNavigateToAllProductsWithSearch}
      />
      <Suspense fallback={<PageLoader />}>
        {renderPage()}
      </Suspense>
      <Footer />
       {returnRequestOrder && (
        <ReturnRequestModal
          order={returnRequestOrder}
          onClose={() => setReturnRequestOrder(null)}
          onSubmit={handleSubmitReturnRequest}
        />
      )}
      {reviewTarget && (
        <ReviewModal
          productName={reviewTarget.productName}
          onSubmit={handleSubmitReview}
          onClose={() => {
            setReviewTarget(null);
            setReviewError(null);
          }}
          isSubmitting={isSubmittingReview}
          error={reviewError}
        />
      )}
    </div>
  );
};

export default App;
