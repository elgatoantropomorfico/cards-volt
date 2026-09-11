"use client";

import * as React from "react";
import { HERO_REVEAL_FRAME_COUNT, heroRevealFrameSrc } from "@/lib/hero-reveal";

/** Pin acts, in order: scrub frames → fill white → hold white → hero fades in. */
const SCRUB_END = 0.46;
const WHITE_FADE_END = 0.64;
const WHITE_HOLD_END = 0.72;

function coverDraw(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
) {
  const ir = img.naturalWidth / img.naturalHeight;
  const cr = w / h;
  let dw = w;
  let dh = h;
  let dx = 0;
  let dy = 0;
  if (ir > cr) {
    dw = h * ir;
    dx = (w - dw) / 2;
  } else {
    dh = w / ir;
    dy = (h - dh) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}

export function HeroScrollReveal({ children }: { children: React.ReactNode }) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const stickyRef = React.useRef<HTMLDivElement>(null);
  const heroRef = React.useRef<HTMLDivElement>(null);
  const framesRef = React.useRef<(HTMLImageElement | null)[]>([]);
  const lastIndexRef = React.useRef(-1);
  const rafRef = React.useRef(0);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (desktop.matches) return;

    let cancelled = false;
    const frames: (HTMLImageElement | null)[] = Array.from({ length: HERO_REVEAL_FRAME_COUNT }, () => null);
    framesRef.current = frames;

    const draw = (index: number) => {
      const canvas = canvasRef.current;
      const img = framesRef.current[index];
      if (!canvas || !img?.naturalWidth) return;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (w < 1 || h < 1) return;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      coverDraw(ctx, img, w, h);
    };

    const applyProgress = () => {
      const wrap = wrapRef.current;
      const sticky = stickyRef.current;
      if (!wrap || !sticky) return;

      if (reduced.matches) {
        lastIndexRef.current = HERO_REVEAL_FRAME_COUNT - 1;
        sticky.style.setProperty("--white-opacity", "1");
        sticky.style.setProperty("--hero-opacity", "1");
        if (heroRef.current) heroRef.current.style.pointerEvents = "auto";
        draw(HERO_REVEAL_FRAME_COUNT - 1);
        return;
      }

      const total = wrap.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-wrap.getBoundingClientRect().top, 0), Math.max(total, 0));
      const progress = total > 0 ? scrolled / total : 0;

      let index: number;
      let whiteOpacity: number;
      let heroOpacity: number;

      if (progress <= SCRUB_END) {
        index = Math.min(
          HERO_REVEAL_FRAME_COUNT - 1,
          Math.round((progress / SCRUB_END) * (HERO_REVEAL_FRAME_COUNT - 1)),
        );
        whiteOpacity = 0;
        heroOpacity = 0;
      } else if (progress <= WHITE_HOLD_END) {
        index = HERO_REVEAL_FRAME_COUNT - 1;
        whiteOpacity =
          progress <= WHITE_FADE_END
            ? (progress - SCRUB_END) / (WHITE_FADE_END - SCRUB_END)
            : 1;
        heroOpacity = 0;
      } else {
        index = HERO_REVEAL_FRAME_COUNT - 1;
        whiteOpacity = 1;
        heroOpacity = Math.min(1, (progress - WHITE_HOLD_END) / (1 - WHITE_HOLD_END));
      }

      sticky.style.setProperty("--white-opacity", String(whiteOpacity));
      sticky.style.setProperty("--hero-opacity", String(heroOpacity));
      if (heroRef.current) {
        heroRef.current.style.pointerEvents = heroOpacity > 0.2 ? "auto" : "none";
      }

      if (index !== lastIndexRef.current) {
        lastIndexRef.current = index;
        draw(index);
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(applyProgress);
    };

    const onResize = () => {
      lastIndexRef.current = -1;
      onScroll();
    };

    const load = async () => {
      await Promise.all(
        Array.from({ length: HERO_REVEAL_FRAME_COUNT }, async (_, i) => {
          const img = new Image();
          img.src = heroRevealFrameSrc(i);
          try {
            await img.decode();
          } catch {
            try {
              await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error("frame"));
              });
            } catch {
              return;
            }
          }
          if (!cancelled) frames[i] = img;
        }),
      );
      if (cancelled) return;
      framesRef.current = frames;
      setReady(true);
      applyProgress();
      if (lastIndexRef.current < 0) draw(0);
    };

    void load();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative h-[320vh] md:hidden motion-reduce:h-auto">
      <div
        ref={stickyRef}
        className="sticky top-0 h-dvh w-full overflow-hidden bg-background"
        style={{ "--white-opacity": 0, "--hero-opacity": 0 } as React.CSSProperties}
      >
        <div className="pointer-events-none absolute inset-0">
          <img
            src={heroRevealFrameSrc(0)}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            draggable={false}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            style={{ opacity: ready ? 1 : 0 }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%] bg-gradient-to-t from-white via-white/55 to-transparent" />
        </div>

        {/* Full white beat — hero does not start until this is solid */}
        <div
          className="pointer-events-none absolute inset-0 bg-white"
          style={{ opacity: "var(--white-opacity)" }}
        />

        <div
          ref={heroRef}
          className="absolute inset-0 overflow-hidden bg-background pt-16"
          style={{ opacity: "var(--hero-opacity)", pointerEvents: "none" }}
        >
          <div className="pointer-events-none absolute inset-0 bg-gradient-mesh" />
          <div className="relative flex h-full flex-col justify-start overflow-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
