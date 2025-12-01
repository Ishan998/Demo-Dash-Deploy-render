import axios from "axios";
import type { CartItem, Banner, Occasion, Crystal, ProductReview } from "../types";

/* Base Axios Setup */
const api = axios.create({
  baseURL: "http://127.0.0.1:8000/storefront", // Change to full URL if API is on another domain
});

// Attach token to every request (if available)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("customer_token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

/* ---------------------------------------------
   AUTH APIs (Login / Register / Logout)
------------------------------------------------ */
export const registerCustomer = async (
  name: string,
  email: string,
  phone: string,
  password: string,
  signup_token?: string
) => {
  const res = await api.post("/auth/register/", { name, email, phone, password, signup_token });
  localStorage.setItem("customer_token", res.data.token);
  return res.data;
};

export const loginCustomer = async (email: string, password: string) => {
  const res = await api.post("/auth/login/", { email, password });
  const data = res.data || {};
  if (data.token) {
    localStorage.setItem("customer_token", data.token);
  }
  return data;
};

export const logoutCustomer = () => {
  localStorage.removeItem("customer_token");
};

// Customer profile (My Account)
export const fetchCustomerProfile = async () => {
  const res = await api.get("/profile/1/"); // retrieve on detail route; id ignored server-side
  return res.data;
};

export const updateCustomerProfile = async (payload: { name?: string; phone?: string }) => {
  const res = await api.put("/profile/1/", payload); // id ignored server-side
  return res.data;
};

// OTP/password reset helpers (reuse admin OTP endpoints)
const authApi = axios.create({
  baseURL: "http://127.0.0.1:8000/api",
});

export const sendResetOtp = async (email: string) => {
  const res = await authApi.post("/auth/otp/send/", { email, purpose: "reset" });
  return res.data;
};

export const verifyResetOtp = async (email: string, code: string) => {
  const res = await authApi.post("/auth/otp/verify/", { email, code, purpose: "reset" });
  return res.data;
};

export const confirmPasswordReset = async (email: string, token: string, newPassword: string) => {
  const res = await authApi.post("/auth/password-reset/confirm/", {
    email,
    token,
    new_password: newPassword,
  });
  return res.data;
};

// Customer signup OTP
export const sendSignupOtp = async (email: string) => {
  const res = await authApi.post("/auth/otp/send/", { email, purpose: "signup_customer" });
  return res.data;
};

export const verifySignupOtp = async (email: string, code: string) => {
  const res = await authApi.post("/auth/otp/verify/", { email, code, purpose: "signup_customer" });
  return res.data; // expects {signup_token: "..."}
};

/* ---------------------------------------------
   BANNER APIs
------------------------------------------------ */
export const fetchBanners = async (): Promise<Banner[]> => {
  const res = await api.get("/banners/");
  const raw = Array.isArray(res.data) ? res.data : [];
  const mapped = raw
    .map((banner: any) => {
      const imageUrl = banner?.imageUrl || banner?.image || "";
      return {
        id: banner?.id ?? 0,
        title: banner?.title ?? "",
        imageUrl,
        redirect_url: banner?.redirect_url ?? banner?.redirectUrl ?? null,
        display_order: banner?.display_order ?? banner?.displayOrder ?? null,
        device_type: banner?.device_type ?? banner?.deviceType ?? "All",
        start_date: banner?.start_date ?? banner?.startDate ?? null,
        end_date: banner?.end_date ?? banner?.endDate ?? null,
        status: banner?.status ?? undefined,
      } as Banner;
    })
    .filter((banner: Banner) => typeof banner.imageUrl === "string" && banner.imageUrl.length > 0);

  return mapped.sort((a, b) => {
    const orderA = typeof a.display_order === "number" ? a.display_order : Number.MAX_SAFE_INTEGER;
    const orderB = typeof b.display_order === "number" ? b.display_order : Number.MAX_SAFE_INTEGER;
    if (orderA === orderB) {
      return (b.id ?? 0) - (a.id ?? 0);
    }
    return orderA - orderB;
  });
};

/* ---------------------------------------------
   PUBLIC PRODUCT APIs
------------------------------------------------ */
export const fetchHomeSections = async () => {
  const res = await api.get("/home-sections/");
  return res.data; // { new_arrival: [], featured: [], ... }
};

// Catalog meta for Mega Menu
export const fetchCategories = async (): Promise<{ id: number; name: string }[]> => {
  const res = await api.get("/categories/");
  return res.data?.categories || [];
};

export const fetchMaterials = async (): Promise<{ id: number; name: string }[]> => {
  const res = await api.get("/materials/");
  return res.data?.materials || [];
};

export const fetchColors = async (): Promise<{ id: number; name: string; hex_code?: string }[]> => {
  const res = await api.get("/colors/");
  return res.data?.colors || [];
};

