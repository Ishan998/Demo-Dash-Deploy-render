/**
 * @file This file contains all the TypeScript types and interfaces used throughout the application.
 * These definitions serve as a contract for the shape of data expected from the API (Django backend)
 * and used within the React components. Keeping them centralized ensures consistency.
 */


export enum OrderStatus {
  Completed = 'Completed',
  Pending = 'Pending',
  Cancelled = 'Cancelled',
  Accepted = 'Accepted',
  Dispatched = 'Dispatched',
}

export enum ProductStatus {
  InStock = 'In Stock',
  OutOfStock = 'Out of Stock',
}

export interface ProductItem {
  id: string; // Could be a product or variant ID
  name: string;
  quantity: number;
  price: number;
  sku?: string; // Optional SKU for display in invoices
}

export interface Rating {
    stars: number;
    review?: string;
}

// export interface Order {
//   id: number;
//   customerName: string;
//   date: string; // ISO string format is recommended (e.g., "2023-10-27T10:00:00Z")
//   amount: number;
//   status: OrderStatus;
//   items: ProductItem[];
//   rating?: Rating;
// }
export interface Order {
  id: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  date: string;
  status: OrderStatus;
  amount: number;
  items: ProductItem[];
  paymentMethod?: string;   // 👈 add this (optional if not always present)
  gstPercent?: number;
  deliveryCharge?: number;
  address?: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    pincode: string;
  };                       // 👈 if you also want to capture address
}


// --- Analytics-specific types ---

export interface SalesDataPoint {
  name: string; // e.g., 'Mon', 'Jan', 'Week 1'
  sales: number;
}

export interface OrderStatusDataPoint {
    name: string;
    total: number;
    completed: number;
    dispatched: number;
    inProgress: number;
}


export interface AnalyticsDataPoint {
    name: string; // Date or time label
    revenue: number;
    orders: number;
    wishlisted: number; // This might be simulated or come from a separate table
    inCart: number;     // This might be simulated or come from a separate table
}

export interface ProductPerformanceData {
  name: string;
  value: number; // Typically sales volume
}

export interface TrendDataPoint {
  name: string; // Represents a point in time
  value: number;
}

export interface KpiData {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  averageOrderValue: number;
  aovChange: number;
  conversionRate: number;
  conversionRateGoal: number;
  revenueTrend: TrendDataPoint[];
  ordersTrend: TrendDataPoint[];
}

// --- UI-related types ---

export interface Note {
  id: number;
  content: string;
  updatedAt: string; // ISO string
}

// export interface VisitorRegionData {
//   region: string;
//   visitors: number;
//   // Optional: backend may not provide coordinates; not required for current charts
//   coords?: [number, number];
// }
export interface VisitorRegionData {
  id: number;
  region: string;
  visitors: number;
  last_updated: string;
}

export interface VisitorRegionTimeseriesPoint {
  timestamp: string; // ISO datetime or date
  date: string;    // YYYY-MM-DD part for grouping
  label?: string;  // Pre-formatted label (e.g., "Nov 30" or "13:00")
  region: string;
  visitors: number;
}

export interface Log {
    id: number | string;
    timestamp: string; // ISO String
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
}

export interface NavigationAction {
  // Fix: Expanded to include all searchable pages to resolve type conflicts.
  page: 'dashboard' | 'inventory' | 'orders' | 'customers' | 'analytics' | 'discounts' | 'banners' | 'profile' | 'settings' | 'rich-content' | 'logs';
  searchTerm?: string;
  statusFilter?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}


// --- Core Data Models ---

export interface ProductVariant {
    id: number;
    name: string; // e.g., "Red, Large"
    sku: string;
    stock: number;
    mrp: number; // Maximum Retail Price
    sellingPrice: number;
    images: string[]; // URLs or base64 strings
    tags: string[];
    materials?: string[];
    colors?: string[];
    occasions?: string[];
    sizes?: string[];
    rpdId?: number | null; 
}

export interface DeliveryInfo {
    weight: number; // in kg
    width: number; // in cm
    height: number; // in cm
    depth: number; // in cm
    deliveryCharges: number;
    returnCharges: number;
    deliveryInDays: number;
}

