"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import CascadeIn from "@/components/CascadeIn";
import RevealImage from "@/components/RevealImage";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";
import type { ArtPiece } from "@/app/misc/art-data";

// ─── layout helpers ──────────────────────────────────────────────────────────

const GAP = 10;
const SECTION_GAP = 28;

/** Desired visual stripe (~row height band), derived from gallery width */
function rowStripeCenter(containerW: number) {
  const cw = Math.max(280, containerW);
  const frac = Math.min(0.30, Math.max(0.235, 0.268 - cw / (cw + 9800)));
  return Math.round(Math.min(318, Math.max(200, cw * frac)));
}

/** Packing threshold so each row tends toward stripeCenter height before justify */
function deriveTargetARS(containerW: number) {
  const cw = Math.max(200, containerW);
  const stripe = rowStripeCenter(cw);
  const gapReserve = Math.max(GAP * 5, cw * 0.02);
  const avail = cw - gapReserve;
  const t = avail / stripe;
  return Math.max(2.75, Math.min(4.15, t));
}

function packRows(pieces: ArtPiece[], targetARSum: number): ArtPiece[][] {
  const rows: ArtPiece[][] = [];
  let bucket: ArtPiece[] = [];
  let arSum = 0;
  for (const p of pieces) {
    bucket.push(p);
    arSum += p.width / p.height;
    if (arSum >= targetARSum) {
      rows.push(bucket);
      bucket = [];
      arSum = 0;
    }
  }
  if (bucket.length) rows.push(bucket);
  return rows;
}

type LayoutRow = {
  items: ArtPiece[];
  widths: number[];
  heights: number[];
};

/** One lone piece spanning the full justified row becomes a panorama strip — cap cell size instead */
function soloThumbnailInsideBox(p: ArtPiece, containerW: number): { w: number; h: number } {
  const stripe = rowStripeCenter(containerW);
  const cw = Math.max(260, containerW);
  const ar = Math.max(p.width / Math.max(p.height, 1), 1e-4);

  const maxW = Math.min(340, Math.floor(cw * 0.38));
  const maxH = Math.min(Math.round(stripe * 1.92), Math.floor(cw * 0.54));

  let w = maxW;
  let h = w / ar;
  if (h > maxH) {
    h = maxH;
    w = ar * h;
  }

  let rw = Math.min(maxW, Math.round(w));
  let rh = Math.round(rw / ar);
  rh = Math.min(maxH, Math.max(154, rh));
  rw = Math.min(maxW, Math.round(ar * rh));

  return { w: Math.max(104, rw), h: rh };
}

function buildRows(
  pieces: ArtPiece[],
  containerW: number,
  targetARSum: number,
): LayoutRow[] {
  return packRows(pieces, targetARSum).map((items) => {
    const ars = items.map((p) => p.width / p.height);
    const arSum = ars.reduce((s, a) => s + a, 0);
    const totalGap = Math.max(0, items.length - 1) * GAP;
    const available = Math.max(0, containerW - totalGap);

    if (available <= 0 || arSum <= 0)
      return { items, widths: ars.map(() => 1), heights: items.map(() => 1) };

    if (items.length === 1) {
      const solo = soloThumbnailInsideBox(items[0], containerW);
      return {
        items,
        widths: [solo.w],
        heights: [solo.h],
      };
    }

    const widths = ars.map((a) => Math.floor((a / arSum) * available));
    const distributed = widths.reduce((s, w) => s + w, 0);
    widths[widths.length - 1] += available - distributed;

    const rawH = Math.round(available / arSum);
    const stripeH = rowStripeCenter(containerW);
    const loose = Math.max(14, Math.round(stripeH * 0.055));
    const low = Math.max(188, stripeH - loose);
    const high = Math.min(335, stripeH + loose);
    const h = Math.min(high, Math.max(low, rawH));

    return { items, widths, heights: items.map(() => Math.max(1, h)) };
  });
}

// ─── grouping ────────────────────────────────────────────────────────────────

type Section = { label: string; year: number | null; pieces: ArtPiece[]; key: string };

