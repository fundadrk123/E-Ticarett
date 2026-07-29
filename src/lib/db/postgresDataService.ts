import { randomUUID } from "crypto";
import {
  query,
  queryOne,
  initializeDatabase,
  parseFeatures,
  serializeFeatures,
  withTransaction,
} from "./postgres";
import type {
  Category,
  Brand,
  Product,
  User,
  Order,
  OrderItem,
  AdminStats,
  CreateOrderPayload,
  OrderStatus,
  PaymentStatus,
  ShippingAddress,
  SavedAddress,
  Coupon,
  CouponType,
  ContactMessage,
} from "@/types";
import { hashPassword } from "@/lib/auth";

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand: string;
  category_id: string;
  price_ex_vat: string;
  price_inc_vat: string;
  unit: string;
  pack_size: number | null;
  pack_unit: string | null;
  in_stock: boolean;
  stock_qty: number;
  is_new: boolean;
  is_restocked: boolean;
  image: string;
  description: string;
  features: string;
};

const PRODUCT_SELECT = `id, sku, name, slug, brand, category_id, price_ex_vat, price_inc_vat, unit,
            pack_size, pack_unit, in_stock, COALESCE(stock_qty, 0) AS stock_qty, is_new, is_restocked, image, description, features`;

const ORDER_SELECT = `id, order_number, user_id, email, customer_name, phone, status,
            payment_status, payment_method, total_ex_vat, total_inc_vat,
            COALESCE(discount_amount, 0) AS discount_amount, coupon_code,
            shipping_address, notes, tracking_number, cargo_company, payment_id, guest_token,
            created_at, updated_at`;

function mapProduct(row: ProductRow): Product {
  const stockQty = Number(row.stock_qty ?? 0);
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    brand: row.brand,
    categoryId: row.category_id,
    priceExVat: Number(row.price_ex_vat),
    priceIncVat: Number(row.price_inc_vat),
    unit: row.unit,
    packSize: row.pack_size ?? undefined,
    packUnit: row.pack_unit ?? undefined,
    stockQty,
    inStock: stockQty > 0,
    isNew: row.is_new,
    isRestocked: row.is_restocked,
    image: row.image,
    description: row.description,
    features: parseFeatures(row.features),
  };
}

type OrderRow = {
  id: string;
  order_number: string;
  user_id: string | null;
  email: string;
  customer_name: string;
  phone: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string;
  total_ex_vat: string;
  total_inc_vat: string;
  discount_amount: string;
  coupon_code: string | null;
  shipping_address: ShippingAddress;
  notes: string | null;
  tracking_number: string | null;
  cargo_company: string | null;
  payment_id: string | null;
  guest_token: string | null;
  created_at: Date;
  updated_at: Date;
};

function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    userId: row.user_id || undefined,
    email: row.email,
    customerName: row.customer_name,
    phone: row.phone || undefined,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method as Order["paymentMethod"],
    totalExVat: Number(row.total_ex_vat),
    totalIncVat: Number(row.total_inc_vat),
    discountAmount: Number(row.discount_amount || 0),
    couponCode: row.coupon_code || undefined,
    shippingAddress: row.shipping_address,
    notes: row.notes || undefined,
    trackingNumber: row.tracking_number || undefined,
    cargoCompany: row.cargo_company || undefined,
    paymentId: row.payment_id || undefined,
    guestToken: row.guest_token || undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function mapCoupon(row: {
  id: string;
  code: string;
  type: CouponType;
  value: string;
  min_order_inc_vat: string;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expires_at: Date | null;
  created_at: Date;
}): Coupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: Number(row.value),
    minOrderIncVat: Number(row.min_order_inc_vat),
    maxUses: row.max_uses,
    usedCount: Number(row.used_count),
    active: row.active,
    expiresAt: row.expires_at?.toISOString(),
    createdAt: row.created_at.toISOString(),
  };
}

function mapAddress(row: {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  district: string;
  postal_code: string | null;
  is_default: boolean;
  created_at: Date;
}): SavedAddress {
  return {
    id: row.id,
    userId: row.user_id,
    label: row.label,
    fullName: row.full_name,
    phone: row.phone,
    addressLine: row.address_line,
    city: row.city,
    district: row.district,
    postalCode: row.postal_code || undefined,
    isDefault: row.is_default,
    createdAt: row.created_at.toISOString(),
  };
}

async function ensureDb() {
  await initializeDatabase();
}

export async function getAllCategoriesPg(): Promise<Category[]> {
  await ensureDb();
  const rows = await query<{
    id: string;
    name: string;
    slug: string;
    icon: string;
    product_count: number;
    image: string | null;
    description: string | null;
  }>(
    `SELECT c.id, c.name, c.slug, c.icon, c.image, c.description,
            COALESCE(pc.cnt, 0)::int AS product_count
     FROM categories c
     LEFT JOIN (
       SELECT category_id, COUNT(*)::int AS cnt
       FROM products
       GROUP BY category_id
     ) pc ON pc.category_id = c.id
     ORDER BY c.name ASC`
  );
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    productCount: Number(row.product_count),
    image: row.image || undefined,
    description: row.description || undefined,
  }));
}

