import { prisma } from "@/lib/prisma";
import { getActiveSalesMailbox, getResendClient, appBaseUrl } from "./resend-client";
import {
  buildPurchaseReceiptHtml,
  buildPurchaseReceiptText,
  mockPurchaseReceiptData,
  type PurchaseReceiptData,
} from "./purchase-receipt";

export async function sendPurchaseReceiptEmail(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
    },
  });

  if (!order) return { ok: false as const, error: "Orden no encontrada" };
  if (order.purchaseEmailSentAt) {
    return { ok: true as const, skipped: true as const };
  }

  const data: PurchaseReceiptData = {
    customerName: order.customerName,
    customerEmail: order.email,
    orderNumber: order.orderNumber,
    currency: order.currency,
    subtotal: Number(order.subtotal),
    shippingTotal: Number(order.shippingTotal),
    total: Number(order.total),
    items: order.items.map((it) => ({
      name: it.productNameSnapshot || it.product?.name || "Volt Card",
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      subtotal: Number(it.subtotal),
    })),
    onboardingUrl: `${appBaseUrl()}/onboarding/${order.id}`,
    paidAtLabel: (order.paidAt || new Date()).toLocaleString("es-AR", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  };

  const result = await dispatchPurchaseReceipt({
    to: order.email,
    data,
    subject: `Confirmación de compra ${order.orderNumber} · Volt Cards`,
  });

  if (!result.ok) return result;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      purchaseEmailSentAt: new Date(),
      events: {
        create: {
          type: "email.purchase_receipt",
          title: "Email de compra enviado",
          detail: `Recibo y link de onboarding enviados a ${order.email}`,
        },
      },
    },
  });

  return { ok: true as const, skipped: false as const };
}

export async function sendTestPurchaseReceiptEmail(toEmail: string) {
  const data = mockPurchaseReceiptData(toEmail);
  return dispatchPurchaseReceipt({
    to: toEmail,
    data,
    subject: `[PRUEBA] Confirmación de compra ${data.orderNumber} · Volt Cards`,
  });
}

async function dispatchPurchaseReceipt({
  to,
  data,
  subject,
}: {
  to: string;
  data: PurchaseReceiptData;
  subject: string;
}) {
  const resend = await getResendClient();
  if (!resend) {
    return {
      ok: false as const,
      error: "Falta la API key de Resend. Cargala en Superadmin → Correos.",
    };
  }

  const mailbox = await getActiveSalesMailbox();
  if (!mailbox.active) {
    return {
      ok: false as const,
      error: `El buzón ${mailbox.email} está inactivo.`,
    };
  }

  const from = `${mailbox.label} <${mailbox.email}>`;

  try {
    const { error } = await resend.emails.send({
      from,
      to: [to],
      subject,
      html: buildPurchaseReceiptHtml(data),
      text: buildPurchaseReceiptText(data),
    });

    if (error) {
      return { ok: false as const, error: error.message || "Error al enviar con Resend" };
    }

    return { ok: true as const };
  } catch (err: any) {
    return {
      ok: false as const,
      error: err?.message || "No se pudo conectar con Resend",
    };
  }
}
