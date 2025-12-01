/**
 * @file Centralized API service for interacting with a Django backend.
 * This service abstracts all data fetching, error handling, and data transformation
 * for various parts of the application.
 *
 * --- DJANGO INTEGRATION GUIDE ---
 * This file is the primary layer for connecting your React frontend to a Django REST Framework backend.
 * Currently, it uses mock data and simulates network delays. To connect to your real API:
 *
 * 1.  **Replace `mockFetch` with real `fetch` calls.** Each function includes a
 *     commented-out example of what a real `fetch` call would look like.
 *
 * 2.  **Configure `API_BASE_URL`**. Set this to your Django API's root URL
 *     (e.g., 'http://localhost:8000/api'). It's best to use environment variables for this.
 *
 * 3.  **Handle Authentication (JWT)**. The `getAuthHeaders` function is set up to retrieve a JWT
 *     token from localStorage and add it to the `Authorization: Bearer <token>` header. This is
 *     standard practice for token-based authentication with DRF Simple JWT.
 *
 * 4.  **Handle CSRF Tokens**. Django's session-based auth and form submissions require CSRF tokens.
 *     If you use DRF's `SessionAuthentication`, you'll need this. The `getCookie` function and
 *     the `X-CSRFToken` header in the state-changing requests (POST, PUT, DELETE) are included
 *     as best practice.
 *
 * 5.  **Error Handling**. The `fetch` examples include basic error handling (`if (!res.ok) throw...`). You should
 *     expand this to handle different HTTP status codes (e.g., 401 for unauthorized,
 *     403 for forbidden, 404 for not found) as needed for a robust user experience.
 *
 * 6. **Image Uploads**: For features like product image uploads, consider switching from
 *    base64 (as used in the mock data) to `multipart/form-data` for better performance. This would involve creating
 *    a `FormData` object in the API call and updating your Django view/serializer to handle file uploads.
 */

// Fix: Add Notification and NotificationType to imports
// Fix: Import ProductStatus to correctly type product statuses.
// import { Order, Product, Customer, Discount, Banner, UserProfile, Note, MainCategory, Material, SubCategory, Color, Occasion, RPD, VisitorRegionData, OrderStatus, Notification, NotificationType, CustomerStatus, ProductStatus } from '../types';
// Fix: Removed import from deprecated mockData.ts file and added mock data directly to this file.

// --- DJANGO INTEGRATION: Configuration ---
// Replace with your Django API's base URL. Use environment variables in a real app.
/**
 * @file apiService.ts
 * Connects React Frontend with Django REST Framework backend using Axios.
 */
import { Log, VisitorRegionTimeseriesPoint } from "../types";
import { NotificationType } from "../types";
import axios from "axios";
import {
  Order,
  Product,
  Customer,
  Discount,
  Banner,
  UserProfile,
  Note,
  MainCategory,
  Material,
  SubCategory,
  Color,
  Occasion,
  HomeCollageItem,
  RPD,
  VisitorRegionData,
  OrderStatus,
  Notification,
} from "../types";
// Base URL of your Django API
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";
const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Example: 'http://127.0.0.1:8000/api'



// --- DJANGO INTEGRATION: CSRF Token Helper ---
/**
 * Retrieves a cookie value by name. Necessary for Django's CSRF protection with SessionAuthentication.
 * @param name The name of the cookie (usually 'csrftoken').
 * @returns The value of the cookie, or null if not found.
 */
function getCookie(name: string): string | null {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
// api.interceptors.request.use((config) => {
//   const token = getAccessToken();
//   if (token && config.headers) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   // Attach X-CSRFToken for unsafe methods if cookie exists
//   const csrftoken = getCookie("csrftoken");
//   if (csrftoken && config.headers && ["post", "put", "patch", "delete"].includes((config.method || "").toLowerCase())) {
//     config.headers["X-CSRFToken"] = csrftoken;
//   }
//   return config;
// });

// --- DJANGO INTEGRATION: Authentication Headers Helper ---
/**
 * Constructs authentication headers for protected API endpoints using JWT.
 * @returns A HeadersInit object with the Authorization token if it exists.
 */
// const getAuthHeaders = (): HeadersInit => {
//     const token = localStorage.getItem('accessToken'); // Assuming you store the JWT access token here
//     const headers: HeadersInit = {
//         'Content-Type': 'application/json',
//     };
//     if (token) {
//         headers['Authorization'] = `Bearer ${token}`;
//     }
//     return headers;
// };


// ====================
// AUTH HEADERS HELPERS
// ====================

/** Get current JWT access token from localStorage */
const getAccessToken = () => localStorage.getItem("accessToken");

/** Get current refresh token from localStorage */
const getRefreshToken = () => localStorage.getItem("refreshToken");

/** Save new tokens */
const saveTokens = (access: string, refresh: string) => {
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
};

/** Clear tokens on logout or expiry */
const clearTokens = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
};

export const logoutUser = () => {
  clearTokens();
  window.location.href = "/login";
};

// ====================
// AUTH: OTP + RESET
// ====================

export const sendOtp = async (email: string, purpose: 'login' | 'reset') => {
  const res = await axios.post(`${API_BASE_URL}/auth/otp/send/`, { email, purpose });
  return res.data;
};

export const verifyOtp = async (email: string, code: string, purpose: 'login' | 'reset') => {
  const res = await axios.post(`${API_BASE_URL}/auth/otp/verify/`, { email, code, purpose });
  return res.data;
};

export const confirmPasswordReset = async (email: string, token: string, newPassword: string) => {
  const res = await axios.post(`${API_BASE_URL}/auth/password-reset/confirm/`, {
    email,
    token,
    new_password: newPassword,
  });
  return res.data;
};

/** Login Superuser via Email + Password (REAL API call) */
// export const loginSuperUser = async (email: string, password: string) => {
//   try {
//     const res = await axios.post(`${API_BASE_URL}/auth/token/`, { email, password });
//     const { access, refresh } = res.data;
//     saveTokens(access, refresh);
//     return { access, refresh };
//   } catch (error: any) {
//     console.error("Login failed:", error.response?.data || error.message);
//     throw new Error(error.response?.data?.detail || "Invalid credentials");
//   }
// };

