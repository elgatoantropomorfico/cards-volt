import Link from "next/link";
import { ensureProfile } from "@/server/profile-actions";
import { appUrl } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/dashboard/CopyButton";

export default async function CardPage() {
  const { profile } = await ensureProfile();
  const url = `${appUrl()}/${profile.slug}`;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Mi tarjeta</CardTitle>
          <CardDescription>Tu URL pública, código QR y estado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700">URL pública</span>
              <Badge variant={profile.active ? "success" : "warning"}>
                {profile.active ? "Activa" : "Inactiva"}
              </Badge>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <code className="flex-1 truncate rounded-md border bg-slate-50 px-3 py-2 text-sm">{url}</code>
              <CopyButton value={url} />
              <Link href={`/${profile.slug}`} target="_blank">
                <Button variant="outline"><ExternalLink className="h-4 w-4" /> Abrir</Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-6 text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/qr/${profile.slug}?format=png`} alt="QR" className="mx-auto h-56 w-56" />
              <div className="mt-4 flex justify-center gap-2">
                <Link href={`/api/qr/${profile.slug}?format=png`}>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4" /> PNG</Button>
                </Link>
                <Link href={`/api/qr/${profile.slug}?format=svg`}>
                  <Button variant="outline" size="sm"><Download className="h-4 w-4" /> SVG</Button>
                </Link>
              </div>
            </div>
            <div className="rounded-xl border bg-slate-50 p-6 text-sm leading-relaxed text-slate-600">
              <p className="font-medium text-slate-800">¿Cómo funciona la NFC?</p>
              <p className="mt-2">
                La tarjeta NFC física apunta a esta misma URL. Quien la acerque a su teléfono será dirigido a tu perfil público.
                Los datos NO se almacenan en la tarjeta: todo lo gestionás desde acá.
              </p>
              <p className="mt-4 font-medium text-slate-800">Compatible con</p>
              <ul className="mt-2 list-disc pl-5">
                <li>iPhone (iOS 14+, NFC nativo)</li>
                <li>Android con NFC</li>
                <li>Cualquier escáner QR</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
