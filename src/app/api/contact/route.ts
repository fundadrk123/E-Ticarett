import { NextRequest, NextResponse } from "next/server";
import {
  createContactMessagePg,
} from "@/lib/db/postgresDataService";
import { sendContactNotificationEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.email || !body.subject || !body.message) {
      return NextResponse.json(
        { success: false, message: "Lütfen tüm zorunlu alanları doldurun." },
        { status: 400 }
      );
    }

    const msg = await createContactMessagePg({
      name: String(body.name).trim(),
      email: String(body.email).trim(),
      phone: body.phone ? String(body.phone).trim() : undefined,
      subject: String(body.subject).trim(),
      message: String(body.message).trim(),
    });

    await sendContactNotificationEmail({
      name: msg.name,
      email: msg.email,
      phone: msg.phone,
      subject: msg.subject,
      message: msg.message,
    }).catch((err) => console.error("Contact email error:", err));

    return NextResponse.json({ success: true, data: { id: msg.id } });
  } catch (error) {
    console.error("Contact POST error:", error);
    return NextResponse.json(
      { success: false, message: "Mesaj gönderilemedi." },
      { status: 500 }
    );
  }
}
