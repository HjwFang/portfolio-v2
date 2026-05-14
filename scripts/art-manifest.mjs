/**
 * Emit width/height for every cleaned art image so the gallery can render
 * aspect-ratio-aware tiles without runtime measurement.
 *
 * Output: scripts/art-sizes.json
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const CLEANED_DIR = path.join(ROOT, "public", "art", "cleaned");
const OUT_FILE = path.join(__dirname, "art-sizes.json");

async function main() {
  const entries = await fs.readdir(CLEANED_DIR);
  const files = entries.filter((f) => /^img_\d+\.jpg$/i.test(f)).sort();
  const sizes = {};
  for (const file of files) {
    const meta = await sharp(path.join(CLEANED_DIR, file)).metadata();
    sizes[file] = { w: meta.width, h: meta.height };
  }
  await fs.writeFile(OUT_FILE, JSON.stringify(sizes, null, 2));
  console.log(`Wrote ${files.length} entries to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