export interface Product {
    id: number;
    name: string;
    description: string;
    mainCategory: string;
    subCategory: string;
    materials: string[];
    sku: string;
    mrp: number;
    sellingPrice: number;
    stock: number;
    status: ProductStatus;
    gst: number; // in percentage
    images: string[]; // URLs or base64 strings
    specifications: string;
    crystalName?: string;
    colors: string[];
    occasions: string[];
    sizes: string[];
    isReturnable: boolean;
    variants: ProductVariant[];
    deliveryInfo: DeliveryInfo;
    tags: string[];
    rpdId?: number; // Foreign Key to a Rich Product Description
    limitedDealEndsAt?: string | null;
}

// export enum DiscountType {
//     Percentage = 'Percentage',
//     Fixed = 'Fixed Amount',
// }

// export enum DiscountStatus {
//     Active = 'active',
//     Inactive = 'inactive',
//     Scheduled = 'scheduled',
// }

// export interface DiscountApplication {
//     type: 'all_products' | 'specific_products';
//     productIds?: number[];
// }
// export type DiscountCreate = Omit<Discount, "id" | "usageCount">;
// export interface Discount {
//     id: number;
//   name: string;
//   code: string;
//   type: 'percentage' | 'fixed';
//   value: number;
//   status: 'active' | 'inactive' | 'scheduled';
//   usageLimit?: number | null;
//   usageLimitPerCustomer?: number | null;
//   startDate?: string | null;
//   endDate?: string | null;
//   appliesTo: {
//     type: 'all_products' | 'specific_products';
//     productIds?: number[];
//   };
//   usageCount?: number;
// }

// // 👇 Special type for form state (accepts string or number)
// export type DiscountFormState = Omit<Discount, 'id' | 'status' | 'usageCount'> & {
//   startDate?: string;
//   endDate?: string;
//   usageLimit?: number | null;
//   usageLimitPerCustomer?: number | null;
// };

// // export type DiscountCreate = Omit<Discount, "id" | "usageCount"> & {
// //   id?: never; // explicitly prevent id
// //   usageCount?: never; // explicitly prevent usageCount
// // };

// // Type for updating a discount (id required, usageCount usually backend-handled)
// export type DiscountUpdate = Omit<Discount, "usageCount">;

// export type DiscountCreate = Omit<Discount, 'id' | 'usageCount'>;
// export type DiscountUpdate = Omit<Discount, 'usageCount'>;
export enum DiscountType {
  Percentage = "percentage",   // must match Django
  Fixed = "fixed",             // must match Django
}

export enum DiscountStatus {
  Active = "active", 
  Inactive = "inactive",
  Scheduled = "scheduled",
}

export interface Discount {
  id: number;
  name: string;
  code: string;
  type: DiscountType;
  value: number;
  status: DiscountStatus;
  usageLimit?: number | null;
  usageLimitPerCustomer?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  appliesTo: {
    type: "all_products" | "specific_products";
    productIds?: number[];
  };
  usageCount?: number;
}

// 👇 Special type for form state (allows empty string for numeric inputs)
export type DiscountFormState = Omit<Discount, "id" | "status" | "usageCount"> & {
  startDate?: string;
  endDate?: string;
  usageLimit?: number | string | null;
  usageLimitPerCustomer?: number | string | null;
};

// For create (no id, no usageCount)
export type DiscountCreate = Omit<Discount, "id" | "usageCount">;

// For update (id required, usageCount backend-handled)
export type DiscountUpdate = Omit<Discount, "usageCount">;


export enum BannerStatus {
    Active = 'Active',
    Inactive = 'Inactive',
    Scheduled = 'Scheduled',
}

export interface Banner {
    id: number;
    title: string;
    image: string; // URL or base64 string
    status: BannerStatus;
    startDate?: string; // ISO String
    endDate?: string;   // ISO String
}

export enum NotificationType {
    NewOrder = "new_order",
  OrderDeclined = "order_declined",
  OrderStatusUpdate = "order_status_update",
  BannerTimeout = "banner_timeout",
  DiscountTimeout = "discount_timeout",
  ProductOutOfStock = "product_out_of_stock",
  ProductLowStock = "product_low_stock",
  NewProductAdded = "new_product_added",
  ProductRemoved = "product_removed",
  WelcomeMessage = "welcome_message",
  PasswordReset = "password_reset",
  Info = "info",   // 👈 
}

export interface Notification {
    id: number;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  timestamp: string;
}

export type NotificationSettings = {
    [key in NotificationType]: boolean;
};

export interface BusinessDetails {
    name: string;
    address: string;
    gstNumber: string;
    panCard: string;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    recoveryEmail?: string;
    phone: string;
    role: string;
    avatarUrl: string;
    businessDetails: BusinessDetails;
    notificationSettings: NotificationSettings;
}

