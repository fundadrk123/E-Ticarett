import { randomUUID } from "crypto";
import {
  query,
  queryOne,
  initializeDatabase,
  parseFeatures,
  serializeFeatures,
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
  is_new: boolean;
  is_restocked: boolean;
  image: string;
  description: string;
  features: string;
};

function mapProduct(row: ProductRow): Product {
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
    inStock: row.in_stock,
    isNew: row.is_new,
    isRestocked: row.is_restocked,
    image: row.image,
    description: row.description,
    features: parseFeatures(row.features),
  };
}

function mapOrder(row: {
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
  shipping_address: ShippingAddress;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}): Order {
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
    shippingAddress: row.shipping_address,
    notes: row.notes || undefined,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
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
    `SELECT id, name, slug, icon, product_count, image, description
     FROM categories ORDER BY name ASC`
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
    `SELECT id, name, slug, icon, product_count, image, description
     FROM categories WHERE slug = $1`,
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

export async function getAllProductsPg(): Promise<Product[]> {
  await ensureDb();
  const rows = await query<ProductRow>(
    `SELECT id, sku, name, slug, brand, category_id, price_ex_vat, price_inc_vat, unit,
            pack_size, pack_unit, in_stock, is_new, is_restocked, image, description, features
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
  const page = Math.max(1, filters.page ?? 1);
  const offset = (page - 1) * pageSize;

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
  if (filters.onlyInStock) where.push("in_stock = true");

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const countRow = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM products ${whereSql}`,
    params
  );
  const total = Number(countRow?.count || 0);

  const limitIdx = params.length + 1;
  const offsetIdx = params.length + 2;
  const rows = await query<ProductRow>(
    `SELECT id, sku, name, slug, brand, category_id, price_ex_vat, price_inc_vat, unit,
            pack_size, pack_unit, in_stock, is_new, is_restocked, image, description, features
     FROM products ${whereSql}
     ORDER BY name ASC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    [...params, pageSize, offset]
  );

  return {
    items: rows.map(mapProduct),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
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
    `SELECT id, sku, name, slug, brand, category_id, price_ex_vat, price_inc_vat, unit,
            pack_size, pack_unit, in_stock, is_new, is_restocked, image, description, features
     FROM products WHERE slug = $1`,
    [slug]
  );
  return row ? mapProduct(row) : undefined;
}

export async function getProductByIdPg(id: string) {
  await ensureDb();
  const row = await queryOne<ProductRow>(
    `SELECT id, sku, name, slug, brand, category_id, price_ex_vat, price_inc_vat, unit,
            pack_size, pack_unit, in_stock, is_new, is_restocked, image, description, features
     FROM products WHERE id = $1`,
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
  const result = await listProductsPg({ onlyNew: true, limit, page: 1 });
  return result.items;
}

export async function getRestockedProductsPg(limit = 8) {
  const result = await listProductsPg({ onlyRestocked: true, limit, page: 1 });
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
  let totalExVat = 0;
  let totalIncVat = 0;
  const orderItems: OrderItem[] = [];

  for (const item of payload.items) {
    const product = await getProductByIdPg(item.productId);
    if (!product) throw new Error(`PRODUCT_NOT_FOUND:${item.productId}`);
    if (!product.inStock) throw new Error(`OUT_OF_STOCK:${product.sku}`);

    totalExVat += product.priceExVat * item.quantity;
    totalIncVat += product.priceIncVat * item.quantity;

    const orderItem: OrderItem = {
      id: randomUUID(),
      orderId,
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      quantity: item.quantity,
      unitPriceExVat: product.priceExVat,
      unitPriceIncVat: product.priceIncVat,
    };
    orderItems.push(orderItem);
  }

  const initialPaymentStatus: PaymentStatus =
    payload.paymentMethod === "credit_card" ? "pending" : "pending";

  await query(
    `INSERT INTO orders (
      id, order_number, user_id, email, customer_name, phone, status, payment_status,
      payment_method, total_ex_vat, total_inc_vat, shipping_address, notes
    ) VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$9,$10,$11,$12)`,
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
      JSON.stringify(payload.shippingAddress),
      payload.notes || null,
    ]
  );

  for (const item of orderItems) {
    await query(
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
  const row = await queryOne<Parameters<typeof mapOrder>[0]>(
    `SELECT id, order_number, user_id, email, customer_name, phone, status,
            payment_status, payment_method, total_ex_vat, total_inc_vat,
            shipping_address, notes, created_at, updated_at
     FROM orders WHERE id = $1`,
    [id]
  );
  if (!row) return undefined;
  const order = mapOrder(row);
  order.items = await getOrderItemsPg(id);
  return order;
}

export async function trackOrderPg(email: string, orderNumber: string) {
  await ensureDb();
  const row = await queryOne<Parameters<typeof mapOrder>[0]>(
    `SELECT id, order_number, user_id, email, customer_name, phone, status,
            payment_status, payment_method, total_ex_vat, total_inc_vat,
            shipping_address, notes, created_at, updated_at
     FROM orders WHERE LOWER(email) = LOWER($1) AND order_number = $2`,
    [email, orderNumber]
  );
  if (!row) return undefined;
  const order = mapOrder(row);
  order.items = await getOrderItemsPg(order.id);
  return order;
}

export async function getOrdersByUserPg(userId: string): Promise<Order[]> {
  await ensureDb();
  const rows = await query<Parameters<typeof mapOrder>[0]>(
    `SELECT id, order_number, user_id, email, customer_name, phone, status,
            payment_status, payment_method, total_ex_vat, total_inc_vat,
            shipping_address, notes, created_at, updated_at
     FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  const orders = rows.map(mapOrder);
  for (const order of orders) {
    order.items = await getOrderItemsPg(order.id);
  }
  return orders;
}

export async function getAllOrdersPg(): Promise<Order[]> {
  await ensureDb();
  const rows = await query<Parameters<typeof mapOrder>[0]>(
    `SELECT id, order_number, user_id, email, customer_name, phone, status,
            payment_status, payment_method, total_ex_vat, total_inc_vat,
            shipping_address, notes, created_at, updated_at
     FROM orders ORDER BY created_at DESC`
  );
  const orders = rows.map(mapOrder);
  for (const order of orders) {
    order.items = await getOrderItemsPg(order.id);
  }
  return orders;
}

export async function updateOrderStatusPg(
  orderId: string,
  status: OrderStatus,
  paymentStatus?: PaymentStatus
) {
  await ensureDb();
  if (paymentStatus) {
    await query(
      `UPDATE orders SET status = $1, payment_status = $2, updated_at = NOW() WHERE id = $3`,
      [status, paymentStatus, orderId]
    );
  } else {
    await query(`UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2`, [
      status,
      orderId,
    ]);
  }
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
  await query(
    `INSERT INTO products (
      id, sku, name, slug, brand, category_id, price_ex_vat, price_inc_vat, unit,
      pack_size, pack_unit, in_stock, is_new, is_restocked, image, description, features
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
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
      data.inStock,
      data.isNew ?? false,
      data.isRestocked ?? false,
      data.image,
      data.description,
      serializeFeatures(data.features),
    ]
  );
  return getProductByIdPg(id);
}

export async function updateProductPg(id: string, data: Partial<Product>) {
  await ensureDb();
  const current = await getProductByIdPg(id);
  if (!current) throw new Error("NOT_FOUND");

  const merged = { ...current, ...data };
  await query(
    `UPDATE products SET
      sku=$2, name=$3, slug=$4, brand=$5, category_id=$6,
      price_ex_vat=$7, price_inc_vat=$8, unit=$9, pack_size=$10, pack_unit=$11,
      in_stock=$12, is_new=$13, is_restocked=$14, image=$15, description=$16, features=$17
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
      merged.inStock,
      merged.isNew ?? false,
      merged.isRestocked ?? false,
      merged.image,
      merged.description,
      serializeFeatures(merged.features),
    ]
  );
  return getProductByIdPg(id);
}

export async function deleteProductPg(id: string) {
  await ensureDb();
  await query("DELETE FROM products WHERE id = $1", [id]);
}

export async function getAdminStatsPg(): Promise<AdminStats> {
  await ensureDb();
  const [products, orders, pending, users, revenue] = await Promise.all([
    queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM products"),
    queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM orders"),
    queryOne<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM orders WHERE status = 'pending'"
    ),
    queryOne<{ count: string }>("SELECT COUNT(*)::text AS count FROM users"),
    queryOne<{ total: string }>(
      "SELECT COALESCE(SUM(total_inc_vat),0)::text AS total FROM orders WHERE payment_status = 'paid'"
    ),
  ]);

  return {
    totalProducts: Number(products?.count || 0),
    totalOrders: Number(orders?.count || 0),
    pendingOrders: Number(pending?.count || 0),
    totalUsers: Number(users?.count || 0),
    totalRevenue: Number(revenue?.total || 0),
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
  await query("DELETE FROM categories WHERE id = $1", [id]);
}