export const fetchCrystals = async (): Promise<string[]> => {
  const res = await api.get("/crystals/");
  const list = res.data?.crystals || [];
  // Normalize: ensure unique, non-empty strings
  return Array.from(new Set((Array.isArray(list) ? list : []).filter((n: any) => typeof n === "string" && n.trim().length > 0)));
};

export interface SubcategoryDTO {
  id: number;
  name: string;
  main_category_id: number | null;
  main_category_name?: string | null;
}

export const fetchSubcategories = async (): Promise<SubcategoryDTO[]> => {
  const res = await api.get("/subcategories/");
  return res.data?.subcategories || [];
};

export const fetchOccasions = async (): Promise<{ id: number; name: string }[]> => {
  const res = await api.get("/occasions/");
  return res.data?.occasions || [];
};

export const fetchCollageTiles = async (): Promise<{ occasions: Occasion[]; crystals: Crystal[]; productTypes: any[] }> => {
  const res = await api.get("/collage-items/");
  const payload = res.data;

  const normalize = (item: any): Occasion & Partial<Crystal> & { item_type?: string } => ({
    id: Number(item.id ?? 0),
    name: item.name ?? item.title ?? "",
    imageUrl: item.imageUrl ?? item.image_url ?? item.image ?? "",
    gridClass: item.grid_class ?? item.gridClass ?? "",
    item_type: item.item_type ?? item.itemType ?? item.type,
  });

  if (Array.isArray(payload?.items)) {
    const all = payload.items.map(normalize);
    return {
      occasions: all.filter((i: any) => (i as any).item_type === "occasion"),
      crystals: all.filter((i: any) => (i as any).item_type === "crystal") as Crystal[],
      productTypes: all.filter((i: any) => (i as any).item_type === "product_type"),
    };
  }

  return {
    occasions: Array.isArray(payload?.occasion) ? payload.occasion.map(normalize) : [],
    crystals: Array.isArray(payload?.crystal) ? payload.crystal.map(normalize) : [],
    productTypes: Array.isArray(payload?.product_type)
      ? payload.product_type.map(normalize)
      : Array.isArray(payload?.productType)
        ? payload.productType.map(normalize)
        : [],
  };
};

export const fetchProducts = async (params?: {
  search?: string;
  tag?: string;
  category?: string;
  inStock?: boolean;
}) => {
  const res = await api.get("/products/", { params });
  return res.data;
};

export const fetchProductDetails = async (productId: number) => {
  const res = await api.get(`/products/${productId}/`);
  return res.data;
};

/* ---------------------------------------------
   ADDRESS APIs (Authenticated)
------------------------------------------------ */
export const fetchAddresses = async () => {
  const res = await api.get("/addresses/");
  return res.data;
};

const normalizeAddressPayload = (address: any) => ({
  line1: address.line1 ?? address.address_line1 ?? "",
  line2: address.line2 ?? "",
  city: address.city ?? "",
  state: address.state ?? "",
  pincode: address.pincode ?? address.zip ?? address.postal_code ?? "",
  is_default: address.is_default ?? address.isDefault ?? false,
});

const toFormData = (payload: ReturnType<typeof normalizeAddressPayload>) => {
  const fd = new FormData();
  fd.append("line1", payload.line1);
  if (payload.line2) fd.append("line2", payload.line2);
  fd.append("city", payload.city);
  fd.append("state", payload.state);
  fd.append("pincode", payload.pincode);
  fd.append("is_default", String(payload.is_default));
  return fd;
};

export const addAddress = async (address: any) => {
  const payload = normalizeAddressPayload(address);
  const formData = toFormData(payload);
  const res = await api.post("/addresses/", formData);
  return res.data;
};

export const updateAddress = async (id: number, address: any) => {
  const payload = normalizeAddressPayload(address);
  const formData = toFormData(payload);
  const res = await api.put(`/addresses/${id}/`, formData);
  return res.data;
};

export const deleteAddress = async (id: number) => {
  const res = await api.delete(`/addresses/${id}/`);
  return res.data;
};

/* ---------------------------------------------
   WISHLIST APIs
------------------------------------------------ */
export const fetchWishlist = async () => {
  const res = await api.get("/wishlist/", {
    params: {
      _: new Date().getTime(),
    },
  });
  return res.data;
};

export const addToWishlist = async (productId: number) => {
  try {
    const res = await api.post("/wishlist/", { product_id: productId });
    return res.data;
  } catch (err: any) {
    console.error("Wishlist error response:", err.response?.data);
    throw err;
  }
};

export const removeFromWishlist = async (wishlistItemId: number) => {
  const res = await api.delete(`/wishlist/${wishlistItemId}/`);
  return res.data;
};

export const fetchByTag = async (tag: string, limit?: number) => {
  const res = await api.get(`/products/by-tag/`, {
    params: { tag, limit },
  });
  return res.data;
};

/* ---------------------------------------------
   CART APIs
------------------------------------------------ */
export const fetchCart = async () => {
  const res = await api.get("/cart/", {
    params: {
      _: new Date().getTime(),
    },
  });
  return res.data;
};

