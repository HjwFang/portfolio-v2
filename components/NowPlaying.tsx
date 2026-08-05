"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

import CrossingCornerBorder from "@/components/CrossingCornerBorder";

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
const PROMOTED_KEY = "np-promoted";
const PROMOTED_MAX = 10;

function readPromoted(): Track[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROMOTED_KEY);
    return raw ? (JSON.parse(raw) as Track[]) : [];
  } catch {
    return [];
  }
}

const WAVE_HEIGHTS = [
  40, 70, 100, 55, 85, 45, 95, 60, 30, 75, 100, 50, 80, 40, 65, 90, 55, 35,
];

function SoundWave() {
  return (
    <div className="flex items-center gap-[2px] h-[clamp(9px,0.7vw,12px)]" aria-hidden>
      {WAVE_HEIGHTS.map((h, i) => (
        <span
          key={i}
          className="now-playing-bar w-[1.5px] rounded-full bg-light-brown"
          style={{ height: `${h}%`, animationDelay: `${(i % 5) * 0.12}s` }}
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
}: {
  children: React.ReactNode;
  wave?: boolean;
  cascadeStep?: number;
  reveal?: boolean;
}) {
  return (
    <div
      style={{ "--cascade-step": cascadeStep } as React.CSSProperties}
      className={`${
        reveal ? "now-playing-cascade " : ""
      }flex items-center gap-[clamp(8px,0.8vw,12px)] mb-[clamp(5px,0.4vw,9px)]`}
    >
      <span className="font-general font-medium leading-snug text-foreground text-[clamp(11px,0.833vw,14px)] whitespace-nowrap">
        {children}
      </span>
      {wave && (
        <div className="min-w-0 flex-1 overflow-hidden">
          <SoundWave />
        </div>
      )}
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
  const content = (
    <a
      href={track.url}
      target="_blank"
      rel="noreferrer"
      className={`group/row flex w-full items-center justify-between gap-[clamp(6px,0.7vw,12px)] p-[clamp(7px,0.6vw,10px)] transition-colors ${
        highlight
          ? "text-background"
          : "text-foreground/80 hover:bg-foreground/10 hover:text-foreground"
      }`}
    >
      <span className="flex min-w-0 flex-1 items-center gap-[clamp(8px,0.8vw,12px)]">
        <img
          src={track.albumArt}
          alt=""
          className="aspect-square h-[clamp(30px,2.6vw,40px)] w-[clamp(30px,2.6vw,40px)] object-cover shrink-0"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-general text-[clamp(11px,0.75vw,14px)]">
            {track.title}
          </span>
          <span
            className={`block truncate font-quicksand font-medium leading-snug text-[clamp(10px,0.677vw,12px)] ${
              highlight ? "text-background/70" : "text-foreground/60"
            }`}
          >
            {track.artist}
          </span>
        </span>
      </span>
      <span
        className={`shrink-0 font-quicksand text-[clamp(11px,0.677vw,13px)] opacity-70 ${
          highlight ? "visible" : "invisible group-hover/row:visible"
        }`}
        aria-hidden
      >
        »»
      </span>
    </a>
  );

  if (highlight) {
    return (
      <div
        data-flip-id={track.id}
        style={{ "--cascade-step": cascadeStep } as React.CSSProperties}
        className={`${reveal ? "now-playing-cascade " : ""}w-full`}
      >
        <CrossingCornerBorder
          color="#c4a484"
          bleed="clamp(2px, 0.208vw, 4px)"
          thickness="clamp(1px, 0.052vw, 1px)"
          className="flex w-full bg-foreground"
        >
          {content}
        </CrossingCornerBorder>
      </div>
    );
  }

  return (
    <div
      data-flip-id={track.id}
      style={{ "--cascade-step": cascadeStep } as React.CSSProperties}
      className={`${reveal ? "now-playing-cascade " : ""}flex w-full`}
    >
      {content}
    </div>
  );
}

export function NowPlaying() {
  const [data, setData] = useState<{ nowPlaying: Track | null; recent: Track[] } | null>(null);
  // Songs promoted into "recently played" locally, so a track that just
  // finished shows up immediately instead of waiting on Spotify's lagging API.
  // Persisted to localStorage so it survives reloads.
  const [promoted, setPromoted] = useState<Track[]>(readPromoted);
  // Latest observed state of the live song (id + how long it has been playing).
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
    try {
      window.localStorage.setItem(PROMOTED_KEY, JSON.stringify(promoted));
    } catch {
      /* ignore quota/serialization errors */
    }
  }, [promoted]);

  useEffect(() => {
    const load = () =>
      fetch("/api/spotify")
        .then((r) => r.json())
        .then((d: { nowPlaying: Track | null; recent: Track[] }) => {
          setData(d);

          const now = d?.nowPlaying ?? null;
          const prev = liveRef.current;
          // The live song switched away (stopped or changed). If it had racked
          // up at least 30s of play, move it into recently played.
          if (prev && prev.id !== now?.id) {
            if ((prev.progressMs ?? 0) >= MIN_PLAY_MS) {
              // Mark this track so the next FLIP pass gives it the fade-through
              // travel from the now-playing slot down into recently played.
              promotedIdRef.current = prev.id;
              setPromoted((p) =>
                [prev, ...p.filter((t) => t.id !== prev.id)].slice(0, PROMOTED_MAX)
              );
            }
          }
          liveRef.current = now;
        })
        .catch(() => {});
    load();
    const id = setInterval(load, 10000);
    return () => clearInterval(id);
  }, []);

  // Hand motion over from the one-time CSS cascade to FLIP once the initial
  // reveal has finished playing (longest delayed row + its duration).
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 2600);
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

  if (!data)
    return (
      <div className="font-quicksand font-light text-foreground/40 text-[clamp(9px,0.62vw,12px)]">
        loading…
      </div>
    );

  // Local promotions sit ahead of Spotify's recently-played, deduped by id.
  const recent = [
    ...promoted,
    ...data.recent.filter((t) => !promoted.some((p) => p.id === t.id)),
  ];

  const featured = data.nowPlaying ?? recent[0] ?? null;
  const rest = recent.filter((t) => t.id !== featured?.id);
  const tracklist = rest.slice(0, 3);

  // Running index so headers + rows cascade sequentially from top to bottom.
  let step = 0;

  const reveal = !revealed;

  return (
    <div
      ref={rootRef}
      className="flex h-full w-full flex-col justify-center gap-[clamp(10px,0.9vw,16px)]"
    >
      {featured && (
        <div className="flex flex-col">
          <SectionHeader wave={!!data.nowPlaying} cascadeStep={step++} reveal={reveal}>
            {data.nowPlaying ? "now playing" : "last played"}
          </SectionHeader>
          <Row
            track={featured}
            cascadeStep={step++}
            highlight={!!data.nowPlaying}
            reveal={reveal}
          />
        </div>
      )}
      {tracklist.length > 0 && (
        <div className="flex flex-col">
          <SectionHeader cascadeStep={step++} reveal={reveal}>
            recently played
          </SectionHeader>
          <div className="flex flex-col">
            {tracklist.map((t) => (
              <Row
                key={t.id + t.playedAt}
                track={t}
                cascadeStep={step++}
                reveal={reveal}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
