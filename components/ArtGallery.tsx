"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import CascadeIn from "@/components/CascadeIn";
import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import IndexedSelector from "@/components/IndexedSelector";
import RevealImage from "@/components/RevealImage";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";
import {
  artPieceYearSpans,
  PINNED_ART_PIECES,
  sortArtPiecesByYear,
  type ArtDisplayRotateDeg,
  type ArtPiece,
  type ArtPieceYearSpan,
  type PinnedArtPiece,
} from "@/app/misc/art-data";

// ─── roulette math ───────────────────────────────────────────────────────────

function normalizeDeg(deg: number) {
  return ((deg % 360) + 360) % 360;
}

function shortestSignedDelta(from: number, to: number) {
  let delta = normalizeDeg(to - from);
  if (delta > 180) delta -= 360;
  return delta;
}

/** Smallest card scale at the far edge of the wheel. */
const FOCUS_SCALE_MIN = 0.74;
/** Full size at the focal point (world angle 0). */
const FOCUS_SCALE_MAX = 1;
/** Gaussian width in slot steps — wider = more gradual size ramp. */
const FOCUS_SIGMA_SLOTS = 4.2;

function focusMetrics(angleDeg: number, angleStep: number) {
  const dist = Math.abs(shortestSignedDelta(angleDeg, 0));
  const sigma = Math.max(angleStep * FOCUS_SIGMA_SLOTS, 1);
  const eased = Math.exp(-0.5 * (dist / sigma) ** 2);
  return {
    scale: FOCUS_SCALE_MIN + (FOCUS_SCALE_MAX - FOCUS_SCALE_MIN) * eased,
    depth: eased,
  };
}

function indexDistance(a: number, b: number, count: number) {
  if (count <= 0) return 0;
  const d = Math.abs(a - b);
  return Math.min(d, count - d);
}

function continuousIndexDistance(focus: number, index: number, count: number) {
  if (count <= 0) return 0;
  const f = ((focus % count) + count) % count;
  let d = Math.abs(f - index);
  return Math.min(d, count - d);
}

function scrollFocusFromDeg(deg: number, angleStep: number, count: number) {
  if (count <= 0) return 0;
  const raw = normalizeDeg(-deg);
  return ((raw / angleStep) % count + count) % count;
}

/** Extra horizontal sweep so the arc bows right from the pivot. */
const ARC_X_GAIN = 4.6;
/** Scales slot spacing along the arc (1 = layout minimum; lower = tighter). */
const ARC_SPACING_GAIN = 1.1;
/** Scales horizontal bow independently of vertical slot spacing. */
const ARC_CURVE_GAIN = 1.3;
const PIVOT_LEFT = "60%";
/** Vertical anchor — above center pulls the arc closer to the container top. */
const PIVOT_TOP_RATIO = 0.43;
const PIVOT_TOP = `${PIVOT_TOP_RATIO * 100}%`;
/** Trim empty space above the roulette stage inside the outer box. */
const STAGE_TOP_INSET = "clamp(6px,1.2vh,18px)";
/** Top/bottom fade — cards and scroll bar feather to transparent at the edges. */
const EDGE_FEATHER = "clamp(18px, 5.5vh, 80px)";
const EDGE_FEATHER_MASK =
  "linear-gradient(to bottom, transparent, black var(--edge-feather), black calc(100% - var(--edge-feather)), transparent)";
/** Stage shell must have explicit height — flex-1 alone does not expand into parent min-height. */
const STAGE_SHELL_MIN_H = "min-h-[clamp(280px,38vh,560px)]";
const STAGE_SHELL_MIN_H_FILL = "min-h-[clamp(240px,32vh,520px)]";
/** Room for the year/underscore tracker on narrow viewports. */
const STAGE_LEFT_INSET = "clamp(60px,11vw,96px)";

/** Map virtual wheel angle to upright card offsets along a vertical arc. */
function arcOffset(angleDeg: number, spacingRadius: number, curveRadius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    y: spacingRadius * Math.sin(rad),
    x: curveRadius * (1 - Math.cos(rad)) * ARC_X_GAIN,
  };
}

function pieceDimensions(slotH: number) {
  const size = Math.round(slotH);
  return { w: size, h: size };
}

function displayRotateTransform(deg?: ArtDisplayRotateDeg) {
  if (!deg) return undefined;
  return `rotate(${deg}deg)`;
}