export async function getCategoryBySlugPg(slug: string) {
  await ensureDb();
  const row = await queryOne<{
    id: string;
    name: string;
    slug: string;
    icon: string;
    product_count: number;
    image: string | null;
    description: string | null;
  }>(
    `SELECT c.id, c.name, c.slug, c.icon, c.image, c.description,
            COALESCE(pc.cnt, 0)::int AS product_count
     FROM categories c
     LEFT JOIN (
       SELECT category_id, COUNT(*)::int AS cnt
       FROM products
       GROUP BY category_id
     ) pc ON pc.category_id = c.id
     WHERE c.slug = $1`,
    [slug]
  );
  if (!row) return undefined;
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon,
    productCount: Number(row.product_count),
    image: row.image || undefined,
    description: row.description || undefined,
  } satisfies Category;
}

export async function getCategoryByIdPg(id: string) {
  await ensureDb();
  const row = await queryOne<{ slug: string }>(
    "SELECT slug FROM categories WHERE id = $1",
    [id]
  );
  if (!row) return undefined;
  return getCategoryBySlugPg(row.slug);
}

export async function getAllBrandsPg(): Promise<Brand[]> {
  await ensureDb();
  return query("SELECT id, name, slug FROM brands ORDER BY name ASC");
}

/** Marka sayfası için ürün sayıları — full catalog çekmez */
export async function getBrandProductCountsPg(): Promise<Record<string, number>> {
  await ensureDb();
  const rows = await query<{ brand: string; count: string }>(
    `SELECT brand, COUNT(*)::text AS count FROM products GROUP BY brand`
  );
  return Object.fromEntries(rows.map((r) => [r.brand, Number(r.count)]));
}

export async function getAllProductsPg(): Promise<Product[]> {
  await ensureDb();
  // Liste için hafif kolonlar (description/features boş) — detay getProductByIdPg ile
  const rows = await query<ProductRow>(
    `SELECT id, sku, name, slug, brand, category_id, price_ex_vat, price_inc_vat, unit,
            pack_size, pack_unit, in_stock, COALESCE(stock_qty, 0) AS stock_qty,
            is_new, is_restocked, image, '' AS description, '' AS features
     FROM products ORDER BY name ASC`
  );
  return rows.map(mapProduct);
}

export type ProductListFilters = {
  categoryId?: string;
  brand?: string;
  search?: string;
  onlyNew?: boolean;
  onlyRestocked?: boolean;
  onlyInStock?: boolean;
  page?: number;
  pageSize?: number;
  limit?: number;
  /** true ise COUNT(*) atlanır (ana sayfa widget'ları için) */
  skipCount?: boolean;
};

export type ProductListResult = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function listProductsPg(
  filters: ProductListFilters = {}
): Promise<ProductListResult> {
  await ensureDb();

  const pageSize = Math.max(1, filters.limit ?? filters.pageSize ?? 24);
  const rawPage = Math.max(1, filters.page ?? 1);

  const where: string[] = [];
  const params: unknown[] = [];

  if (filters.categoryId) {
    params.push(filters.categoryId);
    where.push(`category_id = $${params.length}`);
  }
  if (filters.brand) {
    params.push(filters.brand);
    where.push(`LOWER(brand) = LOWER($${params.length})`);
  }
  if (filters.search?.trim()) {
    params.push(`%${filters.search.trim().toLowerCase()}%`);
    const i = params.length;
    where.push(
      `(LOWER(name) LIKE $${i} OR LOWER(brand) LIKE $${i} OR LOWER(sku) LIKE $${i})`
    );
  }
  if (filters.onlyNew) where.push("is_new = true");
  if (filters.onlyRestocked) where.push("is_restocked = true");
  if (filters.onlyInStock) where.push("stock_qty > 0");

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  let total: number;
  let totalPages: number;
  let page: number;
  let offset: number;

  if (filters.skipCount) {
    total = pageSize;
    totalPages = 1;
    page = 1;
    offset = 0;
  } else {
    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM products ${whereSql}`,
      params
    );
    total = Number(countRow?.count || 0);
    totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    page = Math.min(rawPage, totalPages);
    offset = (page - 1) * pageSize;
  }

  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  // Liste için hafif kolonlar — description/features çekilmez
  const rows = await query<ProductRow>(
    `SELECT id, sku, name, slug, brand, category_id, price_ex_vat, price_inc_vat, unit,
            pack_size, pack_unit, in_stock, COALESCE(stock_qty, 0) AS stock_qty, is_new, is_restocked, image,
            '' AS description, '' AS features
     FROM products ${whereSql}
     ORDER BY name ASC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    [...params, pageSize, offset]
  );

  return {
    items: rows.map(mapProduct),
    total: filters.skipCount ? rows.length : total,
    page,
    pageSize,
    totalPages,
  };
}

export async function getCategoryMinPricesPg(): Promise<
  Record<string, number>
> {
  await ensureDb();
  const rows = await query<{ category_id: string; min_price: string }>(
    `SELECT category_id, MIN(price_inc_vat)::text AS min_price
     FROM products
     GROUP BY category_id`
  );
  return Object.fromEntries(
    rows.map((r) => [r.category_id, Number(r.min_price)])
  );
}

