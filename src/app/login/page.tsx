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
      if (next === "/dashboard") {
        if (me.role === "SUPERADMIN") target = "/admin";
        else if (me.role === "COMPANY_ADMIN") target = "/company";
      }
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
              ¿No tenés cuenta? Pedile acceso a tu admin de empresa.
            </p>
          </div>
        </div>

        <div className="text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} Volt Cards
        </div>
      </div>

      {/* Right: gradient art */}
      <div className="relative hidden overflow-hidden bg-[#070710] lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_80%_10%,rgba(168,85,247,0.45)_0%,transparent_50%),radial-gradient(120%_80%_at_10%_80%,rgba(236,72,153,0.35)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 grid place-items-center p-12">
          <div className="phone-frame">
            <div className="phone-screen relative">
              <div className="phone-notch" />
              <div className="relative h-full w-full bg-[#070710] text-white">
                <div className="absolute inset-x-0 top-0 h-44 bg-[radial-gradient(120%_80%_at_50%_-10%,rgba(168,85,247,0.95)_0%,rgba(168,85,247,0.5)_35%,#070710_90%)]" />
                <div className="relative pt-12 text-center">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/70">Volt</p>
                  <h2 className="font-display mt-1 text-xl font-semibold">Tu tarjeta</h2>
                </div>
                <svg viewBox="0 0 1440 200" preserveAspectRatio="none" className="absolute inset-x-0 top-36 h-10 w-full text-[#070710]" aria-hidden>
                  <path d="M0,200 C320,80 1120,80 1440,200 L1440,200 L0,200 Z" fill="currentColor" />
                </svg>
                <div className="relative -mt-1 flex justify-center">
                  <div className="rounded-3xl bg-gradient-to-br from-fuchsia-500 to-purple-600 p-[2px]">
                    <div className="grid h-20 w-20 place-items-center rounded-[20px] bg-[#070710] ring-4 ring-[#070710] text-white font-display text-2xl">VC</div>
                  </div>
                </div>
                <div className="mt-4 space-y-2 px-6">
                  <div className="rounded-2xl bg-purple-500 py-2.5 text-center text-xs font-semibold">Guardar contacto</div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 py-2 text-center text-xs text-white">Instagram</div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 py-2 text-center text-xs text-white">LinkedIn</div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 py-2 text-center text-xs text-white">Web</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
