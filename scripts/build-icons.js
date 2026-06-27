/* eslint-disable */
// One-shot icon pipeline for the PWA.
// Reads `public/icon-source.png` (any size >=512 square) and writes:
//   public/apple-touch-icon.png    (180x180 — iOS Home Screen, no alpha)
//   public/icon-192.png            (Android Chrome)
//   public/icon-512.png            (Android Chrome high-res)
//   public/icon-maskable-512.png   (Android maskable, padded safe area)
//   public/favicon.png             (32x32 browser tab icon)
//
// Run with:  npm run icons

const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const src = path.join(root, 'public', 'icon-source.png');
const outDir = path.join(root, 'public');

if (!fs.existsSync(src)) {
  console.error(`Source icon not found: ${src}`);
  console.error('Save the icon image as public/icon-source.png (square, >=512px) and retry.');
  process.exit(1);
}

// iOS Home Screen icon. iOS rounds corners and adds shadow automatically,
// so we strip alpha and put a solid background under the artwork.
async function buildAppleTouchIcon() {
  const out = path.join(outDir, 'apple-touch-icon.png');
  await sharp(src)
    .resize(180, 180, { fit: 'cover' })
    .flatten({ background: { r: 168, g: 225, b: 217 } }) // mint background
    .png()
    .toFile(out);
  console.log(`  wrote ${path.relative(root, out)}`);
}

async function buildSquarePng(size) {
  const out = path.join(outDir, `icon-${size}.png`);
  await sharp(src)
    .resize(size, size, { fit: 'cover' })
    .png()
    .toFile(out);
  console.log(`  wrote ${path.relative(root, out)}`);
}

// Maskable icon needs ~20% safe-area padding so the artwork survives any
// circular/rounded mask the Android launcher applies.
async function buildMaskable() {
  const out = path.join(outDir, 'icon-maskable-512.png');
  const inner = 384; // 75% of 512
  const pad = (512 - inner) / 2;
  const inset = await sharp(src).resize(inner, inner, { fit: 'cover' }).png().toBuffer();
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 168, g: 225, b: 217, alpha: 1 },
    },
  })
    .composite([{ input: inset, top: pad, left: pad }])
    .png()
    .toFile(out);
  console.log(`  wrote ${path.relative(root, out)}`);
}

async function buildFavicon() {
  const out = path.join(outDir, 'favicon.png');
  await sharp(src).resize(32, 32, { fit: 'cover' }).png().toFile(out);
  console.log(`  wrote ${path.relative(root, out)}`);
}

(async () => {
  console.log(`Source: ${path.relative(root, src)}`);
  await buildAppleTouchIcon();
  await buildSquarePng(192);
  await buildSquarePng(512);
  await buildMaskable();
  await buildFavicon();
  console.log('Done.');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