export async function getProductBySlugPg(slug: string) {
  await ensureDb();
  const row = await queryOne<ProductRow>(
    `SELECT ${PRODUCT_SELECT} FROM products WHERE slug = $1`,
    [slug]
  );
  return row ? mapProduct(row) : undefined;
}

export async function getProductByIdPg(id: string) {
  await ensureDb();
  const row = await queryOne<ProductRow>(
    `SELECT ${PRODUCT_SELECT} FROM products WHERE id = $1`,
    [id]
  );
  return row ? mapProduct(row) : undefined;
}

export async function getProductsByCategoryPg(categoryId: string) {
  const result = await listProductsPg({
    categoryId,
    page: 1,
    pageSize: 10_000,
  });
  return result.items;
}

export async function getNewProductsPg(limit = 8) {
  const result = await listProductsPg({
    onlyNew: true,
    limit,
    page: 1,
    skipCount: true,
  });
  return result.items;
}

export async function getRestockedProductsPg(limit = 8) {
  const result = await listProductsPg({
    onlyRestocked: true,
    limit,
    page: 1,
    skipCount: true,
  });
  return result.items;
}

export async function searchProductsPg(q: string, limit = 100) {
  const result = await listProductsPg({
    search: q,
    limit,
    page: 1,
  });
  return result.items;
}

export async function createUserPg(data: {
  email: string;
  password: string;
  name: string;
  phone?: string;
}) {
  await ensureDb();
  const existing = await queryOne("SELECT id FROM users WHERE email = $1", [
    data.email.toLowerCase(),
  ]);
  if (existing) throw new Error("EMAIL_EXISTS");

  const id = randomUUID();
  const passwordHash = await hashPassword(data.password);
  await query(
    `INSERT INTO users (id, email, password_hash, name, phone, role)
     VALUES ($1, $2, $3, $4, $5, 'user')`,
    [id, data.email.toLowerCase(), passwordHash, data.name, data.phone || null]
  );
  return getUserByIdPg(id);
}

export async function getUserByEmailPg(email: string) {
  await ensureDb();
  const row = await queryOne<{
    id: string;
    email: string;
    password_hash: string;
    name: string;
    phone: string | null;
    role: "user" | "admin";
    created_at: Date;
  }>("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  if (!row) return undefined;
  return row;
}

export async function getUserByIdPg(id: string): Promise<User | undefined> {
  await ensureDb();
  const row = await queryOne<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: "user" | "admin";
    created_at: Date;
  }>("SELECT id, email, name, phone, role, created_at FROM users WHERE id = $1", [id]);
  if (!row) return undefined;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone || undefined,
    role: row.role,
    createdAt: row.created_at.toISOString(),
  };
}

function generateOrderNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `MG-${y}${m}${d}-${rand}`;
}

export async function createOrderPg(
  payload: CreateOrderPayload,
  userId?: string
): Promise<Order> {
  await ensureDb();
  if (!payload.items.length) throw new Error("EMPTY_CART");

  const orderId = randomUUID();
  const orderNumber = generateOrderNumber();
  const guestToken = userId ? undefined : randomUUID();
  let totalExVat = 0;
  let totalIncVat = 0;
  const orderItems: OrderItem[] = [];

  // Stok ve fiyat doğrulama (transaction dışında okuma; düşüm transaction içinde)
  for (const item of payload.items) {
    const quantity = Math.floor(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new Error("INVALID_QUANTITY");
    }

    const product = await getProductByIdPg(item.productId);
    if (!product) throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
    const stockQty = product.stockQty ?? 0;
    if (stockQty < quantity) {
      throw new Error(`INSUFFICIENT_STOCK:${product.sku}:${stockQty}`);
    }

    totalExVat += product.priceExVat * quantity;
    totalIncVat += product.priceIncVat * quantity;

    orderItems.push({
      id: randomUUID(),
      orderId,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity,
      unitPriceExVat: product.priceExVat,
      unitPriceIncVat: product.priceIncVat,
    });
  }

  let discountAmount = 0;
  let couponCode: string | null = null;
  const grossExVat = totalExVat;
  const grossIncVat = totalIncVat;
  if (payload.couponCode?.trim()) {
    const coupon = await validateCouponPg(payload.couponCode.trim(), grossIncVat);
    discountAmount = coupon.discount;
    couponCode = coupon.code;
    totalIncVat = Math.max(0, Math.round((grossIncVat - discountAmount) * 100) / 100);
    const discountEx = Math.round((discountAmount / 1.2) * 100) / 100;
    totalExVat = Math.max(0, Math.round((grossExVat - discountEx) * 100) / 100);
  }

  const initialPaymentStatus: PaymentStatus = "pending";

  await withTransaction(async (client) => {
    for (const item of orderItems) {
      const stockResult = await client.query(
        `UPDATE products
         SET stock_qty = stock_qty - $2,
             in_stock = (stock_qty - $2) > 0
         WHERE id = $1 AND stock_qty >= $2
         RETURNING id`,
        [item.productId, item.quantity]
      );
      if (!stockResult.rows[0]) {
        throw new Error(`INSUFFICIENT_STOCK:${item.sku}`);
      }
    }

    if (couponCode) {
      const couponResult = await client.query(
        `UPDATE coupons
         SET used_count = used_count + 1
         WHERE UPPER(code) = UPPER($1)
           AND active = true
           AND (max_uses IS NULL OR used_count < max_uses)
           AND (expires_at IS NULL OR expires_at > NOW())
         RETURNING id`,
        [couponCode]
      );
      if (!couponResult.rows[0]) {
        throw new Error("COUPON_INVALID");
      }
    }

    await client.query(
      `INSERT INTO orders (
        id, order_number, user_id, email, customer_name, phone, status, payment_status,
        payment_method, total_ex_vat, total_inc_vat, discount_amount, coupon_code,
        shipping_address, notes, guest_token
      ) VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        orderId,
        orderNumber,
        userId || null,
        payload.email.toLowerCase(),
        payload.customerName,
        payload.phone,
        initialPaymentStatus,
        payload.paymentMethod,
        totalExVat,
        totalIncVat,
        discountAmount,
        couponCode,
        JSON.stringify(payload.shippingAddress),
        payload.notes || null,
        guestToken || null,
      ]
    );

    for (const item of orderItems) {
      await client.query(
        `INSERT INTO order_items (
          id, order_id, product_id, product_name, sku, quantity,
          unit_price_ex_vat, unit_price_inc_vat
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          item.id,
          item.orderId,
          item.productId,
          item.productName,
          item.sku,
          item.quantity,
          item.unitPriceExVat,
          item.unitPriceIncVat,
        ]
      );
    }
  });

  const order = await getOrderByIdPg(orderId);
  if (!order) throw new Error("ORDER_CREATE_FAILED");
  return order;
}

