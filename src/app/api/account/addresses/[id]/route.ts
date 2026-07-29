import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  updateAddressPg,
  deleteAddressPg,
} from "@/lib/db/postgresDataService";

interface Props {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const address = await updateAddressPg(user.userId, id, body);
    return NextResponse.json({ success: true, data: address });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Adres bulunamadı." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Adres güncellenemedi." },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: Props) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    await deleteAddressPg(user.userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      return NextResponse.json(
        { success: false, message: "Adres bulunamadı." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { success: false, message: "Adres silinemedi." },
      { status: 500 }
    );
  }
}
