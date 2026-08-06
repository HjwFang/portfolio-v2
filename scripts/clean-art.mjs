/**
 * Clean & crop art photos in public/art/originals/.
 *
 * Cropping strategy (two-stage):
 *
 *   Stage 1 — paper boundary
 *     Flood-fill from all edge pixels to identify the dark background (table,
 *     floor, etc.).  Anything that isn't background and is sufficiently bright
 *     is "paper".  This gives a bbox that fully contains all art content.
 *
 *   Stage 2 — marks bbox (optional tightening)
 *     Within the paper bbox, find every pixel that is darker than 87% of the
 *     paper's 75th-percentile brightness → those are graphite/ink marks.
 *     Expand their bounding box by 13% margin, clipped to the paper boundary.
 *     This removes blank margins while guaranteeing that no mark is ever cut.
 *
 * Tonal cleanup: lift paper toward white, mild contrast boost, optional
 *   saturation nudge for colour pieces, gentle sharpen.  Max 1 600 px long
 *   edge for full-size; 720 px for thumbs.
 *
 * Usage:
 *   node scripts/clean-art.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "public", "art", "originals");
const OUT_DIR = path.join(ROOT, "public", "art", "cleaned");

const MAX_EDGE = 1600;
const THUMB_EDGE = 720;
const WEBP_QUALITY = 82;
const THUMB_WEBP_QUALITY = 76;

// ─── helpers ────────────────────────────────────────────────────────────────

function sortedMedian(arr) {
  const s = arr.slice().sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function pct(sortedArr, p) {
  return sortedArr[Math.floor(sortedArr.length * p)];
}

/**
 * Flood-fill from the supplied seed indices outward, marking every pixel
 * whose grayscale value lies within [lo, hi].
 */
function edgeFloodFill(data, W, H, seeds, lo, hi) {
  const mask = new Uint8Array(W * H);
  const stack = [];
  for (const idx of seeds) {
    if (mask[idx]) continue;
    const v = data[idx];
    if (v < lo || v > hi) continue;
    mask[idx] = 1;
    stack.push(idx);
  }
  while (stack.length) {
    const i = stack.pop();
    const x = i % W;
    const y = (i - x) / W;
    if (x > 0)     { const ni = i - 1; if (!mask[ni] && data[ni] >= lo && data[ni] <= hi) { mask[ni] = 1; stack.push(ni); } }
    if (x < W - 1) { const ni = i + 1; if (!mask[ni] && data[ni] >= lo && data[ni] <= hi) { mask[ni] = 1; stack.push(ni); } }
    if (y > 0)     { const ni = i - W; if (!mask[ni] && data[ni] >= lo && data[ni] <= hi) { mask[ni] = 1; stack.push(ni); } }
    if (y < H - 1) { const ni = i + W; if (!mask[ni] && data[ni] >= lo && data[ni] <= hi) { mask[ni] = 1; stack.push(ni); } }
  }
  return mask;
}

// ─── stage 1: paper boundary ────────────────────────────────────────────────

async function findPaperBbox(rotatedBuffer, fullW, fullH) {
  // Work on a small version for speed.
  const analysisW = 400;
  const analysisH = Math.max(1, Math.round(fullH * analysisW / fullW));

  const { data, info } = await sharp(rotatedBuffer)
    .resize({ width: analysisW, height: analysisH, fit: "fill" })
    .blur(1.8)          // blur first to suppress noise / spiral texture
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = info.width;
  const H = info.height;

  // ── estimate background brightness from all edge pixels ──────────────────
  const edgePx = [];
  for (let x = 0; x < W; x++) {
    edgePx.push(data[x], data[(H - 1) * W + x]);
  }
  for (let y = 1; y < H - 1; y++) {
    edgePx.push(data[y * W], data[y * W + W - 1]);
  }
  const bgMedian = sortedMedian(edgePx);

  // ── flood-fill background from all edge pixels ────────────────────────────
  const bgSeeds = [];
  for (let x = 0; x < W; x++) {
    bgSeeds.push(x, (H - 1) * W + x);
  }
  for (let y = 1; y < H - 1; y++) {
    bgSeeds.push(y * W, y * W + W - 1);
  }

  // Tolerance: wide enough to span the dark background including shadows and
  // spiral binding, but capped so it can't consume bright paper.
  const bgTol = 80;
  const bgLo = Math.max(0, bgMedian - bgTol);
  // Hard cap: background may not extend brighter than midgray even when the
  // table is light-coloured; this protects paper from being eaten.
  const bgHi = Math.min(180, bgMedian + bgTol);

  const bgMask = edgeFloodFill(data, W, H, bgSeeds, bgLo, bgHi);

  // ── paper pixels: non-background AND clearly brighter than background ─────
  const paperThresh = Math.max(bgMedian + 30, bgHi + 5);
  let pMinX = W, pMinY = H, pMaxX = -1, pMaxY = -1;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = y * W + x;
      if (!bgMask[idx] && data[idx] >= paperThresh) {
        if (x < pMinX) pMinX = x;
        if (x > pMaxX) pMaxX = x;
        if (y < pMinY) pMinY = y;
        if (y > pMaxY) pMaxY = y;
      }
    }
  }

  // Fallback: if edge-flood method found nothing (unusual lighting), use a
  // simple brightness threshold against the centre-sample median.
  if (pMaxX < pMinX || pMaxY < pMinY) {
    const cx0 = Math.floor(W * 0.3), cx1 = Math.floor(W * 0.7);
    const cy0 = Math.floor(H * 0.3), cy1 = Math.floor(H * 0.7);
    const ctr = [];
    for (let y = cy0; y < cy1; y++)
      for (let x = cx0; x < cx1; x++)
        ctr.push(data[y * W + x]);
    ctr.sort((a, b) => a - b);
    const ctrMed = ctr[Math.floor(ctr.length / 2)];
    const brightThresh = Math.max(80, ctrMed - 50);
    pMinX = W; pMinY = H; pMaxX = -1; pMaxY = -1;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        if (data[y * W + x] >= brightThresh) {
          if (x < pMinX) pMinX = x;
          if (x > pMaxX) pMaxX = x;
          if (y < pMinY) pMinY = y;
          if (y > pMaxY) pMaxY = y;
        }
      }
    }
  }

  // Ultimate fallback: full image.
  if (pMaxX < pMinX || pMaxY < pMinY) {
    return { pMinX: 0, pMinY: 0, pMaxX: W - 1, pMaxY: H - 1, W, H, analysisW, analysisH };
  }

  return {
    pMinX: Math.max(0, pMinX),
    pMinY: Math.max(0, pMinY),
    pMaxX: Math.min(W - 1, pMaxX),
    pMaxY: Math.min(H - 1, pMaxY),
    W, H, analysisW, analysisH, data,
  };
}

