"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toaster";
import { Loader2 } from "lucide-react";

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

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    const password = String(fd.get("password") || "");
    setLoading(true);
    const res = await signIn.email({ email, password });
    if (res.error) {
      setLoading(false);
      toast({ title: "No se pudo iniciar sesión", description: res.error.message, variant: "error" });
      return;
    }
    // Ask the server where we should land based on role
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
    <div className="relative grid min-h-screen place-items-center overflow-hidden bg-slate-50 p-4">
      <div className="pointer-events-none absolute inset-x-0 -top-40 -z-0 transform-gpu overflow-hidden blur-3xl">
        <div className="relative left-1/2 aspect-[1155/678] w-[60rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-300 via-fuchsia-300 to-amber-200 opacity-20" />
      </div>
      <Card className="relative z-10 w-full max-w-md border-slate-200 shadow-xl shadow-slate-900/5">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto grid h-10 w-10 place-items-center rounded-lg bg-slate-900 text-white shadow-sm">V</Link>
          <CardTitle className="mt-4 text-2xl font-semibold tracking-tight">Iniciar sesión</CardTitle>
          <CardDescription>Accedé a tu panel de Volt Cards</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" required autoComplete="current-password" />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingresar"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            ¿Sos superadmin?{" "}
            <Link className="font-medium text-slate-900 hover:underline" href="/">Volver al inicio</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
