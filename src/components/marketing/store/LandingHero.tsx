import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HeroCards3D } from "./HeroCards3D";
import { ArrowRight, Nfc, Sparkles } from "lucide-react";

export function LandingHero({
  compact = false,
  fill = false,
}: {
  compact?: boolean;
  fill?: boolean;
}) {
  return (
    <section
      className={cn(
        "container grid items-center md:grid-cols-2",
        fill && "h-full min-h-0 gap-10 py-6 lg:gap-16 lg:py-8",
        compact && !fill && "gap-4 pb-4 pt-3",
        !compact && !fill && "gap-6 pb-16 pt-6 md:gap-10 md:pb-24 md:pt-14",
      )}
    >
      <div className="order-2 md:order-1">
        <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-soft backdrop-blur">
          <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-white">
            <Nfc className="h-2.5 w-2.5" />
          </span>
          Tarjetas NFC + QR · Suscripción anual
        </div>

        <h1
          className={cn(
            "font-display text-balance font-semibold tracking-[-0.02em]",
            fill
              ? "mt-6 text-5xl leading-[1.05] lg:text-[3.6rem]"
              : compact
                ? "mt-3 text-[2rem] leading-tight sm:text-5xl"
                : "mt-5 text-4xl sm:text-5xl md:mt-6 md:text-[3.25rem] md:leading-[1.05]",
          )}
        >
          Tu tarjeta física.{" "}
          <span className="bg-[linear-gradient(120deg,#7c3aed,#ec4899,#f59e0b)] bg-clip-text text-transparent">
            Tu perfil digital.
          </span>
        </h1>

        <p
          className={cn(
            "max-w-lg text-pretty leading-relaxed text-muted-foreground",
            fill ? "mt-6 text-[17px]" : compact ? "mt-3 text-[16px]" : "mt-4 text-[16px] md:mt-5",
          )}
        >
          Blanca o negra, con NFC y QR integrados. Incluye Volt Cards Social Media: editá tu link-in-bio
          profesional desde el panel. Pagás anual, recibís la tarjeta y coordinamos por WhatsApp.
        </p>

        <div className={cn("flex flex-wrap gap-3", fill ? "mt-8" : compact ? "mt-4 md:mt-8" : "mt-6 md:mt-8")}>
          <a href="#tarjetas">
            <Button variant="gradient" size="lg" className="h-12 px-7">
              Ver tarjetas <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </div>

        <div
          className={cn(
            "flex flex-wrap gap-4 text-[12px] text-muted-foreground",
            fill ? "mt-8" : compact ? "mt-4 md:mt-8" : "mt-6 md:mt-8",
          )}
        >
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-600" />
            Desde $18.000/mes · plan anual
          </span>
          <span>NFC + QR incluidos</span>
          <span>Social Media incluido</span>
        </div>
      </div>

      <div
        className={cn(
          "order-1 flex items-center justify-center md:order-2",
          compact && !fill && "origin-top scale-[0.92]",
        )}
      >
        <HeroCards3D fill={fill} />
      </div>
    </section>
  );
}
