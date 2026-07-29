export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  productCount: number;
  image?: string;
  description?: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand: string;
  categoryId: string;
  priceExVat: number;
  priceIncVat: number;
  unit: string;
  packSize?: number;
  packUnit?: string;
  inStock: boolean;
  /** Stok adedi; yoksa inStock boolean'ından türetilir */
  stockQty?: number;
  isNew?: boolean;
  isRestocked?: boolean;
  image: string;
  description: string;
  features: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SiteConfig {
  companyName: string;
  shortName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  whatsapp: string;
  workingHours: string;
}

export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  createdAt: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type PaymentMethod = "credit_card" | "bank_transfer" | "cash_on_delivery";

export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district: string;
  postalCode?: string;
}

export interface SavedAddress {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  addressLine: string;
  city: string;
  district: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
}

export type CouponType = "percent" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrderIncVat: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPriceExVat: number;
  unitPriceIncVat: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  email: string;
  customerName: string;
  phone?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  totalExVat: number;
  totalIncVat: number;
  discountAmount: number;
  couponCode?: string;
  shippingAddress: ShippingAddress;
  notes?: string;
  trackingNumber?: string;
  cargoCompany?: string;
  paymentId?: string;
  guestToken?: string;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface AdminStats {
  totalProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalUsers: number;
  totalRevenue: number;
  /** Stokta olan ürün sayısı (stock_qty > 0) */
  productsInStock: number;
  /** Stoğu bitmiş ürün sayısı */
  productsOutOfStock: number;
  /** Tüm ürünlerdeki toplam stok adedi */
  totalStockQty: number;
  /** İşlem bekleyen sipariş (pending + confirmed) */
  openOrders: number;
  /** Son sipariş zamanı (ISO) — bildirim için */
  latestOrderAt?: string;
  latestOrderNumber?: string;
}

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  notes?: string;
  couponCode?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
}
