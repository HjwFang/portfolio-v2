"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import CrossingCornerBorder from "@/components/CrossingCornerBorder";
import { useHeroNavHoverContext } from "@/components/HeroNavHoverContext";

const ITEMS = [
  { num: "01", label: "projects & experiences", href: "/experience" },
  { num: "02", label: "about me", href: "/about" },
  { num: "03", label: "misc gallery", href: "/misc" },
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
  const pathname = usePathname();
  const isHome = pathname === "/";
  const pathIndex =
    pathname === "/experience" ? 0 : pathname === "/about" ? 1 : pathname === "/misc" ? 2 : -1;
  const [selectedIndex, setSelectedIndex] = useState(pathIndex >= 0 ? pathIndex : 0);
  const activeIndex = isHome ? selectedIndex : pathIndex >= 0 ? pathIndex : 0;
  const heroNavHoverCtx = useHeroNavHoverContext();
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const [slideRect, setSlideRect] = useState<{ top: number; height: number } | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState(-1);

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

  useEffect(() => {
    if (pathIndex >= 0) setSelectedIndex(pathIndex);
  }, [pathIndex]);

  // Keep attraction state aligned with the current highlighted nav item.
  useEffect(() => {
    heroNavHoverCtx?.setHoveredIndex(activeIndex);
  }, [activeIndex, heroNavHoverCtx]);

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
                    key={item.href}
                    className="w-full flex items-center justify-between gap-[clamp(6px,1vw,18px)] px-[clamp(8px,0.625vw,12px)] py-[clamp(4px,0.3vw,6px)]"
                  >
                    <span className="flex items-center gap-2 font-general font-medium tracking-tight text-[clamp(14px,0.937vw,18px)]">
                      <span className="tabular-nums text-[clamp(14px,0.833vw,16px)]">{item.num}</span>
                      <span>{item.label}</span>
                    </span>
                    {(hoveredIndex === index || activeIndex === index) && (
                      <span className="font-quicksand text-[clamp(11px,0.677vw,13px)] opacity-70">»»</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
        <ul ref={listRef} className="relative z-10 flex flex-col">
          {ITEMS.map((item, index) => {
            const isActive = index === activeIndex;
            const link = (
              <Link
                href={item.href}
                id={`nav-item-${index}`}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => {
                  setSelectedIndex(index);
                  setHoveredIndex(index);
                  heroNavHoverCtx?.setHoveredIndex(index);
                }}
                onMouseLeave={() => {
                  setHoveredIndex(-1);
                  heroNavHoverCtx?.setHoveredIndex(activeIndex);
                }}
                className={
                  isActive
                    ? "w-full flex items-center justify-between gap-[clamp(6px,1vw,18px)] bg-transparent px-[clamp(8px,0.625vw,12px)] py-[clamp(4px,0.3vw,6px)] text-foreground transition-colors cursor-pointer"
                    : "w-full flex items-center justify-between gap-[clamp(6px,1vw,18px)] px-[clamp(8px,0.625vw,12px)] py-[clamp(4px,0.3vw,6px)] text-foreground/80 transition-colors hover:bg-foreground/10 hover:text-foreground cursor-pointer"
                }
              >
                <span className="flex items-center gap-2 font-general font-medium tracking-tight text-[clamp(14px,0.937vw,18px)]">
                  <span className="tabular-nums text-[clamp(14px,0.833vw,16px)]">{item.num}</span>
                  <span>{item.label}</span>
                </span>
                {(hoveredIndex === index || isActive) && (
                  <span
                    className="font-quicksand text-[clamp(11px,0.677vw,13px)] opacity-70"
                    aria-hidden
                  >
                    »»
                  </span>
                )}
              </Link>
            );
            return (
              <li
                key={item.href}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
              >
                {link}
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div className="h-[2px] flex-1 bg-foreground/20">
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
