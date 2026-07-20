import { NextResponse } from "next/server";
import { getProductBySlugPg } from "@/lib/db/postgresDataService";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, { params }: Props) {
  try {
    const { slug } = await params;
    const product = await getProductBySlugPg(slug);
    if (!product) {
      return NextResponse.json(
        { success: false, message: "Ürün bulunamadı." },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    console.error("Product API error:", error);
    return NextResponse.json(
      { success: false, message: "Ürün alınamadı." },
      { status: 500 }
    );
  }
}
