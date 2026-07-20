import crypto from "crypto";
import type { Order } from "@/types";

function getIyzicoConfig() {
  return {
    apiKey: process.env.IYZICO_API_KEY || "",
    secretKey: process.env.IYZICO_SECRET_KEY || "",
    baseUrl: process.env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com",
  };
}

export function isIyzicoConfigured() {
  const { apiKey, secretKey } = getIyzicoConfig();
  return Boolean(apiKey && secretKey);
}

function generateAuthorizationHeader(
  apiKey: string,
  secretKey: string,
  uri: string,
  body: string
) {
  const randomKey = Date.now().toString() + "123456789";
  const payload = randomKey + uri + body;
  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(payload)
    .digest("hex");
  const authorizationString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${signature}`;
  return `IYZWSv2 ${Buffer.from(authorizationString).toString("base64")}`;
}

export async function initializeIyzicoCheckout(order: Order, buyerIp: string) {
  const { apiKey, secretKey, baseUrl } = getIyzicoConfig();
  if (!apiKey || !secretKey) {
    throw new Error("IYZICO_NOT_CONFIGURED");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const uri = "/payment/iyzipos/checkoutform/initialize/auth/ecom";
  const requestBody = {
    locale: "tr",
    conversationId: order.id,
    price: order.totalIncVat.toFixed(2),
    paidPrice: order.totalIncVat.toFixed(2),
    currency: "TRY",
    basketId: order.orderNumber,
    paymentGroup: "PRODUCT",
    callbackUrl: `${siteUrl}/api/payment/callback`,
    enabledInstallments: [1, 2, 3, 6, 9],
    buyer: {
      id: order.userId || order.email,
      name: order.customerName.split(" ")[0] || order.customerName,
      surname: order.customerName.split(" ").slice(1).join(" ") || "-",
      gsmNumber: order.phone || "+905000000000",
      email: order.email,
      identityNumber: "11111111111",
      registrationAddress: order.shippingAddress.addressLine,
      ip: buyerIp,
      city: order.shippingAddress.city,
      country: "Turkey",
    },
    shippingAddress: {
      contactName: order.shippingAddress.fullName,
      city: order.shippingAddress.city,
      country: "Turkey",
      address: order.shippingAddress.addressLine,
    },
    billingAddress: {
      contactName: order.shippingAddress.fullName,
      city: order.shippingAddress.city,
      country: "Turkey",
      address: order.shippingAddress.addressLine,
    },
    basketItems: (order.items || []).map((item) => ({
      id: item.productId,
      name: item.productName,
      category1: "Hırdavat",
      itemType: "PHYSICAL",
      price: (item.unitPriceIncVat * item.quantity).toFixed(2),
    })),
  };

  const body = JSON.stringify(requestBody);
  const authorization = generateAuthorizationHeader(apiKey, secretKey, uri, body);

  const response = await fetch(`${baseUrl}${uri}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
      "x-iyzi-rnd": Date.now().toString(),
    },
    body,
  });

  const data = await response.json();
  if (data.status !== "success") {
    throw new Error(data.errorMessage || "IYZICO_INIT_FAILED");
  }

  return {
    token: data.token as string,
    checkoutFormContent: data.checkoutFormContent as string,
    paymentPageUrl: data.paymentPageUrl as string | undefined,
  };
}

export async function retrieveIyzicoPayment(token: string) {
  const { apiKey, secretKey, baseUrl } = getIyzicoConfig();
  const uri = "/payment/iyzipos/checkoutform/auth/ecom/detail";
  const body = JSON.stringify({ locale: "tr", token });
  const authorization = generateAuthorizationHeader(apiKey, secretKey, uri, body);

  const response = await fetch(`${baseUrl}${uri}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authorization,
      "x-iyzi-rnd": Date.now().toString(),
    },
    body,
  });

  return response.json();
}
