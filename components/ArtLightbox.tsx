"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

export type LightboxItem = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption?: string;
};

type Props = {
  items: LightboxItem[];
  /** Index of the open item, or null when closed. */
  index: number | null;
  onIndexChange: (index: number | null) => void;
};

const CLOSE_MS = 220;
/**
 * On touch, the browser fires a compat `click` right after the tap that opened the
 * viewer — by then the backdrop is under the finger and would close it instantly.
 */
const OPEN_CLICK_GUARD_MS = 400;
const SWIPE_MIN_PX = 50;

/**
 * Full-screen viewer for a single art piece. Rendered in a portal so the
 * gallery's masks/overflow never clip it. Esc / backdrop / × close it;
 * ← → (or the side buttons) step through `items`.
 */
export default function ArtLightbox({ items, index, onIndexChange }: Props) {
  /** Item kept on screen while the close animation plays. */
  const [shownIndex, setShownIndex] = useState<number | null>(index);
  const [visible, setVisible] = useState(false);
  const [prevIndex, setPrevIndex] = useState<number | null>(index);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const openedAtRef = useRef(0);
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  // Sync with `index` during render (React's "adjust state on prop change" pattern).
  if (index !== prevIndex) {
    setPrevIndex(index);
    if (index !== null) setShownIndex(index);
    else setVisible(false);
  }

  useEffect(() => {
    if (index !== null) {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    const t = window.setTimeout(() => setShownIndex(null), CLOSE_MS);
    return () => window.clearTimeout(t);
  }, [index]);

  const isOpen = index !== null;
  const count = items.length;

  const close = useCallback(() => onIndexChange(null), [onIndexChange]);
  const onBackdropClick = useCallback(() => {
    if (performance.now() - openedAtRef.current < OPEN_CLICK_GUARD_MS) return;
    close();
  }, [close]);
  const step = useCallback(
    (dir: 1 | -1) => {
      if (index === null || count === 0) return;
      onIndexChange((index + dir + count) % count);
    },
    [index, count, onIndexChange],
  );

  // Scroll lock + focus: once per open, restored on close.
  useEffect(() => {
    if (!isOpen) return;
    openedAtRef.current = performance.now();
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus({ preventScroll: true });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
      restoreFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, close, step]);

  // shownIndex is only ever non-null after a client interaction, so document exists.
  if (shownIndex === null) return null;
  const item = items[shownIndex];
  if (!item) return null;

  const btn =
    "flex items-center justify-center rounded-full border border-foreground/20 bg-background/70 text-foreground/80 backdrop-blur-sm transition-colors hover:border-foreground/50 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.alt}
      className="fixed inset-0 z-[9000] flex items-center justify-center"
      onTouchStart={(e) => {
        const t = e.touches[0];
        swipeStartRef.current = t ? { x: t.clientX, y: t.clientY } : null;
      }}
      onTouchEnd={(e) => {
        const start = swipeStartRef.current;
        swipeStartRef.current = null;
        const t = e.changedTouches[0];
        if (!start || !t) return;
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        // Horizontal swipe steps through pieces; vertical/short moves are ignored.
        if (Math.abs(dx) > SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
          step(dx < 0 ? 1 : -1);
        }
      }}
      style={{
        opacity: visible ? 1 : 0,
        transition: `opacity ${CLOSE_MS}ms ease-out`,
      }}
    >
      {/* Backdrop — click to close */}
      <div
        className="absolute inset-0 bg-background/90 backdrop-blur-md"
        onClick={onBackdropClick}
        aria-hidden
      />

      <figure
        className="pointer-events-none relative z-10 m-0 flex max-h-full flex-col items-center px-4 py-14 sm:px-20"
        style={{
          transform: visible ? "scale(1)" : "scale(0.97)",
          transition: `transform ${CLOSE_MS + 80}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
      >
        <Image
          key={item.src}
          src={item.src}
          alt={item.alt}
          width={item.width}
          height={item.height}
          unoptimized
          priority
          className="pointer-events-auto block h-auto max-h-[calc(100dvh-8rem)] w-auto max-w-full select-none object-contain shadow-[0_8px_40px_rgba(80,46,46,0.18)]"
          draggable={false}
        />
        <figcaption className="mt-3 font-general text-[13px] tracking-wide text-foreground/60">
          {item.caption ? `${item.caption} · ` : ""}
          {shownIndex + 1} / {count}
        </figcaption>
      </figure>

      <button
        ref={closeBtnRef}
        type="button"
        onClick={close}
        aria-label="Close"
        className={`${btn} absolute right-4 top-4 z-20 h-10 w-10 text-xl leading-none`}
      >
        ×
      </button>

      {count > 1 ? (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous piece"
            className={`${btn} absolute bottom-5 left-5 z-20 h-11 w-11 sm:bottom-auto sm:left-6 sm:top-1/2 sm:h-10 sm:w-10 sm:-translate-y-1/2`}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next piece"
            className={`${btn} absolute bottom-5 right-5 z-20 h-11 w-11 sm:bottom-auto sm:right-6 sm:top-1/2 sm:h-10 sm:w-10 sm:-translate-y-1/2`}
          >
            ›
          </button>
        </>
      ) : null}
    </div>,
    document.body,
  );
}
