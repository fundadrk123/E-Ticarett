import { NextRequest, NextResponse } from "next/server";
import { updatePaymentStatusPg } from "@/lib/db/postgresDataService";
import { retrieveIyzicoPayment } from "@/lib/payment/iyzico";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const token = formData.get("token")?.toString();

    if (!token) {
      return NextResponse.redirect(
        new URL("/odeme/basarisiz", request.url)
      );
    }

    const result = await retrieveIyzicoPayment(token);

    if (result.paymentStatus === "SUCCESS" && result.conversationId) {
      await updatePaymentStatusPg(result.conversationId, "paid");
      return NextResponse.redirect(
        new URL(`/odeme/basarili?orderId=${result.conversationId}`, request.url)
      );
    }

    if (result.conversationId) {
      await updatePaymentStatusPg(result.conversationId, "failed");
    }

    return NextResponse.redirect(new URL("/odeme/basarisiz", request.url));
  } catch (error) {
    console.error("Payment callback POST error:", error);
    return NextResponse.redirect(new URL("/odeme/basarisiz", request.url));
  }
}
