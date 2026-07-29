import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getAddressesByUserPg,
  createAddressPg,
} from "@/lib/db/postgresDataService";

export async function GET() {
  try {
    const user = await requireAuth();
    const addresses = await getAddressesByUserPg(user.userId);
    return NextResponse.json({ success: true, data: addresses });
  } catch {
    return NextResponse.json(
      { success: false, message: "Giriş gerekli." },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    if (
      !body.fullName ||
      !body.phone ||
      !body.addressLine ||
      !body.city ||
      !body.district
    ) {
      return NextResponse.json(
        { success: false, message: "Adres bilgileri eksik." },
        { status: 400 }
      );
    }
    const address = await createAddressPg(user.userId, {
      label: body.label || "Adres",
      fullName: body.fullName,
      phone: body.phone,
      addressLine: body.addressLine,
      city: body.city,
      district: body.district,
      postalCode: body.postalCode,
      isDefault: Boolean(body.isDefault),
    });
    return NextResponse.json({ success: true, data: address });
  } catch (error) {
    console.error("Create address error:", error);
    return NextResponse.json(
      { success: false, message: "Adres eklenemedi." },
      { status: 500 }
    );
  }
}
