import { appBaseUrl, brandLogoUrl } from "./resend-client";

export type PurchaseReceiptItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type PurchaseReceiptData = {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  currency: string;
  subtotal: number;
  shippingTotal: number;
  total: number;
  items: PurchaseReceiptItem[];
  onboardingUrl: string;
  paidAtLabel: string;
};

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: currency || "ARS",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount.toLocaleString("es-AR")} ${currency}`;
  }
}

export function buildPurchaseReceiptHtml(data: PurchaseReceiptData) {
  const logo = brandLogoUrl();
  const loginUrl = `${appBaseUrl()}/login`;
  const rows = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#111;">
          <strong>${escapeHtml(item.name)}</strong>
          <div style="color:#6b7280;font-size:12px;margin-top:2px;">Cantidad: ${item.quantity}</div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid #eee;font-size:14px;color:#111;text-align:right;white-space:nowrap;">
          ${money(item.subtotal, data.currency)}
        </td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Confirmación de compra · Volt Cards</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f7;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e8e8ee;">
          <tr>
            <td style="padding:28px 28px 12px;text-align:center;background:linear-gradient(180deg,#faf7ff 0%,#ffffff 100%);">
              <img src="${logo}" alt="Volt Cards" width="56" height="56" style="display:inline-block;border-radius:14px;" />
              <div style="margin-top:14px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#7c3aed;font-weight:700;">Volt Cards</div>
              <h1 style="margin:10px 0 0;font-size:24px;line-height:1.25;font-weight:700;color:#0f172a;">¡Gracias por tu compra!</h1>
              <p style="margin:10px 0 0;font-size:14px;line-height:1.5;color:#64748b;">
                Hola ${escapeHtml(data.customerName.split(" ")[0] || data.customerName)}, ya registramos tu pago.
                Guardá este correo: tiene tu recibo y el acceso para configurar tu perfil.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 28px 0;">
              <table role="presentation" width="100%" style="background:#f8f5ff;border:1px solid #ede9fe;border-radius:16px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#7c3aed;font-weight:700;">Pedido</div>
                    <div style="margin-top:6px;font-size:18px;font-weight:700;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${escapeHtml(data.orderNumber)}</div>
                    <div style="margin-top:4px;font-size:12px;color:#64748b;">Pagado · ${escapeHtml(data.paidAtLabel)}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:22px 28px 8px;">
              <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:8px;">Recibo</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                ${rows}
                <tr>
                  <td style="padding:10px 0 4px;font-size:13px;color:#64748b;">Subtotal</td>
                  <td style="padding:10px 0 4px;font-size:13px;color:#111;text-align:right;">${money(data.subtotal, data.currency)}</td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#64748b;">Envío</td>
                  <td style="padding:4px 0;font-size:13px;color:#111;text-align:right;">${money(data.shippingTotal, data.currency)}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#0f172a;border-top:1px solid #eee;">Total</td>
                  <td style="padding:12px 0 0;font-size:15px;font-weight:700;color:#0f172a;text-align:right;border-top:1px solid #eee;">${money(data.total, data.currency)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 28px;">
              <div style="background:#0f172a;border-radius:16px;padding:20px 18px;color:#fff;">
                <div style="font-size:15px;font-weight:700;">Configurá tu Volt Card</div>
                <p style="margin:8px 0 16px;font-size:13px;line-height:1.55;color:#cbd5e1;">
                  Entrá al wizard con este enlace seguro. Ahí vas a crear tu contraseña (paso 1) y completar tu perfil digital.
                  Si cerrás la web, podés volver cuando quieras con este mismo link o iniciando sesión en
                  <span style="color:#ddd6fe;">${escapeHtml(data.customerEmail)}</span>.
                </p>
                <a href="${escapeHtml(data.onboardingUrl)}"
                   style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:12px;">
                  Configurar mi perfil →
                </a>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:0 28px 24px;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
                Tip: agregá este correo a favoritos. También podés entrar después a
                <a href="${loginUrl}" style="color:#7c3aed;text-decoration:none;">${loginUrl.replace(/^https?:\/\//, "")}</a>
                con el email de compra y la contraseña que crees en el wizard.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:18px 28px 24px;border-top:1px solid #eee;text-align:center;">
              <div style="font-size:11px;color:#94a3b8;">Volt Cards · cards.voltaiagents.com</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:4px;">Este mensaje es un comprobante automático de tu compra.</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildPurchaseReceiptText(data: PurchaseReceiptData) {
  const lines = [
    `Volt Cards — Confirmación de compra`,
    ``,
    `Hola ${data.customerName},`,
    `Tu pago fue confirmado. Pedido: ${data.orderNumber}`,
    `Total: ${money(data.total, data.currency)}`,
    ``,
    `Configurá tu perfil aquí:`,
    data.onboardingUrl,
    ``,
    `En el wizard vas a crear tu contraseña y completar tu tarjeta digital.`,
    `Login futuro: ${appBaseUrl()}/login con ${data.customerEmail}`,
  ];
  return lines.join("\n");
}

export function mockPurchaseReceiptData(toEmail: string): PurchaseReceiptData {
  return {
    customerName: "Ana Pérez",
    customerEmail: toEmail,
    orderNumber: "VC-TEST-0001",
    currency: "ARS",
    subtotal: 89900,
    shippingTotal: 0,
    total: 89900,
    items: [
      {
        name: "Volt Card Classic (demo)",
        quantity: 1,
        unitPrice: 89900,
        subtotal: 89900,
      },
    ],
    onboardingUrl: `${appBaseUrl()}/onboarding/demo-order`,
    paidAtLabel: new Date().toLocaleString("es-AR", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