export async function getOrderItemsPg(orderId: string): Promise<OrderItem[]> {
  await ensureDb();
  const rows = await query<{
    id: string;
    order_id: string;
    product_id: string;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price_ex_vat: string;
    unit_price_inc_vat: string;
  }>(
    `SELECT id, order_id, product_id, product_name, sku, quantity,
            unit_price_ex_vat, unit_price_inc_vat
     FROM order_items WHERE order_id = $1`,
    [orderId]
  );
  return rows.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    productName: row.product_name,
    sku: row.sku,
    quantity: Number(row.quantity),
    unitPriceExVat: Number(row.unit_price_ex_vat),
    unitPriceIncVat: Number(row.unit_price_inc_vat),
  }));
}

export async function getOrderByIdPg(id: string): Promise<Order | undefined> {
  await ensureDb();
  const row = await queryOne<OrderRow>(
    `SELECT ${ORDER_SELECT} FROM orders WHERE id = $1`,
    [id]
  );
  if (!row) return undefined;
  const order = mapOrder(row);
  order.items = await getOrderItemsPg(id);
  return order;
}

export async function trackOrderPg(email: string, orderNumber: string) {
  await ensureDb();
  const row = await queryOne<OrderRow>(
    `SELECT ${ORDER_SELECT} FROM orders WHERE LOWER(email) = LOWER($1) AND order_number = $2`,
    [email, orderNumber]
  );
  if (!row) return undefined;
  const order = mapOrder(row);
  order.items = await getOrderItemsPg(order.id);
  return order;
}

export async function getOrdersByUserPg(userId: string): Promise<Order[]> {
  await ensureDb();
  const user = await getUserByIdPg(userId);
  const rows = await query<OrderRow>(
    `SELECT ${ORDER_SELECT}
     FROM orders
     WHERE user_id = $1
        OR ($2::text IS NOT NULL AND LOWER(email) = LOWER($2))
     ORDER BY created_at DESC`,
    [userId, user?.email || null]
  );
  const orders = rows.map(mapOrder);
  for (const order of orders) {
    order.items = await getOrderItemsPg(order.id);
  }
  return orders;
}

export async function getAllOrdersPg(): Promise<Order[]> {
  await ensureDb();
  const rows = await query<OrderRow>(
    `SELECT ${ORDER_SELECT} FROM orders ORDER BY created_at DESC`
  );
  const orders = rows.map(mapOrder);
  for (const order of orders) {
    order.items = await getOrderItemsPg(order.id);
  }
  return orders;
}

export async function updateOrderStatusPg(
  orderId: string,
  status?: OrderStatus,
  paymentStatus?: PaymentStatus,
  extras?: {
    trackingNumber?: string | null;
    cargoCompany?: string | null;
    paymentId?: string | null;
  }
) {
  await ensureDb();
  const current = await getOrderByIdPg(orderId);
  if (!current) throw new Error("NOT_FOUND");

  const nextStatus = status ?? current.status;
  const nextPayment = paymentStatus ?? current.paymentStatus;
  const tracking =
    extras?.trackingNumber !== undefined
      ? extras.trackingNumber
      : current.trackingNumber || null;
  const cargo =
    extras?.cargoCompany !== undefined
      ? extras.cargoCompany
      : current.cargoCompany || null;
  const paymentId =
    extras?.paymentId !== undefined
      ? extras.paymentId
      : current.paymentId || null;

  await query(
    `UPDATE orders SET status = $1, payment_status = $2,
      tracking_number = $3, cargo_company = $4, payment_id = $5,
      updated_at = NOW() WHERE id = $6`,
    [nextStatus, nextPayment, tracking, cargo, paymentId, orderId]
  );
  return getOrderByIdPg(orderId);
}