/** Ripple falloff — higher = tighter concentration around the active line. */
const TRACK_RIPPLE_DECAY = 0.68;

function scrollTrackerRipple(index: number, focus: number, count: number) {
  const dist = continuousIndexDistance(focus, index, count);
  const wave = Math.exp(-dist * TRACK_RIPPLE_DECAY);
  return {
    opacity: 0.4 + wave * 0.3,
    /** 0 → short tick; 1 → full tracker bar width (see TRACK_BAR_WIDTH). */
    scaleX: 0.22 + wave * 0.48,
    wave,
  };
}

/** Minimum px gap between adjacent card bounds on the wheel arc (desktop). */
const ARC_GAP = 58;
const ARC_GAP_COMPACT = 30;
/** Load full images for the focused card and this many neighbors on each side. */
const IMAGE_LOAD_RADIUS = 4;

type StageMetrics = { height: number; width: number };

function isCompactStage(stage: StageMetrics) {
  return stage.height < 420 || stage.width < 520;
}

function maxPieceExtent(slotH: number) {
  const { w, h } = pieceDimensions(slotH);
  return Math.max(w, h);
}

/** Chord length between adjacent slots must fit the largest card plus gap. */
function minRadiusForCount(count: number, extent: number, gap: number) {
  if (count <= 1) return 220;
  const sinHalfStep = Math.sin(Math.PI / count);
  return (extent + gap) / (2 * sinHalfStep);
}

function computeRouletteLayout(pieces: ArtPiece[], stage: StageMetrics) {
  const count = pieces.length;
  const angleStep = count > 0 ? 360 / count : 360;
  const compact = isCompactStage(stage);
  const arcGap = compact ? ARC_GAP_COMPACT : ARC_GAP;
  const slotRatio = compact ? 0.5 : 0.58;
  const slotMax = compact ? 300 : 400;
  const slotMin = compact ? 148 : 200;
  const slotFloor = compact ? 128 : 160;

  let slotH = Math.round(
    Math.min(slotMax, Math.max(slotMin, stage.height * slotRatio)),
  );

  for (let attempt = 0; attempt < 10; attempt++) {
    const extent = maxPieceExtent(slotH);
    const minRadius = minRadiusForCount(count, extent, arcGap);
    const radius = Math.ceil(minRadius);

    if (radius <= stage.height * 5 || slotH <= slotFloor) {
      return { angleStep, slotH, radius, count, arcGap };
    }

    slotH = Math.max(slotFloor, Math.round(slotH * 0.9));
  }

  const extent = maxPieceExtent(slotH);
  return {
    angleStep,
    slotH,
    radius: Math.ceil(minRadiusForCount(count, extent, arcGap)),
    count,
    arcGap,
  };
}

type WheelLayout = ReturnType<typeof computeRouletteLayout>;

function applyWheelTransformToCards(
  deg: number,
  cards: Array<HTMLDivElement | null>,
  layout: WheelLayout,
) {
  const { angleStep, radius, count } = layout;
  const raw = normalizeDeg(-deg);
  const nearestIdx = count > 0 ? Math.round(raw / angleStep) % count : 0;
  const spacingRadius = radius * ARC_SPACING_GAIN;
  const curveRadius = radius * ARC_CURVE_GAIN;

  for (let i = 0; i < count; i++) {
    const el = cards[i];
    if (!el) continue;

    const angle = angleStep * i;
    const worldAngle = normalizeDeg(angle + deg);
    const { scale, depth } = focusMetrics(worldAngle, angleStep);
    const { y, x } = arcOffset(worldAngle, spacingRadius, curveRadius);

    el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    el.style.opacity = "1";
    el.style.zIndex = String(Math.round(depth * 1000));
    el.style.pointerEvents = i === nearestIdx ? "auto" : "none";
  }
}

// ─── subcomponents ───────────────────────────────────────────────────────────

function applyTrackerStyles(
  focus: number,
  count: number,
  underscoreEls: Array<HTMLSpanElement | null>,
) {
  for (let i = 0; i < count; i++) {
    const el = underscoreEls[i];
    if (!el) continue;
    const { opacity, scaleX } = scrollTrackerRipple(i, focus, count);
    el.style.opacity = String(opacity);
    el.style.transform = `scaleX(${scaleX})`;
  }
}

