export type ShippingQuoteInput = {
  postalCode: string;
  itemsCount: number;
};

export type ShippingQuoteResult = {
  provider: string;
  method: string;
  cost: number;
  currency: string;
  estimatedDays?: number;
};

export interface ShippingProvider {
  quote(input: ShippingQuoteInput): Promise<ShippingQuoteResult>;
  createShipment(orderId: string): Promise<{ shipmentId: string; trackingNumber: string; trackingUrl: string }>;
}

export class MercadoEnviosAdapter implements ShippingProvider {
  async quote(input: ShippingQuoteInput): Promise<ShippingQuoteResult> {
    // Current Volt Cards standard policy: Free shipping on annual subscription!
    // Ready to plug real Mercado Envíos credentials & dimensions when configured.
    return {
      provider: "mercadoenvios",
      method: "Envío Estándar a Domicilio",
      cost: 0,
      currency: "ARS",
      estimatedDays: 3,
    };
  }

  async createShipment(orderId: string) {
    return {
      shipmentId: `ME-${orderId.slice(-6)}`,
      trackingNumber: `TRACK-${Math.floor(100000 + Math.random() * 900000)}`,
      trackingUrl: `https://www.mercadolibre.com.ar/envios`,
    };
  }
}

export const defaultShippingProvider = new MercadoEnviosAdapter();
