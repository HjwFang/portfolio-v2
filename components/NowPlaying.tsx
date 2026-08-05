"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

type Track = {
  id: string;
  title: string;
  artist: string;
  albumArt: string;
  url: string;
  playedAt?: string;
  progressMs?: number;
};

const MIN_PLAY_MS = 30_000;

const WAVE_HEIGHTS = [
  40, 70, 100, 55, 85, 45, 95, 60, 30, 75, 100, 50, 80, 40, 65, 90, 55, 35,
];

function SoundWave() {
  return (
    <div
      className="flex items-center"
      style={{ height: "var(--np-wave-h)", gap: "var(--np-wave-gap)" }}
      aria-hidden
    >
      {WAVE_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className="now-playing-bar rounded-full bg-light-brown"
          style={{
            width: "var(--np-wave-w)",
            height: `${h}%`,
            animationDelay: `${(i % 5) * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

function SectionHeader({
  children,
  wave,
  cascadeStep = 0,
  reveal = true,
  liveSwap = false,
}: {
  children?: React.ReactNode;
  wave?: boolean;
  cascadeStep?: number;
  reveal?: boolean;
  /** When true, labels crossfade between last/now playing and the wave fades. */
  liveSwap?: boolean;
}) {
  const isLive = !!wave;
  return (
    <div
      style={
        {
          "--cascade-step": cascadeStep,
          gap: "var(--np-row-gap)",
          marginBottom: "var(--np-section-gap)",
        } as React.CSSProperties
      }
      className={`${
        reveal ? "now-playing-cascade " : ""
      }flex items-center`}
    >
      {liveSwap ? (
        <span
          className="now-playing-label-swap relative inline-grid font-general font-medium leading-snug text-foreground whitespace-nowrap"
          style={{ fontSize: "var(--np-label)" }}
        >
          {/* Wider label reserves width so the crossfade doesn't shift the wave. */}
          <span className="invisible col-start-1 row-start-1" aria-hidden>
            now playing
          </span>
          <span
            className="col-start-1 row-start-1 transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              opacity: isLive ? 1 : 0,
              transform: isLive ? "translate3d(0,0,0)" : "translate3d(0,3px,0)",
              pointerEvents: isLive ? "auto" : "none",
            }}
          >
            now playing
          </span>
          <span
            className="col-start-1 row-start-1 transition-[opacity,transform] duration-[280ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              opacity: isLive ? 0 : 1,
              transform: isLive ? "translate3d(0,3px,0)" : "translate3d(0,0,0)",
              pointerEvents: isLive ? "none" : "auto",
            }}
          >
            last played
          </span>
        </span>
      ) : (
        <span
          className="font-general font-medium leading-snug text-foreground whitespace-nowrap"
          style={{ fontSize: "var(--np-label)" }}
        >
          {children}
        </span>
      )}
      {liveSwap ? (
        <div
          className="now-playing-wave-slot"
          data-active={isLive ? "true" : "false"}
          aria-hidden={!isLive}
        >
          <SoundWave />
        </div>
      ) : null}
    </div>
  );
}

function Row({
  track,
  cascadeStep = 0,
  highlight = false,
  reveal = true,
}: {
  track: Track;
  cascadeStep?: number;
  highlight?: boolean;
  reveal?: boolean;
}) {
  const L = "var(--np-bleed)";
  const T = "1px";
  const negL = "calc(-1 * var(--np-bleed))";

  return (
    <div
      data-flip-id={track.id}
      style={{ "--cascade-step": cascadeStep } as React.CSSProperties}
      className={`${reveal ? "now-playing-cascade " : ""}w-full`}
    >
      <div
        data-live={highlight ? "true" : "false"}
        className="now-playing-row-shell group/row relative flex w-full"
      >
        {/* Crossing corner edges — fade via --border-color */}
        <div className="now-playing-row-edge pointer-events-none absolute top-0 left-0 h-px w-full" style={{ height: T }} />
        <div className="now-playing-row-edge pointer-events-none absolute bottom-0 left-0 w-full" style={{ height: T }} />
        <div className="now-playing-row-edge pointer-events-none absolute top-0 left-0 h-full" style={{ width: T }} />
        <div
          className="now-playing-row-edge pointer-events-none absolute top-0 left-full h-full -translate-x-full"
          style={{ width: T }}
        />
        <div className="now-playing-row-edge pointer-events-none absolute top-0" style={{ left: negL, width: L, height: T }} />
        <div className="now-playing-row-edge pointer-events-none absolute left-0" style={{ top: negL, width: T, height: L }} />
        <div className="now-playing-row-edge pointer-events-none absolute top-0" style={{ right: negL, width: L, height: T }} />
        <div className="now-playing-row-edge pointer-events-none absolute right-0" style={{ top: negL, width: T, height: L }} />
        <div className="now-playing-row-edge pointer-events-none absolute bottom-0" style={{ left: negL, width: L, height: T }} />
        <div className="now-playing-row-edge pointer-events-none absolute left-0" style={{ bottom: negL, width: T, height: L }} />
        <div className="now-playing-row-edge pointer-events-none absolute bottom-0" style={{ right: negL, width: L, height: T }} />
        <div className="now-playing-row-edge pointer-events-none absolute right-0" style={{ bottom: negL, width: T, height: L }} />

        <a
          href={track.url}
          target="_blank"
          rel="noreferrer"
          style={{ gap: "var(--np-row-gap)", padding: "var(--np-row-pad)" }}
          className="flex w-full items-center justify-between"
        >
          <span
            className="flex min-w-0 flex-1 items-center"
            style={{ gap: "var(--np-row-gap)" }}
          >
            <img
              src={track.albumArt}
              alt=""
              className="aspect-square object-cover shrink-0"
              style={{
                width: "var(--np-art)",
                height: "var(--np-art)",
              }}
            />
            <span className="min-w-0 flex-1">
              <span
                className="block truncate font-general"
                style={{ fontSize: "var(--np-title)" }}
              >
                {track.title}
              </span>
              <span
                className="now-playing-row-artist block truncate font-quicksand font-medium leading-snug"
                style={{ fontSize: "var(--np-artist)" }}
              >
                {track.artist}
              </span>
            </span>
          </span>
          <span
            className="now-playing-row-chevron shrink-0 font-quicksand"
            style={{ fontSize: "var(--np-meta)" }}
            aria-hidden
          >
            »»
          </span>
        </a>
      </div>
    </div>
  );
}

function SkeletonBone({
  className = "",
  style,
  delay = 0,
}: {
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  return (
    <span
      className={`now-playing-skeleton-bone block ${className}`}
      style={{ ...style, animationDelay: `${delay}s` }}
      aria-hidden
    />
  );
}

function SkeletonRow({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="flex w-full items-center"
      style={{
        gap: "var(--np-row-gap)",
        padding: "var(--np-row-pad)",
      }}
    >
      <SkeletonBone
        className="shrink-0 aspect-square"
        style={{ width: "var(--np-art)", height: "var(--np-art)" }}
        delay={delay}
      />
      <span className="flex min-w-0 flex-1 flex-col" style={{ gap: "var(--np-section-gap)" }}>
        <SkeletonBone
          style={{ height: "var(--np-title)", width: "62%" }}
          delay={delay + 0.05}
        />
        <SkeletonBone
          style={{ height: "var(--np-artist)", width: "38%" }}
          delay={delay + 0.1}
        />
      </span>
    </div>
  );
}

function NowPlayingSkeleton() {
  return (
    <div
      className="flex w-full min-h-0 flex-col"
      style={{ gap: "var(--np-gap)" }}
      role="status"
      aria-label="Loading tracks"
    >
      <div className="flex flex-col">
        <div style={{ marginBottom: "var(--np-section-gap)" }}>
          <SkeletonBone
            style={{ height: "var(--np-label)", width: "22%" }}
            delay={0}
          />
        </div>
        <SkeletonRow delay={0.08} />
      </div>
      <div className="flex flex-col">
        <div style={{ marginBottom: "var(--np-section-gap)" }}>
          <SkeletonBone
            style={{ height: "var(--np-label)", width: "30%" }}
            delay={0.16}
          />
        </div>
        <div className="flex flex-col">
          <SkeletonRow delay={0.22} />
          <SkeletonRow delay={0.3} />
          <SkeletonRow delay={0.38} />
          <SkeletonRow delay={0.46} />
          <SkeletonRow delay={0.54} />
          <SkeletonRow delay={0.62} />
          <SkeletonRow delay={0.7} />
          <SkeletonRow delay={0.78} />
        </div>
      </div>
      {/* Match live list: clear the bottom feather when scrolled to the end. */}
      <div aria-hidden style={{ height: "var(--np-feather)", flexShrink: 0 }} />
    </div>
  );
}

export function NowPlaying() {
  const [data, setData] = useState<{ nowPlaying: Track | null; recent: Track[] } | null>(null);
  // Latest observed live song — used only to detect transitions for FLIP.
  const liveRef = useRef<Track | null>(null);

  // Root element used to scope FLIP measurements to this widget's rows.
  const rootRef = useRef<HTMLDivElement>(null);
  // Last painted position of every row, keyed by track id, so we can invert.
  const prevRects = useRef<Map<string, DOMRect>>(new Map());
  // The track that just left "now playing" for "recently played" this update.
  // It gets the special fade-through (fade out, keep sliding, fade back in).
  const promotedIdRef = useRef<string | null>(null);
  // Initial mount uses the CSS cascade reveal; afterwards FLIP owns motion.
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Drop legacy per-browser promotions so every device shows the server list.
    try {
      window.localStorage.removeItem("np-promoted");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/spotify")
        .then(async (r) => {
          let d: { nowPlaying?: Track | null; recent?: Track[] } | null = null;
          try {
            d = (await r.json()) as { nowPlaying?: Track | null; recent?: Track[] };
          } catch {
            return;
          }
          if (cancelled) return;
          const recent = Array.isArray(d?.recent) ? d.recent : [];
          setData({ nowPlaying: d?.nowPlaying ?? null, recent });

          const now = d?.nowPlaying ?? null;
          const prev = liveRef.current;
          // Song left now-playing after enough play — animate the drop into recent.
          // The server already prepends it to `recent`; we only mark the FLIP id.
          if (prev && prev.id !== now?.id && (prev.progressMs ?? 0) >= MIN_PLAY_MS) {
            promotedIdRef.current = prev.id;
          }
          liveRef.current = now;
        })
        .catch(() => {});
    load();
    // Now-playing should feel live; server caches ~15s so this won't burn quota.
    const id = setInterval(load, 15_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Hand motion over from the one-time CSS cascade to FLIP once the initial
  // reveal has finished playing (longest delayed row + its duration).
  // Max step ≈ 10 (featured + header + 8 recent) × 180ms + 1.1s anim ≈ 2.9s.
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 3200);
    return () => clearTimeout(t);
  }, []);

  // FLIP: after each render, compare every row's new position to where it was
  // last frame and play the inverse so re-ordering looks like real movement.
  useIsoLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const nodes = Array.from(
      root.querySelectorAll<HTMLElement>("[data-flip-id]")
    );
    const nextRects = new Map<string, DOMRect>();
    nodes.forEach((node) => {
      const id = node.dataset.flipId;
      if (id) nextRects.set(id, node.getBoundingClientRect());
    });

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Skip animating on the initial reveal (the CSS cascade handles that) and
    // when the user prefers reduced motion — just record positions.
    if (revealed && !reduceMotion) {
      const promotedId = promotedIdRef.current;
      const easing = "cubic-bezier(0.22, 1, 0.36, 1)";

      nodes.forEach((node) => {
        const id = node.dataset.flipId;
        if (!id) return;
        const rect = nextRects.get(id)!;
        const prev = prevRects.current.get(id);

        if (!prev) {
          // Newly appeared row (e.g. a fresh now-playing track): gentle fade-in.
          node.animate(
            [
              { opacity: 0, transform: "translate3d(0, 6px, 0)" },
              { opacity: 1, transform: "translate3d(0, 0, 0)" },
            ],
            { duration: 460, easing }
          );
          return;
        }

        const dx = prev.left - rect.left;
        const dy = prev.top - rect.top;
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;

        if (id === promotedId) {
          // The song leaving now-playing: slide the whole way down while it
          // fades out, then fades back in as it settles under recently played.
          node.animate(
            [
              { transform: `translate3d(${dx}px, ${dy}px, 0)`, opacity: 1 },
              { opacity: 0, offset: 0.45 },
              { transform: "translate3d(0, 0, 0)", opacity: 1 },
            ],
            { duration: 900, easing }
          );
        } else {
          // Rows pushed down by the incoming track just glide into place.
          node.animate(
            [
              { transform: `translate3d(${dx}px, ${dy}px, 0)` },
              { transform: "translate3d(0, 0, 0)" },
            ],
            { duration: 620, easing }
          );
        }
      });

      promotedIdRef.current = null;
    }

    prevRects.current = nextRects;
  });

  if (!data) return <NowPlayingSkeleton />;

  const recent = data.recent;
  const featured = data.nowPlaying ?? recent[0] ?? null;
  const tracklist = recent.filter((t) => t.id !== featured?.id);

  // Running index so headers + rows cascade sequentially from top to bottom.
  let step = 0;

  const reveal = !revealed;

  if (!featured) {
    return (
      <div
        className="font-quicksand font-light text-foreground/40"
        style={{ fontSize: "var(--np-status)" }}
      >
        no recent tracks
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className="flex w-full min-h-0 flex-col"
      style={{ gap: "var(--np-gap)" }}
    >
      <div className="flex flex-col">
        <SectionHeader
          liveSwap
          wave={!!data.nowPlaying}
          cascadeStep={step++}
          reveal={reveal}
        />
        <Row
          track={featured}
          cascadeStep={step++}
          highlight={!!data.nowPlaying}
          reveal={reveal}
        />
      </div>
      {tracklist.length > 0 && (
        <div className="flex flex-col">
          <SectionHeader cascadeStep={step++} reveal={reveal}>
            recently played
          </SectionHeader>
          <div className="flex flex-col">
            {tracklist.map((t) => (
              <Row
                key={t.id + (t.playedAt ?? "")}
                track={t}
                cascadeStep={step++}
                reveal={reveal}
              />
            ))}
          </div>
        </div>
      )}
      {/* Scroll past the bottom feather so the last track stays fully visible. */}
      <div aria-hidden style={{ height: "var(--np-feather)", flexShrink: 0 }} />
    </div>
  );
}
