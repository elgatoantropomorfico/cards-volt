"use client";

import * as React from "react";
import Link from "next/link";
import { Download, ExternalLink, Smartphone, Nfc, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CopyButton } from "../CopyButton";
import type { ProfileView } from "@/lib/profile-types";

export function CardSection({ profile, appBaseUrl }: { profile: ProfileView; appBaseUrl: string }) {
  const url = `${appBaseUrl}/${profile.slug}`;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>URL pública</CardTitle>
          <CardDescription>El destino al que apunta tu tarjeta NFC y tu QR.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant={profile.active ? "success" : "warning"}>{profile.active ? "Activa" : "Inactiva"}</Badge>
            <span className="font-mono text-xs text-muted-foreground">{profile.template.toLowerCase()}</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <code className="flex-1 truncate rounded-xl border bg-secondary px-3 py-2.5 font-mono text-sm">{url}</code>
            <CopyButton value={url} />
            <Link href={`/${profile.slug}`} target="_blank">
              <Button variant="outline"><ExternalLink className="h-4 w-4" /> Abrir</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><QrCode className="h-4 w-4" /> Código QR</CardTitle>
            <CardDescription>Descargá para imprimir o compartir.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid place-items-center rounded-2xl border bg-card p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/qr/${profile.slug}?format=png`} alt="QR" className="h-56 w-56" />
              <div className="mt-4 flex justify-center gap-2">
                <Link href={`/api/qr/${profile.slug}?format=png`}>
                  <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /> PNG</Button>
                </Link>
                <Link href={`/api/qr/${profile.slug}?format=svg`}>
                  <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /> SVG</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Nfc className="h-4 w-4" /> Tu tarjeta NFC</CardTitle>
            <CardDescription>Cómo funciona y qué dispositivos son compatibles.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground">
            <p>
              La tarjeta apunta a esta URL. Acercándola a un teléfono compatible, se abre tu perfil. <strong className="text-foreground">No guarda datos personales</strong>: todo se gestiona desde acá.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Feature icon={<Smartphone className="h-4 w-4" />} title="iPhone" desc="iOS 14+ — NFC nativo en pantalla bloqueada" />
              <Feature icon={<Smartphone className="h-4 w-4" />} title="Android" desc="Cualquier modelo con NFC habilitado" />
              <Feature icon={<QrCode className="h-4 w-4" />} title="QR" desc="Cualquier cámara o lector compatible" />
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
