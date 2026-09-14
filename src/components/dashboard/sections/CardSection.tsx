"use client";

import * as React from "react";
import Link from "next/link";
import { Download, ExternalLink, Smartphone, Nfc, QrCode, AlertTriangle, Unlink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "../CopyButton";
import { toast } from "@/components/ui/toaster";
import { getMyNfcCards, markMyCardLost, unlinkMyCard } from "@/server/profile-actions";
import type { NfcCardView, ProfileView } from "@/lib/profile-types";

const STATUS_LABEL: Record<NfcCardView["status"], string> = {
  UNASSIGNED: "Sin asignar",
  ACTIVE: "Activa",
  INACTIVE: "Inactiva",
  LOST: "Perdida",
};

const STATUS_VARIANT: Record<NfcCardView["status"], "success" | "warning" | "outline" | "secondary"> = {
  UNASSIGNED: "secondary",
  ACTIVE: "success",
  INACTIVE: "warning",
  LOST: "warning",
};

export function CardSection({
  profile,
  appBaseUrl,
  nfcCard: initialCard,
  nfcCards: initialCards,
  onCardChange,
}: {
  profile: ProfileView;
  appBaseUrl: string;
  nfcCard: NfcCardView | null;
  nfcCards?: NfcCardView[];
  onCardChange?: (card: NfcCardView | null) => void;
}) {
  const [nfcCards, setNfcCards] = React.useState<NfcCardView[]>(
    initialCards?.length ? initialCards : initialCard ? [initialCard] : [],
  );
  const [loadingCard, setLoadingCard] = React.useState(false);
  const [pending, setPending] = React.useState<string | null>(null);

  React.useEffect(() => {
    setNfcCards(initialCards?.length ? initialCards : initialCard ? [initialCard] : []);
  }, [initialCards, initialCard]);

  React.useEffect(() => {
    let cancelled = false;
    setLoadingCard(true);
    void getMyNfcCards().then((res) => {
      if (cancelled) return;
      setNfcCards(res.cards);
      onCardChange?.(res.cards[0] ?? null);
    }).finally(() => {
      if (!cancelled) setLoadingCard(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onMarkLost(cardId: string) {
    if (!confirm("¿Marcar esta tarjeta NFC como perdida?")) return;
    setPending(`lost:${cardId}`);
    const res = await markMyCardLost(cardId);
    setPending(null);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    setNfcCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, status: "LOST" } : c)));
    toast({ title: "Tarjeta marcada como perdida", variant: "success" });
  }

  async function onUnlink(cardId: string) {
    if (!confirm("¿Desvincular esta tarjeta NFC?")) return;
    setPending(`unlink:${cardId}`);
    const res = await unlinkMyCard(cardId);
    setPending(null);
    if (!res.ok) return toast({ title: "Error", description: res.error, variant: "error" });
    setNfcCards((prev) => prev.filter((c) => c.id !== cardId));
    onCardChange?.(null);
    toast({ title: "Tarjeta desvinculada", variant: "success" });
  }

  const humanUrl = `${appBaseUrl}/${profile.slug}`;
  const permanentUrl = profile.publicId ? `${appBaseUrl}/c/${profile.publicId}` : humanUrl;

  return (
    <div className="space-y-5 pb-24 sm:space-y-6 sm:pb-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Enlaces de tu perfil</CardTitle>
          <CardDescription>Tu enlace personalizado para compartir y la llave permanente de tu tarjeta física.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={profile.active ? "success" : "warning"}>{profile.active ? "Activa" : "Inactiva"}</Badge>
            <span className="font-mono text-xs text-muted-foreground">{profile.template.toLowerCase()}</span>
          </div>

          <div>
            <span className="text-xs font-medium text-muted-foreground">Enlace público (para compartir en redes)</span>
            <code className="mt-1 block w-full truncate rounded-xl border bg-secondary px-3 py-2 font-mono text-xs sm:text-sm">{humanUrl}</code>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <CopyButton value={humanUrl} className="w-full" />
              <Link href={`/${profile.slug}`} target="_blank" className="w-full">
                <Button variant="outline" className="w-full"><ExternalLink className="h-4 w-4" /> Abrir</Button>
              </Link>
            </div>
          </div>

          <div className="pt-2 border-t">
            <span className="text-xs font-medium text-muted-foreground">Enlace físico permanente (NFC y QR inmutables)</span>
            <code className="mt-1 block w-full truncate rounded-xl border bg-secondary/60 px-3 py-2 font-mono text-xs sm:text-sm text-violet-600 dark:text-violet-400">{permanentUrl}</code>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Esta URL nunca cambia aunque modifiques tu username en el futuro. Tu tarjeta física siempre funcionará.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Nfc className="h-4 w-4" /> Tarjetas físicas NFC
          </CardTitle>
          <CardDescription>
            {nfcCards.length > 1
              ? `Tenés ${nfcCards.length} tarjetas vinculadas a este perfil.`
              : nfcCards.length === 1
                ? "Tarjeta vinculada a tu perfil."
                : "Cuando te asignen una tarjeta física, aparecerá acá."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingCard && nfcCards.length === 0 ? (
            <div className="grid place-items-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : nfcCards.length > 0 ? (
            nfcCards.map((nfcCard) => (
              <div key={nfcCard.id} className="space-y-3 rounded-2xl border bg-secondary/40 p-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                    Código interno
                  </p>
                  <p className="font-display mt-1 break-all text-xl font-semibold tracking-tight">
                    {nfcCard.code}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge variant={STATUS_VARIANT[nfcCard.status]}>
                      {STATUS_LABEL[nfcCard.status]}
                    </Badge>
                    {nfcCard.assignedAt && (
                      <span className="text-xs text-muted-foreground">
                        Vinculada el {new Date(nfcCard.assignedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {nfcCard.status === "LOST" && (
                  <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <p>Marcada como perdida.</p>
                  </div>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    disabled={pending !== null || nfcCard.status === "LOST"}
                    onClick={() => onMarkLost(nfcCard.id)}
                    className="w-full"
                  >
                    {pending === `lost:${nfcCard.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    Marcar perdida
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={pending !== null}
                    onClick={() => onUnlink(nfcCard.id)}
                    className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    {pending === `unlink:${nfcCard.id}` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Unlink className="h-4 w-4" />
                    )}
                    Desvincular
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed bg-secondary/20 px-4 py-8 text-center text-sm text-muted-foreground">
              <Nfc className="mx-auto mb-2 h-8 w-8 opacity-40" />
              <p className="font-medium text-foreground">Sin tarjeta vinculada</p>
              <p className="mt-1">
                Pedile al administrador que te asigne una tarjeta NFC desde el panel.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2 lg:gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg"><QrCode className="h-4 w-4" /> Código QR</CardTitle>
            <CardDescription>Descargá para imprimir o compartir.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid place-items-center rounded-2xl border bg-card p-4 sm:p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/qr/${profile.slug}?format=png`} alt="QR" className="h-44 w-44 sm:h-56 sm:w-56" />
              <div className="mt-4 grid w-full grid-cols-2 gap-2">
                <Link href={`/api/qr/${profile.slug}?format=png`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full"><Download className="h-3.5 w-3.5" /> PNG</Button>
                </Link>
                <Link href={`/api/qr/${profile.slug}?format=svg`} className="w-full">
                  <Button variant="outline" size="sm" className="w-full"><Download className="h-3.5 w-3.5" /> SVG</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Compatibilidad</CardTitle>
            <CardDescription>Cómo funciona tu tarjeta digital.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
            <p>
              La tarjeta apunta a tu URL pública. Acercándola a un teléfono compatible, se abre tu perfil. <strong className="text-foreground">No guarda datos personales</strong>.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Feature icon={<Smartphone className="h-4 w-4" />} title="iPhone" desc="iOS 14+ — NFC nativo" />
              <Feature icon={<Smartphone className="h-4 w-4" />} title="Android" desc="Modelos con NFC habilitado" />
              <Feature icon={<QrCode className="h-4 w-4" />} title="QR" desc="Cualquier cámara compatible" />
              <Feature icon={<Nfc className="h-4 w-4" />} title="Sin app" desc="No requiere apps externas" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center gap-2 text-foreground">
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-secondary">{icon}</span>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <p className="mt-1.5 text-[12.5px] text-muted-foreground">{desc}</p>
    </div>
  );
}
