"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/marketing/store/CartContext";
import { cartLines, cartTotal, formatArs } from "@/lib/store-products";
import { createCheckoutOrder } from "@/server/checkout-actions";
import { ArrowLeft, ShieldCheck, Truck, Lock, CreditCard, Sparkles, Loader2 } from "lucide-react";
import { ProductCardPreview } from "@/components/marketing/store/ProductCardPreview";

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lines = cartLines(items);
  const subtotal = cartTotal(items);
  const shippingCost: number = 0; // Envío gratis en plan anual
  const total = subtotal + shippingCost;

  // Form state
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

      if (!res.ok) {
        throw new Error(res.error || "No se pudo generar la orden de pago.");
      }

      if (!res.checkoutUrl) {
        throw new Error("No se pudo obtener la URL de pago.");
      }

      // Vaciar carrito local y redirigir a Mercado Pago
      clearCart();
      window.location.href = res.checkoutUrl;
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al procesar el checkout.");
      setLoading(false);
    }
  };

  if (lines.length === 0) {
    return (
      <main className="min-h-screen bg-[#07060A] text-white flex flex-col justify-center items-center px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50">
            <Lock className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Tu carrito está vacío</h1>
          <p className="text-white/60 text-sm">
            Elegí tu modelo de Volt Card para iniciar tu compra y configurar tu perfil digital.
          </p>
          <div className="pt-4">
            <Link
              href="/#tarjetas"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#7000FF] hover:bg-[#8A2BE2] text-white font-medium text-sm transition-colors shadow-lg shadow-[#7000FF]/25"
            >
              <ArrowLeft className="w-4 h-4" />
              Explorar Volt Cards
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#07060A] text-white selection:bg-[#7000FF] selection:text-white pb-20">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-[#07060A]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <ArrowLeft className="w-4 h-4 text-white/60 group-hover:text-white transition-colors" />
            <span className="text-xs uppercase tracking-widest text-white/60 group-hover:text-white transition-colors font-mono">
              Volver a la tienda
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-white/60 tracking-wider">CHECKOUT SEGURO</span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Formulario Principal (7 cols) */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Datos Personales */}
              <section className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[#7000FF]/20 text-[#A855F7] flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Datos personales</h2>
                    <p className="text-xs text-white/50">
                      Con este email crearemos o vincularemos tu cuenta Volt.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Nombre *</label>
                    <input
                      required
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Ej. Ignacio"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7000FF] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Apellido *</label>
                    <input
                      required
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Ej. López"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7000FF] transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Email *</label>
                    <input
                      required
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu@email.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7000FF] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Teléfono / WhatsApp *</label>
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+54 9 11 ..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7000FF] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">DNI / CUIL</label>
                    <input
                      type="text"
                      name="dni"
                      value={formData.dni}
                      onChange={handleChange}
                      placeholder="Para factura y logística"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7000FF] transition-colors"
                    />
                  </div>
                </div>
              </section>

              {/* Dirección de Envío */}
              <section className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-[#7000FF]/20 text-[#A855F7] flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">Dirección de entrega</h2>
                    <p className="text-xs text-white/50">¿Dónde querés recibir tu Volt Card física?</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Calle / Avenida *</label>
                    <input
                      required
                      type="text"
                      name="street"
                      value={formData.street}
                      onChange={handleChange}
                      placeholder="Ej. Av. del Libertador"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7000FF] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Altura / Número *</label>
                    <input
                      required
                      type="text"
                      name="number"
                      value={formData.number}
                      onChange={handleChange}
                      placeholder="Ej. 1240"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7000FF] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Piso / Depto</label>
                    <input
                      type="text"
                      name="apartment"
                      value={formData.apartment}
                      onChange={handleChange}
                      placeholder="Ej. 4 B"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7000FF] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Ciudad / Localidad *</label>
                    <input
                      required
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Ej. Vicente López"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7000FF] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Código Postal *</label>
                    <input
                      required
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleChange}
                      placeholder="Ej. 1638"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7000FF] transition-colors"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Provincia *</label>
                    <select
                      name="province"
                      value={formData.province}
                      onChange={handleChange}
                      className="w-full bg-[#110F18] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#7000FF] transition-colors"
                    >
                      <option value="Ciudad Autónoma de Buenos Aires">Ciudad Autónoma de Buenos Aires (CABA)</option>
                      <option value="Buenos Aires">Buenos Aires</option>
                      <option value="Córdoba">Córdoba</option>
                      <option value="Santa Fe">Santa Fe</option>
                      <option value="Mendoza">Mendoza</option>
                      <option value="Entre Ríos">Entre Ríos</option>
                      <option value="Tucumán">Tucumán</option>
                      <option value="Salta">Salta</option>
                      <option value="Neuquén">Neuquén</option>
                      <option value="Río Negro">Río Negro</option>
                      <option value="Otra provincia">Otra provincia</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="block text-xs font-medium text-white/70 mb-1.5">Aclaraciones para entrega (opcional)</label>
                    <textarea
                      rows={2}
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Timbre, horario de recepción o indicaciones..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#7000FF] transition-colors resize-none"
                    />
                  </div>
                </div>
              </section>

              {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                  {error}
                </div>
              )}

              {/* Botón CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#7000FF] via-[#8A2BE2] to-[#A855F7] hover:opacity-95 text-white font-semibold text-base transition-all duration-300 shadow-xl shadow-[#7000FF]/25 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Conectando con Mercado Pago...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Pagar con Mercado Pago · ${total.toLocaleString("es-AR")} ARS</span>
                  </>
                )}
              </button>

              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-white/40 pt-2 font-mono">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Pago 100% Encriptado</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#A855F7]" />
                  <span>Envíos a todo el país</span>
                </div>
              </div>
            </form>
          </div>

          {/* Resumen del Pedido (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 sticky top-24 backdrop-blur-sm">
              <h2 className="text-base font-semibold text-white mb-4 pb-3 border-b border-white/10 flex items-center justify-between">
                <span>Resumen de compra</span>
                <span className="text-xs text-white/50 font-normal">
                  {items.reduce((acc, i) => acc + i.quantity, 0)} {items.length === 1 ? "unidad" : "unidades"}
                </span>
              </h2>

              {/* Items */}
              <div className="space-y-4 mb-6 divide-y divide-white/5">
                {lines.map((item) => (
                  <div key={item.productId} className="pt-4 first:pt-0 flex gap-3.5 items-center">
                    <div className="relative w-16 h-12 rounded-lg bg-black/40 border border-white/10 overflow-hidden shrink-0 grid place-items-center">
                      <div className="scale-[0.35]">
                        <ProductCardPreview variant={item.product.variant} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{item.product.name}</h4>
                      <p className="text-xs text-white/50">{item.product.tagline}</p>
                      <p className="text-xs font-mono text-white/60 mt-1">
                        {item.quantity} × ${item.annualEach.toLocaleString("es-AR")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold font-mono text-white">
                        ${item.lineTotal.toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totales */}
              <div className="space-y-2.5 pt-4 border-t border-white/10 text-sm">
                <div className="flex justify-between text-white/60">
                  <span>Subtotal</span>
                  <span className="font-mono">${subtotal.toLocaleString("es-AR")}</span>
                </div>
                <div className="flex justify-between text-white/60">
                  <span>Envío a domicilio</span>
                  <span className="font-mono text-emerald-400">
                    {shippingCost === 0 ? "GRATIS" : `$${shippingCost.toLocaleString("es-AR")}`}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span className="font-mono text-[#A855F7]">${total.toLocaleString("es-AR")} ARS</span>
                </div>
              </div>

              {/* Banner post-compra preview */}
              <div className="mt-6 p-4 rounded-xl bg-[#7000FF]/10 border border-[#7000FF]/20 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#A855F7] shrink-0 mt-0.5" />
                <div className="text-xs text-white/70 space-y-1">
                  <p className="font-semibold text-white">¿Qué pasa después del pago?</p>
                  <p>
                    El pago creará automáticamente tu Volt Profile y entrarás directo al Wizard para personalizar tu link, datos, foto y redes.
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
