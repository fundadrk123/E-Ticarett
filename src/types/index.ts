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
  shippingAddress: ShippingAddress;
  notes?: string;
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
}

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  customerName: string;
  email: string;
  phone: string;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  notes?: string;
}
