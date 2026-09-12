const sharp = require("sharp");
const fs = require("fs");
const src = "C:/Users/Usuario/Documents/Proyectos de Desarrollo/Volt-Cards/public/brand/volt-mark.png";
const tmp = src.replace(".png", "-tmp.png");

(async () => {
  const meta = await sharp(src).metadata();
  const size = Math.min(meta.width || 256, meta.height || 256);
  const r = size / 2;
  const svg = Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r}" fill="white"/></svg>`,
  );
  await sharp(src)
    .resize(size, size, { fit: "cover" })
    .composite([{ input: svg, blend: "dest-in" }])
    .png()
    .toFile(tmp);
  fs.renameSync(tmp, src);
  console.log("ok", size);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