function buildSections(pieces: ArtPiece[]): Section[] {
  type Acc = { label: string; year: number | null; pieces: ArtPiece[]; firstIndex: number };
  const buckets: Acc[] = [];
  const keyToIdx = new Map<string, number>();

  for (let i = 0; i < pieces.length; i++) {
    const p = pieces[i];
    if (typeof p.year !== "number") {
      let idx = keyToIdx.get("undated");
      if (idx === undefined) {
        idx = buckets.length;
        keyToIdx.set("undated", idx);
        buckets.push({ label: "—", year: null, pieces: [], firstIndex: i });
      }
      buckets[idx].pieces.push(p);
      continue;
    }
    const sec = p.section?.trim() ?? "";
    const key = `${p.year}\0${sec}`;
    let idx = keyToIdx.get(key);
    if (idx === undefined) {
      idx = buckets.length;
      keyToIdx.set(key, idx);
      const label = sec ? sec : String(p.year);
      buckets.push({ label, year: p.year, pieces: [], firstIndex: i });
    }
    buckets[idx].pieces.push(p);
  }

  buckets.sort((a, b) => {
    if (a.year === null && b.year === null) return a.firstIndex - b.firstIndex;
    if (a.year === null) return 1;
    if (b.year === null) return -1;
    if (b.year !== a.year) return b.year - a.year;
    return a.firstIndex - b.firstIndex;
  });

  return buckets.map((b) => ({
    label: b.label,
    year: b.year,
    pieces: b.pieces,
    key: b.year === null ? "undated" : `${b.year}:${b.label}`,
  }));
}

// ─── component ───────────────────────────────────────────────────────────────

type Props = {
  pieces: ArtPiece[];
  /** Optional override for row packing density; omit to auto-tune from width */
  targetARSum?: number;
  /** Stagger thumbnails top-left → bottom-right using portfolio-cascade-in */
  cascade?: boolean;
  /** First --cascade-step index (e.g. continue after hero intro). */
  cascadeBaseStep?: number;
};

export default function ArtGallery({
  pieces,
  targetARSum,
  cascade = false,
  cascadeBaseStep = 0,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);

  const sections = useMemo(() => buildSections(pieces), [pieces]);

  const packingTarget =
    containerW <= 10
      ? 3.4
      : targetARSum !== undefined
        ? targetARSum
        : deriveTargetARS(containerW);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => {
      const w = Math.floor(el.getBoundingClientRect().width) - 1;
      if (w > 10) setContainerW(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  let cascadeIndex = cascadeBaseStep;

  return (
    <div
      ref={containerRef}
      className="flex min-w-0 w-full max-w-full flex-col"
      style={{ gap: SECTION_GAP }}
    >
      {sections.map((section) => {
        const rows =
          containerW > 0 ? buildRows(section.pieces, containerW, packingTarget) : [];

        return (
          <div key={section.key} className="flex w-full min-w-0 flex-col" style={{ gap: GAP }}>
            {/* Year label */}
            <div
              className={`flex items-center gap-3 ${cascade ? "portfolio-cascade-in" : ""}`}
              style={
                cascade
                  ? ({ ["--cascade-step"]: cascadeIndex++ } as CSSProperties)
                  : undefined
              }
            >
              <span className="shrink-0 font-quicksand font-light text-[clamp(0.65rem,0.8vw,0.75rem)] tracking-[0.18em] uppercase text-foreground/35 select-none">
                {section.label}
              </span>
              <span className="h-px flex-1 bg-foreground/10" />
            </div>

            {/* Rows */}
            {rows.map((row, rIdx) => (
              <div
                key={rIdx}
                className="flex min-w-0 max-w-full justify-start"
                style={{ gap: GAP, flexShrink: 0, width: "100%" }}
              >
                {row.items.map((p, tIdx) => {
                  const w = row.widths[tIdx];
                  const h = row.heights[tIdx];
                  const step = cascade ? cascadeIndex++ : undefined;

                  const thumb = (
                    <RevealImage
                      src={`/art/cleaned/thumb/${p.file}`}
                      alt=""
                      fill
                      priority={cascade}
                      sizes={`${w}px`}
                      className={
                        row.items.length === 1
                          ? "object-contain object-left"
                          : "object-cover"
                      }
                      placeholder="blur"
                      blurDataURL={IMAGE_BLUR_DATA_URL}
                    />
                  );

                  return cascade && step !== undefined ? (
                    <CascadeIn
                      key={p.file}
                      step={step}
                      className="relative shrink-0 overflow-hidden"
                      style={{ width: w, height: h }}
                    >
                      {thumb}
                    </CascadeIn>
                  ) : (
                    <div
                      key={p.file}
                      className="relative shrink-0 overflow-hidden"
                      style={{ width: w, height: h }}
                    >
                      {thumb}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