export async function updatePaymentStatusPg(orderId: string, paymentStatus: PaymentStatus) {
  await ensureDb();
  const statusUpdate =
    paymentStatus === "paid" ? ", status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END" : "";
  await query(
    `UPDATE orders SET payment_status = $1, updated_at = NOW()${statusUpdate} WHERE id = $2`,
    [paymentStatus, orderId]
  );
  return getOrderByIdPg(orderId);
}

export async function createProductPg(data: Omit<Product, "id">) {
  await ensureDb();
  const id = randomUUID();
  const stockQty =
    data.stockQty !== undefined
      ? Math.max(0, Math.floor(Number(data.stockQty)))
      : data.inStock
        ? 100
        : 0;
  await query(
    `INSERT INTO products (
      id, sku, name, slug, brand, category_id, price_ex_vat, price_inc_vat, unit,
      pack_size, pack_unit, in_stock, stock_qty, is_new, is_restocked, image, description, features
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      id,
      data.sku,
      data.name,
      data.slug,
      data.brand,
      data.categoryId,
      data.priceExVat,
      data.priceIncVat,
      data.unit,
      data.packSize ?? null,
      data.packUnit ?? null,
      stockQty > 0,
      stockQty,
      data.isNew ?? false,
      data.isRestocked ?? false,
      data.image,
      data.description,
      serializeFeatures(data.features),
    ]
  );
  await refreshCategoryProductCountsPg();
  return getProductByIdPg(id);
}

export async function updateProductPg(id: string, data: Partial<Product>) {
  await ensureDb();
  const current = await getProductByIdPg(id);
  if (!current) throw new Error("NOT_FOUND");

  const merged = { ...current, ...data };
  let stockQty =
    data.stockQty !== undefined
      ? Math.max(0, Math.floor(Number(data.stockQty)))
      : (current.stockQty ?? 0);
  if (data.stockQty === undefined && data.inStock !== undefined) {
    if (data.inStock && stockQty === 0) stockQty = 1;
    if (!data.inStock) stockQty = 0;
  }

  await query(
    `UPDATE products SET
      sku=$2, name=$3, slug=$4, brand=$5, category_id=$6,
      price_ex_vat=$7, price_inc_vat=$8, unit=$9, pack_size=$10, pack_unit=$11,
      in_stock=$12, stock_qty=$13, is_new=$14, is_restocked=$15, image=$16, description=$17, features=$18
     WHERE id=$1`,
    [
      id,
      merged.sku,
      merged.name,
      merged.slug,
      merged.brand,
      merged.categoryId,
      merged.priceExVat,
      merged.priceIncVat,
      merged.unit,
      merged.packSize ?? null,
      merged.packUnit ?? null,
      stockQty > 0,
      stockQty,
      merged.isNew ?? false,
      merged.isRestocked ?? false,
      merged.image,
      merged.description,
      serializeFeatures(merged.features),
    ]
  );
  await refreshCategoryProductCountsPg();
  return getProductByIdPg(id);
}

export async function deleteProductPg(id: string) {
  await ensureDb();
  await query("DELETE FROM products WHERE id = $1", [id]);
  await refreshCategoryProductCountsPg();
}

export async function getAdminStatsPg(): Promise<AdminStats> {
  await ensureDb();
  const [products, orders, pending, open, users, revenue, stock, latest] =
    await Promise.all([
      queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM products"),
      queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM orders"),
      queryOne<{ count: string }>(
        "SELECT COUNT(*)::text AS count FROM orders WHERE status = 'pending'"
      ),
      queryOne<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM orders
         WHERE status IN ('pending', 'confirmed')`
      ),
      queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM users"),
      queryOne<{ total: string }>(
        "SELECT COALESCE(SUM(total_inc_vat),0)::text AS total FROM orders WHERE payment_status = 'paid'"
      ),
      queryOne<{
        in_stock: string;
        out_of_stock: string;
        total_qty: string;
      }>(
        `SELECT
           COUNT(*) FILTER (WHERE COALESCE(stock_qty, 0) > 0)::text AS in_stock,
           COUNT(*) FILTER (WHERE COALESCE(stock_qty, 0) <= 0)::text AS out_of_stock,
           COALESCE(SUM(COALESCE(stock_qty, 0)), 0)::text AS total_qty
         FROM products`
      ),
      queryOne<{ order_number: string; created_at: Date }>(
        `SELECT order_number, created_at FROM orders ORDER BY created_at DESC LIMIT 1`
      ),
    ]);

  return {
    totalProducts: Number(products?.count || 0),
    totalOrders: Number(orders?.count || 0),
    pendingOrders: Number(pending?.count || 0),
    openOrders: Number(open?.count || 0),
    totalUsers: Number(users?.count || 0),
    totalRevenue: Number(revenue?.total || 0),
    productsInStock: Number(stock?.in_stock || 0),
    productsOutOfStock: Number(stock?.out_of_stock || 0),
    totalStockQty: Number(stock?.total_qty || 0),
    latestOrderAt: latest?.created_at?.toISOString(),
    latestOrderNumber: latest?.order_number,
  };
}

