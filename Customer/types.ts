export interface ProductVariant {
  id: number;
  name?: string | null;
  sku?: string | null;
  mrp: number;
  selling_price: number;
  stock: number;
  images?: string[];
  tags?: string[];
  materials?: string[];
  colors?: string[];
  occasions?: string[];
  sizes?: string[];
}

export interface Product {
  id: number;
  /** Optional synthetic id used only for UI (e.g., variant card identity) */
  displayId?: string | number;
  /** When rendering a variant as its own card, keep reference to the parent product id */
  parentId?: number;
  /** Which variant should be preselected on PDP when this card is clicked */
  selectedVariantId?: number;
  /** Flag to indicate this card represents a variant, not the parent product */
  isVariantCard?: boolean;
  name: string; // Product Title
  // Legacy UI fields
  category: string;
  subcategory?: string;
  style?: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  badge?: 'New Arrivals' | 'Sale' | 'Best Seller' | 'Limited' | 'Featured' | 'Festive Sale';
  inStock?: boolean;
  expiryDate?: string;
  dealEndsAt?: string;
  // Backend-synced fields
  stock?: number;
  images?: string[];
  description?: string;
  tags?: string[];
  materials?: string[];
  color?: string; // Added for consistency with filtering
  colors?: string[];
  occasions?: string[];
  size?: string;
  sizes?: string[];
  main_category?: string;
  sub_category?: string;
  crystal_name?: string | null;
  unique_code?: string | null; // SKU / unique id
  gst?: string | null;
  product_specification?: string | null;
  is_returnable?: boolean;
  delivery_weight?: number | null;
  delivery_width?: number | null;
  delivery_height?: number | null;
  delivery_depth?: number | null;
  delivery_days?: number | null;
  delivery_charges?: number | null;
  return_charges?: number | null;
  variants?: ProductVariant[];
  // UI extras
  specifications?: { key: string; value: string }[];
  reviews?: ProductReview[];
  discounts?: Discount[];
  richDescription?: RichDescriptionSection[];
  weight?: string; // legacy demo fields
  width?: string;  // legacy demo fields
  height?: string; // legacy demo fields
  depth?: string;  // legacy demo fields
}

export interface Collection {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
}

export interface Testimonial {
  id: number;
  name: string;
  quote: string;
  rating: number;
}

export interface ProductReview {
  id: number;
  rating: number;
  title?: string;
  comment?: string;
  customer_name?: string | null;
  created_at?: string;
  order_id?: number;
  product_id?: number;
}

export interface Occasion {
  id: number;
  name: string;
  imageUrl: string;
  gridClass: string;
  redirectUrl?: string;
  item_type?: 'occasion' | 'crystal';
}

export interface Crystal {
    id: number;
    name:string;
    imageUrl: string;
    gridClass: string;
    redirectUrl?: string;
    item_type?: 'occasion' | 'crystal';
}

export interface ProductType {
  id: number;
  name: string;
  imageUrl: string;
  gridClass: string;
}

export interface IconProps {
  className?: string;
}

// Mega Menu Types
export interface MegaMenuLink {
  name: string;
  href: string;
  description?: string;
  filter?: {
    type:
      | 'category'
      | 'subcategory'
      | 'metal'
      | 'gemstone'
      | 'badge'
      | 'material'
      | 'color'
      | 'occasion';  // ✅ Added support for material & color filter
    value: string;
  };
}
export interface MegaMenuSection {
  title: string;
  links: MegaMenuLink[];
}

export interface MegaMenuFeatured {
    name: string;
    href: string;
    imageUrl: string;
    description: string;
}

export interface MegaMenuContent {
  sections: MegaMenuSection[];
  featured?: MegaMenuFeatured[];
}

export interface NavItem {
  name: string;
  href?: string;
  menuType?: 'mega' | 'simple';
  megaMenu?: MegaMenuContent;
}

// export interface Banner {
//   id: number;
//   imageUrl: string;
// }
export interface Banner {
  id: number;
  title: string;
  imageUrl: string;
  redirect_url?: string | null;
  display_order?: number | null;
  device_type?: 'All' | 'Mobile' | 'Desktop';
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
}


export interface Discount {
  id: number;
  code: string;
  description: string;
  value: number; // Can be percentage or flat amount
  type: 'percentage' | 'flat';
}

// Rich Description Types
interface RichDescriptionBase {
  id: string;
}

export interface RichDescriptionImageText extends RichDescriptionBase {
  type: 'image-text';
  imageUrl: string;
  title: string;
  text: string;
  imagePosition: 'left' | 'right';
}

export interface RichDescriptionThreeColumn extends RichDescriptionBase {
  type: 'three-column';
  columns: {
    iconUrl: string;
    title: string;
    text: string;
  }[];
}

export interface RichDescriptionBanner extends RichDescriptionBase {
  type: 'banner';
  imageUrl: string;
  title: string;
}

export type RichDescriptionSection = RichDescriptionImageText | RichDescriptionThreeColumn | RichDescriptionBanner;

export interface WishlistItem {
  id: number;
  product: Product;
  addedAt: string;
}

export interface CartItem {
  id:number;
  product: Product;
  quantity: number;
  addedAt: string;
}

export interface Notification {
  id: number;
  type: 'sale' | 'shipping' | 'welcome' | 'new_arrival';
  title: string;
  message: string;
  timestamp: string; // ISO string
  read: boolean;
  link?: string;
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
}

export interface Address {
  id: number;
  type: 'Home' | 'Work';
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'dispatched'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'return_approved'
  | 'return_rejected';

export interface OrderItemSummary {
  productId: number | null;
  quantity: number;
  name?: string;
  price?: number;
  sku?: string | null;
}

export interface Order {
  id: number;
  date: string; // ISO string
  status: OrderStatus;
  total: number;
  paymentMethod?: string;
  items: OrderItemSummary[];
}
