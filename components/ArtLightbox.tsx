"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import { useSwipeSound } from "@/lib/useSwipeSound";

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

  const playSwipe = useSwipeSound();
  const close = useCallback(() => onIndexChange(null), [onIndexChange]);
  const onBackdropClick = useCallback(() => {
    if (performance.now() - openedAtRef.current < OPEN_CLICK_GUARD_MS) return;
    close();
  }, [close]);
  const step = useCallback(
    (dir: 1 | -1) => {
      if (index === null || count < 2) return;
      playSwipe();
      onIndexChange((index + dir + count) % count);
    },
    [index, count, onIndexChange, playSwipe],
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

  const pad = (n: number) => String(n).padStart(2, "0");

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
      {/* Cream paper wash — keeps the page's dot grid faintly visible. Click to close. */}
      <div
        className="absolute inset-0 bg-background/[0.97] backdrop-blur-[3px]"
        onClick={onBackdropClick}
        aria-hidden
      />

      <figure
        className="pointer-events-none relative z-10 m-0 flex max-h-full flex-col items-center px-5 pb-24 pt-20 sm:px-24 sm:py-[clamp(56px,8vh,96px)]"
        style={{
          transform: visible ? "translateY(0)" : "translateY(10px)",
          transition: `transform ${CLOSE_MS + 120}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
      >
        <CrossingCornerBorder
          bleed="clamp(6px,0.6vw,10px)"
          thickness="clamp(1px,0.1vw,1.5px)"
          className="pointer-events-auto inline-block leading-none"
        >
          <Image
            key={item.src}
            src={item.src}
            alt={item.alt}
            width={item.width}
            height={item.height}
            unoptimized
            priority
            draggable={false}
            className="block h-auto max-h-[calc(100dvh-11rem)] w-auto max-w-[calc(100vw-2.5rem)] select-none object-contain sm:max-h-[calc(100dvh-clamp(112px,16vh,192px)-3rem)] sm:max-w-[calc(100vw-12rem)]"
          />
        </CrossingCornerBorder>
        <figcaption className="mt-[clamp(14px,1.6vh,22px)] flex items-baseline gap-[0.6em] whitespace-nowrap text-foreground">
          <span className="font-quicksand text-[clamp(11px,0.677vw,13px)] opacity-70">
            {pad(shownIndex + 1)} / {pad(count)}
          </span>
          {item.caption ? (
            <span className="font-quicksand text-[clamp(14px,1vw,18px)] font-light">
              {item.caption}
            </span>
          ) : null}
        </figcaption>
      </figure>

      <LightboxButton
        buttonRef={closeBtnRef}
        onClick={close}
        label="Close"
        className="right-5 top-5 sm:right-[clamp(20px,2.5vw,40px)] sm:top-[clamp(20px,2.5vw,40px)]"
      >
        <path d="M5 5l10 10M15 5L5 15" />
      </LightboxButton>

      {count > 1 ? (
        <>
          <LightboxButton
            onClick={() => step(-1)}
            label="Previous piece"
            className="bottom-6 left-5 sm:bottom-auto sm:left-[clamp(20px,2.5vw,40px)] sm:top-1/2 sm:-translate-y-1/2"
          >
            <path d="M12.5 4.5L7 10l5.5 5.5" />
          </LightboxButton>
          <LightboxButton
            onClick={() => step(1)}
            label="Next piece"
            className="bottom-6 right-5 sm:bottom-auto sm:right-[clamp(20px,2.5vw,40px)] sm:top-1/2 sm:-translate-y-1/2"
          >
            <path d="M7.5 4.5L13 10l-5.5 5.5" />
          </LightboxButton>
        </>
      ) : null}
    </div>,
    document.body,
  );
}

/** Dark-brown square control with crossing-corner border — same treatment as the social icons. */
function LightboxButton({
  onClick,
  label,
  className,
  buttonRef,
  children,
}: {
  onClick: () => void;
  label: string;
  className: string;
  buttonRef?: React.Ref<HTMLButtonElement>;
  children: React.ReactNode;
}) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`group absolute z-20 block transition-transform duration-300 active:scale-95 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[6px] focus-visible:outline-foreground ${className}`}
    >
      <CrossingCornerBorder
        bleed="clamp(3px,0.26vw,5px)"
        thickness="clamp(1px,0.052vw,1px)"
        className="flex aspect-square items-center justify-center bg-foreground p-[clamp(8px,0.55vw,10px)] transition-all duration-300 group-hover:bg-[#7a4b4b] group-hover:[--border-color:#dec7b0]"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="square"
          className="size-[clamp(16px,1.1vw,20px)] text-background"
          aria-hidden
        >
          {children}
        </svg>
      </CrossingCornerBorder>
    </button>
  );
}
