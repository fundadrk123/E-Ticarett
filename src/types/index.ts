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
