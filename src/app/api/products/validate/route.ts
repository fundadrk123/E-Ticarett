import { NextRequest, NextResponse } from "next/server";
import { getProductByIdPg } from "@/lib/db/postgresDataService";

/** Sepetteki ürünlerin hâlâ DB'de olup olmadığını doğrular */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const ids: string[] = Array.isArray(body.ids) ? body.ids.map(String) : [];
    if (!ids.length) {
      return NextResponse.json({ success: true, data: { valid: [], invalid: [] } });
    }

    const valid = [];
    const invalid: string[] = [];

    for (const id of ids) {
      const product = await getProductByIdPg(id);
      if (product) valid.push(product);
      else invalid.push(id);
    }

    return NextResponse.json({ success: true, data: { valid, invalid } });
  } catch (error) {
    console.error("Products validate error:", error);
    return NextResponse.json(
      { success: false, message: "Doğrulama başarısız." },
      { status: 500 }
    );
  }
}
