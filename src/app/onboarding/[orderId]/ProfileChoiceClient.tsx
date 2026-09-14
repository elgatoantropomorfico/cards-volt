"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Link2, Plus, CheckCircle2 } from "lucide-react";
import {
  associateOrderToExistingProfile,
  createNewProfileForOrder,
} from "@/server/profile-choice-actions";

type ProfileOpt = {
  id: string;
  slug: string;
  fullName: string;
  profileStatus: string;
};

export function ProfileChoiceClient({
  orderId,
  orderNumber,
  accessToken,
  profiles,
}: {
  orderId: string;
  orderNumber: string;
  accessToken: string;
  profiles: ProfileOpt[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(profiles[0]?.id || "");
  const [loading, setLoading] = useState<"associate" | "create" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [doneAssociate, setDoneAssociate] = useState(false);

  const associate = async () => {
    if (!selectedId) return;
    setLoading("associate");
    setError(null);
    const res = await associateOrderToExistingProfile({
      orderId,
      profileId: selectedId,
      accessToken,
    });
    setLoading(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setDoneAssociate(true);
  };

  const createNew = async () => {
    setLoading("create");
    setError(null);
    const res = await createNewProfileForOrder({ orderId, accessToken });
    setLoading(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  };

  if (doneAssociate) {
    return (
      <main className="relative min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full rounded-3xl border bg-card p-8 shadow-soft text-center space-y-5">
          <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
          <h1 className="font-display text-2xl font-semibold">Tarjeta asociada</h1>
          <p className="text-sm text-muted-foreground">
            Esta compra quedó vinculada a tu perfil existente. Podés seguir editándolo desde el panel.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-3"
          >
            Ir a mi panel
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full rounded-3xl border bg-card p-8 shadow-soft space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-mono text-violet-600">{orderNumber}</p>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Ya tenés una cuenta Volt
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Este correo ya tiene perfil(es). ¿Querés asociar esta tarjeta a uno existente, o configurar
            un perfil nuevo?
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Perfiles de tu cuenta
          </p>
          {profiles.map((p) => (
            <label
              key={p.id}
              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                selectedId === p.id
                  ? "border-violet-500 bg-violet-50 ring-2 ring-violet-500/20"
                  : "bg-secondary/30 hover:border-violet-300"
              }`}
            >
              <input
                type="radio"
                name="profile"
                checked={selectedId === p.id}
                onChange={() => setSelectedId(p.id)}
                className="accent-violet-600"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{p.fullName}</p>
                <p className="text-xs font-mono text-muted-foreground">/{p.slug}</p>
              </div>
            </label>
          ))}
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-3 pt-1">
          <button
            type="button"
            disabled={!selectedId || loading !== null}
            onClick={associate}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading === "associate" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            Asociar a este perfil
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={createNew}
            className="w-full py-3 rounded-xl border hover:bg-secondary text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading === "create" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Configurar un perfil nuevo
          </button>
        </div>
      </div>
    </main>
  );
}
