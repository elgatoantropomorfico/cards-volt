"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/marketing/store/CartContext";
import { ProductThumb } from "@/components/marketing/store/ProductThumb";
import { cartLines, cartTotal, formatArs } from "@/lib/store-products";
import { createCheckoutOrder } from "@/server/checkout-actions";
import { ArrowLeft, ShieldCheck, Truck, Lock, CreditCard, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-xl border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground shadow-soft focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition";

export default function CheckoutPage() {
  const { items, prices, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = cartLines(items, prices);
  const subtotal = cartTotal(items, prices);
  const shippingCost: number = 0;
  const total = subtotal + shippingCost;

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dni: "",
    street: "",
    number: "",
    apartment: "",
    city: "",
    province: "Buenos Aires",
    postalCode: "",
    notes: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      setError("Tu carrito está vacío.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createCheckoutOrder({
        customerName: formData.firstName.trim(),
        customerLastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        identificationNumber: formData.dni.trim() || undefined,
        addressStreet: formData.street.trim(),
        addressNumber: formData.number.trim(),
        addressFloor: formData.apartment.trim() || undefined,
        addressCity: formData.city.trim(),
        addressProvince: formData.province.trim(),
        addressPostalCode: formData.postalCode.trim(),
        items: lines.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
      });

      if (!res.ok) throw new Error(res.error || "No se pudo generar la orden de pago.");
      if (!res.checkoutUrl) throw new Error("No se pudo obtener la URL de pago.");

      try {
        sessionStorage.setItem(
          `volt_order_access:${res.orderId}`,
          res.accessToken,
        );
      } catch {
        /* ignore */
      }

      clearCart();
      window.location.href = res.checkoutUrl;
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al procesar el checkout.");
      setLoading(false);
    }
  };

  if (lines.length === 0) {
    return (
      <main className="min-h-screen bg-background text-foreground flex flex-col justify-center items-center px-4">
        <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-60" />
        <div className="relative max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-secondary border flex items-center justify-center text-muted-foreground">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Tu carrito está vacío</h1>
          <p className="text-muted-foreground text-sm">
            Elegí tu modelo de Volt Card para iniciar tu compra y configurar tu perfil digital.
          </p>
          <div className="pt-4">
            <Link href="/#tarjetas">
              <Button variant="gradient" className="rounded-full px-6">
                <ArrowLeft className="w-4 h-4" />
                Explorar Volt Cards
              </Button>
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground pb-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-50" />

      <header className="relative sticky top-0 z-30 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest font-mono">Volver a la tienda</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono text-muted-foreground tracking-wider">CHECKOUT SEGURO</span>
          </div>
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-4 pt-10">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight">Checkout</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Completá tus datos y pagá con Mercado Pago. Después configurás tu perfil en un wizard guiado.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-6">
              <section className="rounded-2xl border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold">Datos personales</h2>
                    <p className="text-xs text-muted-foreground">
                      Con este email crearemos o vincularemos tu cuenta Volt.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nombre *</label>
                    <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Ej. Ignacio" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Apellido *</label>
                    <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Ej. López" className={inputClass} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email *</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="tu@email.com" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Teléfono / WhatsApp *</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="+54 9 11 ..." className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">DNI / CUIL</label>
                    <input type="text" name="dni" value={formData.dni} onChange={handleChange} placeholder="Para factura y logística" className={inputClass} />
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold">Dirección de entrega</h2>
                    <p className="text-xs text-muted-foreground">¿Dónde querés recibir tu Volt Card física?</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Calle / Avenida *</label>
                    <input required type="text" name="street" value={formData.street} onChange={handleChange} placeholder="Ej. Av. del Libertador" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Altura / Número *</label>
                    <input required type="text" name="number" value={formData.number} onChange={handleChange} placeholder="Ej. 1240" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Piso / Depto</label>
                    <input type="text" name="apartment" value={formData.apartment} onChange={handleChange} placeholder="Ej. 4 B" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ciudad / Localidad *</label>
                    <input required type="text" name="city" value={formData.city} onChange={handleChange} placeholder="Ej. Vicente López" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Código Postal *</label>
                    <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} placeholder="Ej. 1638" className={inputClass} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Provincia *</label>
                    <select name="province" value={formData.province} onChange={handleChange} className={inputClass}>
                      <option value="Ciudad Autónoma de Buenos Aires">Ciudad Autónoma de Buenos Aires (CABA)</option>
                      <option value="Buenos Aires">Buenos Aires</option>
                      <option value="Catamarca">Catamarca</option>
                      <option value="Chaco">Chaco</option>
                      <option value="Chubut">Chubut</option>
                      <option value="Córdoba">Córdoba</option>
                      <option value="Corrientes">Corrientes</option>
                      <option value="Entre Ríos">Entre Ríos</option>
                      <option value="Formosa">Formosa</option>
                      <option value="Jujuy">Jujuy</option>
                      <option value="La Pampa">La Pampa</option>
                      <option value="La Rioja">La Rioja</option>
                      <option value="Mendoza">Mendoza</option>
                      <option value="Misiones">Misiones</option>
                      <option value="Neuquén">Neuquén</option>
                      <option value="Río Negro">Río Negro</option>
                      <option value="Salta">Salta</option>
                      <option value="San Juan">San Juan</option>
                      <option value="San Luis">San Luis</option>
                      <option value="Santa Cruz">Santa Cruz</option>
                      <option value="Santa Fe">Santa Fe</option>
                      <option value="Santiago del Estero">Santiago del Estero</option>
                      <option value="Tierra del Fuego">Tierra del Fuego</option>
                      <option value="Tucumán">Tucumán</option>
                    </select>
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Aclaraciones (opcional)</label>
                    <textarea rows={2} name="notes" value={formData.notes} onChange={handleChange} placeholder="Timbre, horario de recepción..." className={`${inputClass} resize-none`} />
                  </div>
                </div>
              </section>

              {error && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-500 hover:opacity-95 text-white font-semibold text-base transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Conectando con Mercado Pago...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pagar con Mercado Pago · {formatArs(total)}</span>
                  </>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground pt-1 font-mono">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Pago 100% encriptado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-violet-600" />
                  <span>Envíos a todo el país</span>
                </div>
              </div>
            </form>
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-2xl border bg-card p-6 shadow-soft sticky top-24">
              <h2 className="font-display text-base font-semibold mb-4 pb-3 border-b flex items-center justify-between">
                <span>Resumen de compra</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {items.reduce((acc, i) => acc + i.quantity, 0)}{" "}
                  {items.reduce((acc, i) => acc + i.quantity, 0) === 1 ? "unidad" : "unidades"}
                </span>
              </h2>

              <div className="space-y-4 mb-6 divide-y">
                {lines.map((item) => (
                  <div key={item.productId} className="pt-4 first:pt-0 flex gap-3.5 items-center">
                    <ProductThumb
                      variant={item.product.variant}
                      className="w-16 h-12 shrink-0 rounded-lg border"
                      priority
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{item.product.name}</h4>
                      <p className="text-xs text-muted-foreground">{item.product.tagline}</p>
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        {item.quantity} × {formatArs(item.annualEach)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold font-mono">{formatArs(item.lineTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2.5 pt-4 border-t text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatArs(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Envío a domicilio</span>
                  <span className="font-mono text-emerald-600 font-medium">
                    {shippingCost === 0 ? "GRATIS" : formatArs(shippingCost)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="font-mono text-violet-700">{formatArs(total)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-violet-50 border border-violet-100 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-semibold text-foreground">¿Qué pasa después del pago?</p>
                  <p>
                    Creamos tu perfil automáticamente y entrás al wizard para personalizar link, datos, foto y redes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
