"use client";

import React, { useState } from "react";
import Link from "next/link";
import { assignOrderSeat } from "@/server/seat-actions";
import { CheckCircle2, Loader2, UserPlus, ArrowRight, Copy } from "lucide-react";

type SeatRow = {
  id: string;
  seatIndex: number;
  status: string;
  productId: string;
  assigneeEmail: string | null;
  assigneeName: string | null;
  profile: { id: string; slug: string; fullName: string; profileStatus: string } | null;
};

export function SeatsAssignClient({
  orderId,
  orderNumber,
  seats: initialSeats,
}: {
  orderId: string;
  orderNumber: string;
  seats: SeatRow[];
}) {
  const [seats, setSeats] = useState(initialSeats);
  const pending = seats.filter((s) => s.status === "PENDING_ASSIGNMENT");
  const [forms, setForms] = useState<Record<string, { name: string; email: string }>>(() => {
    const init: Record<string, { name: string; email: string }> = {};
    for (const s of pending) init[s.id] = { name: "", email: "" };
    return init;
  });
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<
    Record<string, { email: string; password: string; slug: string }>
  >({});
  const [error, setError] = useState<string | null>(null);

  const handleAssign = async (seatId: string) => {
    const f = forms[seatId];
    if (!f?.name.trim() || !f?.email.trim()) {
      setError("Completá nombre y email.");
      return;
    }
    setLoadingId(seatId);
    setError(null);
    const res = await assignOrderSeat({
      orderId,
      seatId,
      name: f.name.trim(),
      email: f.email.trim(),
    });
    setLoadingId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setSeats((prev) =>
      prev.map((s) =>
        s.id === seatId
          ? {
              ...s,
              status: "ASSIGNED",
              assigneeEmail: res.email,
              assigneeName: f.name.trim(),
              profile: {
                id: res.profileId,
                slug: res.slug,
                fullName: f.name.trim(),
                profileStatus: "PENDING_CONFIGURATION",
              },
            }
          : s,
      ),
    );
    if (res.tempPassword) {
      setCredentials((prev) => ({
        ...prev,
        [seatId]: { email: res.email, password: res.tempPassword!, slug: res.slug },
      }));
    }
  };

  const allDone = seats.every((s) => s.status !== "PENDING_ASSIGNMENT");

  return (
    <main className="relative min-h-screen bg-background text-foreground px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-mono text-violet-600">{orderNumber}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Asigná el resto de tus Volt Cards</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ya configuraste tu tarjeta principal. Para las demás, solo necesitamos nombre + email:
            creamos la cuenta y el perfil vacío. Cada persona completa sus datos después, cuando quiera.
          </p>
        </div>

        <div className="space-y-4">
          {seats.map((seat) => {
            if (seat.status === "PRIMARY") {
              return (
                <div
                  key={seat.id}
                  className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold">Tarjeta #{seat.seatIndex + 1} · Principal</p>
                    <p className="text-xs text-muted-foreground">
                      {seat.profile ? `/${seat.profile.slug}` : "Tu wizard"}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              );
            }

            if (seat.status !== "PENDING_ASSIGNMENT") {
              const cred = credentials[seat.id];
              return (
                <div
                  key={seat.id}
                  className="p-4 rounded-2xl border bg-card space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      Tarjeta #{seat.seatIndex + 1} · Asignada
                    </p>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {seat.assigneeName} · {seat.assigneeEmail} · /{seat.profile?.slug}
                  </p>
                  {cred && (
                    <div className="mt-2 p-3 rounded-xl bg-violet-50 border border-violet-200 text-xs font-mono space-y-1">
                      <p className="text-muted-foreground">Credenciales temporales (guardalas ahora):</p>
                      <p>Email: {cred.email}</p>
                      <p>Pass: {cred.password}</p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-violet-600 mt-1"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            `Email: ${cred.email}\nPassword: ${cred.password}\nLogin: /login`,
                          )
                        }
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar
                      </button>
                    </div>
                  )}
                </div>
              );
            }

            const f = forms[seat.id] || { name: "", email: "" };
            return (
              <div
                key={seat.id}
                className="p-4 rounded-2xl border bg-card space-y-3"
              >
                <p className="text-sm font-semibold flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-violet-600" />
                  Tarjeta #{seat.seatIndex + 1} · Alta rápida
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Nombre"
                    value={f.name}
                    onChange={(e) =>
                      setForms((prev) => ({ ...prev, [seat.id]: { ...f, name: e.target.value } }))
                    }
                    className="rounded-xl border bg-background px-3 py-2.5 text-sm shadow-soft"
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    value={f.email}
                    onChange={(e) =>
                      setForms((prev) => ({ ...prev, [seat.id]: { ...f, email: e.target.value } }))
                    }
                    className="rounded-xl border bg-background px-3 py-2.5 text-sm shadow-soft"
                  />
                </div>
                <button
                  type="button"
                  disabled={loadingId === seat.id}
                  onClick={() => handleAssign(seat.id)}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loadingId === seat.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  Crear usuario y perfil
                </button>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
            {error}
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          {allDone ? (
            <Link
              href="/dashboard"
              className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-center text-sm font-semibold flex items-center justify-center gap-2"
            >
              Ir a mi panel <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="flex-1 py-3 rounded-xl border hover:bg-secondary text-center text-sm text-muted-foreground"
            >
              Guardar y asignar más tarde
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
