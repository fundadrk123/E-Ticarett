import nodemailer from "nodemailer";
import type { Order } from "@/types";

function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function getTransporter() {
  if (!isSmtpConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });
}

async function sendMail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const from = process.env.SMTP_FROM || "noreply@mertemgrup.com";
  const transporter = getTransporter();

  if (!transporter) {
    console.info("[email:dev]", {
      to: options.to,
      subject: options.subject,
      text: options.text || options.html.replace(/<[^>]+>/g, " ").slice(0, 500),
    });
    return { queued: false, logged: true };
  }

  await transporter.sendMail({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
  return { queued: true, logged: false };
}

function formatTry(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(n);
}

function orderItemsHtml(order: Order) {
  const rows = (order.items || [])
    .map(
      (i) =>
        `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #e2e8f0">${i.productName} ×${i.quantity}</td>
          <td style="padding:6px 0;border-bottom:1px solid #e2e8f0;text-align:right">${formatTry(i.unitPriceIncVat * i.quantity)}</td>
        </tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse">${rows}</table>`;
}

export async function sendOrderConfirmationEmail(order: Order) {
  const bankIban = process.env.BANK_IBAN || "";
  const bankName = process.env.BANK_ACCOUNT_NAME || "Mertem Grup";
  const isTransfer = order.paymentMethod === "bank_transfer";

  const transferBlock =
    isTransfer && bankIban
      ? `<p style="margin-top:16px;padding:12px;background:#f8fafc;border-radius:8px">
          <strong>Havale / EFT bilgileri</strong><br/>
          Hesap adı: ${bankName}<br/>
          IBAN: ${bankIban}<br/>
          Açıklama: <strong>${order.orderNumber}</strong>
        </p>`
      : isTransfer
        ? `<p style="margin-top:16px">Havale bilgileri için lütfen bizimle iletişime geçin. Sipariş no: <strong>${order.orderNumber}</strong></p>`
        : "";

  const discountLine =
    order.discountAmount > 0
      ? `<p>İndirim: −${formatTry(order.discountAmount)}${order.couponCode ? ` (${order.couponCode})` : ""}</p>`
      : "";

  await sendMail({
    to: order.email,
    subject: `Siparişiniz alındı — ${order.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
        <h2>Siparişiniz alındı</h2>
        <p>Merhaba ${order.customerName},</p>
        <p>Sipariş numaranız: <strong>${order.orderNumber}</strong></p>
        ${orderItemsHtml(order)}
        ${discountLine}
        <p style="margin-top:12px"><strong>Toplam: ${formatTry(order.totalIncVat)}</strong> (KDV dahil)</p>
        ${transferBlock}
        <p style="color:#64748b;font-size:13px;margin-top:24px">Mertem Grup</p>
      </div>
    `,
  });
}

export async function sendShippingUpdateEmail(order: Order) {
  if (!order.trackingNumber && !order.cargoCompany) return;
  await sendMail({
    to: order.email,
    subject: `Siparişiniz kargoya verildi — ${order.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
        <h2>Kargo bilgisi</h2>
        <p>Merhaba ${order.customerName},</p>
        <p><strong>${order.orderNumber}</strong> numaralı siparişiniz kargoya verildi.</p>
        ${order.cargoCompany ? `<p>Kargo firması: <strong>${order.cargoCompany}</strong></p>` : ""}
        ${order.trackingNumber ? `<p>Takip no: <strong>${order.trackingNumber}</strong></p>` : ""}
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await sendMail({
    to: email,
    subject: "Şifre sıfırlama — Mertem Grup",
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
        <h2>Şifre sıfırlama</h2>
        <p>Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın (1 saat geçerlidir):</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color:#64748b;font-size:13px">Bu talebi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.</p>
      </div>
    `,
  });
}

export async function sendContactNotificationEmail(data: {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}) {
  const to =
    process.env.CONTACT_INBOX ||
    process.env.ADMIN_EMAIL ||
    process.env.SMTP_FROM ||
    "";
  if (!to) {
    console.info("[email:contact]", data);
    return;
  }
  await sendMail({
    to,
    subject: `İletişim formu: ${data.subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
        <h2>Yeni iletişim mesajı</h2>
        <p><strong>Ad:</strong> ${data.name}</p>
        <p><strong>E-posta:</strong> ${data.email}</p>
        ${data.phone ? `<p><strong>Telefon:</strong> ${data.phone}</p>` : ""}
        <p><strong>Konu:</strong> ${data.subject}</p>
        <p style="white-space:pre-wrap">${data.message}</p>
      </div>
    `,
  });
}

export async function sendRefundEmail(order: Order) {
  await sendMail({
    to: order.email,
    subject: `İade işlemi — ${order.orderNumber}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
        <h2>İade bilgilendirmesi</h2>
        <p>Merhaba ${order.customerName},</p>
        <p><strong>${order.orderNumber}</strong> numaralı siparişiniz için iade işlemi başlatıldı / tamamlandı.</p>
        <p>Tutar: ${formatTry(order.totalIncVat)}</p>
      </div>
    `,
  });
}