export async function getAllUsersPg(): Promise<User[]> {
  await ensureDb();
  const rows = await query<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: "user" | "admin";
    created_at: Date;
  }>("SELECT id, email, name, phone, role, created_at FROM users ORDER BY created_at DESC");
  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone || undefined,
    role: row.role,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function updateUserRolePg(id: string, role: "user" | "admin") {
  await ensureDb();
  if (role !== "user" && role !== "admin") throw new Error("INVALID_ROLE");
  const result = await query("UPDATE users SET role = $2 WHERE id = $1 RETURNING id", [
    id,
    role,
  ]);
  if (!result[0]) throw new Error("NOT_FOUND");
  const rows = await query<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: "user" | "admin";
    created_at: Date;
  }>("SELECT id, email, name, phone, role, created_at FROM users WHERE id = $1", [id]);
  const row = rows[0];
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone || undefined,
    role: row.role,
    createdAt: row.created_at.toISOString(),
  } satisfies User;
}

export async function refreshCategoryProductCountsPg() {
  await ensureDb();
  await query(`
    UPDATE categories c
    SET product_count = COALESCE((
      SELECT COUNT(*)::int FROM products p WHERE p.category_id = c.id
    ), 0)
  `);
}

export async function createCategoryPg(data: Omit<Category, "id">) {
  await ensureDb();
  const id = randomUUID();
  await query(
    `INSERT INTO categories (id, name, slug, icon, product_count, image, description)
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [
      id,
      data.name,
      data.slug,
      data.icon,
      data.productCount,
      data.image || null,
      data.description || null,
    ]
  );
  return getCategoryBySlugPg(data.slug);
}

export async function updateCategoryPg(id: string, data: Partial<Category>) {
  await ensureDb();
  const rows = await query<{ slug: string }>("SELECT slug FROM categories WHERE id = $1", [id]);
  if (!rows[0]) throw new Error("NOT_FOUND");
  const current = await getCategoryBySlugPg(rows[0].slug);
  if (!current) throw new Error("NOT_FOUND");
  const merged = { ...current, ...data, id };
  await query(
    `UPDATE categories SET name=$2, slug=$3, icon=$4, product_count=$5, image=$6, description=$7
     WHERE id=$1`,
    [
      id,
      merged.name,
      merged.slug,
      merged.icon,
      merged.productCount,
      merged.image || null,
      merged.description || null,
    ]
  );
  return getCategoryBySlugPg(merged.slug);
}

export async function deleteCategoryPg(id: string) {
  await ensureDb();
  const linked = await queryOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM products WHERE category_id = $1",
    [id]
  );
  const count = Number(linked?.count || 0);
  if (count > 0) {
    throw new Error(`HAS_PRODUCTS:${count}`);
  }
  const existing = await queryOne<{ id: string }>(
    "SELECT id FROM categories WHERE id = $1",
    [id]
  );
  if (!existing) throw new Error("NOT_FOUND");
  await query("DELETE FROM categories WHERE id = $1", [id]);
}

// ─── Brands CRUD ───────────────────────────────────────────

export async function createBrandPg(data: Omit<Brand, "id">) {
  await ensureDb();
  const id = randomUUID();
  await query(`INSERT INTO brands (id, name, slug) VALUES ($1,$2,$3)`, [
    id,
    data.name,
    data.slug,
  ]);
  return queryOne<Brand>("SELECT id, name, slug FROM brands WHERE id = $1", [id]);
}

export async function updateBrandPg(id: string, data: Partial<Brand>) {
  await ensureDb();
  const current = await queryOne<Brand>(
    "SELECT id, name, slug FROM brands WHERE id = $1",
    [id]
  );
  if (!current) throw new Error("NOT_FOUND");
  const merged = { ...current, ...data, id };
  await query(`UPDATE brands SET name=$2, slug=$3 WHERE id=$1`, [
    id,
    merged.name,
    merged.slug,
  ]);
  return queryOne<Brand>("SELECT id, name, slug FROM brands WHERE id = $1", [id]);
}

export async function deleteBrandPg(id: string) {
  await ensureDb();
  const brand = await queryOne<{ name: string }>(
    "SELECT name FROM brands WHERE id = $1",
    [id]
  );
  if (!brand) throw new Error("NOT_FOUND");
  const linked = await queryOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM products WHERE LOWER(brand) = LOWER($1)",
    [brand.name]
  );
  if (Number(linked?.count || 0) > 0) {
    throw new Error(`HAS_PRODUCTS:${linked?.count}`);
  }
  await query("DELETE FROM brands WHERE id = $1", [id]);
}

// ─── Coupons ───────────────────────────────────────────────

export async function validateCouponPg(code: string, orderIncVat: number) {
  await ensureDb();
  const row = await queryOne<{
    id: string;
    code: string;
    type: CouponType;
    value: string;
    min_order_inc_vat: string;
    max_uses: number | null;
    used_count: number;
    active: boolean;
    expires_at: Date | null;
  }>(
    `SELECT * FROM coupons WHERE UPPER(code) = UPPER($1)`,
    [code.trim()]
  );
  if (!row || !row.active) throw new Error("COUPON_INVALID");
  if (row.expires_at && row.expires_at.getTime() < Date.now()) {
    throw new Error("COUPON_EXPIRED");
  }
  if (row.max_uses !== null && row.used_count >= row.max_uses) {
    throw new Error("COUPON_EXHAUSTED");
  }
  const minOrder = Number(row.min_order_inc_vat);
  if (orderIncVat < minOrder) {
    throw new Error(`COUPON_MIN_ORDER:${minOrder}`);
  }

  const value = Number(row.value);
  let discount =
    row.type === "percent"
      ? Math.round(((orderIncVat * value) / 100) * 100) / 100
      : value;
  discount = Math.min(discount, orderIncVat);
  return { code: row.code, discount, type: row.type, value };
}

export async function getAllCouponsPg(): Promise<Coupon[]> {
  await ensureDb();
  const rows = await query<{
    id: string;
    code: string;
    type: CouponType;
    value: string;
    min_order_inc_vat: string;
    max_uses: number | null;
    used_count: number;
    active: boolean;
    expires_at: Date | null;
    created_at: Date;
  }>("SELECT * FROM coupons ORDER BY created_at DESC");
  return rows.map(mapCoupon);
}

export async function createCouponPg(data: {
  code: string;
  type: CouponType;
  value: number;
  minOrderIncVat?: number;
  maxUses?: number | null;
  active?: boolean;
  expiresAt?: string | null;
}) {
  await ensureDb();
  const id = randomUUID();
  const code = data.code.trim().toUpperCase();
  await query(
    `INSERT INTO coupons (id, code, type, value, min_order_inc_vat, max_uses, active, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      id,
      code,
      data.type,
      data.value,
      data.minOrderIncVat ?? 0,
      data.maxUses ?? null,
      data.active !== false,
      data.expiresAt || null,
    ]
  );
  const all = await getAllCouponsPg();
  return all.find((c) => c.id === id)!;
}