/** Year label column, gap, and scroll-bar line width (left → right). */
const TRACK_YEAR_WIDTH = "clamp(28px,2.5em,36px)";
const TRACK_YEAR_GAP = "clamp(8px,0.6vw,12px)";
const TRACK_BAR_WIDTH = "clamp(24px,2.25em,36px)";
const TRACK_BAR_LEFT = `calc(${TRACK_YEAR_WIDTH} + ${TRACK_YEAR_GAP})`;
/** Keep first/last tracker marks inside the stage (translate-y-1/2 extends past anchor). */
const TRACK_EDGE_INSET_PCT = 8;

function trackTopPct(index: number, count: number) {
  if (count <= 1) return 50;
  const t = index / (count - 1);
  return TRACK_EDGE_INSET_PCT + t * (100 - 2 * TRACK_EDGE_INSET_PCT);
}

const ArtScrollTracker = memo(function ArtScrollTracker({
  pieces,
  yearSpans,
  assignUnderscoreRef,
}: {
  pieces: ArtPiece[];
  yearSpans: ArtPieceYearSpan[];
  assignUnderscoreRef: (index: number, el: HTMLSpanElement | null) => void;
}) {
  const count = pieces.length;

  const yearTopPct = (start: number, end: number) =>
    trackTopPct((start + end) / 2, count);

  return (
    <div
      className="pointer-events-none absolute bottom-0 left-0 z-20 w-[var(--stage-left-inset)] select-none"
      style={{ top: STAGE_TOP_INSET }}
      aria-hidden
    >
      <div className="relative h-full">
        {yearSpans.map(({ year, start, end }) => (
          <span
            key={`${year}-${start}`}
            className="absolute left-0 -translate-y-1/2 text-right font-quicksand font-light tabular-nums text-[clamp(10px,2.4vw,11px)] leading-[1.15] tracking-tight text-foreground whitespace-nowrap"
            style={{ top: `${yearTopPct(start, end)}%`, width: TRACK_YEAR_WIDTH }}
          >
            {year}
          </span>
        ))}
        <div
          className="absolute inset-0"
          style={{
            WebkitMaskImage: EDGE_FEATHER_MASK,
            maskImage: EDGE_FEATHER_MASK,
          }}
        >
          {pieces.map((p, i) => (
            <span
              key={p.file}
              ref={(el) => assignUnderscoreRef(i, el)}
              className="absolute block origin-left -translate-y-1/2 will-change-[opacity,transform] h-px bg-foreground"
              style={{
                top: `${trackTopPct(i, count)}%`,
                left: TRACK_BAR_LEFT,
                width: TRACK_BAR_WIDTH,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

/** Gap between pinned carousel slides (px). */
const PINNED_GAP = 36;
/** Left/right fade — pinned slides feather to transparent at the stage edges. */
const PINNED_SIDE_FEATHER = "clamp(28px, 9vw, 140px)";
const PINNED_SIDE_FEATHER_MASK =
  "linear-gradient(to right, transparent, black var(--pinned-side-feather), black calc(100% - var(--pinned-side-feather)), transparent)";
/** Auto-scroll speed for the pinned carousel (px/s). */
const PINNED_SCROLL_SPEED = 52;
/** Intro spin peaks here, then eases down to PINNED_SCROLL_SPEED. */
const PINNED_INTRO_PEAK_SPEED = 1900;
const PINNED_INTRO_DURATION_MS = 2000;
const PINNED_WHEEL_SENSITIVITY = 0.9;
const PINNED_DRAG_SENSITIVITY = 1.05;
const PINNED_MOMENTUM_GAIN = 0.38;
const PINNED_VELOCITY_DAMPING = 0.93;
const PINNED_VELOCITY_CUTOFF = 0.45;
/** Matches `.portfolio-cascade-in` delay: step * 72ms. */
const CASCADE_STEP_MS = 72;

/** Smooth ease-out: fast start, long soft landing (original intro curve). */
function introEaseOut(t: number) {
  const x = Math.min(Math.max(t, 0), 1);
  return 1 - (1 - x) ** 4;
}

function pinnedIntroSpeed(elapsedMs: number) {
  const eased = introEaseOut(elapsedMs / PINNED_INTRO_DURATION_MS);
  return PINNED_INTRO_PEAK_SPEED + (PINNED_SCROLL_SPEED - PINNED_INTRO_PEAK_SPEED) * eased;
}

/** Max share of stage height / width a pinned slide may occupy. */
const PINNED_MAX_HEIGHT_RATIO = 0.72;
const PINNED_MAX_WIDTH_RATIO = 0.58;

/** Fit each piece to its true aspect ratio inside the stage max box. */
function pinnedSlideSize(
  piece: PinnedArtPiece,
  stageHeight: number,
  stageWidth: number,
) {
  if (stageHeight <= 0 || stageWidth <= 0) return { width: 0, height: 0 };
  const maxH = stageHeight * PINNED_MAX_HEIGHT_RATIO;
  const maxW = stageWidth * PINNED_MAX_WIDTH_RATIO;
  const ar = piece.width / piece.height;
  let height = maxH;
  let width = height * ar;
  if (width > maxW) {
    width = maxW;
    height = width / ar;
  }
  return { width: Math.round(width), height: Math.round(height) };
}

function pinnedSegmentWidth(
  pieces: PinnedArtPiece[],
  stageHeight: number,
  stageWidth: number,
) {
  if (pieces.length === 0 || stageHeight <= 0 || stageWidth <= 0) return 0;
  const widths = pieces.map((p) => pinnedSlideSize(p, stageHeight, stageWidth).width);
  return widths.reduce((sum, w) => sum + w, 0) + PINNED_GAP * pieces.length;
}

function wrapPinnedOffset(offset: number, segmentWidth: number) {
  if (segmentWidth <= 0) return offset;
  let next = offset;
  while (next <= -segmentWidth) next += segmentWidth;
  while (next > 0) next -= segmentWidth;
  return next;
}

function applyPinnedTrackTransform(track: HTMLDivElement | null, offset: number) {
  if (!track) return;
  track.style.transform = `translate3d(${offset}px, 0, 0)`;
}

function applyPinnedContentOpacity(track: HTMLDivElement | null, opacity: number) {
  if (!track) return;
  track.style.opacity = String(opacity);
}

function pinnedIntroFade(elapsedMs: number) {
  return introEaseOut(elapsedMs / PINNED_INTRO_DURATION_MS);
}

const PinnedCarouselItem = memo(function PinnedCarouselItem({
  piece,
  stageHeight,
  stageWidth,
}: {
  piece: PinnedArtPiece;
  stageHeight: number;
  stageWidth: number;
}) {
  const { width, height } = pinnedSlideSize(piece, stageHeight, stageWidth);

  return (
    <CrossingCornerBorder
      bleed="clamp(4px,0.5vw,8px)"
      thickness="clamp(1px,0.1vw,1.5px)"
      className="inline-block shrink-0 leading-none text-foreground/20"
    >
      <RevealImage
        src={`/art/pinned/${piece.file}`}
        alt={piece.title ?? "Pinned art"}
        width={width}
        height={height}
        wrapClassName="block leading-none"
        className="block h-auto w-auto max-w-none"
        sizes={`${width}px`}
        placeholder="blur"
        blurDataURL={IMAGE_BLUR_DATA_URL}
      />
    </CrossingCornerBorder>
  );
});

const PinnedArtCarousel = memo(function PinnedArtCarousel({
  pieces,
  stageHeight,
  stageWidth,
  active,
  introEnabled,
}: {
  pieces: PinnedArtPiece[];
  stageHeight: number;
  stageWidth: number;
  active: boolean;
  /** False while CascadeIn is still opacity-0 / delaying — intro waits for this. */
  introEnabled: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const velocityRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const segmentWidthRef = useRef(0);
  const autoScrollRef = useRef(true);
  const draggingRef = useRef(false);
  const lastPointerXRef = useRef(0);
  const introPlayedRef = useRef(false);
  const introStartRef = useRef<number | null>(null);
  const introEnabledRef = useRef(introEnabled);
  introEnabledRef.current = introEnabled;

  const segmentWidth = useMemo(
    () => pinnedSegmentWidth(pieces, stageHeight, stageWidth),
    [pieces, stageHeight, stageWidth],
  );

  const loopPieces = useMemo(
    () => (pieces.length > 0 ? [...pieces, ...pieces] : []),
    [pieces],
  );

  const nudgeOffset = useCallback((deltaPx: number, withMomentum = true) => {
    introPlayedRef.current = true;
    applyPinnedContentOpacity(trackRef.current, 1);
    offsetRef.current = wrapPinnedOffset(
      offsetRef.current + deltaPx,
      segmentWidthRef.current,
    );
    if (withMomentum) {
      velocityRef.current += deltaPx * PINNED_MOMENTUM_GAIN;
    }
    applyPinnedTrackTransform(trackRef.current, offsetRef.current);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      autoScrollRef.current = !mq.matches;
      if (mq.matches) {
        introPlayedRef.current = true;
        applyPinnedContentOpacity(trackRef.current, 1);
      }
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    segmentWidthRef.current = segmentWidth;
    if (segmentWidth <= 0) return;
    offsetRef.current = wrapPinnedOffset(offsetRef.current, segmentWidth);
    applyPinnedTrackTransform(trackRef.current, offsetRef.current);
  }, [segmentWidth]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !active) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      nudgeOffset(-delta * PINNED_WHEEL_SENSITIVITY);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [active, nudgeOffset]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !active) return;

    const onPointerDown = (event: PointerEvent) => {
      draggingRef.current = true;
      introPlayedRef.current = true;
      applyPinnedContentOpacity(trackRef.current, 1);
      lastPointerXRef.current = event.clientX;
      velocityRef.current = 0;
      el.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = event.clientX - lastPointerXRef.current;
      lastPointerXRef.current = event.clientX;
      const delta = dx * PINNED_DRAG_SENSITIVITY;
      nudgeOffset(delta, false);
      velocityRef.current = delta;
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      if (el.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [active, nudgeOffset]);

  useEffect(() => {
    if (!active || segmentWidth <= 0) {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (!draggingRef.current) {
        velocityRef.current *= PINNED_VELOCITY_DAMPING;

        if (Math.abs(velocityRef.current) > PINNED_VELOCITY_CUTOFF) {
          offsetRef.current += velocityRef.current;
        } else {
          velocityRef.current = 0;

          if (autoScrollRef.current) {
            let speed = PINNED_SCROLL_SPEED;

            if (!introPlayedRef.current) {
              // Wait until CascadeIn has applied its entrance (see introEnabled).
              if (!introEnabledRef.current) {
                speed = 0;
                applyPinnedContentOpacity(trackRef.current, 0);
              } else {
                if (introStartRef.current === null) {
                  introStartRef.current = now;
                }
                const elapsed = now - introStartRef.current;
                if (elapsed < PINNED_INTRO_DURATION_MS) {
                  speed = pinnedIntroSpeed(elapsed);
                  applyPinnedContentOpacity(trackRef.current, pinnedIntroFade(elapsed));
                } else {
                  introPlayedRef.current = true;
                  applyPinnedContentOpacity(trackRef.current, 1);
                }
              }
            }

            offsetRef.current -= speed * dt;
          }
        }
      }

      offsetRef.current = wrapPinnedOffset(offsetRef.current, segmentWidthRef.current);
      applyPinnedTrackTransform(trackRef.current, offsetRef.current);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [active, segmentWidth]);

  if (pieces.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 cursor-grab overflow-hidden active:cursor-grabbing"
      style={{
        touchAction: "none",
        "--pinned-side-feather": PINNED_SIDE_FEATHER,
        WebkitMaskImage: PINNED_SIDE_FEATHER_MASK,
        maskImage: PINNED_SIDE_FEATHER_MASK,
      } as React.CSSProperties}
      aria-label="Pinned art carousel. Scroll or drag horizontally to browse pieces."
      role="region"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight" || event.key === "PageDown") {
          event.preventDefault();
          nudgeOffset(-96);
        } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
          event.preventDefault();
          nudgeOffset(96);
        }
      }}
    >
      <div
        ref={trackRef}
        className="flex h-full items-center will-change-transform"
        style={{ gap: PINNED_GAP, opacity: 0 }}
      >
        {loopPieces.map((piece, i) => (
          <PinnedCarouselItem
            key={`${piece.file}-${i}`}
            piece={piece}
            stageHeight={stageHeight}
            stageWidth={stageWidth}
          />
        ))}
      </div>
    </div>
  );
});

const ArtGalleryCard = memo(function ArtGalleryCard({
  piece,
  index,
  slotH,
  loadImage,
  assignRef,
}: {
  piece: ArtPiece;
  index: number;
  slotH: number;
  loadImage: boolean;
  assignRef: (index: number, el: HTMLDivElement | null) => void;
}) {
  const { w, h } = pieceDimensions(slotH);
  const rotateTransform = displayRotateTransform(piece.displayRotateDeg);

  return (
    <div
      ref={(el) => assignRef(index, el)}
      className="absolute left-0 top-0"
      style={{
        width: w,
        height: h,
        marginLeft: -w,
        marginTop: -h / 2,
      }}
    >
      <div className="relative h-full w-full overflow-hidden">
        <div
          className="absolute inset-0"
          style={
            rotateTransform
              ? { transform: rotateTransform, transformOrigin: "center center" }
              : undefined
          }
        >
          <div className="absolute inset-0 bg-foreground/6" aria-hidden />
          {loadImage ? (
            <RevealImage
              src={`/art/cleaned/thumb/${piece.file}`}
              alt={piece.title ?? "Art piece"}
              fill
              sizes={`${w}px`}
              className="object-contain"
              placeholder="blur"
              blurDataURL={IMAGE_BLUR_DATA_URL}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
});

// ─── component ───────────────────────────────────────────────────────────────

const ART_GALLERY_SECTIONS = [
  { id: "pinned", label: "pinned" },
  { id: "other", label: "other" },
] as const;

type ArtGallerySection = (typeof ART_GALLERY_SECTIONS)[number]["id"];

type Props = {
  pieces: ArtPiece[];
  /** @deprecated Roulette layout ignores row packing density */
  targetARSum?: number;
  cascade?: boolean;
  cascadeBaseStep?: number;
  /** Fill remaining vertical space in a flex parent (e.g. home misc panel). */
  fillHeight?: boolean;
};

const WHEEL_SENSITIVITY = 0.034;
const DRAG_SENSITIVITY = 0.17;
const SNAP_STRENGTH = 0.082;
const VELOCITY_DAMPING = 0.938;
const VELOCITY_CUTOFF = 0.011;
const MOMENTUM_GAIN = 0.17;

export default function ArtGallery({
  pieces,
  cascade = false,
  cascadeBaseStep = 0,
  fillHeight = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageShellRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const underscoreRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const lastPointerYRef = useRef(0);
  const activeIndexRef = useRef(0);
  const loadedImageIndicesRef = useRef<Set<number>>(new Set());
  const layoutRef = useRef<WheelLayout>({
    angleStep: 360,
    slotH: 168,
    radius: 220,
    count: 0,
    arcGap: ARC_GAP,
  });

  const [activeIndex, setActiveIndex] = useState(0);
  const [section, setSection] = useState<ArtGallerySection>("pinned");
  const [stageMetrics, setStageMetrics] = useState<StageMetrics>({ height: 480, width: 720 });
  /** After the first section change, panels use fade/translate instead of the pinned intro spin. */
  const [sectionTransitionReady, setSectionTransitionReady] = useState(false);
  /** CascadeIn holds opacity-0 until images settle — arm intro when the entrance actually starts. */
  const [pinnedIntroEnabled, setPinnedIntroEnabled] = useState(!cascade);
  const introArmTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (introArmTimeoutRef.current !== null) {
        window.clearTimeout(introArmTimeoutRef.current);
      }
    };
  }, []);

  const sortedPieces = useMemo(() => sortArtPiecesByYear(pieces), [pieces]);
  const yearSpans = useMemo(() => artPieceYearSpans(sortedPieces), [sortedPieces]);

  const layout = useMemo(
    () => computeRouletteLayout(sortedPieces, stageMetrics),
    [sortedPieces, stageMetrics],
  );
  const { angleStep, radius, slotH, count } = layout;

  const applyWheelTransform = useCallback((deg: number) => {
    const layout = layoutRef.current;
    applyWheelTransformToCards(deg, cardRefs.current, layout);
    const focus = scrollFocusFromDeg(deg, layout.angleStep, layout.count);
    applyTrackerStyles(focus, layout.count, underscoreRefs.current);
  }, []);

  const snapTarget = useCallback(
    (index: number) => normalizeDeg(-index * angleStep),
    [angleStep],
  );

  const updateActiveIndex = useCallback(
    (deg: number) => {
      if (count === 0) return;
      const raw = normalizeDeg(-deg);
      const idx = Math.round(raw / angleStep) % count;
      if (idx === activeIndexRef.current) return;
      activeIndexRef.current = idx;
      setActiveIndex(idx);
    },
    [angleStep, count],
  );

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current !== null) return;

    const tick = () => {
      if (draggingRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      const raw = normalizeDeg(-rotationRef.current);
      const nearestIdx = count > 0 ? Math.round(raw / angleStep) % count : 0;
      const target = snapTarget(nearestIdx);
      const delta = shortestSignedDelta(rotationRef.current, target);

      velocityRef.current *= VELOCITY_DAMPING;

      if (Math.abs(velocityRef.current) > VELOCITY_CUTOFF) {
        rotationRef.current += velocityRef.current;
      } else {
        rotationRef.current += delta * SNAP_STRENGTH;
        if (Math.abs(delta) < 0.045 && Math.abs(velocityRef.current) <= VELOCITY_CUTOFF) {
          rotationRef.current = target;
          velocityRef.current = 0;
          applyWheelTransform(target);
          updateActiveIndex(target);
          stopLoop();
          return;
        }
      }

      applyWheelTransform(rotationRef.current);
      updateActiveIndex(rotationRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [angleStep, count, applyWheelTransform, snapTarget, stopLoop, updateActiveIndex]);

  const nudgeRotation = useCallback(
    (deltaDeg: number, withMomentum = true) => {
      rotationRef.current += deltaDeg;
      if (withMomentum) velocityRef.current += deltaDeg * MOMENTUM_GAIN;
      applyWheelTransform(rotationRef.current);
      updateActiveIndex(rotationRef.current);
      startLoop();
    },
    [applyWheelTransform, startLoop, updateActiveIndex],
  );

  const handleSectionChange = useCallback(
    (id: string) => {
      const next = id as ArtGallerySection;
      if (next === section) return;
      setSectionTransitionReady(true);
      setSection(next);
    },
    [section],
  );

  const assignCardRef = useCallback((index: number, el: HTMLDivElement | null) => {
    cardRefs.current[index] = el;
  }, []);

  const assignUnderscoreRef = useCallback((index: number, el: HTMLSpanElement | null) => {
    underscoreRefs.current[index] = el;
  }, []);

  useLayoutEffect(() => {
    layoutRef.current = layout;
    cardRefs.current.length = count;
    underscoreRefs.current.length = count;
    applyWheelTransform(rotationRef.current);
  }, [applyWheelTransform, layout, count, slotH, radius, angleStep]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      nudgeRotation(-event.deltaY * WHEEL_SENSITIVITY);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [nudgeRotation]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPointerDown = (event: PointerEvent) => {
      draggingRef.current = true;
      lastPointerYRef.current = event.clientY;
      velocityRef.current = 0;
      el.setPointerCapture(event.pointerId);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const dy = event.clientY - lastPointerYRef.current;
      lastPointerYRef.current = event.clientY;
      nudgeRotation(dy * DRAG_SENSITIVITY, false);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      if (el.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId);
      }
      startLoop();
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [nudgeRotation, startLoop]);

  useEffect(() => {
    const el = stageShellRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      const height = Math.floor(rect.height);
      const width = Math.floor(rect.width);
      if (height > 120 && width > 80) {
        setStageMetrics((prev) =>
          prev.height === height && prev.width === width ? prev : { height, width },
        );
      }
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => stopLoop, [stopLoop]);

  useLayoutEffect(() => {
    if (section === "other") {
      applyWheelTransform(rotationRef.current);
    } else {
      draggingRef.current = false;
      velocityRef.current = 0;
      stopLoop();
    }

    const el = stageShellRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const height = Math.floor(rect.height);
    const width = Math.floor(rect.width);
    if (height > 120 && width > 80) {
      setStageMetrics((prev) =>
        prev.height === height && prev.width === width ? prev : { height, width },
      );
    }
  }, [section, applyWheelTransform, stopLoop]);

  const roulette = (
    <div
      className="absolute inset-0 min-w-0 overflow-hidden"
      style={{
        touchAction: "none",
        "--stage-top-inset": STAGE_TOP_INSET,
        "--stage-left-inset": STAGE_LEFT_INSET,
        "--pivot-top": PIVOT_TOP_RATIO,
        "--edge-feather": EDGE_FEATHER,
      } as React.CSSProperties}
    >
      <ArtScrollTracker
        pieces={sortedPieces}
        yearSpans={yearSpans}
        assignUnderscoreRef={assignUnderscoreRef}
      />

      {/* Roulette stage — pivot left; arc bows right; overflow clips the wheel */}
      <div
        ref={containerRef}
        className="absolute bottom-0 right-0 cursor-grab overflow-hidden active:cursor-grabbing"
        style={{
          top: STAGE_TOP_INSET,
          left: STAGE_LEFT_INSET,
          WebkitMaskImage: EDGE_FEATHER_MASK,
          maskImage: EDGE_FEATHER_MASK,
        }}
        aria-label="Art roulette gallery. Scroll or drag vertically to browse pieces."
        role="region"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "PageDown") {
            event.preventDefault();
            nudgeRotation(angleStep);
          } else if (event.key === "ArrowUp" || event.key === "PageUp") {
            event.preventDefault();
            nudgeRotation(-angleStep);
          }
        }}
      >
        <div
          className="absolute h-0 w-0 -translate-x-1/2 -translate-y-1/2"
          style={{ left: PIVOT_LEFT, top: PIVOT_TOP }}
        >
          {sortedPieces.map((p, i) => {
            if (indexDistance(i, activeIndex, count) <= IMAGE_LOAD_RADIUS) {
              loadedImageIndicesRef.current.add(i);
            }
            const loadImage = loadedImageIndicesRef.current.has(i);
            return (
              <ArtGalleryCard
                key={p.file}
                piece={p}
                index={i}
                slotH={slotH}
                loadImage={loadImage}
                assignRef={assignCardRef}
              />
            );
          })}
        </div>
      </div>
    </div>
  );

  const stageShellMinH = fillHeight ? STAGE_SHELL_MIN_H_FILL : STAGE_SHELL_MIN_H;

  const content = (
    <div
      className={`flex min-w-0 w-full flex-col ${
        fillHeight ? "min-h-0 flex-1" : ""
      }`}
    >
      <div ref={stageShellRef} className={`relative min-h-0 flex-1 ${stageShellMinH}`}>
        <div
          className={`art-gallery-panel absolute inset-0 ${
            section === "other"
              ? sectionTransitionReady
                ? "art-gallery-panel--enter"
                : "art-gallery-panel--shown"
              : sectionTransitionReady
                ? "art-gallery-panel--exit"
                : "art-gallery-panel--idle"
          }`}
          aria-hidden={section !== "other"}
        >
          {roulette}
        </div>
        <div
          className={`art-gallery-panel absolute inset-0 ${
            section === "pinned"
              ? sectionTransitionReady
                ? "art-gallery-panel--enter"
                : "art-gallery-panel--shown"
              : sectionTransitionReady
                ? "art-gallery-panel--exit"
                : "art-gallery-panel--idle"
          }`}
          aria-hidden={section !== "pinned"}
        >
          <PinnedArtCarousel
            pieces={PINNED_ART_PIECES}
            stageHeight={stageMetrics.height}
            stageWidth={stageMetrics.width}
            active={section === "pinned"}
            introEnabled={pinnedIntroEnabled}
          />
        </div>
      </div>

      <div
        className={`flex shrink-0 items-center justify-center pt-[clamp(10px,1.2vw,16px)] ${
          fillHeight ? "pb-[5vh]" : "pb-[clamp(16px,2vh,24px)]"
        }`}
      >
        <IndexedSelector
          items={ART_GALLERY_SECTIONS}
          value={section}
          onChange={handleSectionChange}
          ariaLabel="Art gallery section"
          showArrow={false}
        />
      </div>
    </div>
  );

  if (cascade) {
    return (
      <CascadeIn
        step={cascadeBaseStep}
        className={`min-w-0 w-full ${fillHeight ? "flex min-h-0 flex-1 flex-col" : ""}`}
        onReady={() => {
          // Arm intro when the cascade fade begins (after step delay), not while opacity-0.
          if (introArmTimeoutRef.current !== null) {
            window.clearTimeout(introArmTimeoutRef.current);
          }
          introArmTimeoutRef.current = window.setTimeout(
            () => setPinnedIntroEnabled(true),
            cascadeBaseStep * CASCADE_STEP_MS,
          );
        }}
      >
        {content}
      </CascadeIn>
    );
  }

  return content;
}