// ─── stage 2: tighten to marks ───────────────────────────────────────────────

/**
 * Within the paper bbox on the analysis image, find graphite/ink marks and
 * return a tightened crop that includes all marks + generous margin.
 * The result is always clipped to the paper boundary — no mark is ever cut.
 */
function tightenToMarks(
  { data, W, pMinX, pMinY, pMaxX, pMaxY },
) {
  // Paper brightness reference: 75th percentile of pixels in the paper region.
  const paperPx = [];
  for (let y = pMinY; y <= pMaxY; y++)
    for (let x = pMinX; x <= pMaxX; x++)
      paperPx.push(data[y * W + x]);
  paperPx.sort((a, b) => a - b);
  const paperBright = pct(paperPx, 0.75);

  // Marks: any pixel at least 13% darker than paper's 75th percentile.
  // Threshold generous enough to catch very light graphite.
  const markThresh = paperBright * 0.87;

  let mMinX = pMaxX + 1, mMinY = pMaxY + 1, mMaxX = pMinX - 1, mMaxY = pMinY - 1;
  let markCount = 0;
  for (let y = pMinY; y <= pMaxY; y++) {
    for (let x = pMinX; x <= pMaxX; x++) {
      if (data[y * W + x] < markThresh) {
        if (x < mMinX) mMinX = x;
        if (x > mMaxX) mMaxX = x;
        if (y < mMinY) mMinY = y;
        if (y > mMaxY) mMaxY = y;
        markCount++;
      }
    }
  }

  // Need at least a meaningful cluster of marks.
  if (markCount < 25 || mMaxX <= mMinX || mMaxY <= mMinY) {
    return { cMinX: pMinX, cMinY: pMinY, cMaxX: pMaxX, cMaxY: pMaxY };
  }

  // Expand by 13% of the marks extent, minimum 12 px (at analysis scale).
  const mW = mMaxX - mMinX;
  const mH = mMaxY - mMinY;
  const padX = Math.max(12, Math.round(mW * 0.13));
  const padY = Math.max(12, Math.round(mH * 0.13));

  return {
    cMinX: Math.max(pMinX, mMinX - padX),
    cMinY: Math.max(pMinY, mMinY - padY),
    cMaxX: Math.min(pMaxX, mMaxX + padX),
    cMaxY: Math.min(pMaxY, mMaxY + padY),
  };
}

// ─── main crop detector ──────────────────────────────────────────────────────

async function detectCropBbox(srcPath, rotatedBuffer, fullW, fullH) {
  const paperResult = await findPaperBbox(rotatedBuffer, fullW, fullH);

  // If data buffer wasn't returned (fallback path), use full image.
  if (!paperResult.data) {
    return { left: 0, top: 0, width: fullW, height: fullH };
  }

  const crop = tightenToMarks(paperResult);
  const { W, H } = paperResult;

  // Map back to full-resolution coordinates.
  const sxR = fullW / W;
  const syR = fullH / H;
  // Extra 2 px safety at analysis scale → ensures rounding never clips marks.
  const safety = 2;

  const left   = Math.max(0,     Math.floor((crop.cMinX - safety) * sxR));
  const top    = Math.max(0,     Math.floor((crop.cMinY - safety) * syR));
  const right  = Math.min(fullW, Math.ceil((crop.cMaxX + safety + 1) * sxR));
  const bottom = Math.min(fullH, Math.ceil((crop.cMaxY + safety + 1) * syR));

  return { left, top, width: right - left, height: bottom - top };
}

