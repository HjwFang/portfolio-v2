/**
 * Dump EXIF capture dates for everything in public/art/.
 * Writes a small JSON manifest at scripts/art-meta.json with { file, year, date }.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import exifr from "exifr";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "public", "art");
const OUT_FILE = path.join(__dirname, "art-meta.json");

async function readDate(srcPath) {
  try {
    const data = await exifr.parse(srcPath, [
      "DateTimeOriginal",
      "CreateDate",
      "ModifyDate",
    ]);
    const date = data?.DateTimeOriginal || data?.CreateDate || data?.ModifyDate;
    if (date) return new Date(date);
  } catch {
    // fall through to sharp
  }
  try {
    const meta = await sharp(srcPath).metadata();
    if (meta.exif) {
      // Last-ditch parse from raw EXIF buffer not worth it; rely on file mtime.
    }
    const stat = await fs.stat(srcPath);
    return stat.mtime;
  } catch {
    return null;
  }
}

async function main() {
  const entries = await fs.readdir(SRC_DIR);
  const files = entries.filter((f) => /^IMG_\d+\.jpe?g$/i.test(f)).sort();
  const out = [];
  for (const file of files) {
    const date = await readDate(path.join(SRC_DIR, file));
    const iso = date ? date.toISOString() : null;
    const year = date ? date.getUTCFullYear() : null;
    out.push({ file, year, date: iso });
    console.log(`${file}\t${year ?? "??"}\t${iso ?? ""}`);
  }
  await fs.writeFile(OUT_FILE, JSON.stringify(out, null, 2));
  console.log(`Wrote ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