export enum CustomerStatus {
    Active = 'Active',
    Blocked = 'Blocked',
}

export interface Customer {
    id: number;
    name: string;
    email: string;
    avatarUrl: string;
    registrationDate: string; // ISO String
    status: CustomerStatus;
    totalOrders: number;
    totalSpend: number;
}

export interface MainCategory {
    id: number;
    name: string;
}

export interface Material {
    id: number;
    name: string;
}

export interface SubCategory {
    id: number;
    name: string;
    // Parent main category id from backend (DRF returns `main_category`)
    main_category?: number | null;
}

export interface Color {
    id: number;
    name: string;
}

export interface Occasion {
    id: number;
    name: string;
}

export interface HomeCollageItem {
    id: number;
    name: string;
    item_type: 'occasion' | 'crystal' | 'product_type';
    image?: string | null;
    imageUrl?: string | null;
    image_url?: string | null;
    grid_class?: string;
    display_order?: number;
    redirect_url?: string | null;
    created_at?: string;
    updated_at?: string;
}

// export type RPDLayout =
//   | 'image-text'
//   | 'feature-list'
//   | 'banner';

// export interface RPDBlockBase {
//     id: string; // A unique ID for the block, e.g., for React keys
//     layout: RPDLayout;
// }

// export interface RPDImageTextBlock extends RPDBlockBase {
//     layout: 'image-text';
//     props: {
//         image: string; // URL or base64
//         title: string;
//         text: string;
//         imagePosition: 'left' | 'right';
//     };
// }

// export type FeatureIcon = 'hypoallergenic' | 'lustrous' | 'hand-crafted';

// export interface RPDFeature {
//     icon: FeatureIcon;
//     title: string;
//     text: string;
// }

// export interface RPDFeatureListBlock extends RPDBlockBase {
//     layout: 'feature-list';
//     props: {
//         features: [RPDFeature, RPDFeature, RPDFeature];
//     };
// }

// export interface RPDBannerBlock extends RPDBlockBase {
//     layout: 'banner';
//     props: {
//         image: string; // URL or base64
//         title: string;
//         text: string;
//     };
// }

// export type RPDContentBlock = RPDImageTextBlock | RPDFeatureListBlock | RPDBannerBlock;

// export interface RPD {
//     id: number;
//     title: string;
//     content: RPDContentBlock[];
//     linkedProductIds: number[];
// }
export type RPDLayout =
  | 'image-text'
  | 'feature-list'
  | 'banner';

// -----------------------------
// Base Block
// -----------------------------
export interface RPDBlockBase {
    id: string;
    layout: RPDLayout;
}

// -----------------------------
// Image + Text Block
// -----------------------------
export interface RPDImageTextBlock extends RPDBlockBase {
    layout: 'image-text';
    props: {
        image: string; // URL or base64
        title: string;
        text: string;
        imagePosition: 'left' | 'right';
    };
}

// -----------------------------
// Feature List Block
// -----------------------------
export type FeatureIcon = 'hypoallergenic' | 'lustrous' | 'hand-crafted';

export interface RPDFeature {
    /** Either a predefined icon OR a custom uploaded one */
    icon?: FeatureIcon;   // Optional predefined
    iconUrl?: string;     // Uploaded base64/URL
    title: string;
    text: string;
}

export interface RPDFeatureListBlock extends RPDBlockBase {
    layout: 'feature-list';
    props: {
        features: [RPDFeature, RPDFeature, RPDFeature];
    };
}

// -----------------------------
// Banner Block
// -----------------------------
export interface RPDBannerBlock extends RPDBlockBase {
    layout: 'banner';
    props: {
        image: string; // URL or base64
        title: string;
        text: string;
    };
}

// -----------------------------
// Union Type
// -----------------------------
export type RPDContentBlock =
    | RPDImageTextBlock
    | RPDFeatureListBlock
    | RPDBannerBlock;

// -----------------------------
// RPD Root
// -----------------------------
export interface RPD {
    id: number;
    title: string;
    content: RPDContentBlock[];
    products: number[]; 
    // linkedProductIds: number[];
}

// export interface ProductVariant {
   
//   name: string;
//   sku: string;
//   stock: number;
//   mrp: number;
//   sellingPrice: number;
//   images: string[];
//   tags: string[];}
