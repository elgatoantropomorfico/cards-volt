import { SUBSCRIPTION_INCLUDES } from "@/lib/store-products";
import { Globe, LayoutTemplate, Nfc, QrCode, Sparkles, Zap } from "lucide-react";

const HIGHLIGHTS = [
  { icon: Nfc, title: "NFC", desc: "Un toque en iPhone o Android. Sin apps." },
  { icon: QrCode, title: "QR", desc: "Impreso en la tarjeta para cualquier cámara." },
  { icon: LayoutTemplate, title: "Social Media", desc: "Perfil editable con plantillas premium." },
  { icon: Zap, title: "En vivo", desc: "Cambiá links y diseño sin reimprimir." },
];

export function IncludedSection() {
  return (
    <section className="scroll-mt-20">
      <div className="rounded-3xl border bg-card/70 p-8 backdrop-blur md:p-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> Todo incluido
            </div>
            <h2 className="font-display mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Hardware + software en una suscripción
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
              No pagás la tarjeta por un lado y la plataforma por otro. Cada plan anual incluye la tarjeta física
              con NFC y QR, más acceso completo a{" "}
              <strong className="font-medium text-foreground">Volt Cards Social Media</strong> — tu perfil público
              editable en cards.voltaiagents.com.
            </p>
            <ul className="mt-6 space-y-2.5">
              {SUBSCRIPTION_INCLUDES.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <Globe className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border bg-background/80 p-5 shadow-soft">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-soft">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-display mt-3 text-sm font-semibold">{title}</h3>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
