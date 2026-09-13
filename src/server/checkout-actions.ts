"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/id";
import { createMercadoPagoPreference } from "./mercadopago";
import { ensureStoreCatalog } from "./store-catalog";
import { generateOrderAccessToken } from "./order-access";

const CheckoutSchema = z.object({
  customerName: z.string().min(2, "Nombre requerido"),
  customerLastName: z.string().min(2, "Apellido requerido"),
  email: z.string().email("Email inválido"),
  phone: z.string().min(6, "Teléfono requerido"),
  identificationNumber: z.string().optional(),
  addressStreet: z.string().min(2, "Calle requerida"),
  addressNumber: z.string().min(1, "Número requerido"),
  addressFloor: z.string().optional(),
  addressCity: z.string().min(2, "Ciudad requerida"),
  addressProvince: z.string().min(2, "Provincia requerida"),
  addressPostalCode: z.string().min(3, "Código postal requerido"),
  items: z.array(
    z.object({
      productId: z.enum(["white", "black"]),
      quantity: z.number().int().min(1).max(99),
    }),
  ).min(1, "El carrito no puede estar vacío"),
});

export type CreateOrderInput = z.infer<typeof CheckoutSchema>;

export type CreateOrderResult =
  | { ok: true; orderId: string; orderNumber: string; accessToken: string; checkoutUrl: string }
  | { ok: false; error: string };

export async function createCheckoutOrder(rawInput: CreateOrderInput): Promise<CreateOrderResult> {
  const parsed = CheckoutSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message || "Datos inválidos" };
  }

  await ensureStoreCatalog();
  const input = parsed.data;

  // 1. Fetch live products from DB — NEVER trust frontend prices
  const dbProducts = await prisma.product.findMany({
    where: {
      slug: { in: input.items.map((i) => i.productId) },
      active: true,
    },
    include: { variants: true },
  });

  if (dbProducts.length === 0) {
    return { ok: false, error: "Productos no disponibles" };
  }

  // 2. Validate availability and calculate totals
  let subtotal = 0;
  const orderItemsData = [];
  const preferenceItems = [];

  for (const item of input.items) {
    const product = dbProducts.find((p) => p.slug === item.productId);
    if (!product) {
      return { ok: false, error: `Producto ${item.productId} no encontrado` };
    }

    if (product.stockManaged && product.stockQuantity < item.quantity) {
      return { ok: false, error: `Stock insuficiente para ${product.name}` };
    }

    const unitPrice = Number(product.price);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    const variant = product.variants[0] || null;

    orderItemsData.push({
      productId: product.id,
      variantId: variant?.id ?? null,
      productNameSnapshot: product.name,
      skuSnapshot: variant?.sku || product.sku || null,
      quantity: item.quantity,
      unitPrice,
      subtotal: lineTotal,
    });

    preferenceItems.push({
      id: product.id,
      title: `${product.name} (Plan Anual)`,
      description: "Volt Card física NFC + QR + suscripción anual perfil digital",
      quantity: item.quantity,
      currency_id: "ARS",
      unit_price: unitPrice,
    });
  }

  const shippingTotal = 0; // Free promotion
  const discountTotal = 0;
  const total = subtotal + shippingTotal - discountTotal;

  // 3. Generate human order number
  let orderNumber = generateOrderNumber();
  while (await prisma.order.findUnique({ where: { orderNumber }, select: { id: true } })) {
    orderNumber = generateOrderNumber();
  }

  const fullName = `${input.customerName.trim()} ${input.customerLastName.trim()}`;
  const accessToken = generateOrderAccessToken();

  // 4. Create Order in preliminary PENDING state
  const order = await prisma.order.create({
    data: {
      orderNumber,
      accessToken,
      customerName: fullName,
      email: input.email.toLowerCase().trim(),
      phone: input.phone.trim(),
      identificationNumber: input.identificationNumber?.trim() || null,
      currency: "ARS",
      subtotal,
      shippingTotal,
      discountTotal,
      total,
      paymentStatus: "PENDING",
      fulfillmentStatus: "AWAITING_PROFILE",
      shippingStatus: "PENDING",
      source: "ecommerce",
      shippingAddress: {
        street: input.addressStreet.trim(),
        number: input.addressNumber.trim(),
        floor: input.addressFloor?.trim() || null,
        city: input.addressCity.trim(),
        province: input.addressProvince.trim(),
        postalCode: input.addressPostalCode.trim(),
        country: "Argentina",
      },
      items: {
        create: orderItemsData,
      },
      events: {
        create: [
          {
            type: "order.created",
            title: "Pedido creado",
            detail: `Iniciado por ${fullName} con total de ARS $${total.toLocaleString("es-AR")}`,
          },
        ],
      },
    },
  });

  // 5. Create Mercado Pago Preference
  try {
    const preference = await createMercadoPagoPreference({
      orderId: order.id,
      orderNumber: order.orderNumber,
      items: preferenceItems,
      payer: {
        name: input.customerName.trim(),
        surname: input.customerLastName.trim(),
        email: input.email.toLowerCase().trim(),
        phone: { number: input.phone.trim() },
        address: {
          street_name: input.addressStreet.trim(),
          street_number: parseInt(input.addressNumber) || undefined,
          zip_code: input.addressPostalCode.trim(),
        },
      },
    });

    return {
      ok: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
      accessToken,
      checkoutUrl: preference.init_point,
    };
  } catch (err: any) {
    console.error("Error creating Mercado Pago preference:", err);
    return { ok: false, error: err.message || "Error al conectar con Mercado Pago" };
  }
}