// ─── tonal correction ────────────────────────────────────────────────────────

async function computeTonalAdjust(cropPipeline) {
  const { data, info } = await cropPipeline
    .clone()
    .resize({ width: 256, fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels;
  const len = data.length / ch;
  const rs = [], gs = [], bs = [], lums = [];
  for (let i = 0; i < len; i++) {
    const r = data[i * ch], g = data[i * ch + 1], b = data[i * ch + 2];
    rs.push(r); gs.push(g); bs.push(b);
    lums.push(0.299 * r + 0.587 * g + 0.114 * b);
  }
  const targets = [pct(rs.sort((a,b)=>a-b), 0.9), pct(gs.sort((a,b)=>a-b), 0.9), pct(bs.sort((a,b)=>a-b), 0.9)];
  const black = Math.min(40, Math.max(0, pct(lums.sort((a,b)=>a-b), 0.02) - 4));
  const targetWhite = 248;
  const scales = targets.map(t => {
    const eff = Math.max(80, t - black);
    return targetWhite / eff;
  });
  const maxScale = Math.min(...scales) > 0 ? 1.45 : 1.0;
  return {
    a: scales.map(s => Math.min(maxScale, Math.max(0.9, s))),
    b: scales.map(s => -black * Math.min(maxScale, Math.max(0.9, s))),
    paperLum: 0.299 * targets[0] + 0.587 * targets[1] + 0.114 * targets[2],
  };
}

async function detectIsColorful(cropPipeline) {
  const { data, info } = await cropPipeline
    .clone()
    .resize({ width: 200, fit: "inside" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const len = data.length / ch;
  let satSum = 0;
  for (let i = 0; i < len; i++) {
    const r = data[i * ch], g = data[i * ch + 1], b = data[i * ch + 2];
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    satSum += mx === 0 ? 0 : (mx - mn) / mx;
  }
  return satSum / len;
}

// ─── process one file ────────────────────────────────────────────────────────

async function processOne(srcPath, outPath, thumbPath) {
  const rotatedBuffer = await sharp(srcPath).rotate().toBuffer();
  const meta = await sharp(rotatedBuffer).metadata();
  const fullW = meta.width;
  const fullH = meta.height;

  const bbox = await detectCropBbox(srcPath, rotatedBuffer, fullW, fullH);

  const cropped = sharp(rotatedBuffer).extract({
    left: bbox.left,
    top: bbox.top,
    width: bbox.width,
    height: bbox.height,
  });

  const { a, b } = await computeTonalAdjust(cropped);
  const sat = await detectIsColorful(cropped);
  const isColor = sat > 0.09;
  const saturation = isColor ? 1.08 : 0.92;

  const finalize = (pipeline, maxEdge, quality) =>
    pipeline
      .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
      .linear(a, b)
      .modulate({ saturation, brightness: 1.0 })
      .sharpen({ sigma: 0.6, m1: 0.5, m2: 1.0 })
      .webp({ quality, effort: 4 });

  await finalize(cropped.clone(), MAX_EDGE, WEBP_QUALITY).toFile(outPath);
  await finalize(cropped.clone(), THUMB_EDGE, THUMB_WEBP_QUALITY).toFile(thumbPath);

  const [outStat, thumbStat] = await Promise.all([fs.stat(outPath), fs.stat(thumbPath)]);
  return { bbox, outSize: outStat.size, thumbSize: thumbStat.size };
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(path.join(OUT_DIR, "thumb"), { recursive: true });

  const entries = await fs.readdir(SRC_DIR);
  const inputs = entries.filter(f => /^IMG_\d+\.jpe?g$/i.test(f)).sort();

  console.log(`Processing ${inputs.length} images…`);
  const results = [];

  for (const file of inputs) {
    const srcPath = path.join(SRC_DIR, file);
    const base = file.replace(/\.[^.]+$/, "").toLowerCase();
    const outPath = path.join(OUT_DIR, `${base}.webp`);
    const thumbPath = path.join(OUT_DIR, "thumb", `${base}.webp`);
    try {
      const t0 = Date.now();
      const { bbox, outSize, thumbSize } = await processOne(srcPath, outPath, thumbPath);
      const kb = n => `${(n / 1024).toFixed(0)}kb`;
      console.log(
        `${file}  crop=${bbox.width}x${bbox.height}@(${bbox.left},${bbox.top})` +
        `  out=${kb(outSize)}  thumb=${kb(thumbSize)}  (${Date.now() - t0}ms)`
      );
      results.push({ file, outSize, thumbSize });
    } catch (err) {
      console.error(`FAILED ${file}:`, err.message);
    }
  }

  const total = results.reduce((a, r) => a + r.outSize + r.thumbSize, 0);
  console.log(`Done. Total: ${(total / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(err => { console.error(err); process.exit(1); });