export async function updateCouponPg(
  id: string,
  data: Partial<{
    code: string;
    type: CouponType;
    value: number;
    minOrderIncVat: number;
    maxUses: number | null;
    active: boolean;
    expiresAt: string | null;
  }>
) {
  await ensureDb();
  const current = (await getAllCouponsPg()).find((c) => c.id === id);
  if (!current) throw new Error("NOT_FOUND");
  await query(
    `UPDATE coupons SET code=$2, type=$3, value=$4, min_order_inc_vat=$5,
      max_uses=$6, active=$7, expires_at=$8 WHERE id=$1`,
    [
      id,
      (data.code ?? current.code).trim().toUpperCase(),
      data.type ?? current.type,
      data.value ?? current.value,
      data.minOrderIncVat ?? current.minOrderIncVat,
      data.maxUses !== undefined ? data.maxUses : current.maxUses,
      data.active ?? current.active,
      data.expiresAt !== undefined ? data.expiresAt : current.expiresAt || null,
    ]
  );
  return (await getAllCouponsPg()).find((c) => c.id === id);
}

export async function deleteCouponPg(id: string) {
  await ensureDb();
  await query("DELETE FROM coupons WHERE id = $1", [id]);
}

// ─── Addresses ─────────────────────────────────────────────

export async function getAddressesByUserPg(userId: string): Promise<SavedAddress[]> {
  await ensureDb();
  const rows = await query<{
    id: string;
    user_id: string;
    label: string;
    full_name: string;
    phone: string;
    address_line: string;
    city: string;
    district: string;
    postal_code: string | null;
    is_default: boolean;
    created_at: Date;
  }>(
    `SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC`,
    [userId]
  );
  return rows.map(mapAddress);
}

export async function createAddressPg(
  userId: string,
  data: Omit<SavedAddress, "id" | "userId" | "createdAt">
) {
  await ensureDb();
  const id = randomUUID();
  if (data.isDefault) {
    await query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [userId]);
  }
  await query(
    `INSERT INTO addresses (id, user_id, label, full_name, phone, address_line, city, district, postal_code, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      id,
      userId,
      data.label || "Adres",
      data.fullName,
      data.phone,
      data.addressLine,
      data.city,
      data.district,
      data.postalCode || null,
      data.isDefault ?? false,
    ]
  );
  return (await getAddressesByUserPg(userId)).find((a) => a.id === id)!;
}

export async function updateAddressPg(
  userId: string,
  id: string,
  data: Partial<Omit<SavedAddress, "id" | "userId" | "createdAt">>
) {
  await ensureDb();
  const current = (await getAddressesByUserPg(userId)).find((a) => a.id === id);
  if (!current) throw new Error("NOT_FOUND");
  if (data.isDefault) {
    await query(`UPDATE addresses SET is_default = false WHERE user_id = $1`, [userId]);
  }
  const merged = { ...current, ...data };
  await query(
    `UPDATE addresses SET label=$3, full_name=$4, phone=$5, address_line=$6,
      city=$7, district=$8, postal_code=$9, is_default=$10
     WHERE id=$1 AND user_id=$2`,
    [
      id,
      userId,
      merged.label,
      merged.fullName,
      merged.phone,
      merged.addressLine,
      merged.city,
      merged.district,
      merged.postalCode || null,
      merged.isDefault,
    ]
  );
  return (await getAddressesByUserPg(userId)).find((a) => a.id === id)!;
}

export async function deleteAddressPg(userId: string, id: string) {
  await ensureDb();
  const result = await query(
    `DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId]
  );
  if (!result[0]) throw new Error("NOT_FOUND");
}

