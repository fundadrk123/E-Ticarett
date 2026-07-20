import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import type { User, UserRole } from "@/types";

const COOKIE_NAME = "mertem-token";

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return new TextEncoder().encode(secret);
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  [key: string]: unknown;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(payload: TokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as unknown as TokenPayload;
  } catch {
    return null;
  }
}

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getTokenFromCookies() {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function getCurrentUser(): Promise<(User & TokenPayload) | null> {
  const token = await getTokenFromCookies();
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;

  const { queryOne } = await import("@/lib/db/postgres");
  await import("@/lib/db/postgres").then((m) => m.initializeDatabase());

  const row = await queryOne<{
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: UserRole;
    created_at: Date;
  }>("SELECT id, email, name, phone, role, created_at FROM users WHERE id = $1", [
    payload.userId,
  ]);

  if (!row) return null;

  return {
    id: row.id,
    userId: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone || undefined,
    role: row.role,
    createdAt: row.created_at.toISOString(),
  };
}

export function sanitizeUser(user: {
  id: string;
  email: string;
  name: string;
  phone?: string | null;
  role: UserRole;
  created_at?: Date | string;
}): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone || undefined,
    role: user.role,
    createdAt:
      user.created_at instanceof Date
        ? user.created_at.toISOString()
        : String(user.created_at || new Date().toISOString()),
  };
}

export async function requireAuth(role?: UserRole) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (role && user.role !== role) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
