"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Sparkles, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || searchParams.get("external_reference");

  const [status, setStatus] = useState<"checking" | "approved" | "pending" | "error">("checking");
  const [orderInfo, setOrderInfo] = useState<{
    orderNumber: string;
    profileId: string | null;
  } | null>(null);

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      return;
    }

    let intervalId: any;
    let attempts = 0;

    const checkOrderStatus = async () => {
      try {
        attempts++;
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();

        if (data.paymentStatus === "APPROVED") {
          setStatus("approved");
          setOrderInfo({
            orderNumber: data.orderNumber,
            profileId: data.profileId,
          });
          clearInterval(intervalId);
        } else if (attempts > 15) {
          // Si después de 30 segundos sigue en pending, dejamos la UI en pending amigable
          setStatus("pending");
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error(err);
      }
    };

    // Chequeo inicial
    checkOrderStatus();
    intervalId = setInterval(checkOrderStatus, 2500);

    return () => clearInterval(intervalId);
  }, [orderId]);

  return (
    <div className="max-w-xl w-full mx-auto p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-xl text-center space-y-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute -top-32 -left-32 w-64 h-64 bg-[#7000FF]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-[#A855F7]/15 rounded-full blur-3xl pointer-events-none" />

      {status === "checking" && (
        <div className="space-y-6 py-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#A855F7] animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Estamos confirmando tu pago...
            </h1>
            <p className="text-white/60 text-sm max-w-sm mx-auto">
              Aguardá unos segundos mientras procesamos la confirmación con Mercado Pago y preparamos tu perfil.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/50">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Sincronizando con webhook</span>
          </div>
        </div>
      )}

      {status === "approved" && (
        <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              PAGO APROBADO ✓
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white pt-2">
              Tu Volt Card ya está en marcha.
            </h1>
            <p className="text-white/70 text-sm">
              Pedido <span className="font-mono text-white font-semibold">{orderInfo?.orderNumber}</span>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#7000FF]/10 border border-[#7000FF]/30 text-left flex items-start gap-3.5">
            <Sparkles className="w-5 h-5 text-[#A855F7] shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-white">Falta un último paso:</p>
              <p className="text-white/70 text-xs leading-relaxed">
                Configurá el perfil digital que vamos a vincular a tu tarjeta física para que cuando alguien acerque tu Volt Card o escanee tu QR, vea exactamente lo que querés.
              </p>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href={`/onboarding/${orderId}`}
              className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#7000FF] via-[#8A2BE2] to-[#A855F7] hover:opacity-95 text-white font-bold text-base transition-all duration-300 shadow-xl shadow-[#7000FF]/30 flex items-center justify-center gap-3 group"
            >
              <span>CONFIGURAR MI VOLT CARD</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <p className="text-xs text-white/40">
            Podés guardar tu avance y continuar en cualquier momento desde tu cuenta.
          </p>
        </div>
      )}

      {status === "pending" && (
        <div className="space-y-6 py-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Pago en proceso de acreditación
            </h1>
            <p className="text-white/60 text-sm max-w-sm mx-auto">
              Mercado Pago está acreditando tu compra. Te notificaremos por email apenas impacte.
            </p>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/onboarding/${orderId}`}
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors"
            >
              Ir al Wizard preliminar
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-transparent border border-white/10 hover:bg-white/5 text-white/70 font-medium text-sm transition-colors"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="space-y-4 py-4">
          <h1 className="text-xl font-bold text-white">No pudimos encontrar la orden</h1>
          <p className="text-white/60 text-sm">
            Verificá el enlace o ponete en contacto con nuestro equipo de soporte.
          </p>
          <div className="pt-4">
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-[#7000FF] hover:bg-[#8A2BE2] text-white font-medium text-sm"
            >
              Volver a la tienda
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-[#07060A] text-white flex items-center justify-center px-4 py-16 selection:bg-[#7000FF] selection:text-white">
      <Suspense
        fallback={
          <div className="text-white/50 text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </main>
  );
}