// ─── Profile ───────────────────────────────────────────────

export async function updateUserProfilePg(
  userId: string,
  data: { name?: string; phone?: string }
) {
  await ensureDb();
  const current = await getUserByIdPg(userId);
  if (!current) throw new Error("NOT_FOUND");
  await query(`UPDATE users SET name = $2, phone = $3 WHERE id = $1`, [
    userId,
    data.name?.trim() || current.name,
    data.phone !== undefined ? data.phone || null : current.phone || null,
  ]);
  return getUserByIdPg(userId);
}

export async function updateUserPasswordPg(userId: string, passwordHash: string) {
  await ensureDb();
  await query(`UPDATE users SET password_hash = $2 WHERE id = $1`, [
    userId,
    passwordHash,
  ]);
}

// ─── Password reset ────────────────────────────────────────

export async function createPasswordResetTokenPg(userId: string, tokenHash: string, expiresAt: Date) {
  await ensureDb();
  await query(`DELETE FROM password_reset_tokens WHERE user_id = $1`, [userId]);
  const id = randomUUID();
  await query(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at) VALUES ($1,$2,$3,$4)`,
    [id, userId, tokenHash, expiresAt.toISOString()]
  );
}

export async function consumePasswordResetTokenPg(tokenHash: string) {
  await ensureDb();
  const row = await queryOne<{
    id: string;
    user_id: string;
    expires_at: Date;
    used_at: Date | null;
  }>(
    `SELECT id, user_id, expires_at, used_at FROM password_reset_tokens WHERE token_hash = $1`,
    [tokenHash]
  );
  if (!row || row.used_at || row.expires_at.getTime() < Date.now()) {
    return null;
  }
  await query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1`, [
    row.id,
  ]);
  return row.user_id;
}

// ─── Server cart ───────────────────────────────────────────

export async function getCartItemsPg(userId: string): Promise<
  { product: Product; quantity: number }[]
> {
  await ensureDb();
  const rows = await query<ProductRow & { quantity: number }>(
    `SELECT p.id, p.sku, p.name, p.slug, p.brand, p.category_id, p.price_ex_vat, p.price_inc_vat, p.unit,
            p.pack_size, p.pack_unit, p.in_stock, COALESCE(p.stock_qty, 0) AS stock_qty,
            p.is_new, p.is_restocked, p.image, '' AS description, '' AS features,
            c.quantity
     FROM cart_items c
     INNER JOIN products p ON p.id = c.product_id
     WHERE c.user_id = $1`,
    [userId]
  );
  return rows.map((row) => ({
    product: mapProduct(row),
    quantity: Number(row.quantity),
  }));
}

export async function setCartItemsPg(
  userId: string,
  items: { productId: string; quantity: number }[]
) {
  await ensureDb();
  await withTransaction(async (client) => {
    await client.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
    for (const item of items) {
      const qty = Math.max(1, Math.floor(Number(item.quantity)));
      await client.query(
        `INSERT INTO cart_items (id, user_id, product_id, quantity) VALUES ($1,$2,$3,$4)
         ON CONFLICT (user_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity`,
        [randomUUID(), userId, item.productId, qty]
      );
    }
  });
  return getCartItemsPg(userId);
}

export async function clearCartPg(userId: string) {
  await ensureDb();
  await query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
}

// ─── Contact messages ──────────────────────────────────────

export async function createContactMessagePg(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}): Promise<ContactMessage> {
  await ensureDb();
  const id = randomUUID();
  const rows = await query<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    subject: string;
    message: string;
    created_at: Date;
  }>(
    `INSERT INTO contact_messages (id, name, email, phone, subject, message)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      id,
      data.name,
      data.email.toLowerCase(),
      data.phone || null,
      data.subject,
      data.message,
    ]
  );
  const row = rows[0];
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || undefined,
    subject: row.subject,
    message: row.message,
    createdAt: row.created_at.toISOString(),
  };
}

// ─── Refund / restore stock ────────────────────────────────

export async function refundOrderPg(orderId: string) {
  await ensureDb();
  const order = await getOrderByIdPg(orderId);
  if (!order) throw new Error("NOT_FOUND");
  if (order.paymentStatus === "refunded") return order;

  await withTransaction(async (client) => {
    for (const item of order.items || []) {
      await client.query(
        `UPDATE products
         SET stock_qty = stock_qty + $2,
             in_stock = true
         WHERE id = $1`,
        [item.productId, item.quantity]
      );
    }
    await client.query(
      `UPDATE orders SET payment_status = 'refunded', status = 'cancelled', updated_at = NOW()
       WHERE id = $1`,
      [orderId]
    );
  });
  return getOrderByIdPg(orderId);
}

export async function setOrderPaymentIdPg(orderId: string, paymentId: string) {
  await ensureDb();
  await query(`UPDATE orders SET payment_id = $2, updated_at = NOW() WHERE id = $1`, [
    orderId,
    paymentId,
  ]);
}

