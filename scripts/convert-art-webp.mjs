/**
 * Convert cleaned art JPEGs to WebP and remove the JPEG originals.
 *
 * Usage: node scripts/convert-art-webp.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIRS = [
  path.join(ROOT, "public", "art", "cleaned"),
  path.join(ROOT, "public", "art", "cleaned", "thumb"),
];

async function convertDir(dir) {
  const entries = await fs.readdir(dir);
  const jpgs = entries.filter((f) => /\.jpe?g$/i.test(f)).sort();
  const converted = [];

  for (const file of jpgs) {
    const src = path.join(dir, file);
    const dest = path.join(dir, file.replace(/\.jpe?g$/i, ".webp"));
    await sharp(src).webp({ quality: 82, effort: 4 }).toFile(dest);
    await fs.unlink(src);
    converted.push(path.relative(ROOT, dest).replace(/\\/g, "/"));
  }

  return converted;
}

async function main() {
  const all = [];
  for (const dir of DIRS) {
    all.push(...(await convertDir(dir)));
  }
  console.log(`Converted ${all.length} files to WebP.`);
  for (const f of all) console.log(`  ${f}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
