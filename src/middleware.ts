import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "mertem-token";

async function verifyAdmin(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return false;
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret)
    );
    return (payload as { role?: string }).role === "admin";
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const isAdmin = await verifyAdmin(request);
    if (!isAdmin) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { success: false, message: "Yetkisiz erişim." },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/giris?redirect=/admin", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
