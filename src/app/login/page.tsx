"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import { Loader2, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { MarketingPhoneMock } from "@/components/marketing/MarketingPhoneMock";

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";
  const [loading, setLoading] = React.useState(false);
  const [showPw, setShowPw] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    setLoading(true);
    const res = await signIn.email({ email, password });
    if (res.error) {
      setLoading(false);
      toast({ title: "No se pudo iniciar sesión", description: res.error.message, variant: "error" });
      return;
    }
    let target = next;
    try {
      const me = await fetch("/api/me", { cache: "no-store" }).then((r) => r.json());
      if (next === "/dashboard" && me.role === "SUPERADMIN") target = "/admin";
    } catch {}
    setLoading(false);
    window.location.assign(target);
  }

  return (
    <div className="relative grid min-h-screen overflow-hidden lg:grid-cols-2">
      {/* Left: form */}
      <div className="relative z-10 flex min-h-screen flex-col bg-background p-6 sm:p-10">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al inicio
        </Link>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-foreground text-background shadow-soft">
                <span className="font-display text-base font-bold">V</span>
              </span>
              <span className="font-display text-base font-semibold tracking-tight">Volt Cards</span>
            </Link>
            <h1 className="font-display mt-7 text-3xl font-semibold tracking-tight">Bienvenido de vuelta</h1>
            <p className="mt-1.5 text-[14px] text-muted-foreground">Iniciá sesión para administrar tu tarjeta digital.</p>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required autoComplete="email" autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Input id="password" name="password" type={showPw ? "text" : "password"} required autoComplete="current-password" />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-secondary"
                    aria-label="Mostrar contraseña"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Ingresar
              </Button>
            </form>

            <p className="mt-6 text-center text-[12.5px] text-muted-foreground">
              ¿No tenés cuenta? Pedile acceso al administrador de Volt Cards.
            </p>
          </div>
        </div>

        <div className="text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Volt Cards
        </div>
      </div>

      {/* Right: live profile preview */}
      <div className="relative hidden overflow-hidden bg-[#070710] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_80%_10%,rgba(168,85,247,0.45)_0%,transparent_50%),radial-gradient(120%_80%_at_10%_80%,rgba(236,72,153,0.35)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 grid place-items-center p-12">
          <MarketingPhoneMock template="PREMIUM" />
        </div>
      </div>
    </div>
  );
}
