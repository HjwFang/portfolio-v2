"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import CascadeIn from "@/components/CascadeIn";
import IndexedSelector from "@/components/IndexedSelector";
import RevealImage from "@/components/RevealImage";
import { IMAGE_BLUR_DATA_URL } from "@/lib/imagePlaceholder";
import {
  artPieceYearSpans,
  sortArtPiecesByYear,
  type ArtDisplayRotateDeg,
  type ArtPiece,
  type ArtPieceYearSpan,
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
/** Top/bottom fade — cards and tracker feather to transparent at the edges. */
const EDGE_FEATHER = "clamp(32px, 9vh, 80px)";

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

/** Matches underscore column `leading-[1.28]`. */
const TRACK_LINE_HEIGHT_EM = 1.28;
/** Ripple falloff — higher = tighter wave around the active slot. */
const TRACK_RIPPLE_DECAY = 0.58;

function scrollTrackerRipple(index: number, focus: number, count: number) {
  const dist = continuousIndexDistance(focus, index, count);
  const wave = Math.exp(-dist * TRACK_RIPPLE_DECAY);
  return {
    opacity: 0.1 + wave * 0.9,
    scaleX: 0.45 + wave * 1.15,
    scaleY: 0.7 + wave * 0.5,
    wave,
  };
}

/** Minimum px gap between adjacent card bounds on the wheel arc. */
const ARC_GAP = 58;
/** Load full images for the focused card and this many neighbors on each side. */
const IMAGE_LOAD_RADIUS = 4;

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

function computeRouletteLayout(pieces: ArtPiece[], stageH: number) {
  const count = pieces.length;
  const angleStep = count > 0 ? 360 / count : 360;
  let slotH = Math.round(Math.min(320, Math.max(168, stageH * 0.46)));

  for (let attempt = 0; attempt < 10; attempt++) {
    const extent = maxPieceExtent(slotH);
    const minRadius = minRadiusForCount(count, extent, ARC_GAP);
    const radius = Math.ceil(minRadius);

    if (radius <= stageH * 5 || slotH <= 120) {
      return { angleStep, slotH, radius, count };
    }

    slotH = Math.max(120, Math.round(slotH * 0.9));
  }

  const extent = maxPieceExtent(slotH);
  return {
    angleStep,
    slotH,
    radius: Math.ceil(minRadiusForCount(count, extent, ARC_GAP)),
    count,
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
    const { opacity, scaleX, scaleY } = scrollTrackerRipple(i, focus, count);
    el.style.opacity = String(opacity);
    el.style.transform = `scale(${scaleX}, ${scaleY})`;
  }
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
  return (
    <div
      className="pointer-events-none absolute left-0 z-20 -translate-y-1/2 select-none"
      style={{
        top: "calc(var(--stage-top-inset) + (100% - var(--stage-top-inset)) * var(--pivot-top))",
      }}
      aria-hidden
    >
      <div
        className="grid min-w-0 font-mono text-[clamp(12px,1.05vw,16px)] font-medium leading-[1.28] tracking-tight"
        style={{
          gridTemplateColumns: "minmax(1.35em, auto) minmax(2.75em, auto)",
          gridTemplateRows: `repeat(${pieces.length}, ${TRACK_LINE_HEIGHT_EM}em)`,
          columnGap: "clamp(6px, 0.55vw, 10px)",
        }}
      >
        {pieces.map((p, i) => (
          <span
            key={p.file}
            ref={(el) => assignUnderscoreRef(i, el)}
            className="col-start-1 inline-block origin-left will-change-[opacity,transform] self-center"
            style={{ gridRow: i + 1 }}
          >
            _
          </span>
        ))}
        {yearSpans.map(({ year, start, end }, index) => (
          <div
            key={`${year}-${start}`}
            className="col-start-2 flex items-center self-stretch"
            style={{ gridRow: `${start + 1} / ${end + 2}` }}
          >
            <span className="font-quicksand font-light tabular-nums text-[clamp(9px,0.75vw,11px)] leading-[1.15] tracking-tight text-foreground whitespace-nowrap">
              {year}
            </span>
          </div>
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
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const underscoreRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const rotationRef = useRef(0);
  const velocityRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const draggingRef = useRef(false);
  const lastPointerYRef = useRef(0);
  const activeIndexRef = useRef(0);
  const loadedImageIndicesRef = useRef<Set<number>>(new Set());
  const layoutRef = useRef<WheelLayout>({ angleStep: 360, slotH: 168, radius: 220, count: 0 });

  const [activeIndex, setActiveIndex] = useState(0);
  const [section, setSection] = useState<ArtGallerySection>("other");
  const [stageH, setStageH] = useState(480);

  const sortedPieces = useMemo(() => sortArtPiecesByYear(pieces), [pieces]);
  const yearSpans = useMemo(() => artPieceYearSpans(sortedPieces), [sortedPieces]);

  const layout = useMemo(
    () => computeRouletteLayout(sortedPieces, stageH),
    [sortedPieces, stageH],
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
      nudgeRotation(event.deltaY * WHEEL_SENSITIVITY);
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
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const h = Math.floor(el.getBoundingClientRect().height);
      if (h > 120) setStageH(h);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => stopLoop, [stopLoop]);

  useLayoutEffect(() => {
    if (section !== "other") {
      draggingRef.current = false;
      velocityRef.current = 0;
      stopLoop();
      return;
    }

    applyWheelTransform(rotationRef.current);
    const el = containerRef.current;
    if (!el) return;
    const h = Math.floor(el.getBoundingClientRect().height);
    if (h > 120) setStageH(h);
  }, [section, applyWheelTransform, stopLoop]);

  const roulette = (
    <div
      className="relative h-full min-h-0 min-w-0 w-full overflow-hidden"
      style={{
        touchAction: "none",
        "--stage-top-inset": STAGE_TOP_INSET,
        "--pivot-top": PIVOT_TOP_RATIO,
        "--edge-feather": EDGE_FEATHER,
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent, black var(--edge-feather), black calc(100% - var(--edge-feather)), transparent)",
        maskImage:
          "linear-gradient(to bottom, transparent, black var(--edge-feather), black calc(100% - var(--edge-feather)), transparent)",
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
        className="absolute bottom-0 right-0 left-[clamp(60px,6vw,92px)] cursor-grab overflow-hidden active:cursor-grabbing"
        style={{ top: STAGE_TOP_INSET }}
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

  const content = (
    <div
      className={`flex min-w-0 w-full flex-col ${
        fillHeight ? "min-h-0 flex-1" : "min-h-[clamp(350px,47vh,580px)]"
      }`}
    >
      <div
        className={`min-h-0 flex-1 ${
          section !== "other" ? "pointer-events-none invisible" : ""
        }`}
        aria-hidden={section !== "other"}
      >
        {roulette}
      </div>

      <div className="flex shrink-0 items-center justify-center pt-[clamp(10px,1.2vw,16px)]">
        <IndexedSelector
          items={ART_GALLERY_SECTIONS}
          value={section}
          onChange={(id) => setSection(id as ArtGallerySection)}
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
      >
        {content}
      </CascadeIn>
    );
  }

  return content;
}
