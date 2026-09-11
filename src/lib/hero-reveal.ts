/** First 4s of the vertical pocket-pull, 16 fps. Regenerar con:
 * ffmpeg -y -ss 0 -t 4 -i "source.mp4" -vf "fps=16,scale=540:-1:flags=lanczos" -start_number 0 -c:v libwebp -quality 76 public/hero-reveal/frame-%03d.webp
 */
export const HERO_REVEAL_FRAME_COUNT = 64;

export function heroRevealFrameSrc(index: number) {
  const n = String(Math.max(0, Math.min(HERO_REVEAL_FRAME_COUNT - 1, index))).padStart(3, "0");
  return `/hero-reveal/frame-${n}.webp`;
}
