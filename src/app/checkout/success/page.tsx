"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
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

function readStoredAccessToken(orderId: string): string | null {
  try {
    return sessionStorage.getItem(`volt_order_access:${orderId}`);
  } catch {
    return null;
  }
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [redirectIn, setRedirectIn] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      return;
    }

    const stored = readStoredAccessToken(orderId);
    if (stored) setAccessToken(stored);

    let intervalId: ReturnType<typeof setInterval> | undefined;
    let attempts = 0;
    let cancelled = false;

    const confirmAndCheck = async () => {
      try {
        attempts++;
        const token = stored || readStoredAccessToken(orderId);

        const confirmRes = await fetch(`/api/orders/${orderId}/confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, paymentId, mpStatus, accessToken: token }),
          cache: "no-store",
        }).catch(() => null);

        if (confirmRes?.ok) {
          const confirmed = await confirmRes.json();
          if (cancelled) return;
          if (confirmed.accessToken) {
            setAccessToken(confirmed.accessToken);
            try {
              sessionStorage.setItem(`volt_order_access:${orderId}`, confirmed.accessToken);
            } catch {
              /* ignore */
            }
          }
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

        const statusUrl = new URL(`/api/orders/${orderId}/status`, window.location.origin);
        if (token) statusUrl.searchParams.set("t", token);
        const res = await fetch(statusUrl.toString(), { cache: "no-store" });
        if (!res.ok) throw new Error("Order not found");
        const data = await res.json();
        if (cancelled) return;

        if (data.accessToken) {
          setAccessToken(data.accessToken);
          try {
            sessionStorage.setItem(`volt_order_access:${orderId}`, data.accessToken);
          } catch {
            /* ignore */
          }
        }

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

  const onboardingPath =
    orderId && accessToken
      ? `/onboarding/${orderId}?t=${encodeURIComponent(accessToken)}`
      : orderId
        ? `/onboarding/${orderId}`
        : null;

  useEffect(() => {
    if (redirectIn === null || !onboardingPath) return;
    if (redirectIn <= 0) {
      router.push(onboardingPath);
      return;
    }
    const t = setTimeout(() => setRedirectIn((n) => (n == null ? null : n - 1)), 1000);
    return () => clearTimeout(t);
  }, [redirectIn, onboardingPath, router]);

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
    <main className="relative min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-16">
      <div className="pointer-events-none absolute inset-0 bg-gradient-mesh opacity-50" />
      <div className="relative max-w-xl w-full mx-auto rounded-3xl border bg-card p-8 shadow-soft text-center space-y-8 overflow-hidden">
        {status === "checking" && (
          <>
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-violet-600" />
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-semibold">Confirmando tu pago…</h1>
              <p className="text-sm text-muted-foreground">
                Estamos verificando la acreditación con Mercado Pago.
              </p>
            </div>
          </>
        )}

        {status === "approved" && (
          <>
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-semibold">¡Pago confirmado!</h1>
              <p className="text-sm text-muted-foreground">
                Pedido <span className="font-mono text-foreground">{orderInfo?.orderNumber}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Te redirigimos al wizard para crear tu contraseña y configurar tu perfil
                {redirectIn != null ? ` en ${redirectIn}s` : ""}.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {onboardingPath && (
                <Link href={onboardingPath} className="flex-1">
                  <Button className="w-full gap-2" variant="default">
                    Configurar mi perfil <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
              <Button type="button" variant="outline" className="gap-2" onClick={copyLink}>
                <Copy className="w-4 h-4" />
                {copied ? "Copiado" : "Copiar link"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Guardá el link del email: es tu acceso seguro al wizard.
            </p>
          </>
        )}

        {status === "pending" && (
          <>
            <RefreshCw className="w-10 h-10 mx-auto text-amber-500" />
            <div className="space-y-2">
              <h1 className="font-display text-2xl font-semibold">Pago en proceso</h1>
              <p className="text-sm text-muted-foreground">
                Todavía no vemos la acreditación. Si ya pagaste, esperá unos minutos y revisá el
                email de confirmación con el link del wizard.
              </p>
            </div>
            <Button type="button" variant="outline" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="font-display text-2xl font-semibold">No encontramos el pedido</h1>
            <p className="text-sm text-muted-foreground">
              Volvé al checkout o usá el link del email de compra.
            </p>
            <Link href="/checkout">
              <Button variant="outline">Ir al checkout</Button>
            </Link>
          </>
        )}
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen grid place-items-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