/** Login via Email + Password with Captcha + Attempts */
/** Login via Email + Password with Captcha + Attempts */
export const loginSuperUser = async (email: string, password: string, captchaToken?: string) => {
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/login/`, {
      email,
      password,
      captcha_token: captchaToken,
    });
    const { access, refresh } = res.data;
    saveTokens(access, refresh);
    return { access, refresh };
  } catch (error: any) {
    console.error("Login failed:", error.response?.data || error.message);
    const errData = error.response?.data || { detail: "Invalid credentials" };

    // Normalize keys
    throw {
      detail: errData.detail,
      // Support both camelCase and snake_case from backend renderers
      captchaRequired:
        (errData.captchaRequired ?? errData.captcha_required) ?? false,
      attempts: errData.attempts ?? null,
      blockedUntil:
        (errData.blockedUntil ?? errData.blocked_until) ?? null,
    };
  }
};



/** Refresh expired JWT token */
const refreshToken = async (): Promise<string | null> => {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  try {
    const res = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, { refresh });
    const newAccess = res.data.access;
    if (newAccess) {
      localStorage.setItem("accessToken", newAccess);
      return newAccess;
    }
    return null;
  } catch (error) {
    clearTokens();
    return null;
  }
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
};


/**
 * A mock fetch utility to simulate API calls with a delay.
 * In a real application, this entire function is replaced by actual `fetch` calls.
 */

// ====================
// GENERIC API WRAPPER
// ====================

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: getAuthHeaders(),
});

// Prevent stale cached responses: add cache-busting param on GET and no-store headers.
api.interceptors.request.use((config) => {
  // Ensure auth header stays current
  config.headers = {
    ...(config.headers || {}),
    ...getAuthHeaders(),
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
  };
  if ((config.method || "").toLowerCase() === "get") {
    const params = new URLSearchParams(config.params as any);
    if (!params.has("_")) {
      params.set("_", Date.now().toString());
    }
    config.params = params;
  }
  return config;
});

// Debug helpers (opt-in)
// const DEBUG_API = true; // set false to silence
const trimString = (s: any, len = 64) => {
  if (typeof s !== 'string') return s;
  return s.length > len ? `${s.slice(0, len)}…(${s.length}b)` : s;
};
const sanitizePayload = (obj: any) => {
  try {
    return JSON.parse(
      JSON.stringify(obj, (_k, v) => {
        if (typeof v === 'string' && v.startsWith('data:image')) return trimString(v, 64);
        if (Array.isArray(v) && v.length > 0 && typeof v[0] === 'string' && v[0].startsWith('data:image')) {
          return v.slice(0, 3).map((x) => trimString(x, 64)).concat(v.length > 3 ? [`(+${v.length - 3} more)`] : []);
        }
        return v;
      })
    );
  } catch {
    return obj;
  }
};
// const dbg = (...args: any[]) => { if (DEBUG_API) console.log('[API]', ...args); };

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // if (DEBUG_API) {
  //   try {
  //     const method = (config.method || 'GET').toUpperCase();
  //     dbg('→', method, config.baseURL ? `${config.baseURL}${config.url}` : config.url, {
  //       headers: { ...config.headers, Authorization: config.headers?.Authorization ? 'Bearer ***' : undefined },
  //       data: sanitizePayload(config.data),
  //     });
  //   } catch {}
  // }
  return config;
});

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (res) => {
    // if (DEBUG_API) {
    //   try {
    //     dbg('←', res.status, res.config?.url, sanitizePayload(res.data));
    //   } catch {}
    // }
    return res;
  },
  (error) => {
    // if (DEBUG_API && error?.response) {
    //   try {
    //     dbg('x', error.response.status, error.config?.url, sanitizePayload(error.response.data));
    //   } catch {}
    // }
    if (error.response && error.response.status === 401) {
      // handled by refresh-aware interceptor; do not redirect here
    }
    return Promise.reject(error);
  }
);

// =============================
// 401 handling with silent refresh
// =============================
let isRefreshing = false as boolean;
let refreshWaiters: Array<(token: string | null) => void> = [];
const notifyRefreshWaiters = (token: string | null) => {
  refreshWaiters.forEach(cb => { try { cb(token); } catch {} });
  refreshWaiters = [];
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config || {};
    if (status === 401 && !originalRequest._retry && !String(originalRequest?.url || '').includes('/auth/token/refresh/')) {
      originalRequest._retry = true;
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshWaiters.push((newToken) => {
            if (!newToken) return reject(error);
            try {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            } catch {}
            resolve(api(originalRequest));
          });
        });
      }
      isRefreshing = true;
      try {
        const newAccess = await refreshToken();
        isRefreshing = false;
        notifyRefreshWaiters(newAccess);
        if (newAccess) {
          try {
            api.defaults.headers.common = api.defaults.headers.common || {} as any;
            (api.defaults.headers.common as any).Authorization = `Bearer ${newAccess}`;
          } catch {}
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        }
        clearTokens();
        return Promise.reject(error);
      } catch {
        isRefreshing = false;
        notifyRefreshWaiters(null);
        clearTokens();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// =============================
// MAINTENANCE / UTILITIES
// =============================

/** Trigger server-side backup of SQLite DB and return backup URL */
export const backupDatabase = async (): Promise<{ backupUrl: string; backupPath: string; filename: string }> => {
  const res = await api.post("/backup-db/");
  return res.data;
};

/** List existing DB backup files */
export const listBackups = async (): Promise<Array<{ filename: string; url: string; size: number; modified: string }>> => {
  const res = await api.get("/backups/");
  return res.data;
};

/** Restore database from a selected backup filename */
export const restoreDatabase = async (filename: string): Promise<{ message: string; restoredFrom: string; safetyBackup: string }> => {
  const res = await api.post("/restore-db/", { filename });
  return res.data;
};

// =============================
// NOTIFICATIONS: CREATE
// =============================
export const createNotification = async (payload: { title: string; message: string; type: NotificationType }) => {
  const res = await api.post("/notifications/", payload);
  return res.data as Notification;
};




// =================================
// ORDERS API
// =================================

export const getOrders = async (): Promise<Order[]> => {
  const res = await api.get("/orders/");
  const raw = (res.data as any).results || res.data || [];

  const normalizeStatus = (s: any): OrderStatus => {
    const lower = String(s || "").toLowerCase();
    switch (lower) {
      case "pending":
        return OrderStatus.Pending;
      case "accepted":
        return OrderStatus.Accepted;
      case "dispatched":
        return OrderStatus.Dispatched;
      case "completed":
        return OrderStatus.Completed;
      case "cancelled":
      case "canceled":
        return OrderStatus.Cancelled;
      default:
        return (s as OrderStatus) || OrderStatus.Pending;
    }
  };

  const normalizeOrder = (order: any): Order => ({
    id: Number(order.id),
    customerName: order.customer?.name || order.customer_name || order.customerName || "N/A",
    customerEmail: order.customer?.email || order.customerEmail || undefined,
    customerPhone: order.customer?.phone || order.customerPhone || undefined,
    date: order.created_at || order.date || order.createdAt || new Date().toISOString(),
    status: normalizeStatus(order.status),
    amount: Number(order.total_amount ?? order.amount ?? order.totalAmount ?? 0),
    paymentMethod: order.payment_method || order.paymentMethod,
    gstPercent: order.gst_percent ?? order.gstPercent ?? undefined,
    deliveryCharge: order.delivery_charge ?? order.deliveryCharge ?? undefined,
    items: (order.items || []).map((it: any) => ({
      id: (it.id?.toString?.() ?? it.id ?? `${it.name}-${Math.random()}`) as string,
      name: it.name,
      sku: it.sku,
      price: Number(it.price ?? 0),
      quantity: Number(it.quantity ?? 0),
    })),
    address: (
      order.address_line1 || order.addressLine1 || order.city || order.addressCity || order.state || order.addressState || order.pincode || order.addressPincode
    )
      ? {
          line1: order.address_line1 || order.addressLine1 || "",
          line2: order.address_line2 || order.addressLine2 || "",
          city: order.city || order.addressCity || "",
          state: order.state || order.addressState || "",
          pincode: order.pincode || order.addressPincode || "",
        }
      : undefined,
  });

  return Array.isArray(raw) ? raw.map(normalizeOrder) : [];
};


export const createOrder = async (orderData: {
  customer: { name: string; email: string; phone: string };
  items: { name: string; sku?: string; price: number; quantity: number }[];
  status: string;
  totalAmount: number;
  paymentMethod: string;
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };
}): Promise<Order> => {
  const payload = {
    customer: orderData.customer,
    status: orderData.status,
    total_amount: orderData.totalAmount,
    payment_method: orderData.paymentMethod,
    address_line1: orderData.address.line1,
    address_line2: orderData.address.line2,
    city: orderData.address.city,
    state: orderData.address.state,
    pincode: orderData.address.pincode,
    items: orderData.items.map(i => ({ name: i.name, sku: i.sku, price: i.price, quantity: i.quantity })),
  };

  const response = await api.post("/orders/", payload);
  return response.data;
};



export const updateOrderStatus = async (orderId: number, status: string) => {
  const response = await api.patch(`/orders/${orderId}/`, { status });
  return response.data;
};

// Update order details (orders app shape)
export const updateOrderDetails = async (
  orderId: number,
  data: {
    customer?: { name: string; email: string; phone: string };
    status: string;
    items: { name: string; sku?: string; price: number; quantity: number }[];
    paymentMethod?: string;
    address?: { line1: string; line2?: string; city: string; state: string; pincode: string };
  }
) => {
  const total_amount = data.items.reduce(
    (sum: number, it: any) => sum + Number(it.price) * Number(it.quantity),
    0
  );
  const payload: any = {
     status: data.status,
  items: data.items.map(it => ({
    name: it.name,
    sku: it.sku,
    price: it.price,
    quantity: it.quantity,
    product: null,   // ✅ ensure serializer doesn’t complain
  })),
  };
  if (data.customer && data.customer.name && data.customer.email && data.customer.phone) {
    payload.customer = data.customer;
  }
  if (data.paymentMethod) payload.payment_method = data.paymentMethod;
  if (data.address) {
     payload.address_line1 = data.address.line1 || "";
    payload.address_line2 = data.address.line2 || "";
    payload.city = data.address.city || "";
    payload.state = data.address.state || "";
    payload.pincode = data.address.pincode || "";
  }
  const res = await api.put(`/orders/${orderId}/`, payload);
  return res.data;
};


// // =================================
// // PRODUCTS API (with Debug Logs)
// // =================================

// export const getProducts = async (): Promise<Product[]> => {
//   console.log("📦 [GET] Fetching products...");
//   try {
//     const res = await api.get("/products/");
//     console.log("✅ [GET] Products fetched:", res.data);
//     return res.data;
//   } catch (error: any) {
//     console.error("❌ [GET] Failed to fetch products:", error.response?.data || error.message);
//     throw error;
//   }
// };

// export const createProduct = async (
//   productData: Partial<Product>,
//   onUploadProgress?: (percent: number) => void
// ): Promise<Product> => {
//   console.log("🆕 [POST] Creating new product:", productData);

//   try {
//     const res = await api.post("/products/", productData, {
//       onUploadProgress: (progressEvent) => {
//         if (progressEvent.total) {
//           const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
//           onUploadProgress?.(percent);
//         }
//       },
//     });

//     console.log("✅ Product created:", res.data);
//     return res.data;
//   } catch (error: any) {
//     console.error("❌ Product creation failed:", error.response?.data || error.message);
//     throw error;
//   }
// };


// export const updateProduct = async (productData: Product): Promise<Product> => {
//   console.log(`✏️ [PUT] Updating product ID ${productData.id} with data:`, productData);
//   try {
//     const res = await api.put(`/products/${productData.id}/`, productData);
//     console.log("✅ [PUT] Product updated successfully:", res.data);
//     return res.data;
//   } catch (error: any) {
//     console.error(`❌ [PUT] Failed to update product ID ${productData.id}:`);
//     console.error("   ↳ Sent data:", productData);
//     console.error("   ↳ Server response:", error.response?.data || error.message);
//     throw error;
//   }
// };

// export const deleteProduct = async (id: number): Promise<void> => {
//   console.log(`🗑️ [DELETE] Deleting product ID ${id}...`);
//   try {
//     await api.delete(`/products/${id}/`);
//     console.log(`✅ [DELETE] Product ID ${id} deleted successfully.`);
//   } catch (error: any) {
//     console.error(`❌ [DELETE] Failed to delete product ID ${id}:`, error.response?.data || error.message);
//     throw error;
//   }
// };
// -----------------------------
// 1️⃣ GET Products
// -----------------------------
export const getProducts = async (): Promise<Product[]> => {
  console.log("📦 [GET] Fetching products...");
  try {
    const res = await api.get("/products/");
    console.log("✅ [GET] Products fetched:", res.data);

    const mapStatus = (s: any): Product["status"] => {
      if (!s) return "Out of Stock" as Product["status"];
      const val = String(s);
      const lower = val.toLowerCase();
      if (lower === "in_stock" || val === "In Stock") return "In Stock" as Product["status"];
      if (lower === "out_of_stock" || val === "Out of Stock") return "Out of Stock" as Product["status"];
      return "Out of Stock" as Product["status"];
    };
    const mapLimitedDeal = (p: any) => (p?.limitedDealEndsAt ?? p?.limited_deal_ends_at ?? null);
    const list = ((res.data as any)?.results ?? res.data ?? []) as any[];
    return list.map((p) => ({ ...p, status: mapStatus(p?.status), limitedDealEndsAt: mapLimitedDeal(p) })) as Product[]
  } catch (error: any) {
    console.error(
      "❌ [GET] Failed to fetch products:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// -----------------------------
// 2️⃣ CREATE Product
// -----------------------------
export const createProduct = async (
  productData: Partial<Product>,
  onUploadProgress?: (percent: number) => void
): Promise<Product> => {
  console.log("🆕 [POST] Creating new product:", productData);



  try {
    const payload = { ...productData };
    const res = await api.post("/products/", payload, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress?.(percent);
        }
      },
    });

    console.log("✅ Product created:", res.data);
    const mapStatus = (s: any): Product["status"] => {
      if (!s) return "Out of Stock" as Product["status"];
      const val = String(s);
      const lower = val.toLowerCase();
      if (lower === "in_stock" || val === "In Stock") return "In Stock" as Product["status"];
      if (lower === "out_of_stock" || val === "Out of Stock") return "Out of Stock" as Product["status"];
      return "Out of Stock" as Product["status"];
    };
    return {
      ...(res.data as any),
      status: mapStatus((res.data as any)?.status),
      limitedDealEndsAt: (res.data as any)?.limitedDealEndsAt ?? (res.data as any)?.limited_deal_ends_at ?? null,
    } as Product;
  } catch (error: any) {
    console.error(
      "❌ Product creation failed:",
      error.response?.data || error.message
    );
    throw error;
  }
};

// -----------------------------
// 3️⃣ UPDATE Product
// -----------------------------
export const updateProduct = async (
  productData: Product
): Promise<Product> => {
  // console.log(`✏️ [PUT] Updating product ID ${productData.id}:`, productData);

  // Clean variants before sending
  const cleanVariants = productData.variants.map(v => {
    let variant = { ...v };
    const cleanList = (arr: any) => (Array.isArray(arr) ? arr : []);

    // Strip fake IDs (e.g. Date.now()) so backend can assign real ones
    if (!variant.id || String(variant.id).length > 10) {
      const { id, ...rest } = variant;
      variant = rest;
    }

    // Normalize SKU (trim spaces, avoid accidental dupes)
    if (variant.sku) {
      variant.sku = variant.sku.trim();
    }

    // Coerce numeric fields to numbers to avoid empty-string -> 0 issues server-side
    if (variant.mrp !== undefined) (variant as any).mrp = Number(variant.mrp) || 0;
    if (variant.sellingPrice !== undefined) (variant as any).sellingPrice = Number((variant as any).sellingPrice) || 0;
    if (variant.stock !== undefined) (variant as any).stock = Number(variant.stock) || 0;
    (variant as any).materials = cleanList((variant as any).materials);
    (variant as any).colors = cleanList((variant as any).colors);
    (variant as any).occasions = cleanList((variant as any).occasions);
    (variant as any).sizes = cleanList((variant as any).sizes);

    return variant;
  });

  const payload = { ...productData, variants: cleanVariants };

  try {
    const res = await api.put(`/products/${productData.id}/`, payload);
    console.log("✅ [PUT] Product updated successfully:", res.data);
    return {
      ...(res.data as any),
      limitedDealEndsAt: (res.data as any)?.limitedDealEndsAt ?? (res.data as any)?.limited_deal_ends_at ?? null,
    };
  } catch (error: any) {
    console.error(`❌ [PUT] Failed to update product ID ${productData.id}:`);
    console.error("   ↳ Sent data:", payload);
    console.error("   ↳ Server response:", error.response?.data || error.message);
    throw error;
  }
};

// -----------------------------
// 4️⃣ DELETE Product
// -----------------------------
export const deleteProduct = async (id: number): Promise<void> => {
  // console.log(`🗑️ [DELETE] Deleting product ID ${id}...`);
  try {
    await api.delete(`/products/${id}/`);
    // console.log(`✅ [DELETE] Product ID ${id} deleted successfully.`);
  } catch (error: any) {
    console.error(`❌ [DELETE] Failed to delete product ID ${id}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// =============================
// ORDERS: DELETE
// =============================
export const deleteOrder = async (orderId: number): Promise<{ success: true }> => {
  await api.delete(`/orders/${orderId}/`);
  return { success: true };
};

// =================================
// CUSTOMERS API
// =================================

export const getCustomers = async (): Promise<Customer[]> => {
  // Use storefront customer accounts
  const res = await api.get("/customer-accounts/");
  const list = res.data || [];
  return list.map((c: any): Customer => ({
    id: c.id,
    name: c.name,
    email: c.email,
    avatarUrl: c.avatarUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(c.name || 'C'),
    registrationDate: c.created_at || c.registrationDate || new Date().toISOString(),
    status: (c.is_active === false || String(c.status || '').toLowerCase() === 'blocked') ? 'Blocked' as Customer["status"] : 'Active' as Customer["status"],
    totalOrders: c.total_orders || 0,
    totalSpend: Number(c.total_spend || 0),
  }));
};

/** Update customer’s active/suspended status */
export const updateCustomerStatus = async (
  customerId: number,
  status: Customer["status"]
): Promise<{ success: true }> => {
  // Block/unblock removed from UI; keep for compatibility but no-op
  return { success: true };
};

/** Delete a customer (admin-only endpoint) */
export const deleteCustomer = async (
  customerId: number
): Promise<{ success: true }> => {
  try {
    await api.delete(`/customer-accounts/${customerId}/`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting customer:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to delete customer");
  }
};

// =================================
// DISCOUNTS API (Connected to Django Backend)
// =================================

/** Fetch all discounts */
export const getDiscounts = async (): Promise<Discount[]> => {
  try {
    const res = await api.get("/discounts/");
    return res.data;
  } catch (error: any) {
    console.error("Error fetching discounts:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch discounts");
  }
};

/** Create a new discount */
export const createDiscount = async (
  discountData: Omit<Discount, "id">
): Promise<Discount> => {
  try {
    const res = await api.post("/discounts/", discountData);
    return res.data;
  } catch (error: any) {
    console.error("Error creating discount:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to create discount");
  }
};

/** Update an existing discount */
export const updateDiscount = async (discountData: Discount): Promise<Discount> => {
  try {
    const res = await api.put(`/discounts/${discountData.id}/`, discountData);
    return res.data;
  } catch (error: any) {
    console.error("Error updating discount:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to update discount");
  }
};

/** Delete a discount */
export const deleteDiscount = async (
  discountId: number
): Promise<{ success: true }> => {
  try {
    await api.delete(`/discounts/${discountId}/`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting discount:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to delete discount");
  }
};



// =================================
// BANNERS API (Connected to Django Backend)
// =================================

/** Fetch all banners */
export const getBanners = async (): Promise<Banner[]> => {
  try {
    const res = await api.get("/banners/", { params: { all: "true" } });
    return res.data;
  } catch (error: any) {
    console.error("Error fetching banners:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to fetch banners");
  }
};

/** Create a new banner */
// export const createBanner = async (
//   bannerData: Omit<Banner, "id">
// ): Promise<Banner> => {
//   try {
//     const res = await api.post("/banners/", bannerData);
//     return res.data;
//   } catch (error: any) {
//     console.error("Error creating banner:", error.response?.data || error.message);
//     throw new Error(error.response?.data?.detail || "Failed to create banner");
//   }
// };

/** Update an existing banner */
// export const updateBanner = async (bannerData: Banner): Promise<Banner> => {
//   try {
//     const res = await api.put(`/banners/${bannerData.id}/`, bannerData);
//     return res.data;
//   } catch (error: any) {
//     console.error("Error updating banner:", error.response?.data || error.message);
//     throw new Error(error.response?.data?.detail || "Failed to update banner");
//   }
// };

// await api.post("/banners/", formData, { headers: { "Content-Type": "multipart/form-data" } });


// apiService.ts

/** Create a new banner */

export const createBanner = async (bannerData: Omit<Banner, "id">): Promise<Banner> => {
  try {
    const formData = new FormData();
    formData.append("title", bannerData.title);

    // Only append image if a new file is provided (avoid sending URL string)
    const img: any = (bannerData as any).image;
    if (img instanceof File || img instanceof Blob) {
      formData.append("image", img);
    }

    if (bannerData.startDate) {
      formData.append("start_date", bannerData.startDate);
    }
    if (bannerData.endDate) {
      formData.append("end_date", bannerData.endDate);
    }

    formData.append("status", bannerData.status);

    const res = await api.post("/banners/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  } catch (error: any) {
    console.error("Error creating banner:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to create banner");
  }
};

/** Update an existing banner */
export const updateBanner = async (bannerData: Banner): Promise<Banner> => {
  try {
    const formData = new FormData();
    formData.append("title", bannerData.title);
    // Only append image if a new file is provided (avoid sending URL string)
    const img: any = (bannerData as any).image;
    if (img instanceof File || img instanceof Blob) {
      formData.append("image", img);
    }

    if (bannerData.startDate) {
      formData.append("start_date", bannerData.startDate);
    }
    if (bannerData.endDate) {
      formData.append("end_date", bannerData.endDate);
    }

    formData.append("status", bannerData.status);

    const res = await api.put(`/banners/${bannerData.id}/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return res.data;
  } catch (error: any) {
    console.error("Error updating banner:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to update banner");
  }
};


/** Delete a banner */
export const deleteBanner = async (
  bannerId: number
): Promise<{ success: true }> => {
  try {
    await api.delete(`/banners/${bannerId}/`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting banner:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to delete banner");
  }
};



// =================================
// USER PROFILE & NOTIFICATIONS API
// =================================

// export const getUserProfile = (): Promise<UserProfile> => mockFetch(MOCK_USER_PROFILE);
// export const getUserProfile = async () => {
//   const res = await axios.get(`${API_BASE_URL}/users/profile/`, {
//     headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
//   });
//   return res.data;
// };

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getUserProfile = async (): Promise<UserProfile> => {
  const response = await api.get("/users/profile/");
  const d = response.data || {};

  return {
    id: String(d.id ?? ""),
    name: (d.full_name ?? (d as any).fullName ?? "") as string,
    email: (d.email ?? "") as string,
    phone: (d.phone ?? "") as string,
    recoveryEmail: (d.recovery_email ?? (d as any).recoveryEmail ?? "") as string,
    role: (d.role ?? "") as string,
    avatarUrl: (d.avatar ?? (d as any).avatarUrl ?? "") as string,
    businessDetails: {
      name: (d.business_name ?? (d as any).businessName ?? "") as string,
      address: (d.business_address ?? (d as any).businessAddress ?? "") as string,
      gstNumber: (d.gst_number ?? (d as any).gstNumber ?? "") as string,
      panCard: (d.pan_card ?? (d as any).panCard ?? "") as string,
    },
    notificationSettings: {
      [NotificationType.NewOrder]: (d.notify_orders ?? (d as any).notifyOrders ?? false) as boolean,

      // updates group
      [NotificationType.OrderDeclined]: (d.notify_updates ?? (d as any).notifyUpdates ?? false) as boolean,
      [NotificationType.OrderStatusUpdate]: (d.notify_updates ?? (d as any).notifyUpdates ?? false) as boolean,
      [NotificationType.ProductOutOfStock]: (d.notify_updates ?? (d as any).notifyUpdates ?? false) as boolean,
      [NotificationType.ProductLowStock]: (d.notify_updates ?? (d as any).notifyUpdates ?? false) as boolean,
      [NotificationType.ProductRemoved]: (d.notify_updates ?? (d as any).notifyUpdates ?? false) as boolean,
      [NotificationType.PasswordReset]: (d.notify_updates ?? (d as any).notifyUpdates ?? false) as boolean,

      // promotions group
      [NotificationType.BannerTimeout]: (d.notify_promotions ?? (d as any).notifyPromotions ?? false) as boolean,
      [NotificationType.DiscountTimeout]: (d.notify_promotions ?? (d as any).notifyPromotions ?? false) as boolean,
      [NotificationType.NewProductAdded]: (d.notify_promotions ?? (d as any).notifyPromotions ?? false) as boolean,
      [NotificationType.WelcomeMessage]: (d.notify_promotions ?? (d as any).notifyPromotions ?? false) as boolean,

      // always include extra keys so TS doesn’t complain
      [NotificationType.Info]: false,
    },
  };
};

// export const updateUserProfile = async (data: any) => {
//   const res = await axios.put(`${API_BASE_URL}/users/profile/`, data, {
//     headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
//   });
//   return res.data;
// };

// export const updateUserProfile = async (payload: { full_name: any; email: any; phone: any; recovery_email: any; avatar: any; role: any; business_name: any; business_address: any; gst_number: any; pan_card: any; notify_orders: any; notify_promotions: any; notify_updates: any; }) => {
//   const response = await api.patch("/users/profile/");
//   return response.data;
// };

// export const updateUserProfile = async (payload: {
//   full_name: string;
//   email: string;
//   phone: string;
//   recovery_email: string;
//   avatar: string;
//   role: string;
//   business_name: string;
//   business_address: string;
//   gst_number: string;
//   pan_card: string;
//   notify_orders?: boolean;
//   notify_order_declined?: boolean;
//   notify_order_status?: boolean;
//   notify_banner_timeout?: boolean;
//   notify_discount_timeout?: boolean;
//   notify_product_out_of_stock?: boolean;
//   notify_product_low_stock?: boolean;
//   notify_new_product_added?: boolean;
//   notify_product_removed?: boolean;
//   notify_welcome_message?: boolean;
//   notify_password_reset?: boolean;
// }) => {

// export const updateUserProfile = async (payload: {
//   full_name: string;
//   email: string;
//   phone: string;
//   recovery_email: string;
//   avatar: string;
//   role: string;
//   business_name: string;
//   business_address: string;
//   gst_number: string;
//   pan_card: string;
//   notify_orders: boolean;
//   notify_promotions: boolean;
//   notify_updates: boolean;
// }) => {
//   try {
//     console.log("Sending payload to backend:", payload); // 👈 Add this
//     const response = await api.patch("/users/profile/", payload, {
//       headers: {
//         Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
//         "Content-Type": "application/json",
//       },
//     });
//     console.log("Backend response:", response.data); // 👈 Add this
//     return response.data;
//   } catch (error: any) {
//     console.error("Profile update failed:", error.response?.data || error.message);
//     throw new Error(error.response?.data?.detail || "Failed to update profile");
//   }
// };

export const updateUserProfile = async (payload: {
  full_name: string;
  email: string;
  phone: string;
  recovery_email: string;
  avatar: string;
  role: string;
  business_name: string;
  business_address: string;
  gst_number: string;
  pan_card: string;
  notify_orders: boolean;
  notify_promotions: boolean;
  notify_updates: boolean;
}) => {
  try {
    console.log("Sending payload to backend:", payload);
    const response = await api.patch("/users/profile/", payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        "Content-Type": "application/json",
      },
    });
    console.log("Backend response:", response.data);
    return response.data; // ✅ will now contain updated profile
  } catch (error: any) {
    console.error("Profile update failed:", error.response?.data || error.message);
    throw new Error(error.response?.data?.detail || "Failed to update profile");
  }
};


// ✅ Fetch notifications
export const getNotifications = async (): Promise<Notification[]> => {
  const res = await api.get("/notifications/");
  const list = res.data || [];
  return list.map((n: any) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type as any,
    isRead: Boolean(n.is_read),
    timestamp: n.created_at || new Date().toISOString(),
  }));
};

// ✅ Mark all as read
export const markAllNotificationsRead = async (): Promise<void> => {
  await api.post("/notifications/mark_all_read/");
};
// export const getUserProfile = async () => {
//   const res = await axios.get(`${API_BASE}profile/`, {
//     headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
//   });
//   return res.data;
// };

// export const updateUserProfile = async (data: any) => {
//   const res = await axios.put(`${API_BASE}profile/`, data, {
//     headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
//   });
//   return res.data;
// };
// =================================
// NOTES API
// =================================
// export const getNotes = (): Promise<Note[]> => mockFetch(MOCK_NOTES);
export const getNotes = async (): Promise<Note[]> => {
  const res = await api.get("/notes/");
  return res.data;
};
export const createNote = async (content: string): Promise<Note> => {
  const res = await api.post("/notes/", { content });
  return res.data;
};

// Update a note
export const updateNote = async (noteId: number, content: string): Promise<Note> => {
  const res = await api.put(`/notes/${noteId}/`, { content });
  return res.data;
};

// Delete a note
export const deleteNote = async (noteId: number): Promise<{ success: true }> => {
  await api.delete(`/notes/${noteId}/`);
  return { success: true };
};

// =================================
// PRODUCT ATTRIBUTES API
// =================================

// export const getMainCategories = (): Promise<MainCategory[]> => mockFetch(MOCK_MAIN_CATEGORIES);
export const getMainCategories = async (): Promise<MainCategory[]> => {
  const res = await api.get("/main-categories/");
  return res.data;
};

export const createMainCategory = async (name: string) => {
  const res = await api.post("/main-categories/", { name });
  return res.data;
};

export const deleteMainCategory = async (id: number) => {
  await api.delete(`/main-categories/${id}/`);
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ------------------ MATERIALS ------------------

export const getMaterials = async (): Promise<Material[]> => {
  const res = await api.get("/materials/");
  return res.data;
};

export const createMaterial = async (name: string): Promise<Material> => {
  const res = await api.post("/materials/", { name });
  return res.data;
};

export const deleteMaterial = async (id: number): Promise<{ success: boolean }> => {
  await api.delete(`/materials/${id}/`);
  return { success: true };
};

// ------------------ SUBCATEGORIES ------------------

export const getSubCategories = async (): Promise<SubCategory[]> => {
  const res = await api.get("/subcategories/");
  const items = Array.isArray(res.data) ? res.data : [];
  // Backend uses camelCase via CamelCaseJSONRenderer (mainCategory),
  // but we normalize to snake_case key `main_category` (numeric id) for the UI.
  return items.map((s: any) => {
    const raw = (s?.mainCategory ?? s?.main_category);
    const id = raw && typeof raw === "object" ? Number(raw.id) : (raw != null ? Number(raw) : null);
    return { ...s, main_category: id } as SubCategory;
  });
};

export const createSubCategory = async (
  name: string,
  mainCategoryId: number
): Promise<SubCategory> => {
  // Send camelCase to match CamelCaseJSONParser; still compatible if backend accepts snake_case.
  const payload: any = { name, mainCategory: mainCategoryId };
  const res = await api.post("/subcategories/", payload);
  const s = res.data;
  const raw = (s?.mainCategory ?? s?.main_category);
  const id = raw && typeof raw === "object" ? Number(raw.id) : (raw != null ? Number(raw) : null);
  return { ...s, main_category: id } as SubCategory;
};

export const deleteSubCategory = async (id: number): Promise<{ success: boolean }> => {
  await api.delete(`/subcategories/${id}/`);
  return { success: true };
};

// ------------------ COLORS ------------------

export const getColors = async (): Promise<Color[]> => {
  const res = await api.get("/colors/");
  return res.data;
};

export const createColor = async (name: string): Promise<Color> => {
  const res = await api.post("/colors/", { name });
  return res.data;
};

export const deleteColor = async (id: number): Promise<{ success: boolean }> => {
  await api.delete(`/colors/${id}/`);
  return { success: true };
};

// ------------------ OCCASIONS ------------------

export const getOccasions = async (): Promise<Occasion[]> => {
  const res = await api.get("/occasions/");
  return res.data;
};

export const createOccasion = async (name: string): Promise<Occasion> => {
  const res = await api.post("/occasions/", { name });
  return res.data;
};

export const deleteOccasion = async (id: number): Promise<{ success: boolean }> => {
  await api.delete(`/occasions/${id}/`);
  return { success: true };
};

// ------------------ HOMEPAGE COLLAGE (Occasion/Crystal) ------------------

const mapCollageItem = (raw: any): HomeCollageItem => ({
  id: Number(raw.id ?? 0),
  name: raw.name ?? raw.title ?? "",
  item_type: (raw.item_type ?? raw.itemType ?? raw.type ?? "occasion") as HomeCollageItem["item_type"],
  image: raw.image ?? null,
  imageUrl: raw.imageUrl ?? raw.image_url ?? raw.image ?? null,
  image_url: raw.image_url ?? null,
  grid_class: raw.grid_class ?? raw.gridClass ?? "",
  display_order: raw.display_order ?? raw.displayOrder ?? 0,
  redirect_url: raw.redirect_url ?? raw.redirectUrl ?? null,
  created_at: raw.created_at,
  updated_at: raw.updated_at,
});

export const getCollageItems = async (type?: HomeCollageItem["item_type"]): Promise<HomeCollageItem[]> => {
  const res = await api.get("/collage-items/", { params: type ? { type } : undefined });
  const payload = res.data;
  const arr = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.results)
        ? payload.results
        : [];
  if (arr.length) return arr.map(mapCollageItem);

  const grouped: any[] = [
    ...(Array.isArray(payload?.occasion) ? payload.occasion : []),
    ...(Array.isArray(payload?.crystal) ? payload.crystal : []),
  ];
  return grouped.map(mapCollageItem);
};

export const createCollageItem = async (payload: {
  name: string;
  item_type: HomeCollageItem["item_type"];
  imageFile?: File | null;
  image_url?: string;
  grid_class?: string;
  redirect_url?: string;
  display_order?: number;
}): Promise<HomeCollageItem> => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("item_type", payload.item_type);
  if (payload.imageFile) formData.append("image", payload.imageFile);
  if (payload.image_url) formData.append("image_url", payload.image_url);
  if (payload.grid_class !== undefined) formData.append("grid_class", payload.grid_class);
  if (payload.redirect_url) formData.append("redirect_url", payload.redirect_url);
  if (typeof payload.display_order === "number") formData.append("display_order", String(payload.display_order));

  const res = await api.post("/collage-items/", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return mapCollageItem(res.data);
};

export const updateCollageItem = async (
  id: number,
  payload: {
    name?: string;
    item_type?: HomeCollageItem["item_type"];
    imageFile?: File | null;
    image_url?: string | null;
    grid_class?: string;
    redirect_url?: string | null;
    display_order?: number;
  }
): Promise<HomeCollageItem> => {
  const formData = new FormData();
  if (payload.name !== undefined) formData.append("name", payload.name);
  if (payload.item_type) formData.append("item_type", payload.item_type);
  if (payload.imageFile) formData.append("image", payload.imageFile);
  if (payload.image_url !== undefined && payload.image_url !== null) formData.append("image_url", payload.image_url);
  if (payload.grid_class !== undefined) formData.append("grid_class", payload.grid_class);
  if (payload.redirect_url !== undefined && payload.redirect_url !== null) formData.append("redirect_url", payload.redirect_url);
  if (typeof payload.display_order === "number") formData.append("display_order", String(payload.display_order));

  const res = await api.put(`/collage-items/${id}/`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return mapCollageItem(res.data);
};

export const deleteCollageItem = async (id: number): Promise<{ success: true }> => {
  await api.delete(`/collage-items/${id}/`);
  return { success: true };
};

// =================================
// RICH PRODUCT DESCRIPTION (RPD) API
// =================================

// const api = axios.create({
//   baseURL: API_BASE_URL,
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
//   },
// });



// export const getRPDs = (): Promise<RPD[]> => mockFetch(MOCK_RPD_DATA);
export const getRPDs = async (): Promise<RPD[]> => {
  const res = await api.get("/rpd/");
  return res.data;
};


export const createRPD = async (rpdData: Omit<RPD, "id">): Promise<RPD> => {
  const payload = {
    title: rpdData.title,
    content: rpdData.content,
    products: rpdData.products,   // ✅ changed
  };
  const res = await api.post("/rpd/", payload);
  return res.data;
};

export const updateRPD = async (rpdData: RPD): Promise<RPD> => {
  const payload = {
    title: rpdData.title,
    content: rpdData.content,
    products: rpdData.products,   // ✅ changed
  };
  const res = await api.put(`/rpd/${rpdData.id}/`, payload);
  return res.data;
};



export const deleteRPD = async (rpdId: number): Promise<{ success: true }> => {
  await api.delete(`/rpd/${rpdId}/`);
  return { success: true };
};

// =================================
// ANALYTICS API
// =================================ag

// export const getVisitorData = async (): Promise<VisitorRegionData[]> => {
//   const res = await api.get("/analytics/");
//   return res.data;
// };
export const getVisitorData = async (): Promise<VisitorRegionData[]> => {
  try {
    const res = await api.get("/visitor-region-data/");
    const payload = Array.isArray(res.data)
      ? res.data
      : Array.isArray((res.data as any)?.results)
        ? (res.data as any).results
        : [];

    const normalized: VisitorRegionData[] = payload.map((row: any, idx: number) => {
      const rawRegion = (row?.region ?? "").toString().trim();
      const region = rawRegion && rawRegion.toLowerCase() !== "unknown" ? rawRegion : "Other";
      return {
        id: Number(row?.id ?? idx + 1),
        region,
        visitors: Number(row?.visitors ?? 0),
        last_updated: (row?.last_updated || (row as any)?.lastUpdated || new Date().toISOString()) as string,
      };
    });

    // Deduplicate by region in case the API returns multiple rows for the same place
    const uniqueByRegion = new Map<string, VisitorRegionData>();
    normalized.forEach((row, idx) => {
      const key = row.region.toLowerCase();
      const existing = uniqueByRegion.get(key);
      if (!existing || (row.visitors ?? 0) > (existing.visitors ?? 0)) {
        uniqueByRegion.set(key, { ...row, id: row.id ?? idx + 1 });
      }
    });

    return Array.from(uniqueByRegion.values()).sort((a, b) => b.visitors - a.visitors);
  } catch (error: any) {
    console.error("Failed to fetch visitor data:", error);
    throw error;
  }
};

export const getVisitorRegionTimeseries = async (period: "30d" | "7d" | "24h" = "30d"): Promise<VisitorRegionTimeseriesPoint[]> => {
  try {
    const res = await api.get("/visitor-region-timeseries/", { params: { period } });
    const payload = Array.isArray(res.data) ? res.data : [];
    return payload
      .map((row: any) => {
        const tsRaw = row?.timestamp ?? row?.day ?? row?.date;
        const ts = tsRaw ? new Date(tsRaw).toISOString() : "";
        const date = ts ? ts.slice(0, 10) : (row?.date ? String(row.date).slice(0, 10) : "");
        const label = row?.label as string | undefined;
        const rawRegion = (row?.region ?? "").toString().trim();
        const region = rawRegion && rawRegion.toLowerCase() !== "unknown" ? rawRegion : "Other";
        return {
          timestamp: ts || date,
          date,
          label,
          region,
          visitors: Number(row?.visitors ?? 0),
        } as VisitorRegionTimeseriesPoint;
      })
      .filter(
        (row) =>
          row.timestamp &&
          row.date &&
          row.region
      );
  } catch (error: any) {
    console.error("Failed to fetch visitor region timeseries:", error);
    throw error;
  }
};

export const downloadVisitorRegionDataExcel = async () => {
  const res = await api.get("/visitor-region-data/export/", { responseType: "blob" });
  return res.data as Blob;
};


export const getAnalytics = async () => {
  const response = await api.get("/analytics/");
  return response.data;
};

// Summary KPIs (revenue, orders, wishlisted, in_cart)
export const getAnalyticsSummary = async () => {
  const res = await api.get("/analytics-summary/");
  return res.data as {
    revenue: number;
    orders: number;
    wishlisted: number;
    in_cart: number;
    period_data?: any[];
  };
};

// Top products by wishlist/cart counts
export const getAnalyticsTopProducts = async (limit?: number) => {
  const res = await api.get("/analytics-top-products/", { params: limit ? { limit } : undefined });
  const raw = res.data as any;
  const wishRaw = raw?.top_wishlisted ?? raw?.topWishlisted ?? [];
  const cartRaw = raw?.top_carted ?? raw?.topCarted ?? [];
  const mapList = (arr: any[]) =>
    (Array.isArray(arr) ? arr : []).map((item) => ({
      productId: item.product_id ?? item.productId ?? item.id,
      name: item.name ?? "Product",
      count: Number(item.count ?? 0),
      image: item.image ?? null,
    }));
  return {
    topWishlisted: mapList(wishRaw),
    topCarted: mapList(cartRaw),
  };
};

// Wishlist/Cart time-series for a given period
export const getWishlistCartTimeseries = async (
  period: 'Yearly' | 'Monthly' | 'Weekly' | 'Daily'
) => {
  const res = await api.get("/analytics-timeseries/", { params: { period } });
  return res.data as {
    period: typeof period;
    data: { name: string; wishlisted: number; inCart: number; orders: number; revenue: number }[];
    totals: { wishlisted: number; inCart: number; orders: number; revenue: number };
  };
};

// Fetch logs
export const getLogs = async (): Promise<Log[]> => {
  const res = await api.get("/logs/");
  return res.data;
};

// Create a log
export const createLog = async (logData: Omit<Log, "id" | "timestamp">): Promise<Log> => {
  const res = await api.post("/logs/", logData);
  return res.data;
};

// Clear all logs
export const clearLogs = async (): Promise<void> => {
  await api.delete("/logs/"); // If you want to implement bulk delete in Django
};

// =================================
// RATINGS ANALYTICS (Admin)
// =================================
export const getCustomerRatingAnalysis = async () => {
  const res = await api.get("/customer-rating-analysis/");
  const raw = res.data || {};

  const summary = raw.summary || {};
  const normalizeSummary = {
    average_rating: summary.average_rating ?? summary.averageRating ?? null,
    total_reviews: Number(summary.total_reviews ?? summary.totalReviews ?? 0),
  };

  const mapProduct = (p: any) => ({
    product_id: p?.product_id ?? p?.productId ?? p?.id,
    name: p?.name ?? "Product",
    average_rating: p?.average_rating ?? p?.averageRating ?? null,
    review_count: Number(p?.review_count ?? p?.reviewCount ?? 0),
    last_reviewed_at: p?.last_reviewed_at ?? p?.lastReviewedAt ?? null,
  });

  const mapRecent = (r: any) => ({
    id: r?.id,
    product_id: r?.product_id ?? r?.productId ?? r?.product?.id,
    product_name: r?.product_name ?? r?.productName ?? r?.product?.name,
    customer_name: r?.customer_name ?? r?.customerName ?? r?.customer?.name ?? r?.customer?.email,
    rating: Number(r?.rating ?? 0),
    title: r?.title,
    comment: r?.comment,
    order_id: r?.order_id ?? r?.orderId ?? null,
    created_at: r?.created_at ?? r?.createdAt ?? null,
  });

  const products = Array.isArray(raw.products ?? raw.product_stats ?? raw.productStats)
    ? (raw.products ?? raw.product_stats ?? raw.productStats).map(mapProduct)
    : [];

  const recent_reviews = Array.isArray(raw.recent_reviews ?? raw.recentReviews)
    ? (raw.recent_reviews ?? raw.recentReviews).map(mapRecent)
    : [];

  return {
    summary: normalizeSummary,
    products,
    recent_reviews,
  } as {
    summary: { average_rating: number | null; total_reviews: number };
    products: { product_id: number; name: string; average_rating: number | null; review_count: number; last_reviewed_at?: string | null }[];
    recent_reviews: { id: number; product_id: number | null; product_name?: string; customer_name?: string; rating: number; title?: string; comment?: string; order_id?: number | null; created_at?: string | null }[];
  };
};

export const downloadProductRatingsExcel = async () => {
  const res = await api.get("/export-product-ratings/", { responseType: "blob" });
  return res.data as Blob;
};

// =================================
// WISHLIST API (Storefront)
// =================================

/** Fetch customer's wishlist items */
export const getWishlist = async (): Promise<any[]> => {
  // The endpoint is `/storefront/wishlist/` based on your WishlistViewSet
  const res = await api.get("/storefront/wishlist/");
  // The response will be an array of WishlistItem objects
  return res.data || [];
};




