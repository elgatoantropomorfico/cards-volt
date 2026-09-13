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
    <main className="min-h-screen bg-[#07060A] text-white px-4 py-12 selection:bg-[#7000FF]">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-mono text-[#A855F7]">{orderNumber}</p>
          <h1 className="text-3xl font-extrabold tracking-tight">Asigná el resto de tus Volt Cards</h1>
          <p className="text-sm text-white/60 leading-relaxed">
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
                  className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold">Tarjeta #{seat.seatIndex + 1} · Principal</p>
                    <p className="text-xs text-white/50">
                      {seat.profile ? `/${seat.profile.slug}` : "Tu wizard"}
                    </p>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                </div>
              );
            }

            if (seat.status !== "PENDING_ASSIGNMENT") {
              const cred = credentials[seat.id];
              return (
                <div
                  key={seat.id}
                  className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      Tarjeta #{seat.seatIndex + 1} · Asignada
                    </p>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <p className="text-xs text-white/60">
                    {seat.assigneeName} · {seat.assigneeEmail} · /{seat.profile?.slug}
                  </p>
                  {cred && (
                    <div className="mt-2 p-3 rounded-xl bg-[#7000FF]/10 border border-[#7000FF]/30 text-xs font-mono space-y-1">
                      <p className="text-white/80">Credenciales temporales (guardalas ahora):</p>
                      <p>Email: {cred.email}</p>
                      <p>Pass: {cred.password}</p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[#A855F7] mt-1"
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
                className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3"
              >
                <p className="text-sm font-semibold flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-[#A855F7]" />
                  Tarjeta #{seat.seatIndex + 1} · Alta rápida
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    placeholder="Nombre"
                    value={f.name}
                    onChange={(e) =>
                      setForms((prev) => ({ ...prev, [seat.id]: { ...f, name: e.target.value } }))
                    }
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm"
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    value={f.email}
                    onChange={(e) =>
                      setForms((prev) => ({ ...prev, [seat.id]: { ...f, email: e.target.value } }))
                    }
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm"
                  />
                </div>
                <button
                  type="button"
                  disabled={loadingId === seat.id}
                  onClick={() => handleAssign(seat.id)}
                  className="w-full py-2.5 rounded-xl bg-[#7000FF] hover:bg-[#8A2BE2] text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
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
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="pt-4 flex flex-col sm:flex-row gap-3">
          {allDone ? (
            <Link
              href="/dashboard"
              className="flex-1 py-3 rounded-xl bg-[#7000FF] hover:bg-[#8A2BE2] text-center text-sm font-semibold flex items-center justify-center gap-2"
            >
              Ir a mi panel <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Link
              href="/dashboard"
              className="flex-1 py-3 rounded-xl border border-white/10 hover:bg-white/5 text-center text-sm text-white/70"
            >
              Guardar y asignar más tarde
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