export const addToCart = async (productId: number, quantity = 1) => {
  const res = await api.post("/cart/", { product_id: productId, quantity });
  return res.data;
};

export const updateCartItem = async (cartItemId: number, quantity: number) => {
  const res = await api.put(`/cart/${cartItemId}/`, { quantity });
  return res.data;
};

export const removeFromCart = async (cartItemId: number) => {
  const res = await api.delete(`/cart/${cartItemId}/`);
  return res.data;
};

/* ---------------------------------------------
   CHECKOUT API (Creates Order)
------------------------------------------------ */
interface StorefrontOrderItem {
  id: number;
  name: string;
  sku?: string | null;
  price: number | string;
  quantity: number;
  productId: number | null;
}

export interface StorefrontOrder {
  id: number;
  status: string;
  payment_method: string;
  total: number | string;
  date: string;
  items: StorefrontOrderItem[];
}

interface CreateOrderResponse {
  success: boolean;
  order?: StorefrontOrder;
  error?: string;
}

export const createOrder = async (
  items: CartItem[],
  addressId: number | null,
  paymentMethod: "cod" | "prepaid" = "cod",
  totalPayable?: number
): Promise<CreateOrderResponse> => {
  try {
    const res = await api.post("/checkout/", {
      payment_method: paymentMethod,
      address_id: addressId,
      total: totalPayable,
      items: items
        .map((i) => {
          const productId = (i as any).productId ?? (i as any).product_id ?? (i as any).product?.id;
          return {
            product_id: productId,
            quantity: i.quantity,
          };
        })
        .filter((i) => i.product_id),
    });

    const order: StorefrontOrder | undefined = res.data?.order;
    if (!order) {
      return {
        success: false,
        error: "Order could not be created. Please try again.",
      };
    }

    return {
      success: true,
      order,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.response?.data?.detail || err.response?.data?.error || "Order Failed. Please try again.",
    };
  }
};

export const fetchOrders = async (): Promise<StorefrontOrder[]> => {
  const res = await api.get("/orders/");
  return Array.isArray(res.data) ? res.data : [];
};

/* ---------------------------------------------
   PRODUCT REVIEWS (Authenticated)
------------------------------------------------ */
export interface CreateReviewPayload {
  orderId: number;
  productId: number;
  rating: number;
  title?: string;
  comment?: string;
}

export const submitProductReview = async (payload: CreateReviewPayload) => {
  const res = await api.post("/reviews/", {
    order_id: payload.orderId,
    product_id: payload.productId,
    rating: payload.rating,
    title: payload.title,
    comment: payload.comment,
  });
  return res.data;
};

export const fetchProductReviews = async (productId: number): Promise<ProductReview[]> => {
  const res = await api.get("/reviews/", { params: { product_id: productId } });
  const raw = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [];
  return raw.map((r: any) => ({
    id: Number(r.id ?? 0),
    rating: Number(r.rating ?? 0),
    title: r.title ?? "",
    comment: r.comment ?? "",
    customer_name: r.customer_name ?? r.customer ?? r.customerName ?? "",
    created_at: r.created_at ?? r.createdAt ?? "",
    order_id: r.order_id ?? r.orderId,
    product_id: r.product_id ?? r.productId,
  })) as ProductReview[];
};

export const fetchMyReviews = async (): Promise<ProductReview[]> => {
  const res = await api.get("/reviews/", { params: { mine: true } });
  const raw = Array.isArray(res.data?.results) ? res.data.results : Array.isArray(res.data) ? res.data : [];
  return raw.map((r: any) => ({
    id: Number(r.id ?? 0),
    rating: Number(r.rating ?? 0),
    title: r.title ?? "",
    comment: r.comment ?? "",
    customer_name: r.customer_name ?? r.customer ?? r.customerName ?? "",
    created_at: r.created_at ?? r.createdAt ?? "",
    order_id: r.order_id ?? r.orderId,
    product_id: r.product_id ?? r.productId,
  })) as ProductReview[];
};

/* ---------------------------------------------
   HEALTH / TEST
------------------------------------------------ */
export const pingServer = async () => {
  const res = await api.get("/health/");
  return res.data;
};

/* ---------------------------------------------
   ANALYTICS APIs
------------------------------------------------ */
export const logVisitor = async (region?: string) => {
  try {
    // Fire-and-forget: we don't need the response, and shouldn't block on it
    const fallbackRegion = (import.meta as any)?.env?.VITE_DEFAULT_REGION as string | undefined;
    const payload: Record<string, any> = {};
    if (region) {
      payload.region = region;
    } else if (fallbackRegion) {
      payload.region = fallbackRegion;
    }
    authApi.post("/record-visitor/", payload);
  } catch (error) {
    // Silently fail so we don't disrupt user experience
    console.warn("Failed to log visitor", error);
  }
};
