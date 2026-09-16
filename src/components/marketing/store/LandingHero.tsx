"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, ChevronDown, Nfc, Sparkles, Store } from "lucide-react";
import {
  DESKTOP_VIEWPORT_FIT,
  HeroProductScene,
  MOBILE_VIEWPORT_FIT,
  type SceneViewportFit,
} from "./cards3d/cinematic/HeroProductScene";
import { HeroBeatTypography } from "./cards3d/cinematic/HeroMotionText";
import { sampleProductSequence, type SequenceViewOpts } from "./cards3d/cinematic/useProductSequence";
import { useScrollProgress } from "./cards3d/cinematic/useScrollProgress";
import { useLandingBoot } from "./LandingBoot";
import { HeroCards3D } from "./HeroCards3D";

function viewOptsFromFit(fit: SceneViewportFit): SequenceViewOpts {
  return {
    orbitElevMul: fit.orbitElevMul,
    orbitRadiusMul: fit.orbitRadiusMul,
    orbitTipMul: fit.orbitTipMul,
    dollyZMul: fit.dollyZMul,
    isMobile: fit.isMobile,
  };
}

export function LandingHero({ fill = true }: { fill?: boolean }) {
  void fill;
  const boot = useLandingBoot();
  const trackRef = React.useRef<HTMLElement>(null);
  const progressTargetRef = React.useRef(0);
  const progressSmoothRef = React.useRef(0);
  const sampleRef = React.useRef(sampleProductSequence(0));
  const layoutBiasRef = React.useRef({ x: 0, y: 0 });
  const viewportFitRef = React.useRef<SceneViewportFit>(DESKTOP_VIEWPORT_FIT);
  const introLockedRef = React.useRef(false);
  const pendingStoreScrollRef = React.useRef(false);
  const signaled = React.useRef(false);

  const [mountScene, setMountScene] = React.useState(false);
  const [ready, setReady] = React.useState(false);
  const [introLocked, setIntroLocked] = React.useState(false);
  const [hintOpacity, setHintOpacity] = React.useState(1);
  const [skipVisible, setSkipVisible] = React.useState(true);
  const [contentOpacity, setContentOpacity] = React.useState(0);
  const [oppLeft, setOppLeft] = React.useState(0);
  const [oppRight, setOppRight] = React.useState(0);
  const [oppLeftSweep, setOppLeftSweep] = React.useState(0);
  const [oppRightSweep, setOppRightSweep] = React.useState(0);
  const [connectLeft, setConnectLeft] = React.useState(0);
  const [connectRight, setConnectRight] = React.useState(0);
  const [connectLeftSweep, setConnectLeftSweep] = React.useState(0);
  const [connectRightSweep, setConnectRightSweep] = React.useState(0);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);
  /** Page hero background fade-in (slow blend from cinematic end → ecommerce hero) */
  const [bgBlend, setBgBlend] = React.useState(0);
  const lockIntro = React.useCallback((opts?: { toStore?: boolean }) => {
    if (introLockedRef.current) return;
    // Pin sample FIRST — never scrub backward again
    introLockedRef.current = true;
    progressTargetRef.current = 1;
    progressSmoothRef.current = 1;
    sampleRef.current = sampleProductSequence(1, layoutBiasRef.current, viewOptsFromFit(viewportFitRef.current));
    pendingStoreScrollRef.current = Boolean(opts?.toStore);

    setIntroLocked(true);
    setSkipVisible(false);
    setHintOpacity(0);
    setContentOpacity(1);
    setOppLeft(0);
    setOppRight(0);
    setConnectLeft(0);
    setConnectRight(0);
  }, []);

  const isStoreHash = React.useCallback((hash = window.location.hash) => {
    const h = hash.replace(/^#/, "").toLowerCase();
    return h === "catalogo" || h === "tarjetas" || h === "ecommerce";
  }, []);

  const scrollToCatalog = React.useCallback(() => {
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Ads / deep-link: /#catalogo skips cinematic intro and lands on catalog
  React.useLayoutEffect(() => {
    if (!isStoreHash()) return;
    pendingStoreScrollRef.current = true;
    lockIntro({ toStore: true });
  }, [isStoreHash, lockIntro]);

  React.useEffect(() => {
    const onHash = () => {
      if (!isStoreHash()) return;
      if (!introLockedRef.current) {
        lockIntro({ toStore: true });
      } else {
        scrollToCatalog();
      }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [isStoreHash, lockIntro, scrollToCatalog]);

  // Collapse track + fix scroll BEFORE paint — avoids 1-frame jump to footer
  React.useLayoutEffect(() => {
    if (!introLocked) return;
    progressTargetRef.current = 1;
    progressSmoothRef.current = 1;
    sampleRef.current = sampleProductSequence(1, layoutBiasRef.current, viewOptsFromFit(viewportFitRef.current));

    if (pendingStoreScrollRef.current || isStoreHash()) {
      pendingStoreScrollRef.current = false;
      // Wait a frame so track height collapses before measuring catalog offset
      requestAnimationFrame(() => scrollToCatalog());
      return;
    }
    // Natural end: stay on the final hero (never leave a huge scrollY after height collapse)
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [introLocked, isStoreHash, scrollToCatalog]);

  React.useLayoutEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    // Don't wipe hash deep-links destined for the catalog
    if (!isStoreHash()) {
      window.scrollTo(0, 0);
    }
    progressTargetRef.current = 0;
    progressSmoothRef.current = 0;
    setContentOpacity(0);
    setOppLeft(0);
    setOppRight(0);
    setOppLeftSweep(0);
    setOppRightSweep(0);
    setConnectLeft(0);
    setConnectRight(0);
    setConnectLeftSweep(0);
    setConnectRightSweep(0);
  }, [isStoreHash]);

  React.useEffect(() => {
    const reset = () => {
      if (introLockedRef.current || isStoreHash()) return;
      window.scrollTo(0, 0);
      progressTargetRef.current = 0;
      progressSmoothRef.current = 0;
    };
    reset();
    const t0 = window.setTimeout(reset, 0);
    const t1 = window.setTimeout(reset, 40);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) reset();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [isStoreHash]);

  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => setMountScene(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  React.useLayoutEffect(() => {
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqDesk = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      const desk = mqDesk.matches;
      setReducedMotion(mqMotion.matches);
      setIsDesktop(desk);
      layoutBiasRef.current = desk ? { x: 3.15, y: 0 } : { x: 0.08, y: 0.55 };
      viewportFitRef.current = desk ? DESKTOP_VIEWPORT_FIT : MOBILE_VIEWPORT_FIT;
    };
    sync();
    mqMotion.addEventListener("change", sync);
    mqDesk.addEventListener("change", sync);
    return () => {
      mqMotion.removeEventListener("change", sync);
      mqDesk.removeEventListener("change", sync);
    };
  }, []);

  const onProgress = React.useCallback(
    (p: number) => {
      if (reducedMotion || introLockedRef.current) return;
      // Lock on the last scroll frame — don't wait for damp catch-up
      const lockThreshold = isDesktop ? 0.992 : 0.945;
      if (p >= lockThreshold) {
        lockIntro();
      }
    },
    [isDesktop, reducedMotion, lockIntro],
  );

  useScrollProgress(trackRef, progressTargetRef, {
    reducedMotion,
    locked: introLocked,
    onProgress,
  });

  React.useEffect(() => {
    if (reducedMotion) {
      setContentOpacity(1);
      setOppLeft(0);
      setOppRight(0);
      setOppLeftSweep(0);
      setOppRightSweep(0);
      setConnectLeft(0);
      setConnectRight(0);
      setConnectLeftSweep(0);
      setConnectRightSweep(0);
      setHintOpacity(0);
      setSkipVisible(false);
      return;
    }
    let raf = 0;
    const tick = () => {
      if (introLockedRef.current) {
        progressTargetRef.current = 1;
        progressSmoothRef.current = 1;
      }
      const sample = sampleProductSequence(
        progressSmoothRef.current,
        layoutBiasRef.current,
        viewOptsFromFit(viewportFitRef.current),
      );
      sampleRef.current = sample;
      setContentOpacity(sample.contentOpacity);
      // Slow bg blend tracks settled; after lock keep easing toward 1
      setBgBlend((prev) => {
        const target = introLockedRef.current
          ? 1
          : Math.max(sample.settled, sample.contentOpacity * 0.85);
        return prev + (target - prev) * 0.045;
      });
      setOppLeft(sample.text.opportunity.left);
      setOppRight(sample.text.opportunity.right);
      setOppLeftSweep(sample.text.opportunity.leftSweep);
      setOppRightSweep(sample.text.opportunity.rightSweep);
      setConnectLeft(sample.text.connect.left);
      setConnectRight(sample.text.connect.right);
      setConnectLeftSweep(sample.text.connect.leftSweep);
      setConnectRightSweep(sample.text.connect.rightSweep);

      const p = progressSmoothRef.current;
      const target = progressTargetRef.current;
      setHintOpacity(p < 0.08 ? 1 - p / 0.08 : 0);
      // Chip only through the opening flip, then gone
      setSkipVisible(!introLockedRef.current && p < 0.11);

      const lockThreshold = isDesktop ? 0.992 : 0.945;
      if (!introLockedRef.current && (p >= lockThreshold || target >= lockThreshold)) {
        lockIntro();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isDesktop, reducedMotion, lockIntro]);

  React.useEffect(() => {
    if (!reducedMotion) return;
    progressTargetRef.current = 1;
    progressSmoothRef.current = 1;
    setContentOpacity(1);
    introLockedRef.current = true;
    setIntroLocked(true);
  }, [reducedMotion]);

  const handleReady = React.useCallback(() => {
    setReady(true);
    if (!signaled.current) {
      signaled.current = true;
      boot?.markHeroReady();
    }
  }, [boot]);

  const skipToStore = React.useCallback(() => {
    if (window.location.hash !== "#catalogo") {
      history.replaceState(null, "", "#catalogo");
    }
    lockIntro({ toStore: true });
  }, [lockIntro]);

  // Full-bleed sticky stage under fixed header; tall scrub until locked.
  // On mobile locked, uses natural height so #catalogo flows immediately without dead space.
  const isMobileLocked = introLocked && !isDesktop;
  const trackClass = isMobileLocked
    ? "h-auto min-h-0"
    : introLocked
      ? "h-[100dvh]"
      : isDesktop
        ? "h-[1050vh]"
        : "h-[780vh]";

  return (
    <section ref={trackRef} className={cn("relative", trackClass)}>
      <div
        className={cn(
          "w-full",
          isMobileLocked
            ? "relative h-auto pt-[max(5.25rem,11%)] pb-10 sm:pb-14"
            : "sticky top-0 h-[100dvh] overflow-hidden",
        )}
      >
        {/* Soft page-bg fade-in — bridges cinematic end → hero ecommerce look */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{ opacity: bgBlend }}
        >
          <div className="absolute inset-0 bg-background" />
          <div className="absolute inset-0 bg-gradient-mesh opacity-90" />
          <div className="absolute inset-x-0 top-0 h-full bg-grid-fade bg-[size:40px_40px] opacity-35 [mask-image:linear-gradient(black,transparent)]" />
        </div>

        <div
          className={cn(
            "absolute inset-0 z-[1] transition-opacity duration-500",
            ready ? "opacity-100" : "opacity-0",
            isMobileLocked && "hidden md:block",
          )}
        >
          {mountScene ? (
            <HeroProductScene
              className="h-full w-full"
              progressTargetRef={progressTargetRef}
              progressSmoothRef={progressSmoothRef}
              sampleRef={sampleRef}
              layoutBiasRef={layoutBiasRef}
              viewportFitRef={viewportFitRef}
              introLockedRef={introLockedRef}
              onReady={handleReady}
            />
          ) : null}
        </div>

        {/* Chip: centered, just above the card */}
        {skipVisible ? (
          <div className="pointer-events-none absolute inset-x-0 top-[max(4.75rem,18%)] z-30 flex justify-center px-4 md:top-[22%]">
            <button
              type="button"
              onClick={skipToStore}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white/75 px-3 py-1.5 text-[11px] font-medium text-zinc-700 shadow-soft backdrop-blur-md transition hover:bg-white/95 hover:text-zinc-900 sm:text-[12px]"
            >
              <Store className="h-3.5 w-3.5 text-violet-600" />
              Ir directo a la ecommerce
              <ArrowRight className="h-3 w-3 opacity-60" />
            </button>
          </div>
        ) : null}

        {!introLocked ? (
          <>
            <HeroBeatTypography
              left="Una tarjeta"
              right="Muchas oportunidades"
              rightLines={["Muchas", "oportunidades"]}
              leftAmount={oppLeft}
              rightAmount={oppRight}
              leftSweep={oppLeftSweep}
              rightSweep={oppRightSweep}
              accentRight
              layout={isDesktop ? "sides" : "stack"}
            />
            <HeroBeatTypography
              left="Acercá"
              right="Conectá"
              leftAmount={connectLeft}
              rightAmount={connectRight}
              leftSweep={connectLeftSweep}
              rightSweep={connectRightSweep}
              layout={isDesktop ? "sides" : "diagonal"}
            />
          </>
        ) : null}

        {/* Hint: mid between card and bottom of viewport */}
        {hintOpacity > 0.02 ? (
          <div
            className="pointer-events-none absolute inset-x-0 top-[72%] z-20 flex -translate-y-1/2 flex-col items-center gap-1 md:top-[70%]"
            style={{ opacity: hintOpacity }}
          >
            <p className="font-display text-[12px] font-light tracking-[0.04em] text-zinc-500/90 sm:text-[13px]">
              Desliza para continuar
            </p>
            <ChevronDown className="h-4 w-4 animate-bounce text-zinc-400/80" strokeWidth={1.5} />
          </div>
        ) : null}

        <div
          className={cn(
            "relative z-10 flex w-full",
            isMobileLocked
              ? "h-auto items-start"
              : "pointer-events-none h-full items-start pt-[max(5.25rem,11%)] md:items-center md:pt-0",
          )}
        >
          <div className="container grid w-full items-center pb-6 md:grid-cols-2 md:gap-12 md:pb-0 lg:gap-16">
            <div
              className="max-w-xl md:pt-0"
              style={{
                opacity: isMobileLocked ? 1 : contentOpacity,
                transform: isMobileLocked ? "none" : `translateY(${(1 - contentOpacity) * 14}px)`,
                pointerEvents: isMobileLocked || contentOpacity > 0.55 ? "auto" : "none",
              }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-soft backdrop-blur">
                <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-white">
                  <Nfc className="h-2.5 w-2.5" />
                </span>
                Tarjetas NFC + QR · Suscripción anual
              </div>

              <h1 className="font-display mt-4 text-balance text-[1.85rem] font-semibold tracking-[-0.02em] sm:text-4xl md:mt-6 md:text-[3.35rem] md:leading-[1.05] lg:text-[3.6rem]">
                Tu tarjeta física.{" "}
                <span className="bg-[linear-gradient(120deg,#7c3aed,#ec4899,#f59e0b)] bg-clip-text text-transparent">
                  Tu perfil digital.
                </span>
              </h1>

              {/* Mobile static 3D cards: exact original model, responsive height, preloaded */}
              <div className="my-3 flex justify-center md:hidden w-full">
                <HeroCards3D className="h-[250px] sm:h-[290px] w-full max-w-[340px]" />
              </div>

              <p className="mt-4 max-w-lg text-pretty text-[15px] leading-relaxed text-muted-foreground md:mt-6 md:text-[17px]">
                Blanca o negra, con NFC y QR integrados. Incluye Volt Cards Social Media: editá tu
                link-in-bio profesional desde el panel. Pagás anual, recibís la tarjeta y coordinamos
                por WhatsApp.
              </p>

              <div className="mt-6 flex flex-wrap gap-3 md:mt-8">
                <a href="#catalogo" className="pointer-events-auto">
                  <Button variant="gradient" size="lg" className="h-11 px-6 md:h-12 md:px-7">
                    Ver tarjetas <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
              </div>

              <div className="mt-5 flex flex-wrap gap-3 text-[11px] text-muted-foreground md:mt-8 md:gap-4 md:text-[12px]">
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                  Desde $216.000/año · pago anual
                </span>
                <span>NFC + QR incluidos</span>
                <span>Social Media incluido</span>
              </div>
            </div>
            <div className="hidden md:block" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
