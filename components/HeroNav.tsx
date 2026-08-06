"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import { useHeroNavHoverContext } from "@/components/HeroNavHoverContext";
import { readHomeNavigationFromUrl, writeSectionToUrl } from "@/lib/homeNavigation";
import { useSwipeSound } from "@/lib/useSwipeSound";

const ITEMS = [
  { num: "01", label: "experiences" },
  { num: "02", label: "projects" },
  { num: "03", label: "misc gallery" },
] as const;

function isFormElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  const role = target.getAttribute("role");
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    target.isContentEditable ||
    role === "textbox" ||
    role === "searchbox"
  );
}

export default function HeroNav() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeIndex = selectedIndex;
  const heroNavHoverCtx = useHeroNavHoverContext();
  const setContextHoveredIndex = heroNavHoverCtx?.setHoveredIndex;
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [slideRect, setSlideRect] = useState<{ top: number; height: number } | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const playSwipe = useSwipeSound();
  const isFirstRender = useRef(true);
  const hasRestoredFromUrl = useRef(false);

  useLayoutEffect(() => {
    if (hasRestoredFromUrl.current) return;
    // Must stay an effect: `readHomeNavigationFromUrl` reads `window.location`,
    // which doesn't exist during SSR — the server-rendered default has to match
    // the first client render, then this syncs from the URL post-hydration.
    const { sectionIndex } = readHomeNavigationFromUrl();
    hasRestoredFromUrl.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedIndex(sectionIndex);
    setContextHoveredIndex?.(sectionIndex);
  }, [setContextHoveredIndex]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    playSwipe();
  }, [selectedIndex, playSwipe]);

  useLayoutEffect(() => {
    const list = listRef.current;
    const itemEl = itemRefs.current[activeIndex];
    if (!list || !itemEl) return;
    const listRect = list.getBoundingClientRect();
    const itemRect = itemEl.getBoundingClientRect();
    // Round to whole pixels for a crisp clip edge (no subpixel blur)
    const top = Math.round(itemRect.top - listRect.top);
    const height = Math.round(itemRect.height);
    setSlideRect({ top, height });
  }, [activeIndex]);

  // Keep attraction/content state aligned with the clicked nav item.
  useEffect(() => {
    setContextHoveredIndex?.(activeIndex);
    if (!hasRestoredFromUrl.current) return;
    writeSectionToUrl(activeIndex);
  }, [activeIndex, setContextHoveredIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isFormElement(e.target as EventTarget)) return;
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + ITEMS.length) % ITEMS.length);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % ITEMS.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const progressWidth = `${((activeIndex + 1) / ITEMS.length) * 100}%`;

  return (
    <nav
      className="w-full pointer-events-auto"
      role="listbox"
      aria-label="Section navigation"
      aria-activedescendant={`nav-item-${activeIndex}`}
      tabIndex={0}
    >
      <div className="relative">
        {slideRect !== null && (
          <>
            <div
              className="absolute left-0 right-0 transition-[top,height] duration-300 ease-out z-0"
              style={{ top: slideRect.top, height: slideRect.height }}
              aria-hidden
            >
              <CrossingCornerBorder
                bleed="clamp(2px, 0.208vw, 4px)"
                thickness="clamp(1px, 0.052vw, 1px)"
                className="h-full w-full bg-foreground"
              >
                <div className="h-full w-full" />
              </CrossingCornerBorder>
            </div>
            {/* Beige text overlay: only visible where the sliding rect is; whole-pixel rect for a crisp cut */}
            <div
              className="absolute left-0 right-0 overflow-hidden transition-[top,height] duration-300 ease-out z-20 pointer-events-none"
              style={{ top: slideRect.top, height: slideRect.height }}
              aria-hidden
            >
              <div
                className="flex flex-col w-full text-background transition-[transform] duration-300 ease-out"
                style={{ transform: `translate3d(0, -${slideRect.top}px, 0)` }}
              >
                {ITEMS.map((item, index) => (
                  <div
                    key={item.num}
                    className="w-full flex items-center justify-between gap-[clamp(6px,1vw,18px)] px-[clamp(8px,0.625vw,12px)] py-[clamp(5px,0.35vw,7px)]"
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-[clamp(6px,0.7vw,10px)] font-general font-medium tracking-tight leading-none text-[clamp(14px,0.9vw,16px)]">
                      <span className="tabular-nums shrink-0 text-[0.8em] opacity-50">{item.num}</span>
                      <span>{item.label}</span>
                    </span>
                    <span
                      className={`shrink-0 font-quicksand text-[clamp(11px,0.677vw,13px)] opacity-70 ${
                        hoveredIndex === index || activeIndex === index ? "" : "invisible"
                      }`}
                      aria-hidden
                    >
                      »»
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        <ul ref={listRef} className="relative z-10 flex flex-col">
          {ITEMS.map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <li
                key={item.num}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
              >
                <div
                  id={`nav-item-${index}`}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => setSelectedIndex(index)}
                  onMouseEnter={() => {
                    setHoveredIndex(index);
                  }}
                  onMouseLeave={() => {
                    setHoveredIndex(-1);
                  }}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(-1)}
                  className={
                    isActive
                      ? "w-full flex items-center justify-between gap-[clamp(6px,1vw,18px)] bg-transparent px-[clamp(8px,0.625vw,12px)] py-[clamp(5px,0.35vw,7px)] text-foreground transition-colors hover:bg-foreground/5 cursor-pointer"
                      : "w-full flex items-center justify-between gap-[clamp(6px,1vw,18px)] px-[clamp(8px,0.625vw,12px)] py-[clamp(5px,0.35vw,7px)] text-foreground/80 transition-colors hover:bg-foreground/10 hover:text-foreground cursor-pointer"
                  }
                >
                  <span className="flex min-w-0 flex-1 items-center gap-[clamp(6px,0.7vw,10px)] font-general font-medium tracking-tight leading-none text-[clamp(14px,0.9vw,16px)]">
                    <span className="tabular-nums shrink-0 text-[0.8em] opacity-50">{item.num}</span>
                    <span>{item.label}</span>
                  </span>
                  <span
                    className={`shrink-0 font-quicksand text-[clamp(11px,0.677vw,13px)] opacity-70 ${
                      hoveredIndex === index || isActive ? "" : "invisible"
                    }`}
                    aria-hidden
                  >
                    »»
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-[clamp(6px,0.7vw,10px)] flex items-center gap-[clamp(6px,0.7vw,10px)]">
        <div className="h-[clamp(1px,0.12vw,2px)] flex-1 bg-foreground/20">
          <div
            className="h-full bg-foreground transition-[width] duration-300 ease-out"
            style={{ width: progressWidth }}
            aria-hidden
          />
        </div>
      </div>
    </nav>
  );
}
