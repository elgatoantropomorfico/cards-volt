/** Mobile: first 4s of the vertical pocket-pull, 16 fps.
 * ffmpeg -y -ss 0 -t 4 -i "source.mp4" -vf "fps=16,scale=540:-1:flags=lanczos" -start_number 0 -c:v libwebp -quality 76 public/hero-reveal/frame-%03d.webp
 */
export const HERO_REVEAL_FRAME_COUNT = 64;

/** Desktop: full landscape card spin, 12 fps.
 * ffmpeg -y -i "source.mp4" -vf "fps=12,scale=960:-1:flags=lanczos" -start_number 0 -c:v libwebp -quality 74 public/hero-reveal-desk/frame-%03d.webp
 */
export const HERO_REVEAL_DESK_FRAME_COUNT = 90;

export type HeroRevealVariant = "mobile" | "desktop";

export function heroRevealFrameSrc(index: number, variant: HeroRevealVariant = "mobile") {
  const max = (variant === "desktop" ? HERO_REVEAL_DESK_FRAME_COUNT : HERO_REVEAL_FRAME_COUNT) - 1;
  const n = String(Math.max(0, Math.min(max, index))).padStart(3, "0");
  const folder = variant === "desktop" ? "hero-reveal-desk" : "hero-reveal";
  return `/${folder}/frame-${n}.webp`;
}

export function heroRevealConfig(variant: HeroRevealVariant) {
  const desktop = variant === "desktop";
  return {
    count: desktop ? HERO_REVEAL_DESK_FRAME_COUNT : HERO_REVEAL_FRAME_COUNT,
    skipMedia: desktop ? "(max-width: 767px)" : "(min-width: 768px)",
    wrapClass: desktop
      ? "relative hidden h-[360vh] md:block motion-reduce:h-auto"
      : "relative h-[320vh] md:hidden motion-reduce:h-auto",
  };
}
