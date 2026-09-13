"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function cleanParam(value: string | null): string | null {
  if (!value || value === "null" || value === "undefined") return null;
  return value;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId =
    cleanParam(searchParams.get("orderId")) ||
    cleanParam(searchParams.get("external_reference"));
  const paymentId =
    cleanParam(searchParams.get("payment_id")) ||
    cleanParam(searchParams.get("collection_id")) ||
    cleanParam(searchParams.get("paymentId"));
  const mpStatus = cleanParam(searchParams.get("status")) || cleanParam(searchParams.get("collection_status"));

  const [status, setStatus] = useState<"checking" | "approved" | "pending" | "error">("checking");
  const [orderInfo, setOrderInfo] = useState<{
    orderNumber: string;
    profileId: string | null;
  } | null>(null);
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      return;
    }

    let intervalId: ReturnType<typeof setInterval> | undefined;
    let attempts = 0;
    let cancelled = false;

    const confirmAndCheck = async () => {
      try {
        attempts++;

        // Always try confirm (uses payment_id OR searches MP by external_reference)
        const confirmRes = await fetch(`/api/orders/${orderId}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, paymentId, mpStatus }),
          cache: "no-store",
        }).catch(() => null);

        if (confirmRes?.ok) {
          const confirmed = await confirmRes.json();
          if (cancelled) return;
          if (confirmed.paymentStatus === "APPROVED") {
            setStatus("approved");
            setOrderInfo({
              orderNumber: confirmed.orderNumber,
              profileId: confirmed.profileId,
            });
            if (intervalId) clearInterval(intervalId);
            setRedirectIn(3);
            return;
          }
        }

        const res = await fetch(`/api/orders/${orderId}/status`, { cache: "no-store" });
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();
        if (cancelled) return;

        if (data.paymentStatus === "APPROVED") {
          setStatus("approved");
          setOrderInfo({
            orderNumber: data.orderNumber,
            profileId: data.profileId,
          });
          if (intervalId) clearInterval(intervalId);
          setRedirectIn(3);
        } else if (attempts > 30) {
          setStatus("pending");
          if (intervalId) clearInterval(intervalId);
        }
      } catch (err) {
        console.error(err);
        if (attempts > 30) setStatus("pending");
      }
    };

    confirmAndCheck();
    intervalId = setInterval(confirmAndCheck, 2000);

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [orderId, paymentId, mpStatus]);

  useEffect(() => {
    if (redirectIn === null || !orderId) return;
    if (redirectIn <= 0) {
      router.push(`/onboarding/${orderId}`);
      return;
    }
    const t = setTimeout(() => setRedirectIn((n) => (n == null ? null : n - 1)), 1000);
    return () => clearTimeout(t);
  }, [redirectIn, orderId, router]);

  const onboardingPath = orderId ? `/onboarding/${orderId}` : null;
  const onboardingAbsolute =
    typeof window !== "undefined" && onboardingPath
      ? `${window.location.origin}${onboardingPath}`
      : onboardingPath;

  const copyLink = async () => {
    if (!onboardingAbsolute) return;
    await navigator.clipboard.writeText(onboardingAbsolute);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative max-w-xl w-full mx-auto rounded-3xl border bg-card p-8 shadow-soft text-center space-y-8 overflow-hidden">
      <div className="absolute -top-24 -left-24 w-56 h-56 bg-violet-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-56 h-56 bg-fuchsia-200/30 rounded-full blur-3xl pointer-events-none" />

      {status === "checking" && (
        <div className="relative space-y-6 py-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
              Estamos confirmando tu pago...
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Validamos con Mercado Pago y preparamos tu perfil. En unos segundos pasás al siguiente paso.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary border text-xs font-mono text-muted-foreground">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Sincronizando pago</span>
          </div>
        </div>
      )}

      {status === "approved" && (
        <div className="relative space-y-6 py-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-mono font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              PAGO APROBADO ✓
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-foreground pt-2">
              Tu Volt Card ya está en marcha.
            </h1>
            <p className="text-muted-foreground text-sm">
              Pedido{" "}
              <span className="font-mono text-foreground font-semibold">
                {orderInfo?.orderNumber}
              </span>
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-violet-50 border border-violet-100 text-left flex items-start gap-3.5">
            <Sparkles className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-semibold text-foreground">Siguiente paso: configurá tu perfil</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {redirectIn != null
                  ? `Te llevamos al wizard automáticamente en ${redirectIn}s…`
                  : "Configurá el perfil que vamos a vincular a tu tarjeta física."}
              </p>
            </div>
          </div>

          <Link
            href={onboardingPath || "/"}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-500 hover:opacity-95 text-white font-bold text-base transition-all shadow-lg shadow-violet-500/25 flex items-center justify-center gap-3 group"
          >
            <span>CONFIGURAR MI VOLT CARD</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      )}

      {status === "pending" && (
        <div className="relative space-y-6 py-4">
          <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Pago en proceso de acreditación
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto">
              Si ya te debitaron, guardá este link de configuración. También podés reintentar la confirmación.
            </p>
          </div>

          {onboardingPath && (
            <div className="p-4 rounded-xl bg-secondary/60 border text-left space-y-2">
              <p className="text-xs font-medium text-foreground">Link de configuración</p>
              <p className="text-[11px] font-mono text-muted-foreground break-all">{onboardingAbsolute}</p>
              <Button type="button" size="sm" variant="outline" onClick={copyLink} className="gap-1.5">
                <Copy className="h-3.5 w-3.5" />
                {copied ? "Copiado" : "Copiar link"}
              </Button>
            </div>
          )}

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Button type="button" variant="soft" onClick={() => window.location.reload()}>
              Reintentar confirmación
            </Button>
            {onboardingPath && (
              <Link href={onboardingPath}>
                <Button variant="gradient">Ir al wizard igual</Button>
              </Link>
            )}
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="relative space-y-4 py-4">
          <h1 className="font-display text-xl font-semibold">No pudimos encontrar la orden</h1>
          <p className="text-muted-foreground text-sm">
            Verificá el enlace o contactá soporte con tu comprobante de Mercado Pago.
          </p>
          <div className="pt-4">
            <Link href="/">
              <Button variant="gradient">Volver a la tienda</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <main className="relative min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-50" />
      <Suspense
        fallback={
          <div className="text-muted-foreground text-sm flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando...
          </div>
        }
      >
        <SuccessContent />
      </Suspense>
    </main>
  );
}
